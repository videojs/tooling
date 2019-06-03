#!/usr/bin/env node
/* eslint-disable no-console */
const runCommand = require('./run-command.js');

const path = require('path');
const spawnSync = require('child_process').spawnSync;
const assert = require('assert');
const debug = require('./debug-logging.js');
const rootDir = require('./generator-setup.js')({autoCleanup: true});
const fs = require('fs');

const spawnOptions = {
  cwd: rootDir,
  env: Object.assign(process.env, {
    NPM_MERGE_DRIVER_IGNORE_CI: true,
    // inherit makes child stdout and stderr got to parent stdout and stderr
    // which we only want for debug purposes.
    stdio: debug ? 'inherit' : 'pipe'
  })
};

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json')));

/* allow husky to run in ci */
pkg.husky.skipCI = false;

fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(pkg));

const commands = [
  ['npm', 'run', 'docs'],
  ['git', 'add', '--all'],
  ['git', 'commit', '-a', '-m', 'feat: initial release!'],

  ['npm', 'version', 'prerelease'],
  // copy the changelog over to check its size
  ['shx', 'cp', 'CHANGELOG.md', 'CHANGELOG-prerelease.md'],
  ['npm', 'version', 'major'],
  ['npm', 'publish', '--dry-run'],

  // convoluted npm merge driver test
  ['git', 'checkout', '-b', 'merge-driver-test'],
  ['npm', 'i', '-D', 'is-ci'],
  ['git', 'commit', '-a', '-m', 'add is-ci to dev deps'],
  ['git', 'checkout', 'master'],
  ['npm', 'i', 'is-ci'],
  ['git', 'commit', '-a', '-m', 'add is-ci as dep'],
  ['git', 'merge', '--no-edit', 'merge-driver-test']
];

commands.forEach((c) => runCommand(c, spawnOptions));

console.log('** Running \'npm audit\' **');
// not a test, but useful to log
spawnSync('npm', ['audit'], spawnOptions);

const release = fs.statSync(path.join(rootDir, 'CHANGELOG.md'));
const prerelease = fs.statSync(path.join(rootDir, 'CHANGELOG-prerelease.md'));

assert.ok(prerelease.size === 0, 'changelog was not written to after prerelease');
assert.ok(release.size > 0, 'changelog was written to after major');

console.log('** Making sure npm-merge-driver-install works **');

const mergeDriverRetval = spawnSync('git', ['ls-files', '-u'], spawnOptions);
const mergeDriverOutput = mergeDriverRetval.output
  .filter((s) => !!s)
  .map((s) => s.toString().trim())
  .join('');

if (mergeDriverOutput) {
  console.error(mergeDriverOutput);
  throw new Error('npm-merge-driver should have merged conflicts!');
}

console.log('** Making sure husky/lint-staged/doctoc works **');
fs.appendFileSync(path.join(rootDir, 'README.md'), '\n\n###some new section');
const oldREADME = fs.readFileSync(path.join(rootDir, 'README.md'));
const doctocRetval = spawnSync('git', ['commit', '-a', '-m', 'test doctoc'], spawnOptions);

if (doctocRetval.status === 1) {
  const output = doctocRetval.output
    .filter((s) => !!s)
    .map((s) => s.toString().trim())
    .join('');

  console.error(output);
  throw new Error('doctoc should not error on commit!');
}

const newREADME = fs.readFileSync(path.join(rootDir, 'README.md'));

if (newREADME === oldREADME) {
  throw new Error('doctoc should have update the toc with a new entry!');
}

// test to make sure husky and lint-staged work
console.log('** Making sure husky/lint-staged can fail **');
fs.writeFileSync(path.join(rootDir, 'src', 'plugin.js'), '\n\n\n\n\n\nexport default nothing;');

const huskyRetval = spawnSync('git', ['commit', '-a', '-m', 'test husky'], spawnOptions);

if (huskyRetval.status === 0) {
  const output = huskyRetval.output
    .filter((s) => !!s)
    .map((s) => s.toString().trim())
    .join('');

  console.error(output);
  throw new Error('Husky should have errored on linting!');
}

console.log('** SUCCESS **');
