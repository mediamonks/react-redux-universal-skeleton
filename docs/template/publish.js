"use strict"; // eslint-disable-line
/* eslint-disable import/no-extraneous-dependencies, import/no-unresolved */

const template = require('jsdoc/template');
const fs = require('fs-extra');
const jsdocFs = require('jsdoc/fs');
const path = require('jsdoc/path');
const _ = require('lodash');
const taffy = require('taffydb').taffy;
const underscoreTemplate = require('underscore').template;
const handleError = require('jsdoc/util/error').handle;
const {
  htmlsafe,
  linkto,
  resolveAuthorLinks,
  getUniqueFilename,
  find: taffyDBFind,
  toTutorial,
  getAncestorLinks,
  createLink,
  getSignatureParams,
  getSignatureReturns,
  getSignatureTypes,
  getAttribs,
  tutorialToUrl,
  registerLink,
  setTutorials,
  getMembers,
  longnameToUrl,
  resolveLinks,
  prune,
  addEventListeners,
} = require('jsdoc/util/templateHelper');
const moment = require('moment');
const { Filter } = require('jsdoc/src/filter');
const { Scanner } = require('jsdoc/src/scanner');
const sanitizeHtml = require('sanitize-html');

const categoriesConfig = require('../categories/categories.json');

const conf = env.conf.templates || {}; // eslint-disable-line no-undef
let outputDirectory = env.opts.destination; // eslint-disable-line no-undef

let data;
let view;

const MASTER_NAV_LIST_ENTRIES = [
  'namespace',
  'module',
  'class',
  'mixin',
  'event',
  'interface',
  'tutorial',
  'external',
];

const MASTER_NAV_LIST_TYPES = [
  'namespaces',
  'modules',
  'classes',
  'mixins',
  'events',
  'interfaces',
  'tutorials',
  'externals',
];

const MASTER_NAV_ENTRIES = [
  'overview',
  ...(MASTER_NAV_LIST_ENTRIES.map(name => `${name}.list`)),
  'global',
  'index',
];

const TEMPLATES = {
  container: 'container.tmpl',
  layout: 'layout.tmpl',
  tutorial: 'tutorial.tmpl',
  quicksearch: 'quicksearch.tmpl',
};

const urls = MASTER_NAV_ENTRIES.reduce((result, name) => {
  result[name] = getUniqueFilename(name); // eslint-disable-line no-param-reassign
  return result;
}, {});

const searchableDocuments = {};

const navOptions = {
  includeDate: false,
  logoFile: undefined,
  systemName: 'Documentation',
  navType: 'vertical',
  footer: '',
  copyright: '',
  theme: 'simplex',
  syntaxTheme: 'default',
  linenums: undefined,
  collapseSymbols: false,
  inverseNav: undefined,
  sourceRootPath: undefined,
  disablePackagePath: undefined,
  outputSourcePath: undefined,
  dateFormat: undefined,
  analytics: null,
  sort: undefined,
};
Object.keys(navOptions).forEach(
  option => (navOptions[option] = conf[option] || navOptions[option])
);
navOptions.includeDate = conf.includeDate !== false;
navOptions.outputSourceFiles = conf.outputSourceFiles === true;
navOptions.methodHeadingReturns = conf.methodHeadingReturns === true;
navOptions.search = conf.search !== false;

const masterNav = MASTER_NAV_ENTRIES.reduce((result, name, index) => {
  const nameCased = name[0].toUpperCase() + name.slice(1);

  result[name] = { // eslint-disable-line no-param-reassign
    title: nameCased.replace('.list', ''),
    getLink: member => linkto(member.longname, member.longname.replace('module:', '')),
    stripFromName: 'module:',
    link: urls[name],
    order: index,
    members: [],
  };

  return result;
}, {});

masterNav.index.title = navOptions.systemName;
masterNav.global.title = 'Unsorted';
masterNav['external.list'].getLink = member => linkto(
  member.longname, member.longname.replace(/(^"|"$)/g, '')
);
masterNav['tutorial.list'].getLink = member => getTutorialLink(member.name);

const getTutorialLink = tutorial => toTutorial(tutorial, null, {
  tag: 'em',
  classname: 'disabled',
  prefix: 'Tutorial: ',
});

const hashToLink = (doclet, hash) => {
  if (!/^(#.+)/.test(hash)) {
    return hash;
  }

  const url = createLink(doclet).replace(/(#.+|$)/, hash);

  return `<a href="${url}">${hash}</a>`;
};

const needsSignature = (doclet) => {
  let needsSig = false;

  // function and class definitions always get a signature
  if (doclet.kind === 'function' || doclet.kind === 'class') {
    needsSig = true;
  } else if (
    doclet.kind === 'typedef' &&
    doclet.type &&
    doclet.type.names &&
    doclet.type.names.length
  ) {
    // typedefs that contain functions get a signature, too
    for (let i = 0, l = doclet.type.names.length; i < l; i++) {
      if (doclet.type.names[i].toLowerCase() === 'function') {
        needsSig = true;
        break;
      }
    }
  }

  return needsSig;
};

const addParamsToSignature = (doclet) => {
  /* eslint-disable no-param-reassign */
  const optionalClass = 'optional';
  const params = getSignatureParams(doclet, optionalClass);

  doclet.signature = `${doclet.signature || ''}(`;

  for (let i = 0, l = params.length; i < l; i++) {
    const element = params[i];
    const separator = i ? ', ' : '';

    if (!new RegExp(`class=["']${optionalClass}["']`).test(element)) {
      doclet.signature += separator + element;
    } else {
      const regExp = new RegExp(`<span class=["']${optionalClass}["']>(.*?)<\\/span>`, 'i');
      doclet.signature += element.replace(regExp, " $`[" + separator + "$1$']"); // eslint-disable-line
    }
  }

  doclet.signature += ')';
  /* eslint-enable no-param-reassign */
};

const addReturnsToSignature = (doclet) => {
  /* eslint-disable no-param-reassign */
  if (navOptions.methodHeadingReturns) {
    const returnTypes = getSignatureReturns(doclet);

    doclet.signature = `<span class="signature">${doclet.signature || ''}</span><span class="type-signature">${returnTypes.length ? ` &arr; {${returnTypes.join('|')}}` : ''}</span>`;
  } else {
    doclet.signature = doclet.signature || '';
  }
  /* eslint-enable no-param-reassign */
};

const addTypesToSignature = (doclet) => {
  const types = getSignatureTypes(doclet);

  // eslint-disable-next-line no-param-reassign
  doclet.signature = `${doclet.signature || ''}<span class="type-signature">${types.length ? ` :${types.join('|')}` : ''}</span>`;
};

const addAttribs = (f) => {
  const attribs = getAttribs(f).filter(attrib => (attrib.toLowerCase() !== 'inner'));

  // eslint-disable-next-line no-param-reassign
  f.attribs = `<span class="type-signature">${htmlsafe(attribs.length ? `<${attribs.join(', ')}> ` : '')}</span>`;
};

const addShortenedToFiles = (files, commonPrefix) => {
  /* eslint-disable no-param-reassign */
  Object.keys(files).forEach(file => (
    files[file].shortened = files[file].resolved.replace(commonPrefix, '')
      // always use forward slashes
      .replace(/\\/g, '/')
  ));
  /* eslint-enable no-param-reassign */
};

const getPathFromDoclet = (doclet) => {
  if (!doclet.meta) {
    return;
  }

  // eslint-disable-next-line consistent-return
  return path.normalize(
    (doclet.meta.path && doclet.meta.path !== 'null') ?
      `${doclet.meta.path}/${doclet.meta.filename}` :
      doclet.meta.filename
  );
};

const getSearchDataFromHtml = (html) => {
  /* eslint-disable no-param-reassign */
  let startOfContent = html.indexOf('<div class="container">');
  if (startOfContent > 0) {
    const startOfSecondContent = html.indexOf('<div class="container">', startOfContent + 2);
    if (startOfSecondContent > 0) {
      startOfContent = startOfSecondContent;
    }
    html = html.slice(startOfContent);
  }
  const endOfContent = html.indexOf('<span class="copyright">');
  if (endOfContent > 0) {
    html = html.substring(0, endOfContent);
  }
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: [] }).replace(/\s+/g, ' ');
  /* eslint-enable no-param-reassign */
};

const generatePage = (docType, title, docs, filename, enableResolveLinks = true) => {
  const docData = { title, docs, docType };
  const outputPath = path.join(outputDirectory, filename);
  let html = view.render(TEMPLATES.container, docData);
  if (enableResolveLinks) {
    html = resolveLinks(html);
  }

  if (navOptions.search && (docType !== 'source')) {
    searchableDocuments[filename] = {
      id: filename,
      title,
      body: getSearchDataFromHtml(html),
    };
  }

  fs.writeFileSync(outputPath, html, 'utf8');
};

const generateSourceFiles = sourceFiles => Object.keys(sourceFiles).forEach((file) => {
  let source;

  // links are keyed to the shortened path in each doclet's `meta.shortpath` property
  const sourceOutFile = getUniqueFilename(sourceFiles[file].shortened);
  registerLink(sourceFiles[file].shortened, sourceOutFile);

  try {
    source = {
      kind: 'source',
      code: htmlsafe(fs.readFileSync(sourceFiles[file].resolved, 'utf8')),
    };
  } catch (e) {
    handleError(e);
  }

  generatePage('source', `Source: ${sourceFiles[file].shortened}`, [source], sourceOutFile, false);
});

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
const attachModuleSymbols = (doclets, modules) => {
  const symbols = doclets.reduce((result, symbol) => {
    result[symbol.longname] = [ // eslint-disable-line no-param-reassign
      ...(result[symbol.longname] || []),
      symbol,
    ];
    return result;
  }, {});

  modules.forEach((module) => {
    if (symbols[module.longname]) {
      module.modules = symbols[module.longname] // eslint-disable-line no-param-reassign
        // Only show symbols that have a description. Make an exception for classes, because
        // we want to show the constructor-signature heading no matter what.
        .filter(symbol => (symbol.description || symbol.kind === 'class'))
        .map((symbol) => {
          const clonedSymbol = _.cloneDeep(symbol);

          if (['class', 'function'].includes(symbol.kind)) {
            clonedSymbol.name = `${clonedSymbol.name.replace('module:', '(require("')}"))`;
          }

          return clonedSymbol;
        });
    }
  });

  return modules.filter(module => symbols[module.longname]);
};

/**
 * Create the navigation sidebar.
 * @param {object} members The members that will be used to create the sidebar.
 * @param {array<object>} members.classes
 * @param {array<object>} members.externals
 * @param {array<object>} members.globals
 * @param {array<object>} members.mixins
 * @param {array<object>} members.interfaces
 * @param {array<object>} members.modules
 * @param {array<object>} members.namespaces
 * @param {array<object>} members.tutorials
 * @param {array<object>} members.events
 * @return {string} The HTML for the navigation sidebar.
 */
const buildNav = (members) => {
  const seen = {};

  MASTER_NAV_LIST_TYPES.forEach((memberType, index) => {
    const listType = `${MASTER_NAV_LIST_ENTRIES[index]}.list`;

    if (members[memberType].length) {
      members[memberType].forEach((member) => {
        if (!Object.prototype.hasOwnProperty.call(seen, member.longname)) {
          masterNav[listType].members.push(masterNav[listType].getLink(member));
          seen[member.longname] = true;
        }
      });
    }
  });

  if (members.globals.length) {
    members.globals.forEach((global) => {
      if (global.kind !== 'typedef' && !Object.prototype.hasOwnProperty.call(seen, global.longname)) {
        masterNav.global.members.push(masterNav.global.getLink(global));
      }
      seen[global.longname] = true;
    });

    // if there are no links, provide a link to the global page.
    if (!masterNav.global.members.length) {
      masterNav.global.members.push(linkto('global', 'Global'));
    }
  }

  masterNav.topLevelNav = Object.keys(masterNav)
    .filter(name => (masterNav[name].members.length && (name !== 'index')))
    .sort((a, b) => (masterNav[a].order - masterNav[b].order))
    .map(name => _.clone(masterNav[name]));
};

const processDocletExamples = examples => examples.map((example) => {
  let caption;

  // allow using a markdown parser on the examples captions
  // (surrounded by useless HTML p tags)
  const match = example.match(
    /^\s*(<p>)?<caption>([\s\S]+?)<\/caption>(\s*)([\s\S]+?)(<\/p>)?$/i
  );
  if (match) {
    caption = match[2];
    example = match[4] + (match[1] ? '' : match[5]); // eslint-disable-line no-param-reassign
  }

  let lang = /{@lang (.*?)}/.exec(example);
  if (lang && lang[1]) {
    example = example.replace(lang[0], ''); // eslint-disable-line no-param-reassign
    lang = lang[1];
  } else {
    lang = null;
  }

  return {
    caption: caption || '',
    code: example,
    lang: lang || 'javascript',
  };
});

/**
 * @param {TAFFY} taffyData See <http://taffydb.com/>.
 * @param {object} opts
 * @param {Tutorial} tutorials
 */
exports.publish = function (taffyData, opts, tutorials) { // eslint-disable-line func-names
  data = taffyData;

  conf.default = conf.default || {};

  const templatePath = opts.template;
  view = new template.Template(`${templatePath}/tmpl`);

  registerLink('global', urls.global);
  registerLink('overview', urls.overview);

  // set up templating
  view.layout = conf.default.layoutFile ?
    path.getResourcePath(
      path.dirname(conf.default.layoutFile),
      path.basename(conf.default.layoutFile)
    ) : TEMPLATES.layout;

  // set up tutorials for helper
  setTutorials(tutorials);

  data = prune(data);

  let sortOption = (navOptions.sort === undefined) ? opts.sort : navOptions.sort;
  sortOption = (sortOption === undefined) ? true : sortOption;
  sortOption = (sortOption === true) ? 'longname, version, since' : sortOption;

  if (sortOption) {
    data.sort(sortOption);
  }
  addEventListeners(data);

  const sourceFiles = {};
  const sourceFilePaths = [];
  data().each((doclet) => {
    /* eslint-disable no-param-reassign */
    doclet.attribs = '';

    if (doclet.examples) {
      doclet.examples = processDocletExamples(doclet.examples);
    }

    if (doclet.see) {
      doclet.see = doclet.see.map(seeItem => hashToLink(doclet, seeItem));
    }

    let sourcePath;
    if (doclet.meta) {
      sourcePath = getPathFromDoclet(doclet);
      sourceFiles[sourcePath] = {
        resolved: sourcePath,
        shortened: null,
      };

      // Check to see if the array of source file paths already contains
      // the source path, if not then add it
      if (!sourceFilePaths.includes(sourcePath)) {
        sourceFilePaths.push(sourcePath);
      }
    }
    /* eslint-enable no-param-reassign */
  });

  const packageInfo = (taffyDBFind(data, { kind: 'package' }) || [])[0];
  if ((navOptions.disablePackagePath !== true) && packageInfo && packageInfo.name) {
    outputDirectory = packageInfo.version ?
      path.join(outputDirectory, packageInfo.name, packageInfo.version) :
      path.join(outputDirectory, packageInfo.name);
  }
  fs.ensureDirSync(Array.isArray(outputDirectory) ? outputDirectory.join('') : outputDirectory);

  // copy the template's static files to outdir
  const fromDir = path.join(templatePath, 'static');
  const staticFiles = jsdocFs.ls(fromDir, 3);

  staticFiles.forEach((filePath) => {
    const toDir = jsdocFs.toDir(filePath.replace(fromDir, outputDirectory));
    const toDirString = Array.isArray(toDir) ? toDir.join('') : toDir;
    fs.ensureDirSync(toDirString);
    fs.copySync(filePath, path.join(toDirString, path.parse(filePath).base));
  });

  // copy user-specified static files to outdir
  let staticFilePaths;
  let staticFileFilter;
  let staticFileScanner;
  if (conf.default.staticFiles) {
    // The canonical property name is `include`. We accept `paths` for backwards compatibility
    // with a bug in JSDoc 3.2.x.
    staticFilePaths = (
      conf.default.staticFiles.include ||
      conf.default.staticFiles.paths ||
      []
    );
    staticFileFilter = new Filter(conf.default.staticFiles);
    staticFileScanner = new Scanner();

    staticFilePaths.forEach((filePath) => {
      const extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

      extraStaticFiles.forEach((extracStaticFilePath) => {
        const sourcePath = jsdocFs.toDir(extracStaticFilePath);
        const toDir = jsdocFs.toDir(extracStaticFilePath.replace(sourcePath, outputDirectory));
        const toDirString = Array.isArray(toDir) ? toDir.join('') : toDir;

        fs.ensureDirSync(toDirString);
        fs.copySync(
          extracStaticFilePath,
          path.join(toDirString, path.parse(extracStaticFilePath).base)
        );
      });
    });
  }

  if (sourceFilePaths.length) {
    const payload = navOptions.sourceRootPath || path.commonPrefix(sourceFilePaths);
    addShortenedToFiles(sourceFiles, payload);
  }

  const categoryData = Object.keys(categoriesConfig)
    .map(id => Object.assign(
      { members: {} },
      { id },
      categoriesConfig[id]
    ));
  categoryData.sort((a, b) => ((a.order || 0) - (b.order || 0)));
  categoryData.forEach((category) => {
    masterNav.overview.members.push(linkto('overview', category.title, undefined, `category:${category.id}`));
  });

  data().each((doclet) => {
    const link = createLink(doclet);
    registerLink(doclet.longname, link);

    if (doclet.category) {
      doclet.category.forEach((categoryName) => {
        const category = categoryData.find(cat => (cat.id === categoryName));
        if (category) {
          if (!category.members[doclet.kind]) {
            category.members[doclet.kind] = [];
          }
          category.members[doclet.kind].push(doclet);
        }
      });
    }

    // add a shortened version of the full path
    let docletPath;
    if (doclet.meta) {
      docletPath = getPathFromDoclet(doclet);
      if (!_.isEmpty(sourceFiles[docletPath])) {
        docletPath = sourceFiles[docletPath].shortened;
        if (docletPath) {
          doclet.meta.shortpath = docletPath; // eslint-disable-line no-param-reassign
        }
      }
    }
  });

  data().each((doclet) => {
    const url = longnameToUrl[doclet.longname];

    doclet.id = (url.indexOf('#') > -1) ? // eslint-disable-line no-param-reassign
      longnameToUrl[doclet.longname].split(/#/).pop() :
      doclet.name;

    if (needsSignature(doclet)) {
      addParamsToSignature(doclet);
      addReturnsToSignature(doclet);
      addAttribs(doclet);
    }
  });

  data().each((doclet) => {
    doclet.ancestors = getAncestorLinks(doclet); // eslint-disable-line no-param-reassign

    if (doclet.kind === 'member') {
      addTypesToSignature(doclet);
      addAttribs(doclet);
    }

    if (doclet.kind === 'constant') {
      addTypesToSignature(doclet);
      addAttribs(doclet);
      doclet.kind = 'member'; // eslint-disable-line no-param-reassign
    }
  });

  const members = getMembers(data);
  members.tutorials = tutorials.children;

  // add template helpers
  view.find = f => taffyDBFind(data, f);
  view.tutoriallink = getTutorialLink;

  Object.assign(view, { linkto, resolveAuthorLinks, htmlsafe, moment });

  // once for all
  buildNav(members);
  view.nav = masterNav;
  view.navOptions = navOptions;

  attachModuleSymbols(
    taffyDBFind(data, {
      kind: ['class', 'function'],
      longname: { left: 'module:' },
    }),
    members.modules
  );

  // only output pretty-printed source files if requested; do this before generating any other
  // pages, so the other pages can link to the source files
  if (navOptions.outputSourceFiles) {
    generateSourceFiles(sourceFiles);
  }

  if (members.globals.length) {
    generatePage('global', 'Global', [{ kind: 'globalobj' }], urls.global);
  }

  MASTER_NAV_LIST_ENTRIES.forEach((viewType) => {
    if (masterNav[`${viewType}.list`].members.length) {
      generatePage(viewType, masterNav[`${viewType}.list`].title, [{
        kind: 'sectionIndex',
        contents: masterNav[`${viewType}.list`],
      }], masterNav[`${viewType}.list`].link);
    }
  });

  // index page displays information from package.json and lists files
  const files = taffyDBFind(data, { kind: 'file' });
  const packages = taffyDBFind(data, { kind: 'package' });

  generatePage(
    'index',
    'Index',
    packages.concat(
      [{
        kind: 'mainpage',
        readme: opts.readme,
        longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page',
      }]
    ).concat(files),
    urls.index
  );

  generatePage(
    'overview',
    'Overview',
    [{
      kind: 'overview',
      categories: categoryData,
    }],
    urls.overview,
    true
  );

  const taffyLists = MASTER_NAV_LIST_TYPES
    .filter(listType => !['tutorials', 'events'].includes(listType))
    .reduce((result, listType) => {
      result[listType] = taffy(members[listType]); // eslint-disable-line no-param-reassign

      return result;
    }, {});

  Object.keys(longnameToUrl).forEach((longname) => {
    Object.keys(taffyLists).forEach((listType) => {
      const entities = taffyDBFind(taffyLists[listType], { longname });
      const listTypeCased = listType[0].toUpperCase() + listType.slice(1);
      if (entities.length) {
        generatePage(
          listType,
          `${listTypeCased}: ${entities[0].name}`,
          entities,
          longnameToUrl[longname]
        );
      }
    });
  });

  function generateTutorial(title, tutorial, filename) {
    const tutorialData = {
      title,
      header: tutorial.title,
      content: tutorial.parse(),
      children: tutorial.children,
      docs: null,
    };

    const tutorialPath = path.join(outputDirectory, filename);
    const html = resolveLinks(view.render(TEMPLATES.tutorial, tutorialData));

    if (navOptions.search) {
      searchableDocuments[filename] = {
        id: filename,
        title,
        body: getSearchDataFromHtml(html),
      };
    }

    fs.writeFileSync(tutorialPath, html, 'utf8');
  }

  // tutorials can have only one parent so there is no risk for loops
  function saveChildren(node) {
    node.children.forEach((child) => {
      generateTutorial(`Tutorial: ${child.title}`, child, tutorialToUrl(child.name));
      saveChildren(child);
    });
  }

  function generateQuickTextSearch(_templatePath, _searchableDocs, _navOptions) {
    const quickTextSearchData = {
      searchableDocuments: JSON.stringify(_searchableDocs),
      _navOptions,
    };

    const tmplString = fs.readFileSync(`${_templatePath}/${TEMPLATES.quicksearch}`).toString();
    const tmpl = underscoreTemplate(tmplString);

    const html = tmpl(quickTextSearchData);
    const outputPath = path.join(outputDirectory, 'quicksearch.html');

    fs.writeFileSync(outputPath, html, 'utf8');
  }

  saveChildren(tutorials);

  if (navOptions.search) {
    generateQuickTextSearch(`${templatePath}/tmpl`, searchableDocuments, navOptions);
  }
};
