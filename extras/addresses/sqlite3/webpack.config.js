const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');

// Extract RexxJS metadata
const rexxjsMeta = pkg.rexxjs || {};
const outputDir = path.resolve(__dirname, '../../../dist/addresses');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, rexxjsMeta.entry || pkg.main),
  target: 'node',
  output: {
    path: outputDir,
    filename: rexxjsMeta.bundle || `${pkg.name}.bundle.js`
  },
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/"),
      "buffer": require.resolve("buffer/"),
      "process": require.resolve("process/browser")
    }
  },
  externals: {
    // Don't bundle Node.js built-ins
    'child_process': 'commonjs child_process',
    'fs': 'commonjs fs',
    'http': 'commonjs http',
    'https': 'commonjs https',
    'net': 'commonjs net',
    'tls': 'commonjs tls',
    // Don't bundle native modules
    'sqlite3': 'commonjs sqlite3'
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `/*!
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 * (c) 2025 ${pkg.author} | ${pkg.license} License
 * 
 * @rexxjs-meta {
 *   "canonical": "${rexxjsMeta.canonical}",
 *   "name": "${pkg.name}",
 *   "version": "${pkg.version}",
 *   "description": "${pkg.description}",
 *   "author": "${pkg.author}",
 *   "license": "${pkg.license}",
 *   "type": "${rexxjsMeta.type}",
 *   "minified": true,
 *   "buildTime": "${new Date().toISOString()}",
 *   "buildTool": "webpack@5.x"
 * }
 */`,
      raw: true,
      entryOnly: true
    })
  ],
  optimization: {
    minimize: false
  }
};