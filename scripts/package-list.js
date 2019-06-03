const runCommand = require('./run-command.js');
const lernaList = runCommand(['lerna', 'list', '--json'], {cwd: __dirname, silent: true});

const packages = JSON.parse(lernaList.stdout.toString()).reduce(function(acc, val) {
  acc[val.name] = val.location;
  return acc;
}, {});

module.exports = packages;

