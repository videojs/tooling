#!/usr/bin/env node

import cli from 'cli';
import convert from './api';

cli.enable('help', 'status', 'version');

cli.parse({
  dir: [
    'd',
    [
      'A directory, relative to cwd, into which converted files will be',
      'placed. If the directory does not exist, an attempt will be made',
      'to create it. If not provided or creation fails, converted .js',
      'files will be placed alongside their .json sources.'
    ].join(' '),
    'string'
  ]
});

cli.main(function(args, options) {
  this.debug(`args: ${JSON.stringify(args)}, options: ${JSON.stringify(options)}`);

  let result = convert(args, options.dir);
  let conversions = result.srces.map((s, i) => `${s} => ${result.dests[i]}`);
  let sep = '\n  ';

  if (conversions.length) {
    this.ok(`videojs-language: conversion complete: ${sep + conversions.join(sep)}`);
  } else {
    this.info('videojs-language: nothing to convert');
  }
});