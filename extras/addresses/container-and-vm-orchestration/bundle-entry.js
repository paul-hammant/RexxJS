// Centralized shared utils (static import for bundling)
const shared = require('../shared-utils/index.js');
global.__REXXJS_SHARED_UTILS__ = shared;

// Load individual handlers so their globals are registered
const fs = require('fs');
const path = require('path');

function evalFile(p) {
  const code = fs.readFileSync(p, 'utf8');
  // Make shared utils visible under expected names in scope
  const { interpolateMessage, createLogFunction, parseCommandParts, parseCommand, parseMemoryLimit, validateVolumePath, validateBinaryPath, auditSecurityEvent, calculateUptime, parseKeyValueString, parseCheckpointOutput, wrapScriptWithCheckpoints, parseEnhancedCheckpointOutput, formatStatus } = shared;
  eval(code);
}

['address-remote-docker.js', 'address-docker.js', 'address-podman.js', 'address-nspawn.js'].forEach(f => {
  const full = path.join(__dirname, f);
  if (fs.existsSync(full)) evalFile(full);
});

function BUNDLED_CONTAINER_HANDLERS_META() {
  return {
    type: 'bundle',
    name: 'Bundled Container and VM Orchestration Handlers',
    provides: { bundleHandlers: ['remote_docker', 'docker', 'podman', 'nspawn'] },
    dependencies: {},
    envVars: []
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BUNDLED_CONTAINER_HANDLERS_META };
}
