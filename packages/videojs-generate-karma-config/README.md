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
