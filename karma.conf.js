/* eslint-disable */
// Karma configuration
// Generated on Mon Nov 30 2015 00:21:47 GMT-0500 (EST)

const webpackConfig = require('./webpack.config');

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
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.js': ['webpack']
    },

    reporters: ['mocha', 'coverage'],

    coverageReporter: {
      dir: 'coverage',
      reporters: [
        {type: 'html', subdir: 'report'},
        {type: 'lcovonly', subdir: '.', file: 'lcov.info'},
        {type: 'text-summary'},
      ]
    },

    port: 9876,

    colors: true,

    logLevel: config.LOG_ERROR,

    autoWatch: true,

    browsers: ['PhantomJS'],

    singleRun: true,

    webpack: webpackConfig,
  });
};
