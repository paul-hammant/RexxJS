-- RexxJS Infrastructure Module: Node.js LTS Installation
-- Pure RexxJS implementation for installing Node.js via NodeSource repository
-- Usage: Include with REQUIRE or call as standalone module

REQUIRE "./extras/addresses/remote/address-ssh.js"

PARSE ARG HOST, USER, SESSION_ID
IF SESSION_ID = '' THEN SESSION_ID = 'nodejs-install'

SAY '[Node.js Module] Installing Node.js LTS on ' || USER || '@' || HOST

ADDRESS ssh
connect host=HOST user=USER id=SESSION_ID

-- Check current Node.js status
SAY '[Node.js Module] Checking existing Node.js installation...'
ADDRESS ssh
<<CHECK_NODEJS_STATUS
if command -v node >/dev/null 2>&1; then
  echo "NODEJS_STATUS=installed"
  echo "NODEJS_VERSION=$(node --version)"
  echo "NPM_VERSION=$(npm --version)"
else
  echo "NODEJS_STATUS=not_installed"
fi
CHECK_NODEJS_STATUS

-- Install Node.js LTS using NodeSource repository
SAY '[Node.js Module] Installing Node.js LTS via NodeSource...'
ADDRESS ssh
exec command='echo "[nodejs-install] Starting Node.js installation on $(hostname)"' id=SESSION_ID

-- Download and run NodeSource setup script
ADDRESS ssh
exec command='curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -' id=SESSION_ID

-- Install Node.js package
ADDRESS ssh
exec command='sudo apt-get install -y nodejs' id=SESSION_ID

-- Install build essentials for native modules
SAY '[Node.js Module] Installing build tools for native modules...'
ADDRESS ssh
exec command='sudo apt-get install -y build-essential' id=SESSION_ID

-- Verify installation
SAY '[Node.js Module] Verifying Node.js installation...'
ADDRESS ssh
exec command='node --version' id=SESSION_ID

ADDRESS ssh
exec command='npm --version' id=SESSION_ID

-- Create installation marker
ADDRESS ssh
exec command='touch ~/.rexxjs-nodejs-install-marker' id=SESSION_ID

SAY '[Node.js Module] Node.js LTS installation completed on ' || USER || '@' || HOST