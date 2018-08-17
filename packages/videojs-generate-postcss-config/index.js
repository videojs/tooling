const path = require('path');
const progress = require('postcss-progress');

const getSettings = function(options) {
  const pkg = require(path.join(process.cwd(), 'package.json'));

  const settings = {
    banner: options.banner || `@name ${pkg.name} @version ${pkg.version} @license ${pkg.license}`,
    browserslist: options.banner || pkg.browserslist || ['defaults', 'ie 11']
  };

  settings.plugins = [
    // set the startTime so that we can print the end time
    progress.start(),

    // inlines local file imports
    require('postcss-import')(),

    // allows you to use newer css features, by converting
    // them into something browsers can support now.
    // see https://preset-env.cssdb.org/features
    // by default we use stage 3+
    require('postcss-preset-env')({
      browsers: settings.browserslist,
      stage: false,
      features: {
        // turn `var(xyz)` into the actual value
        'custom-properties': {preserve: false, warnings: true},

        // flatten nested rules
        'nesting-rules': true
      }
    }),

    // adds a banner to the top of the file
    require('postcss-banner')({important: true, inline: true, banner: settings.banner}),

    // add/remove vendor prefixes based on browser list
    require('autoprefixer')(settings.browserslist),

    // minify
    require('cssnano')({
      safe: true,
      preset: ['default', {
        autoprefixer: settings.browserslist
      }]
    }),

    progress.stop()
  ];

  if (options.plugins) {
    settings.plugins = options.plugins(settings.plugins);
  }

  return settings;
};

module.exports = function(context, options) {
  const settings = getSettings(options);

  context.opts = {
    to: `dist/${settings.distName}.css`,
    from: settings.input
  };

  return {
    plugins: settings.plugins
  };
};
