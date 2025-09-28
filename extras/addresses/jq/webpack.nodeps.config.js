/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const path = require('path');
const { execSync } = require('child_process');
const TerserPlugin = require('terser-webpack-plugin');

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

class InjectNoDepsMetaPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('InjectNoDepsMetaPlugin', (compilation) => {
      // Get the main chunk asset
      const mainAsset = compilation.assets['jq-nodeps-address.js'];
      if (mainAsset) {
        // Get the source code
        let source = mainAsset.source();
        
        // Update for new metadata pattern - keep the same function name but indicate no deps
        // The metadata function will still exist, but will return dependencies: {}
        
        // Replace the header comment to indicate this is the no-deps version
        source = source.replace(
          /\/\*!\s*\n \* jq-address v1\.0\.0/,
          '/*!\n * jq-nodeps-address v1.0.0'
        );
        
        // Update dependencies in the metadata function to be empty
        source = source.replace(
          /dependencies:\s*\{\s*["']jq-wasm["']:\s*["'][^"']+["']\s*\}/g,
          'dependencies: {}'
        );
        
        // Update canonical name to distinguish nodeps version
        source = source.replace(
          /canonical:\s*["']org\.rexxjs\/jq-address["']/g,
          'canonical: "org.rexxjs/jq-nodeps-address"'
        );
        
        // Update requirements to reflect web compatibility (nodeps version works in browser)
        source = source.replace(
          /environment:\s*["']nodejs["']/g,
          'environment: "universal"'
        );
        
        // Update description to clarify this is the standalone version
        source = source.replace(
          /description:\s*["']JSON query execution via ADDRESS interface \(requires jq-wasm dependency\)["']/g,
          'description: "JSON query execution via ADDRESS interface (standalone, web-compatible)"'
        );
        
        // Update the asset
        compilation.assets['jq-nodeps-address.js'] = {
          source: () => source,
          size: () => source.length
        };
      }
    });
  }
}

module.exports = {
  entry: './src/jq-address.js',
  output: {
    path: path.resolve(getGitRoot(), '../dist/addresses'),
    filename: 'jq-nodeps-address.js',
    library: 'jqNoDepsAddress',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'typeof self !== \'undefined\' ? self : this'
  },
  target: 'web',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  // Don't externalize jq-wasm - include it in the bundle
  externals: {},
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // Preserve function names for RexxJS detection
          keep_fnames: /.*_META$/,
          mangle: {
            // Don't mangle critical property names
            reserved: [
              'dependencies', 'peerDependencies', 'optionalDependencies',
              'type', 'module', 'name', 'version', 'loaded', 'functions',
              'jq-address', 'JQ_ADDRESS_META', 'ADDRESS_JQ_HANDLER', 'ADDRESS_JQ_METHODS'
            ]
          },
          compress: {
            // Preserve function calls that return metadata
            pure_funcs: []
          },
          format: {
            // CRITICAL: Preserve /*! */ comments (jQuery-style) with @rexxjs-meta
            comments: /^\\*!|@preserve|@license|@cc_on|@rexxjs-meta/i
          }
        },
        extractComments: false // Keep comments in main file
      })
    ]
  },
  resolve: {
    fallback: {
      // Provide fallbacks for Node.js modules in browser
      "buffer": require.resolve("buffer/"),
      "crypto": false,
      "fs": false,
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/")
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
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['> 1%', 'last 2 versions'],
                  node: '14'
                }
              }]
            ]
          }
        }
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async'
      }
    ]
  },
  plugins: [
    new InjectNoDepsMetaPlugin()
  ],
  experiments: {
    asyncWebAssembly: true
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'eval-source-map'
};