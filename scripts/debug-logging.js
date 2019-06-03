const isCi = require('is-ci');

// in a ci or if --debug is passed
module.exports = isCi || [...process.argv].some((arg) => (/^-d|--debug$/.test(arg)));
