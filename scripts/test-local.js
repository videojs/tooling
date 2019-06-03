#!/usr/bin/env node
/* eslint-disable no-console */
const packages = require('./package-list.js');
const runCommand = require('./run-command');

const promises = [];

Object.keys(packages).forEach(function(packageName) {
  const packageDir = packages[packageName];

  const promise = runCommand(
    ['npm', 'run', 'test'],
    {cwd: packageDir, async: true, silent: true}
  ).then(function() {
    console.log(`** npm test success for ${packageName}`);
  }).catch(function(e) {
    console.error(`** npm test failure for ${packageName}`, e);
    return Promise.reject();
  });

  promises.push(promise);
});

Promise.all(promises).then(function() {
  // done;
}).catch(function(e) {
  process.exit(1);
});
