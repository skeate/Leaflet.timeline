/* eslint-disable */
// Karma configuration
// Generated on Mon Nov 30 2015 00:21:47 GMT-0500 (EST)

var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'sinon-chai'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/leaflet/dist/leaflet-src.js',
      'test/**/*_test.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.js': ['webpack', 'sourcemap']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha', 'coverage'],

    coverageReporter: {
      dir: 'coverage',
      reporters: [
        {type: 'html', subdir: 'report'},
        {type: 'lcovonly', subdir: '.', file: 'lcov.info'}
      ]
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: Infinity,


    webpack: {
      module: {
        preLoaders: [
          {
            test: /(\.jsx)|(\.js)$/,
            exclude: /(test|node_modules|bower_components)\//,
            loader: 'isparta-instrumenter-loader',
          }
        ],
        loaders: [
          {
            test: /\.js$/,
            // don't want to compile node_modules -- other than the diesal lib.
            exclude: /node_modules\/(^diesal)/,
            loader: 'babel'
          },
          {
            test: /\.sass$/,
            loader: ExtractTextPlugin.extract(
              'style',
              'css!sass'
            )
          }
        ]
      },

      sassLoader: {
        indentedSyntax: true
      },

      devtool: 'inline-source-map'
    },

    webpackMiddleware: {
      noInfo: true
    }
  });
};
