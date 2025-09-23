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

module.exports = {
  entry: {
    'gemini-pro-address': './src/gemini-pro.js',
    'gemini-pro-vision-address': './src/gemini-pro-vision.js'
  },
  output: {
    path: path.resolve(getGitRoot(), '../dist/addresses'),
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'typeof self !== \'undefined\' ? self : this'
  },
  target: 'web',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  externals: {
    '@google/genai': {
      commonjs: '@google/genai',
      commonjs2: '@google/genai',
      amd: '@google/genai',
      root: 'GoogleGenerativeAI'
    }
  },
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_fnames: /.*_MAIN$/,
          mangle: {
            reserved: [
              'dependencies', 'peerDependencies', 'optionalDependencies',
              'type', 'module', 'name', 'version', 'loaded', 'functions'
            ]
          },
          compress: {
            pure_funcs: []
          },
          format: {
            comments: /^\\*!|@preserve|@license|@cc_on|@rexxjs-meta/i
          }
        },
        extractComments: false
      })
    ]
  },
  resolve: {
    fallback: {
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
