const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, '../interpreter-web-loader.js'),
  output: {
    filename: 'repl.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'RexxInterpreter',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.js'],
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "child_process": false
    }
  },
  target: 'web',
  optimization: {
    minimize: true
  }
};
