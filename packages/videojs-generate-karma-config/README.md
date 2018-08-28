# videojs-generate-karma-config

[![Build Status](https://travis-ci.org/videojs/videojs-generate-karma-config.svg?branch=master)](https://travis-ci.org/videojs/videojs-generate-karma-config)
[![Greenkeeper badge](https://badges.greenkeeper.io/videojs/videojs-generate-karma-config.svg)](https://greenkeeper.io/)
[![Slack Status](http://slack.videojs.com/badge.svg)](http://slack.videojs.com)

[![NPM](https://nodei.co/npm/videojs-generate-karma-config.png?downloads=true&downloadRank=true)](https://nodei.co/npm/videojs-generate-karma-config/)

Currently our karma configs are the same for most plugins, but when the default config changes a bit, every repository has
to be updated since it is a static file. This package will provide the standard config as a module, so that updates can be
deployed much easier.

Lead Maintainer: Brandon Casey [@brandonocasey](https://github.com/brandonocasey)

Maintenance Status: Stable


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Installation](#installation)
- [Code Coverage](#code-coverage)
  - [codecov.io](#codecovio)
  - [View the html report](#view-the-html-report)
  - [View the report after testing](#view-the-report-after-testing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

```
$ npm install --save-dev karma videojs-generate-karma-config
```

Then in your karma config do

```js
const generateKarmaConfig = require('videojs-generate-karma-config');

module.exports = function(config) {
  config = generateKarmaConfig(config);
};
```

## Code Coverage
lcov, json, and html coverage reports will be generated in `test/dist/coverage` after a test run.

### codecov.io
1. install codecov globally in your ci of choice
2. run `codecov -f test/dist/coverage/lcov.info` on your ci after testing

### View the html report
> NOTE: When running as a static server you will have to generate the coverage report by going to `localhost:9999/test` before you can visit the coverage report.
1. Run your unit tests
2. open `test/dist/coverage/index.html`

### View the report after testing
* simply run `cat test/dist/coverage/text.txt` or if you want a cross platform way use `shx`. `shx cat test/dist/coverage/text.txt`


