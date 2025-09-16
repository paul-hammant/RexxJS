const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rexx.js',
    library: 'rexxjs',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  mode: 'production',
  resolve: {
    fallback: {
      // Disable Node.js polyfills for crypto since we handle it manually
      "crypto": false,
      "buffer": false,
      "stream": false,
      "util": false,
      "path": false,
      "fs": false,
      "vm": false,
      "https": false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};