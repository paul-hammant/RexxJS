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

class RexxMetaPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('RexxMetaPlugin', (compilation) => {
      Object.keys(compilation.assets).forEach(filename => {
        if (filename.endsWith('.bundle.js')) {
          const asset = compilation.assets[filename];
          let source = asset.source();
          source = source.replace(/\\?"dependencies\\?":\s*\\?\{[^}]*\\?\}/g, '\\"dependencies\\":{');
          source = source.replace(/"dependencies":\s*\{[^}]*\}/g, '"dependencies":{}');
          compilation.assets[filename] = {
            source: () => source,
            size: () => source.length
          };
        }
      });
    });
  }
}

module.exports = {
  mode: 'development',
  entry: './virtualbox-address.js',
  output: {
    filename: 'virtualbox-address.bundle.js',
    path: path.resolve(getGitRoot(), '../dist/addresses'),
    library: 'virtualbox-address',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  externals: {
    'fs': 'fs',
    'path': 'path',
    'child_process': 'child_process'
  },
  resolve: {
    extensions: ['.js']
  },
  target: 'node',
  plugins: [
    new RexxMetaPlugin(),
    new (require('webpack')).BannerPlugin({
      banner: '/*!\n * @rexxjs-meta=VIRTUALBOX_ADDRESS_META\n */',
      raw: true
    })
  ]
};
