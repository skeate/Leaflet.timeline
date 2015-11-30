/* eslint-disable */
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: './src/index.js',

  output: {
    path: __dirname + '/dist',
    filename: 'leaflet.timeline.min.js'
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
    new webpack.optimize.UglifyJsPlugin(),
    new ExtractTextPlugin('leaflet.timeline.min.css')
  ],

  sassLoader: {
    indentedSyntax: true
  }
};
