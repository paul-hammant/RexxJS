// Centralized shared utils (static import for bundling)
const shared = require('../shared-utils/index.js');
global.__REXXJS_SHARED_UTILS__ = shared;

const fs = require('fs');
const path = require('path');

function evalFile(p) {
  const code = fs.readFileSync(p, 'utf8');
  const { interpolateMessage, createLogFunction } = shared;
  eval(code);
}

['address-ssh.js'].forEach(f => {
  const full = path.join(__dirname, f);
  if (fs.existsSync(full)) evalFile(full);
});

// Bundle metadata function
function BUNDLED_REMOTE_HANDLERS_META() {
  return {
    type: 'bundle',
    name: 'Bundled Remote Handlers',
    provides: { bundleHandlers: ['ssh'] },
    dependencies: {},
    envVars: []
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BUNDLED_REMOTE_HANDLERS_META };
}
