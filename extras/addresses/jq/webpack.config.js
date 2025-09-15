/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/jq-address.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'jq-address.js',
    library: 'jqAddress',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'typeof self !== \'undefined\' ? self : this'
  },
  target: 'web',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  externals: {
    // jq-wasm should be loaded separately
    'jq-wasm': {
      commonjs: 'jq-wasm',
      commonjs2: 'jq-wasm',
      amd: 'jq-wasm',
      root: 'jq'
    }
  },
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
      "buffer": false,
      "crypto": false,
      "fs": false,
      "path": false,
      "stream": false,
      "util": false
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
      }
    ]
  },
  plugins: [],
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map'
};