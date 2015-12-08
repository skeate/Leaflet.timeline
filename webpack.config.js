/* eslint-disable */
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    'leaflet.timeline': './src/index.js',
    'leaflet.timeline.min': './src/index.js',
  },

  output: {
    path: __dirname + '/dist',
    filename: '[name].js'
  },

  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel' },
      {
        test: /\.sass$/,
        loader: ExtractTextPlugin.extract(
          'style',
          'css!sass'
        )
      }
    ]
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true,
    }),
    new ExtractTextPlugin('leaflet.timeline.min.css'),
    new webpack.SourceMapDevToolPlugin({
      exclude: /(\.min\.js|\.css)$/,
    })
  ],

  sassLoader: {
    indentedSyntax: true
  }
};
