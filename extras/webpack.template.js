// RexxJS Webpack Configuration Template
// This template provides a standard webpack config for RexxJS libraries
// Copy this file and customize the variables at the top for your specific library

const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

// =============================================================================
// CUSTOMIZE THESE VARIABLES FOR YOUR LIBRARY
// =============================================================================

const LIBRARY_CONFIG = {
  // Package configuration (usually from package.json)
  name: 'your-library-name',
  version: '1.0.0',
  description: 'Your library description',
  author: 'Your Name',
  license: 'MIT',
  
  // Entry and output
  entry: './src/your-library.js',
  outputDir: '../../../dist/addresses', // Adjust for functions vs addresses
  outputFilename: 'your-library.bundle.js',
  
  // RexxJS metadata
  metadataFunction: 'YOUR_LIBRARY_META', // Must match the function name in your library
  
  // Build configuration
  target: 'node', // or 'web' for browser libraries
  bundleDependencies: [], // Dependencies to include in bundle
  externalDependencies: {}, // Dependencies to keep external
  
  // Function names to preserve during minification
  preservedFunctions: [
    'YOUR_LIBRARY_META',
    'ADDRESS_YOUR_HANDLER', // If it's an address handler
    'YOUR_LIBRARY_FUNCTIONS' // If it's a function library
  ]
};

// =============================================================================
// STANDARD CONFIGURATION (usually no changes needed below this line)
// =============================================================================

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: path.resolve(__dirname, LIBRARY_CONFIG.entry),
  target: LIBRARY_CONFIG.target,
  
  output: {
    path: path.resolve(__dirname, LIBRARY_CONFIG.outputDir),
    filename: LIBRARY_CONFIG.outputFilename,
    library: LIBRARY_CONFIG.name.replace(/-/g, ''),
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'typeof self !== \'undefined\' ? self : this'
  },
  
  resolve: {
    fallback: LIBRARY_CONFIG.target === 'web' ? {
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/"),
      "buffer": require.resolve("buffer/"),
      "process": require.resolve("process/browser")
    } : {}
  },
  
  externals: LIBRARY_CONFIG.externalDependencies,
  
  plugins: [
    new webpack.BannerPlugin({
      banner: `/*!
 * ${LIBRARY_CONFIG.name} v${LIBRARY_CONFIG.version}
 * ${LIBRARY_CONFIG.description}
 * (c) 2025 ${LIBRARY_CONFIG.author} | ${LIBRARY_CONFIG.license} License
 * 
 * @rexxjs-meta=${LIBRARY_CONFIG.metadataFunction}
 */`,
      raw: true,
      entryOnly: true
    })
  ],
  
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
              'canonical', 'envVars', 'nodeonly',
              ...LIBRARY_CONFIG.preservedFunctions
            ]
          },
          compress: {
            // Preserve function calls that return metadata
            pure_funcs: []
          },
          format: {
            // Preserve critical comments
            comments: /^\*!|@preserve|@license|@cc_on|@rexxjs-meta/i
          }
        }
      })
    ]
  },
  
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map'
};