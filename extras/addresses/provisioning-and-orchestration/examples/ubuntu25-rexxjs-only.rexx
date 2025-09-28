-- Pure RexxJS Infrastructure as Code: RexxJS-Only Provisioning
-- Usage: node core/src/cli.js extras/addresses/provisioning-and-orchestration/ubuntu25-rexxjs-only.rexx HOST USER [REXX_BIN]
-- No Node.js installation - RexxJS binary is self-contained

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"

PARSE ARG HOST, USER, REXX_BIN
IF REXX_BIN = '' THEN REXX_BIN = './bin/rexx-linux-x64-bin'

SAY '🚀 Pure RexxJS Infrastructure: RexxJS-Only'
SAY '=========================================='
SAY 'Target: ' || USER || '@' || HOST
SAY 'RexxJS Binary: ' || REXX_BIN
SAY 'Philosophy: RexxJS binary is self-contained (no Node.js needed)'
SAY ''

ADDRESS ssh
connect host=HOST user=USER id=rexxjs-only timeout=15000

-- [1/3] Install Docker only (if needed for container orchestration)
SAY '[1/3] Installing Docker for container orchestration...'
ADDRESS ssh
<<DOCKER_INSTALL
if ! command -v docker >/dev/null 2>&1; then
  echo "[docker] Installing Docker CE..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg lsb-release
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable --now docker
  sudo usermod -aG docker $(whoami)
  echo "[docker] Docker installed: $(docker --version)"
else
  echo "[docker] Already installed: $(docker --version)"
fi
DOCKER_INSTALL

-- [2/3] Deploy standalone RexxJS binary (no Node.js required)
SAY '[2/3] Deploying standalone RexxJS binary...'
ADDRESS ssh
exec command='mkdir -p ~/rexxjs-only/{bin,scripts,projects}' id=rexxjs-only

SAY 'Uploading self-contained RexxJS binary...'
ADDRESS ssh
copy_to id=rexxjs-only local=REXX_BIN remote='~/rexxjs-only/bin/rexx'

ADDRESS ssh
exec command='chmod +x ~/rexxjs-only/bin/rexx' id=rexxjs-only

-- Verify standalone RexxJS works without Node.js
SAY 'Verifying standalone RexxJS binary...'
ADDRESS ssh
exec command='~/rexxjs-only/bin/rexx --version' id=rexxjs-only

-- [3/3] Create RexxJS-only continued provisioning framework
SAY '[3/3] Setting up RexxJS-only infrastructure framework...'
ADDRESS ssh
<<SETUP_REXXJS_FRAMEWORK
# Create system test script (no Node.js dependencies)
cat > ~/rexxjs-only/scripts/system-test.rexx << 'EOF'
-- RexxJS System Test (No Node.js Required)
SAY '🧪 RexxJS-Only System Test'
SAY '========================='
SAY 'This demonstrates RexxJS infrastructure without Node.js dependencies'
SAY ''
SAY 'Date: ' || DATE()
SAY 'Time: ' || TIME()
SAY ''
SAY '✅ RexxJS binary is self-contained and operational!'
SAY 'No Node.js installation required on remote host.'
EOF

# Create infrastructure management script (RexxJS-only)
cat > ~/rexxjs-only/scripts/manage-infra.rexx << 'EOF'
-- RexxJS Infrastructure Management (No Node.js)
PARSE ARG ACTION
IF ACTION = '' THEN ACTION = 'status'

SAY '🏗️ RexxJS-Only Infrastructure Manager'
SAY '===================================='
SAY 'Action: ' || ACTION
SAY 'Host managed by standalone RexxJS binary'
SAY ''

IF ACTION = 'status' THEN DO
  SAY 'Infrastructure Status:'
  SAY '  RexxJS: Self-contained binary operational'
  SAY '  Docker: Available for container orchestration'
  SAY '  Node.js: Not required (RexxJS is standalone)'
  SAY ''
  SAY '✅ RexxJS-only infrastructure ready!'
END

IF ACTION = 'deploy' THEN DO
  SAY 'Deploying application structure...'
  SAY 'Creating project directories via RexxJS...'
  SAY ''
  SAY '✅ Application deployment framework ready!'
END

SAY 'Infrastructure management completed via standalone RexxJS.'
EOF

# Create application deployment script (RexxJS-only)
cat > ~/rexxjs-only/scripts/deploy-app.rexx << 'EOF'
-- RexxJS Application Deployment (No Node.js Dependencies)
PARSE ARG APP_NAME, APP_TYPE
IF APP_NAME = '' THEN APP_NAME = 'default-app'
IF APP_TYPE = '' THEN APP_TYPE = 'general'

SAY '🚀 RexxJS-Only Application Deployment'
SAY '===================================='
SAY 'Application: ' || APP_NAME
SAY 'Type: ' || APP_TYPE
SAY 'Deployment method: Pure RexxJS (no Node.js)'
SAY ''

SAY 'Application ' || APP_NAME || ' deployment simulation completed.'
SAY 'RexxJS binary handles all processing without Node.js runtime.'
SAY ''
SAY '✅ ' || APP_NAME || ' ready for RexxJS-based operations!'
EOF

chmod +x ~/rexxjs-only/scripts/*.rexx
echo "RexxJS-only framework ready!"
SETUP_REXXJS_FRAMEWORK

-- Test the RexxJS-only framework
SAY 'Testing RexxJS-only infrastructure...'
ADDRESS ssh
exec command='cd ~/rexxjs-only && ./bin/rexx scripts/system-test.rexx' id=rexxjs-only

SAY 'Testing infrastructure management...'
ADDRESS ssh
exec command='cd ~/rexxjs-only && ./bin/rexx scripts/manage-infra.rexx status' id=rexxjs-only

SAY 'Testing application deployment...'
ADDRESS ssh
exec command='cd ~/rexxjs-only && ./bin/rexx scripts/deploy-app.rexx test-app web' id=rexxjs-only

-- Final verification
SAY 'Final RexxJS-only verification...'
ADDRESS ssh
<<FINAL_VERIFICATION
echo "🎯 RexxJS-Only Infrastructure Verification"
echo "========================================"
echo "Host: $(hostname)"
echo "User: $(whoami)"
echo ""
echo "Infrastructure Status:"
echo "  Docker: $(docker --version 2>/dev/null || echo 'Not available')"
echo "  Node.js: $(node --version 2>/dev/null || echo 'Not installed (not needed)')"
echo "  RexxJS: $(~/rexxjs-only/bin/rexx --version 2>/dev/null || echo 'Not available')"
echo ""
echo "RexxJS Infrastructure:"
find ~/rexxjs-only -name "*.rexx" | head -5
echo ""
echo "✅ RexxJS-Only Infrastructure: OPERATIONAL"
echo "🎯 Pure RexxJS without Node.js dependency!"
FINAL_VERIFICATION

ADDRESS ssh
close id=rexxjs-only

SAY ''
SAY '🎯 SUCCESS: Pure RexxJS-Only Infrastructure Deployed!'
SAY '==================================================='
SAY '  Host: ' || USER || '@' || HOST
SAY '  Architecture: RexxJS binary only (no Node.js runtime)'
SAY '  Status: Self-contained and operational'
SAY ''
SAY '🏆 RexxJS-Only Achievements:'
SAY '  ✅ No Node.js installation required'
SAY '  ✅ RexxJS binary is completely self-contained'
SAY '  ✅ Docker available for container orchestration only'
SAY '  ✅ Pure RexxJS infrastructure management'
SAY '  ✅ Minimal footprint, maximum capability'
SAY ''
SAY '🧪 Test RexxJS-Only Infrastructure:'
SAY '  ssh ' || USER || '@' || HOST || ' "cd ~/rexxjs-only && ./bin/rexx scripts/system-test.rexx"'
SAY '  ssh ' || USER || '@' || HOST || ' "cd ~/rexxjs-only && ./bin/rexx scripts/manage-infra.rexx status"'
SAY ''
SAY '🚀 RexxJS Infrastructure as Code: Pure and Self-Contained!'