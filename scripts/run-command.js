/* eslint-disable no-console */
const childProcess = require('child_process');
const path = require('path');

const isSuccess = function(retval) {
  if (retval.status !== 0) {
    const output = retval.error || retval.output.toString();

    console.error('** FAILURE **');
    console.error(output);
    return false;
  }

  return true;
};

const runCommand = function(args, options) {
  options = Object.assign({}, options);
  const cmd = args.shift();
  const command = `${path.basename(cmd)} ${args.join(' ')}`;

  if (!options.silent) {
    console.log(`** Running '${command}' **`);
  }
  if (!options.async) {
    const retval = childProcess.spawnSync(cmd, args, options);

    if (!isSuccess(retval)) {
      process.exit(1);
    }
    return retval;
  }

  delete options.silent;
  delete options.async;

  return new Promise(function(resolve, reject) {
    const retval = {
      stdout: '',
      stderr: '',
      output: '',
      status: 0
    };
    const child = childProcess.spawn(cmd, args, options);

    child.on('error', function(e) {
      reject(e);
    });

    child.on('close', function(exitCode) {
      retval.status = exitCode;
      if (!isSuccess(retval)) {
        reject(retval);
      }
      resolve(retval);
    });

    ['stdout', 'stderr'].forEach((channel) => child[channel].on('data', function(d) {
      const str = d.toString();

      retval[channel] += str;
      retval.output += str;
    }));
  });
};

module.exports = runCommand;
