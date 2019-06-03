#!/usr/bin/env node
/* eslint-disable no-console */
const packages = require('./package-list.js');
const path = require('path');
const fs = require('fs');
const runCommand = require('./run-command');
const installLocal = path.resolve(__dirname, '..', 'node_modules', '.bin', 'install-local');

const promises = [];

const getLocalPackages = function(dependencies) {
  const local = [];

  Object.keys(packages).forEach(function(packageName) {
    const packageDir = packages[packageName];

    if (local.indexOf(packageDir) === -1 && dependencies[packageName]) {
      local.push(packageDir);
    }
  });

  return local;
};

Object.keys(packages).forEach(function(packageName) {
  const packageDir = packages[packageName];

  const promise = runCommand(
    ['npm', 'ci'],
    {cwd: packageDir, async: true, silent: true}
  ).then(function() {
    const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json')));
    const toInstallLocal = getLocalPackages(Object.assign({}, pkg.dependencies, pkg.devDependencies));

    if (toInstallLocal.length) {
      return runCommand([installLocal].concat(toInstallLocal), {cwd: packageDir, silent: true, async: true});
    }

    return Promise.resolve();
  }).then(function() {
    console.log(`** local install done for ${packageName}`);
  }).catch(function(e) {
    console.error(`failure to install ${packageName}`, e);
  });

  promises.push(promise);
});

Promise.all(promises).then(function() {
  // done;

});
