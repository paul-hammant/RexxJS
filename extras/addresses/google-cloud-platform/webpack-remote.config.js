const path = require('path');
const { execSync } = require('child_process');

function getGitRoot() {
    try {
        const gitRoot = execSync('git rev-parse --show-toplevel')
            .toString()
            .trim();
        return gitRoot;
    } catch (error) {
        throw new Error('Not in a git repository');
    }
}

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'bundle-entry-remote.js'),
  output: {
    path: path.resolve(getGitRoot(), '../dist/addresses'),
    filename: 'ssh-address.bundle.js',
    library: 'ssh-address',
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
            reserved: ['BUNDLED_REMOTE_HANDLERS_META', 'SSH_ADDRESS_META']
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
