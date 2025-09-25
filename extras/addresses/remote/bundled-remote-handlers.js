/*!
 * Bundled Remote Handlers (SSH) v1.0.0
 * (c) 2025 RexxJS Project | MIT License
 * Includes shared-utils via centralized module path
 */

// Load shared utils using path relative to cli snapshot root (pkg-build)
const shared = require(require('path').join(__dirname, '../extras/addresses/shared-utils/index.js'));

// Re-export or bootstrap the SSH handlers by evaluating source files if needed
// For now, require the node-source SSH handler and expose its globals
const fs = require('fs');
const path = require('path');

function loadFileIfExists(p) {
  if (fs.existsSync(p)) {
    const code = fs.readFileSync(p, 'utf8');
    eval(code);
    return true;
  }
  return false;
}

(function init() {
  const here = __dirname;
  const ssh1 = path.join(here, 'address-ssh.js');
  const ssh2 = path.join(here, 'address-ssh-multimode.js');
  loadFileIfExists(ssh1);
  loadFileIfExists(ssh2);
})();

module.exports = { shared };
