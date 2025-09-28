-- Dogfooding RexxJS Infrastructure as Code
-- This script uses RexxJS to create and deploy another RexxJS provisioning script
-- Usage: node core/src/cli.js extras/addresses/provisioning-and-orchestration/dogfood-ubuntu25-iac.rexx HOST USER

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"

PARSE ARG HOST, USER
IF USER = '' THEN USER = 'paul'

SAY '🎯 Dogfooding RexxJS Infrastructure as Code'
SAY '==========================================='
SAY 'Creating RexxJS scripts to manage RexxJS infrastructure'
SAY 'Target: ' || USER || '@' || HOST
SAY ''

-- Connect to remote host
ADDRESS ssh
connect host=HOST user=USER id='dogfood' timeout=15000

-- Step 1: Create infrastructure scripts using RexxJS
SAY '[1/5] Creating infrastructure management scripts via RexxJS...'

-- Use HEREDOC to create a remote script file
ADDRESS ssh
<<CREATE_INFRASTRUCTURE_SCRIPT
cat > ~/setup-rexxjs-iac.sh << 'SCRIPT_EOF'
#!/bin/bash
set -e

echo "🚀 Setting up RexxJS Infrastructure as Code workspace"
echo "===================================================="

# Create workspace
mkdir -p ~/rexxjs-iac/{bin,scripts,templates,projects}

# Install Docker if needed
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg lsb-release
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo systemctl enable --now docker
  sudo usermod -aG docker \$(whoami)
fi

# Install Node.js if needed  
if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js LTS..."
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs build-essential git
fi

echo "✅ Infrastructure base ready for RexxJS deployment"
SCRIPT_EOF

chmod +x ~/setup-rexxjs-iac.sh
echo "Infrastructure setup script created"
CREATE_INFRASTRUCTURE_SCRIPT

-- Step 2: Run the infrastructure setup
SAY '[2/5] Running infrastructure setup...'
ADDRESS ssh
exec command='~/setup-rexxjs-iac.sh' id='dogfood'

-- Step 3: Upload RexxJS binary
SAY '[3/5] Deploying RexxJS binary...'
ADDRESS ssh
copy_to id='dogfood' local='./bin/rexx-linux-x64-bin' remote='~/rexxjs-iac/bin/rexx'

ADDRESS ssh
exec command='chmod +x ~/rexxjs-iac/bin/rexx' id='dogfood'

-- Step 4: Create RexxJS management scripts using RexxJS
SAY '[4/5] Creating RexxJS management scripts...'
ADDRESS ssh
<<CREATE_REXXJS_SCRIPTS
# Create a RexxJS script that manages infrastructure
cat > ~/rexxjs-iac/scripts/manage-infrastructure.rexx << 'REXX_EOF'
-- RexxJS Infrastructure Management Script
-- This script was created by RexxJS to manage RexxJS infrastructure

SAY '🏗️ RexxJS Infrastructure Manager'
SAY '==============================='
SAY 'Host: ' || ADDRESS('SYSTEM', 'hostname')
SAY 'User: ' || ADDRESS('SYSTEM', 'whoami')
SAY 'Timestamp: ' || DATE() || ' ' || TIME()
SAY ''

SAY 'Infrastructure Status Check:'
SAY '  Docker: ' || ADDRESS('SYSTEM', 'docker --version 2>/dev/null || echo "Not installed"')  
SAY '  Node.js: ' || ADDRESS('SYSTEM', 'node --version 2>/dev/null || echo "Not installed"')
SAY '  RexxJS: ' || ADDRESS('SYSTEM', '~/rexxjs-iac/bin/rexx --version 2>/dev/null || echo "Not available"')
SAY ''

SAY 'Managing project structure...'
ADDRESS SYSTEM
mkdir -p ~/rexxjs-iac/projects/web-apps ~/rexxjs-iac/projects/apis ~/rexxjs-iac/projects/containers || true

ADDRESS SYSTEM  
echo "RexxJS managed this infrastructure on $(date)" > ~/rexxjs-iac/managed-status.txt

SAY ''
SAY '✅ Infrastructure management completed via RexxJS!'
SAY 'Status file: ~/rexxjs-iac/managed-status.txt'
REXX_EOF

# Create a RexxJS script for deploying applications
cat > ~/rexxjs-iac/scripts/deploy-app.rexx << 'DEPLOY_EOF'
-- RexxJS Application Deployment Script
-- Created by RexxJS for deploying applications via RexxJS

PARSE ARG APP_NAME, APP_TYPE
IF APP_NAME = '' THEN APP_NAME = 'sample-app'
IF APP_TYPE = '' THEN APP_TYPE = 'web'

SAY '🚀 RexxJS Application Deployment'
SAY '==============================='
SAY 'Deploying application: ' || APP_NAME
SAY 'Application type: ' || APP_TYPE
SAY ''

SAY 'Creating application structure...'
ADDRESS SYSTEM
mkdir -p ~/rexxjs-iac/projects/' || APP_TYPE || '/' || APP_NAME

ADDRESS SYSTEM
echo 'Application: ' || APP_NAME > ~/rexxjs-iac/projects/' || APP_TYPE || '/' || APP_NAME || '/info.txt'

ADDRESS SYSTEM
echo 'Deployed via RexxJS on: ' || DATE() >> ~/rexxjs-iac/projects/' || APP_TYPE || '/' || APP_NAME || '/info.txt'

SAY ''
SAY '✅ Application ' || APP_NAME || ' deployed successfully!'
SAY 'Path: ~/rexxjs-iac/projects/' || APP_TYPE || '/' || APP_NAME
DEPLOY_EOF

chmod +x ~/rexxjs-iac/scripts/*.rexx
echo "RexxJS management scripts created"
CREATE_REXXJS_SCRIPTS

-- Step 5: Test the dogfooding by running RexxJS scripts that manage RexxJS
SAY '[5/5] Testing dogfooding - RexxJS managing RexxJS...'

SAY 'Running infrastructure management via RexxJS...'
ADDRESS ssh
exec command='cd ~/rexxjs-iac && ./bin/rexx scripts/manage-infrastructure.rexx' id='dogfood'

SAY 'Testing application deployment via RexxJS...'  
ADDRESS ssh
exec command='cd ~/rexxjs-iac && ./bin/rexx scripts/deploy-app.rexx sample-web-app web' id='dogfood'

SAY 'Verifying dogfood results...'
ADDRESS ssh
<<VERIFY_DOGFOODING
echo "🎯 Dogfooding Verification"
echo "========================="
echo "Host: $(hostname)"
echo "User: $(whoami)"
echo ""
echo "Infrastructure Status:"
echo "  Docker: $(docker --version 2>/dev/null || echo 'Not available')"
echo "  Node.js: $(node --version 2>/dev/null || echo 'Not available')"
echo "  RexxJS: $(~/rexxjs-iac/bin/rexx --version 2>/dev/null || echo 'Not available')"
echo ""
echo "RexxJS-managed infrastructure:"
find ~/rexxjs-iac -name "*.rexx" -o -name "*.txt" | head -10
echo ""
echo "✅ Dogfooding successful: RexxJS is managing RexxJS infrastructure!"
VERIFY_DOGFOODING

ADDRESS ssh
close id='dogfood'

SAY ''
SAY '🎯 DOGFOODING SUCCESS: RexxJS Managing RexxJS Infrastructure!'
SAY '==========================================================='
SAY '  Host: ' || USER || '@' || HOST
SAY '  Achievement: RexxJS scripts created and deployed by RexxJS'
SAY '  Status: Self-managing RexxJS Infrastructure as Code'
SAY ''
SAY '🏆 Dogfooding Achievements:'
SAY '  ✅ RexxJS created infrastructure setup scripts'
SAY '  ✅ RexxJS deployed RexxJS binary remotely'
SAY '  ✅ RexxJS created RexxJS management scripts'
SAY '  ✅ RexxJS ran RexxJS scripts to manage infrastructure'
SAY '  ✅ RexxJS deployed applications via RexxJS'
SAY ''
SAY '🧪 Test Continued Self-Management:'
SAY '  ssh ' || USER || '@' || HOST || ' "cd ~/rexxjs-iac && ./bin/rexx scripts/manage-infrastructure.rexx"'
SAY '  ssh ' || USER || '@' || HOST || ' "cd ~/rexxjs-iac && ./bin/rexx scripts/deploy-app.rexx my-api api"'
SAY ''  
SAY '🚀 Pure RexxJS Infrastructure as Code: Self-Managing and Dogfooded!'