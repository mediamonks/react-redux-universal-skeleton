Below is an overview of the different kinds of configuration we have.

### Fixed configuration
| name | description | source |
|----------------|----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| webpack config | main webpack configuration | repo:/build-tools/config/webpack/webpack.config.\*.js |
| build options | Default values for build options (see *build options* in dynamic config table below) | repo:/build-tools/config/buildoptions/default.buildoptions.js |
| eslint | Configuration for JS linter | repo:/.eslintrc and repo:/.esilntignore |
| editorconfig | Code style options to be used by IDE | repo:/.editorconfig |
| scss lint | Config for sass linter | repo:/sass-lint.yml |
| package.json | npm module dependencies + npm scripts definitions | repo:/package.json |
| yarn.lock | lockfile for alternative package manager. used by by build server instead of npm to lock down package versions | repo:/yarn.lock |
| jsdoc config | Configuration to render this documentation | repo:/docs/conf.json and repo:/docs/tutorials/tutorials.json |
| jsdoc template | Custom build of docstrap jsdoc template | repo:/docs/template/ |

### Dynamic configuration

name | description\* | parsed at | source | parsed by
--- | --- | --- | --- | ---
build options | Webpack build options per target (browser vs nodejs) per mode (development vs distribution) | buildtime | repo:/build-tools/config/buildoptions/&lt;web/node&gt;-&lt;dist/dev&gt;.buildoptions.json |
repo:/build-tools/config/buildoptions/BuildOptionsManager.js
configdefinitions | Application options | buildtime | repo:/build-tools/config/config.json | config-injector-loader in frontend repo
environment config | Application options per environment | runtime | repo:/config/&lt;environment&gt;.json | node-config JS module (see {@link https://github.com/lorenwest/node-config})
