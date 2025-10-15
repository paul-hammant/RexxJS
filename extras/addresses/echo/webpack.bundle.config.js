const path = require('path');

module.exports = {
  mode: 'development', // No minification to preserve comments
  entry: path.resolve(__dirname, 'src/echo-address.js'),
  output: {
    filename: 'echo-address.bundle.js',
    path: path.resolve(__dirname, '../../../../dist/addresses'),
    library: 'EchoAddress',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  target: 'web',
  plugins: [
    new (require('webpack')).BannerPlugin({
      banner: '/*!\n * @rexxjs-meta=ECHO_ADDRESS_META\n */',
      raw: true
    })
  ]
};
