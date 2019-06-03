#!/usr/bin/env node
/* eslint-disable no-console */

const runCommand = require('./run-command.js');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const debug = require('./debug-logging.js');
const packages = require('./package-list.js');

const generatorSetup = function({autoCleanup} = {}) {
  const tempDir = path.join(os.tmpdir(), 'vjs-tooling-monorepo-' + crypto.randomBytes(9).toString('hex'));
  const rootDir = path.join(tempDir, 'vjs-tooling-monorepo');
  const spawnOptions = {
    cwd: rootDir,
    env: Object.assign(process.env, {
      stdio: debug ? 'inherit' : 'pipe'
    })
  };

  console.log(`** Generating Project in ${rootDir} **`);

  fs.mkdirSync(tempDir);
  fs.mkdirSync(rootDir);

  if (autoCleanup) {
    const cleanup = function(e) {
      if (typeof e !== 'number') {
        console.log(e);
      }
      console.log(`** Cleaning up ${tempDir} **`);

      if (fs.existsSync(tempDir)) {
        runCommand(['shx', 'rm', '-rf', tempDir], {cwd: __dirname});
      }
    };

    ['SIGINT', 'SIGHUP', 'SIGQUIT', 'SIGTERM', 'exit', 'uncaughtException'].forEach(function(signal) {
      process.on(signal, cleanup);
    });
  }

  runCommand(['yo', packages['generator-videojs-plugin'], '--hurry'], spawnOptions);

  [
    ['git', 'init'],
    ['npm', 'i', '--package-lock-only'],
    ['npm', 'ci'],
    ['install-local'].concat(Object.values(packages))
  ].forEach((c) => runCommand(c, spawnOptions));

  return rootDir;
};

// if run via node generator-setup.js or ./generator-setup.js
// run the setup
if (require.main === module) {
  generatorSetup();
  console.log('** Make sure to cleanup this directory when your done!');
} else {
  module.exports = generatorSetup;
}
