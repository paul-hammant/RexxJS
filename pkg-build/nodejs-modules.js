/*!
 * Node.js built-in modules for pkg environment
 * Pre-requires modules that aren't available via require() in pkg
 */

// Pre-require Node.js built-ins at build time so they're available at runtime
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const util = require('util');

// Expose them for runtime access
global.PKG_NODEJS_MODULES = {
  child_process,
  fs, 
  path,
  os,
  crypto,
  util
};

module.exports = {
  child_process,
  fs,
  path, 
  os,
  crypto,
  util
};