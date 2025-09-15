/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

class InjectNoDepsMetaPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('InjectNoDepsMetaPlugin', (compilation) => {
      // Get the main chunk asset
      const mainAsset = compilation.assets['jq-nodeps-address.js'];
      if (mainAsset) {
        // Get the source code
        let source = mainAsset.source();
        
        // Replace the @rexxjs-meta comment to indicate no external dependencies
        source = source.replace(
          /@rexxjs-meta {"dependencies":{"jq-wasm":"[^"]+"}}/,
          '@rexxjs-meta {"dependencies":{}}'
        );
        
        // Replace the header comment
        source = source.replace(
          /\/\*!\s*\n \* jq-address v1\.0\.0/,
          '/*!\n * jq-nodeps-address v1.0.0'
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
    path: path.resolve(__dirname, 'dist'),
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
          keep_fnames: /.*_MAIN$/,
          mangle: {
            // Don't mangle critical property names
            reserved: [
              'dependencies', 'peerDependencies', 'optionalDependencies',
              'type', 'module', 'name', 'version', 'loaded', 'functions',
              'jq-address', 'JQ_ADDRESS_MAIN', 'ADDRESS_JQ_HANDLER', 'ADDRESS_JQ_METHODS'
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
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map'
};