/* eslint-disable */
var gulp = require('gulp');
var gutil = require('gulp-util');
var webserver = require('gulp-webserver');

var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var webpackConfig = require('./webpack.config');

gulp.task('webpack', function(cb) {
  webpack(webpackConfig, function(err, stats) {
    if (err) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack]', stats.toString({

    }));
    cb();
  });
});

gulp.task('webpack-dev-server', function(cb) {
  var compiler = webpack(webpackConfig);

  new WebpackDevServer(compiler, {

  }).listen(8080, "localhost", function(err) {
    if (err) throw new gutil.PluginError('webpack-dev-server', err);
    gutil.log(
      '[webpack-dev-server]',
      'http://localhost:8080/webpack-dev-server/index.html'
    );
  });
});

gulp.task('default', ['webpack']);
