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

// Plugin to transform @rexxjs-meta dependencies in bundled output
class RexxMetaPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('RexxMetaPlugin', (compilation) => {
      Object.keys(compilation.assets).forEach(filename => {
        if (filename.endsWith('.bundle.js')) {
          const asset = compilation.assets[filename];
          let source = asset.source();
          
          // Handle both regular JSON and escaped JSON (in eval strings)
          // Match "dependencies":{...} including nested braces and escaped quotes
          source = source.replace(
            /\\?"dependencies\\?":\s*\\?\{[^}]*\\?\}/g,
            '\\"dependencies\\":{}'
          );
          
          // Also handle non-escaped version
          source = source.replace(
            /"dependencies":\s*\{[^}]*\}/g,
            '"dependencies":{}'
          );
          
          // Update the asset
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
  mode: 'development', // No minification
  entry: './src/sqlite-address.js',
  output: {
    filename: 'sqlite-address.bundle.js',
    path: path.resolve(getGitRoot(), '../dist/addresses'),
    library: 'sqlite-address',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  externals: {
    'fs': 'fs',
    'path': 'path',
    'sqlite3': 'sqlite3'
  },
  resolve: {
    extensions: ['.js']
  },
  target: 'web',
  plugins: [
    new RexxMetaPlugin(),
    new (require('webpack')).BannerPlugin({
      banner: '/*!\n * @rexxjs-meta=SQLITE_ADDRESS_META\n */',
      raw: true
    })
  ]
};
