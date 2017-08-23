import glob from 'glob';
import promisify from 'es6-promisify';
import moment from 'moment';
import yargs from 'yargs';
import fs from 'fs-extra';
import path from 'path';
import process from 'process';

process.chdir(__dirname);

const debug = console.log; // eslint-disable-line no-console
const globPromise = promisify(glob);
const argv = yargs
  .usage('node asset-cleanup <options>')
  .options({
    d: {
      alias: 'dry-run',
      describe: 'only logs, does not delete any files',
    },
    b: {
      alias: 'before',
      nargs: 1,
      type: 'number',
      describe: 'delete all versions before the given unix timestamp',
    },
    n: {
      alias: 'num-versions',
      nargs: 1,
      type: 'number',
      describe: 'keep only this number of versions',
    },
    u: {
      alias: 'unknown',
      type: 'boolean',
      describe: "remove files that aren't assets of any known version",
    },
    a: {
      alias: 'all',
      type: 'boolean',
      describe: 'remove all versions',
    },
    v: {
      alias: 'verbose',
      type: 'boolean',
      describe: 'verbose output',
    },
  })
  .conflicts('before', 'versions')
  .conflicts('before', 'all')
  .conflicts('versions', 'all')
  .wrap(yargs.terminalWidth())
  .help('h')
  .alias('h', 'help').argv;

// ignore the assets that were placed statically for use in edge.js
// these will probably be the only exceptions as other static files are placed elsewhere
const ASSET_IGNORE = [
  '../wwwroot/assets/app.crypto.min.js',
  '../wwwroot/assets/app.FormPostResponse.js',
];

if (typeof argv.n === 'undefined' && !argv.b && !argv.a) {
  yargs.showHelp();
} else {
  debug('\n\nglobbing assets...\n');

  Promise.all([
    // detect the versions by globbing al manifest files
    globPromise('./manifests/*-webpack-manifest.json', { cwd: __dirname }),
    // glob all asset files currently in asset folder
    globPromise('../wwwroot/assets/*', { cwd: __dirname }),
  ]).then(([manifestFiles, assetFiles]) => {
    const versions = manifestFiles
      .map(filePath => filePath.match(/([^/]+)-webpack-manifest.json$/)[1])
      .filter(versionName => versionName !== 'static')
      .map(versionName => parseInt(versionName, 10))
      .filter(parsed => {
        if (isNaN(parsed)) {
          debug(
            'warning: ignored manifest file because we were unable to parse the version from the filename',
          );
          return false;
        }
        return true;
      })
      // sort descending (newest first), because we want the newer versions to have priority
      .sort((a, b) => b - a)
      .map((parsed, index) => {
        const manifest = JSON.parse(
          fs.readFileSync(`./manifests/${parsed}-webpack-manifest.json`, { encoding: 'utf8' }),
        );
        // get array of all asset files in this version
        const assets = Object.keys(manifest).reduce(
          (result, asset) => [...result, manifest[asset]],
          [],
        );

        return {
          date: moment(parsed * 1000),
          name: parsed,
          manifestFile: `./manifests/${parsed}-webpack-manifest.json`,
          manifest,
          assets,
          staticPath: `../wwwroot/version/${parsed}`,
          /*
           * Remove version if:
           *  - the "all" flag is present
           *  - the "num-versions" option is set and the version index is larger than it
           *  - the "before" option is set and the timestamp is smaller than it
           */
          keep: !argv.a && (argv.n ? index < argv.n : parsed * 1000 > argv.b),
        };
      });

    if (versions.length) {
      // u2713 = checkmark, u2716 = X
      debug('versions found:  (\u2713=keep \u2716=remove)');
    }
    versions.forEach(({ date, name, keep }) =>
      debug(`${keep ? '\u2713' : '\u2716'} ${name} ${date.format('dddd, MMMM Do YYYY, hh:mm')}`),
    );

    const assets = assetFiles.filter(filePath => !ASSET_IGNORE.includes(filePath)).map(filePath => {
      const manifestPath = filePath.replace('../wwwroot', '');
      let assetKeepCount = 0;
      let assetCleanCount = 0;

      versions.forEach(version => {
        if (version.assets.includes(manifestPath)) {
          if (version.keep) {
            assetKeepCount += 1;
          } else {
            assetCleanCount += 1;
          }
        }
      });

      return {
        filePath,
        manifestPath,
        assetCleanCount,
        assetKeepCount,
        filename: filePath.replace('../wwwroot/assets/', ''),
        /*
           * Keep the file if:
           *  - it is present in a version that needs to be preserved
           *  OR
           *  - the "unknown" option is NOT set AND the asset is not found in any
           *  known version
           */
        keep: !!(assetKeepCount || (!argv.u && !assetCleanCount)),
      };
    });

    debug(' ');
    let cleanCount = 0;
    let keepCount = 0;

    // loop through the assets
    assets.forEach(({ keep, filename, assetKeepCount, assetCleanCount, filePath }) => {
      // most of the code below is just for debug logging
      const countLogs = [];
      if (assetKeepCount) {
        countLogs.push(`${assetKeepCount} version${assetKeepCount === 1 ? '' : 's'} to keep`);
      }
      if (assetCleanCount) {
        countLogs.push(`${assetCleanCount} version${assetCleanCount === 1 ? '' : 's'} to clean`);
      }
      if (keep) {
        keepCount += 1;
      } else {
        cleanCount += 1;
      }
      if (argv.v) {
        debug(`${keep ? '\u2713' : '\u2716'} ${filename}`);
        debug(`   found in ${countLogs.length ? countLogs.join(', ') : 'no versions'}`);
      }
      // remove files that are not marked as "keep", if this is not a dry run
      if (!argv.d && !keep) {
        fs.removeSync(path.join(__dirname, filePath));
      }
    });

    if (argv.v) {
      debug(' ');
    }

    const cleanedStaticFolders = [];
    versions.forEach(({ staticPath, manifestFile, keep }) => {
      if (!keep) {
        const absStaticPath = path.join(__dirname, staticPath);
        // check is a folder with static assets exists
        if (fs.existsSync(absStaticPath)) {
          cleanedStaticFolders.push(staticPath);

          // if not a dry run, remove the static asset folder
          if (!argv.d) {
            fs.removeSync(absStaticPath);
          }
        }

        if (!argv.d) {
          // if not a dry run, remove the manifest file itself so it is not present in future
          // cleanups
          fs.removeSync(path.join(__dirname, manifestFile));
          if (argv.v) {
            debug(`removed manifest ${manifestFile}`);
          }
        }
      }
    });

    // beyond this point is just debug logging
    if (argv.v) {
      debug('');

      if (!argv.d && cleanedStaticFolders.length) {
        debug('Removed versioned static asset folders:');
        debug(cleanedStaticFolders.join('\n'));
        debug('');
      }
    }

    if (argv.d) {
      debug('in dry-run mode. when executed normally, will: ');
      debug(`clean ${cleanCount} asset${cleanCount === 1 ? '' : 's'}`);
      debug(`preserve ${keepCount} asset${keepCount === 1 ? '' : 's'}`);
      debug(
        `remove ${cleanedStaticFolders.length} versioned static asset folder${cleanedStaticFolders.length ===
        1
          ? ''
          : 's'}`,
      );
    } else {
      debug(`${cleanCount} asset${cleanCount === 1 ? '' : 's'} removed`);
      debug(`${keepCount} asset${keepCount === 1 ? '' : 's'} preserved`);
      debug(
        `${cleanedStaticFolders.length} versioned static asset folder${cleanedStaticFolders.length ===
        1
          ? ''
          : 's'} removed`,
      );
    }
    debug('\n\n');
  });
}
