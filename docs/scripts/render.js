/* eslint-disable import/no-extraneous-dependencies, no-console */
/* global exec */
require('shelljs/global');
const path = require('path');

const srcDir = 'src';
const jsdocPath = path.resolve(__dirname, '../../node_modules/.bin/jsdoc');
const templatePath = path.resolve(__dirname, '../template');
const jsdocConfigPath = path.resolve(__dirname, '../conf.json');
const outputDir = path.resolve(__dirname, '../output/');
const tutorialsDir = path.resolve(__dirname, '../tutorials/');
const readmePath = path.resolve(__dirname, '../../README.md');

exec(
  `${jsdocPath} ${srcDir} -r -c ${jsdocConfigPath} -u ${tutorialsDir} -t ${templatePath} -R ${readmePath} -d ${outputDir}`,
  {
    cwd: path.resolve(__dirname, '../../'),
    maxBuffer: 5120 * 1024,
  },
  (error, stdout, stderror) => {
    console.log(stdout);
    console.log(stderror);
  }
);
