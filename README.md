# React Redux Universal Skeleton

Welcome to the React / Redux Skeleton

## How do I get set up?

Install [Yarn](https://yarnpkg.com/en/docs/install).

* `yarn`
* `yarn dev`

## Building the project

Run `yarn build` to build the project. The output can be found in `./build`.

## Generating the documentation

### JSDoc

This repository includes API documentation rendered from JSDoc annotation. Besides API
documentation, it includes a list of tutorials on various core topics of this codebase.
To create the documentation, run the following command:

```shell
yarn docs
```

After the documentation is generated it can be found in `./docs/output`. Open the `index.html` in a browser to view
the documentation.

### Storybook

[Storybook](https://storybook.js.org/) is used to document/preview the React components used in the project.

To create the documentation, run the following command:

```shell
yarn storybook:build
```

This will output the documentation to `./docs/storybook`. Open the `index.html` in a browser to view
the documentation.

## Linting

Please make sure you have `sass lint` and `eslint` and `tslint` installed for your IDE / editor.

## Style guides

* follow the airbnb es6 and react style guides
* look at the example tutorials for other guidelines

## Lint

Follow install instructions for [scss-lint](https://github.com/brigade/scss-lint).

```shell
npm run lint # runs them all
npm run lint:js # uses eslint
npm run lint:ts # uses tslint
npm run lint:css # uses scss-lint
```

You can configure WebStorm to use `eslint`, `tslint` and `scss-lint` (through a plugin),
so your IDE will also show the warnings.

## Git Hooks

Upon running a fresh `yarn`, the Husky package will install some git hooks. Those hooks will run
some checks when committing or pushing.

When you absolutely need to, you can skip the hook by appending `--no-verify` (e.g. when finishing
releases and hotfix branches and having to push them develop and master, there is no need to run
linting again, since no files have changed).

### Commit

Before commit, it lints all the staged files with the corresponding linter.

Besides that, please follow [this guide](https://chris.beams.io/posts/git-commit/) on how to write
proper commit messages.

### Push

Before push, it will run `yarn lint` to verify the js, ts and scss code style.

## Rendermode

By default, our server uses server-side rendering to render the pre-render the page. This can make
debugging more difficult, because errors in page rendering appear in the Node.JS server instead of
the browser. To switch to client-side rendering for debugging, a cookie `rendermode` of value
`client` needs to be set in the browser. On non-production servers, this can be done by navigating
to a special route:

### route to switch to client-side rendering
```
<base url>/rendermode/client
```

### route to switch back to server-side rendering
```
<base url>/rendermode/server
```

## Forms and validation
We use the `redux-form` library for syncing input with Redux. However, we have our own wrapper
around redux-form called `redux-enhanced-form`. For the differences between standard redux-form
and the enhanced usage, please consult {@tutorial enhanced-redux-form}

## Cleanup script
Once built, there is an `asset-clean.js` node script in the node output folder that will clean old
assets from the `wwwroot` directory. You can use it like so:

```
node asset-cleanup <options>

Options:
  -d, --dry-run       only logs, does not delete any files
  -b, --before        delete all versions before the given unix timestamp       [number]

  -n, --num-versions  keep only this number of versions                         [number]

  -u, --unknown       remove files that aren't assets of any known version     [boolean]

  -a, --all           remove all versions                                      [boolean]

  -v, --verbose       verbose output                                           [boolean]

  -h, --help          Show help                                                [boolean]
```
