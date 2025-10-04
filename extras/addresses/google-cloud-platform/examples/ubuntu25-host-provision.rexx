-- Pure RexxJS Infrastructure as Code: Ubuntu 25 Host Provisioning
-- Usage: node core/src/cli.js extras/addresses/provisioning-and-orchestration/ubuntu25-host-provision.rexx HOST USER [REXX_BIN]
-- This replaces provision-ubuntu25.sh and provision-ubuntu25-with-rexxjs.sh entirely

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"

PARSE ARG HOST, USER, REXX_BIN
IF REXX_BIN = '' THEN REXX_BIN = './bin/rexx-linux-x64-bin'

SAY '🚀 RexxJS Infrastructure as Code: Ubuntu 25 Provisioning'
SAY '========================================================='
SAY 'Target: ' || USER || '@' || HOST
SAY 'RexxJS Binary: ' || REXX_BIN
SAY ''

-- [1/5] Test SSH connectivity
SAY '[1/5] Testing SSH connectivity...'
ADDRESS ssh
connect host=HOST user=USER id=ubuntu-provision timeout=10000

SAY 'SSH connection established ✅'

-- [2/5] Install Docker using pure RexxJS commands
SAY '[2/5] Installing Docker via RexxJS...'
ADDRESS ssh
exec command='hostname' id=ubuntu-provision
exec command='whoami' id=ubuntu-provision

-- Check if Docker exists
ADDRESS ssh
<<CHECK_DOCKER
if command -v docker >/dev/null 2>&1; then
  echo "DOCKER_EXISTS=true"
else
  echo "DOCKER_EXISTS=false"
fi
CHECK_DOCKER

-- Install Docker if needed (Ubuntu 25 compatible)
ADDRESS ssh
<<INSTALL_DOCKER
if ! command -v docker >/dev/null 2>&1; then
  echo "[docker-install] Installing Docker on $(hostname)"
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg lsb-release
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo usermod -aG docker $(whoami)
  echo "[docker-install] Docker installation completed"
else
  echo "[docker-install] Docker already installed: $(docker --version)"
fi
INSTALL_DOCKER

-- [3/5] Install Node.js LTS
SAY '[3/5] Installing Node.js LTS...'
ADDRESS ssh
<<INSTALL_NODEJS
if ! command -v node >/dev/null 2>&1; then
  echo "[nodejs-install] Installing Node.js LTS"
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs build-essential git
  echo "[nodejs-install] Node.js installed: $(node --version)"
else
  echo "[nodejs-install] Node.js already installed: $(node --version)"
fi
INSTALL_NODEJS

-- [4/5] Deploy RexxJS binary to remote host
SAY '[4/5] Deploying RexxJS binary...'
ADDRESS ssh
exec command='mkdir -p ~/rexxjs-workspace/bin' id=ubuntu-provision

-- Upload RexxJS binary (this needs file transfer capability)
SAY 'Uploading RexxJS binary: ' || REXX_BIN || ' -> ~/rexxjs-workspace/bin/rexx'
ADDRESS ssh
put local=REXX_BIN remote='~/rexxjs-workspace/bin/rexx' id=ubuntu-provision

ADDRESS ssh
exec command='chmod +x ~/rexxjs-workspace/bin/rexx' id=ubuntu-provision
exec command='~/rexxjs-workspace/bin/rexx --version' id=ubuntu-provision

-- [5/5] Setup RexxJS workspace and verification
SAY '[5/5] Setting up RexxJS workspace...'
ADDRESS ssh
<<SETUP_WORKSPACE
cd ~/rexxjs-workspace
echo "#!/usr/bin/env bash" > test-rexx.sh
echo "echo 'Testing RexxJS on remote host...'" >> test-rexx.sh  
echo "./bin/rexx -c 'SAY \"Hello from RexxJS on \" || ADDRESS(\"SYSTEM\", \"hostname\")'" >> test-rexx.sh
chmod +x test-rexx.sh
echo "[workspace] RexxJS workspace ready at ~/rexxjs-workspace"
SETUP_WORKSPACE

-- Final verification
SAY 'Running final verification...'
ADDRESS ssh
<<VERIFY_INSTALLATION
echo "🔍 System verification:"
echo "  ✅ Docker: $(docker --version 2>/dev/null || echo 'Not available')"
echo "  ✅ Node.js: $(node --version 2>/dev/null || echo 'Not available')"  
echo "  ✅ RexxJS: $(~/rexxjs-workspace/bin/rexx --version 2>/dev/null || echo 'Not available')"
echo "  ✅ User in docker group: $(groups | grep docker && echo 'Yes' || echo 'No (logout/login needed)')"
echo ""
echo "🎉 Ubuntu 25 RexxJS provisioning completed!"
VERIFY_INSTALLATION

ADDRESS ssh
close id=ubuntu-provision

SAY ''
SAY '✅ RexxJS Infrastructure as Code Provisioning Complete'
SAY '===================================================='
SAY '  Host: ' || USER || '@' || HOST
SAY '  Status: Ready for RexxJS development and execution'
SAY ''
SAY '📝 Next Steps:'
SAY '  1. User may need to logout/login for Docker without sudo'  
SAY '  2. RexxJS workspace: ~/rexxjs-workspace'
SAY '  3. RexxJS binary: ~/rexxjs-workspace/bin/rexx'
SAY ''
SAY '🧪 Test RexxJS remotely:'
SAY '  ssh ' || USER || '@' || HOST || ' "cd ~/rexxjs-workspace && ./test-rexx.sh"'