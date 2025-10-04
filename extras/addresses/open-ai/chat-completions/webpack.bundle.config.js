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

          // Replace only the dependencies field in @rexxjs-meta, preserving other fields
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
  entry: path.resolve(__dirname, 'src/chat-completions.js'),
  output: {
    filename: 'openai-address.bundle.js',
    path: path.resolve(getGitRoot(), '../dist/addresses'),
    library: 'openai-address',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  externals: {
    'fs': 'fs',
    'path': 'path',
    'crypto': 'crypto',
    'child_process': 'child_process',
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
  plugins: [new RexxMetaPlugin()]
};
