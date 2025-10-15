const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'interpreter-bundle-entry.js'),
  output: {
    filename: 'rexxjs.bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    extensions: ['.js'],
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "child_process": false,
      "vm": false,
      "https": false,
      "http": false,
      "os": false,
      "zlib": false,
      "module": false,
      "url": false,
      "stream": false,
      "buffer": false,
      "util": false
    }
  },
  target: 'web',
  optimization: {
    minimize: true
  }
};
