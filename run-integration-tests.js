/* global Promise */
/* eslint-disable no-console */

const crypto = require('crypto');
const os = require('os');
const path = require('path');
const spawnSync = require('child_process').spawnSync;
const fs = require('fs');
const isCi = require('is-ci');
const lernaList = spawnSync('lerna', ['list', '--json'], {cwd: __dirname});
const assert = require('assert');
if (lernaList.status !== 0) {
  throw new Error('lerna list --json failed, is lerna installed?');
}
const packages = JSON.parse(lernaList.stdout.toString()).reduce(function(acc, val) {
  acc[val.name] = val.location;
  return acc;
}, {});

// in a ci or if --debug is passed
const debug = isCi || [...process.argv].some((arg) => (/^-d|--debug$/.test(arg)));
const tempDir = path.join(os.tmpdir(), crypto.randomBytes(20).toString('hex'));
const rootDir = path.join(tempDir, 'videojs-integration-test');
const spawnOptions = {
  cwd: rootDir,
  env: Object.assign(process.env, {
    NPM_MERGE_DRIVER_IGNORE_CI: true,
    // set PATH to current env + each lerna packages node_modules/.bin
    PATH: []
      .concat([path.join(__dirname, 'node_modules', '.bin')])
      .concat(Object.values(packages).map((v) => path.join(v, 'node_modules', '.bin')))
      .concat(process.env.PATH.split(':'))
      .join(':')
  }),
  // inherit makes child stdout and stderr got to parent stdout and stderr
  // which we only want for debug purposes.
  stdio: debug ? 'inherit' : 'pipe'
};

const runCommand = function(args, options) {
  const cmd = args.shift();
  const command = `${path.basename(cmd)} ${args.join(' ')}`;

  console.log(`** Running '${command}' **`);
  const retval = spawnSync(cmd, args, spawnOptions);

  if (retval.status !== 0) {
    const output = retval.error || retval.output.toString();

    console.error(`** FAILURE **`);
    console.error(output);
    process.exit(1);
  }
};

const cleanup = function() {
  console.log(`** Cleaning up ${tempDir} **`);

  if (fs.existsSync(tempDir)) {
    runCommand(['shx', 'rm', '-rf', tempDir], {cwd: __dirname});
  }
};

console.log(`** Generating Project in ${rootDir} **`);

['SIGINT', 'SIGHUP', 'SIGQUIT', 'SIGTERM', 'exit', 'uncaughtException'].forEach(function(k) {
  process.on(k, cleanup);
});

fs.mkdirSync(tempDir);
fs.mkdirSync(rootDir);
runCommand(['yo', packages['generator-videojs-plugin'], '--hurry']);

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json')));

/* allow husky to run in ci */
pkg.husky.skipCI = false;

fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(pkg));

const commands = [
  ['git', 'init'],
  ['npm', 'i', '--package-lock-only'],
  ['npm', 'ci'],
  ['install-local'].concat(Object.values(packages)),
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

commands.forEach(runCommand);
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
