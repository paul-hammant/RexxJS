const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'bundle-entry.js'),
  output: {
    path: __dirname,
    filename: 'bundled-remote-handlers.bundle.js',
    library: 'RexxJSRemoteHandlers',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'typeof self !== "undefined" ? self : this'
  },
  externals: {
    'child_process': 'child_process',
    'fs': 'fs', 
    'path': 'path'
  },
  target: 'node',
  resolve: {
    preferRelative: true
  },
  optimization: {
    minimize: true,
    minimizer: [
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          keep_fnames: /.*_META$/,
          mangle: {
            reserved: ['BUNDLED_REMOTE_HANDLERS_META', 'ADDRESS_SSH_META']
          }
        }
      })
    ]
  },
  plugins: [
    new (require('webpack')).BannerPlugin({
      banner: '/*!\n * @rexxjs-meta=BUNDLED_REMOTE_HANDLERS_META\n */',
      raw: true
    })
  ]
};