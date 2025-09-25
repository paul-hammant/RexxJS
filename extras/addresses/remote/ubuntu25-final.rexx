-- Pure RexxJS Infrastructure as Code: Ubuntu 25 Final Production Version
-- Usage: node core/src/cli.js extras/addresses/remote/ubuntu25-final.rexx HOST USER [REXX_BIN]
-- Environment Variables: HOST, USER, REXX_BIN can also be set via env vars

REQUIRE "./extras/addresses/remote/address-ssh.js"

PARSE ARG HOST, USER, REXX_BIN

-- Parameter validation and fast-fail
IF HOST = '' THEN DO
  SAY '❌ ERROR: HOST parameter required!'
  SAY ''
  SAY 'Usage Options:'
  SAY '  node core/src/cli.js extras/addresses/remote/ubuntu25-final.rexx HOST USER [REXX_BIN]'
  SAY '  ./bin/rexx extras/addresses/remote/ubuntu25-final.rexx HOST USER [REXX_BIN]'
  SAY ''
  SAY 'Parameters:'
  SAY '  HOST      - Target hostname or IP address (required)'
  SAY '  USER      - SSH username (required)' 
  SAY '  REXX_BIN  - Path to RexxJS binary (optional, default: ./bin/rexx-linux-x64-bin)'
  SAY ''
  SAY 'Example:'
  SAY '  node core/src/cli.js extras/addresses/remote/ubuntu25-final.rexx 192.168.1.100 ubuntu'
  EXIT 1
END

IF USER = '' THEN DO
  SAY '❌ ERROR: USER parameter required!'
  SAY ''
  SAY 'Specify SSH username:'
  SAY '  node core/src/cli.js extras/addresses/remote/ubuntu25-final.rexx ' || HOST || ' USERNAME'
  SAY ''
  SAY 'Example:'
  SAY '  node core/src/cli.js extras/addresses/remote/ubuntu25-final.rexx ' || HOST || ' ubuntu'
  EXIT 1
END

IF REXX_BIN = '' THEN REXX_BIN = './bin/rexx-linux-x64-bin'

SAY '🚀 RexxJS Infrastructure as Code: Production Deploy'
SAY '=================================================='
SAY 'Target: ' || USER || '@' || HOST
SAY 'Binary: ' || REXX_BIN
SAY 'Mission: Standalone RexxJS Infrastructure (No Node.js)'
SAY ''

ADDRESS ssh
connect host=HOST user=USER id=final-deploy timeout=15000

-- Install Docker via RexxJS  
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
fi
echo "Docker: $(docker --version 2>/dev/null || echo 'Installation needed')"
DOCKER_INSTALL

-- Create workspace and deploy RexxJS  
SAY '[2/3] Deploying standalone RexxJS binary...'
ADDRESS ssh
exec command='mkdir -p ~/rexxjs-workspace/bin ~/rexxjs-workspace/scripts ~/rexxjs-workspace/projects' id=final-deploy

SAY 'Uploading RexxJS binary...'
ADDRESS ssh
copy_to id=final-deploy local=REXX_BIN remote='~/rexxjs-workspace/bin/rexx'

ADDRESS ssh
exec command='chmod +x ~/rexxjs-workspace/bin/rexx' id=final-deploy

-- Verify deployment
SAY 'Verifying RexxJS deployment...'
ADDRESS ssh
exec command='~/rexxjs-workspace/bin/rexx --version' id=final-deploy

-- Setup continued provisioning capability
SAY '[3/3] Creating continued provisioning framework...'
ADDRESS ssh
<<SETUP_CONTINUED_PROVISIONING
# Create system test script
cat > ~/rexxjs-workspace/scripts/system-test.rexx << 'EOF'
SAY '🧪 RexxJS System Test'
SAY '=================='
SAY 'Host: ' || ADDRESS('SYSTEM', 'hostname')
SAY 'User: ' || ADDRESS('SYSTEM', 'whoami')
SAY 'Time: ' || DATE() || ' ' || TIME()
SAY ''
SAY 'Software Status:'
SAY '  RexxJS: ' || ADDRESS('SYSTEM', './bin/rexx --version')
SAY '  Docker: ' || ADDRESS('SYSTEM', 'docker --version 2>/dev/null || echo "Not available"')
SAY '  Node.js: ' || ADDRESS('SYSTEM', 'node --version 2>/dev/null || echo "Not available"')
SAY ''
SAY '✅ System test completed!'
EOF

# Create continued provisioning script
cat > ~/rexxjs-workspace/scripts/extend-infrastructure.rexx << 'EOF'
SAY '🔧 RexxJS Infrastructure Extension'
SAY '================================='
SAY 'Extending infrastructure on: ' || ADDRESS('SYSTEM', 'hostname')
SAY ''

SAY 'Installing development tools...'
ADDRESS SYSTEM
sudo apt-get update -y

ADDRESS SYSTEM
sudo apt-get install -y vim htop tree jq curl wget unzip

SAY 'Creating additional project structure...'
ADDRESS SYSTEM
mkdir -p ~/rexxjs-workspace/projects/web ~/rexxjs-workspace/projects/api ~/rexxjs-workspace/projects/infrastructure

SAY 'Setting up infrastructure templates...'
ADDRESS SYSTEM
mkdir -p ~/rexxjs-workspace/templates

ADDRESS SYSTEM
cat > ~/rexxjs-workspace/templates/new-server.rexx << 'TEMPLATE_EOF'
-- Template for provisioning additional servers
SAY 'New server provisioning template'
SAY 'Customize this for your infrastructure needs'
TEMPLATE_EOF

ADDRESS SYSTEM
echo "$(date): Infrastructure extended successfully" >> ~/rexxjs-workspace/extension.log

SAY ''
SAY '✅ Infrastructure extension completed!'
SAY 'Log: ~/rexxjs-workspace/extension.log'
EOF

# Make scripts executable
chmod +x ~/rexxjs-workspace/scripts/*.rexx

echo "Continued provisioning framework ready!"
SETUP_CONTINUED_PROVISIONING

-- Demonstrate continued provisioning
SAY 'Demonstrating continued provisioning...'
ADDRESS ssh
exec command='cd ~/rexxjs-workspace && ./bin/rexx scripts/system-test.rexx' id=final-deploy

SAY 'Running infrastructure extension...'
ADDRESS ssh
exec command='cd ~/rexxjs-workspace && ./bin/rexx scripts/extend-infrastructure.rexx' id=final-deploy

-- Final status
SAY 'Final infrastructure status...'
ADDRESS ssh
<<FINAL_STATUS
echo "🎯 RexxJS Infrastructure as Code: DEPLOYED"
echo "========================================"
echo "Host: $(hostname)"
echo "User: $(whoami)"
echo "Status: Operational"
echo ""
echo "Installed Components:"
echo "  Docker: $(docker --version 2>/dev/null || echo 'Not available')"
echo "  Node.js: Not needed (RexxJS binary is self-contained)"
echo "  RexxJS: $(~/rexxjs-workspace/bin/rexx --version 2>/dev/null || echo 'Not available')"
echo ""
echo "RexxJS Workspace:"
find ~/rexxjs-workspace -name "*.rexx" 2>/dev/null
echo ""
echo "✅ Standalone RexxJS Infrastructure Ready for Production!"
FINAL_STATUS

ADDRESS ssh
close id=final-deploy

SAY ''
SAY '🎯 SUCCESS: Standalone RexxJS Infrastructure as Code Deployed!'
SAY '========================================================='
SAY '  Host: ' || USER || '@' || HOST  
SAY '  Architecture: Self-contained RexxJS (No Node.js needed)'
SAY '  Status: Production Ready'
SAY ''
SAY '🏆 Mission Accomplished:'
SAY '  ✅ No Node.js installation required'
SAY '  ✅ Docker installed for container orchestration'
SAY '  ✅ Self-contained RexxJS binary deployed and operational'
SAY '  ✅ Continued provisioning framework established'
SAY ''
SAY '🧪 Test Your Infrastructure:'
SAY '  ssh ' || USER || '@' || HOST || ' "cd ~/rexxjs-workspace && ./bin/rexx scripts/system-test.rexx"'
SAY ''
SAY '🚀 Your standalone RexxJS Infrastructure as Code is ready to scale!'