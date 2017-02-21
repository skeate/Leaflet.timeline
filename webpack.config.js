const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    'leaflet.timeline': './src/index.js',
    'leaflet.timeline.min': './src/index.js',
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.js$/i,
        loader: 'babel-loader',
        exclude: /node_modules\/(^diesal)/,
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          {
            loader: 'sass-loader',
            options: {
              indentedSyntax: true,
            },
          },
        ],
      },
    ]
  },

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true,
    }),
  ],

  devtool: 'eval-source-map',

  devServer: {
    inline: true,
    contentBase: [
      'examples',
      'node_modules/leaflet/dist',
    ],
    port: 8112,
    host: '0.0.0.0',
  },
};
