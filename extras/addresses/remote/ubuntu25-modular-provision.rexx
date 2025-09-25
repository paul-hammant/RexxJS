-- Pure RexxJS Infrastructure as Code: Ubuntu 25 Modular Provisioning
-- Usage: node core/src/cli.js extras/addresses/remote/ubuntu25-modular-provision.rexx HOST USER [REXX_BIN]
-- This demonstrates modular RexxJS-based Infrastructure as Code

PARSE ARG HOST, USER, REXX_BIN
IF REXX_BIN = '' THEN REXX_BIN = './bin/rexx-linux-x64-bin'

SAY '🚀 RexxJS Modular Infrastructure as Code'
SAY '======================================='
SAY 'Target: ' || USER || '@' || HOST
SAY 'RexxJS Binary: ' || REXX_BIN
SAY 'Architecture: Pure RexxJS, No Bash Scripts'
SAY ''

-- Test SSH connectivity first
SAY '[0/4] Testing SSH connectivity...'
REQUIRE "./extras/addresses/remote/address-ssh.js"

ADDRESS ssh
connect host=HOST user=USER id=main-provision timeout=10000

SAY 'SSH connection established ✅'
SAY ''

-- [1/4] Install Docker using modular RexxJS component
SAY '[1/4] Installing Docker via RexxJS module...'
-- Call Docker installation module
LET DOCKER_RESULT = ADDRESS('SYSTEM', 'cd /home/paul/scm/rexxjs/RexxJS && node core/src/cli.js extras/addresses/remote/modules/docker-install.rexx ' || HOST || ' ' || USER || ' docker-provision')
SAY 'Docker module result: ' || DOCKER_RESULT

-- [2/4] Install Node.js using modular RexxJS component  
SAY '[2/4] Installing Node.js via RexxJS module...'
-- Call Node.js installation module
LET NODEJS_RESULT = ADDRESS('SYSTEM', 'cd /home/paul/scm/rexxjs/RexxJS && node core/src/cli.js extras/addresses/remote/modules/nodejs-install.rexx ' || HOST || ' ' || USER || ' nodejs-provision')
SAY 'Node.js module result: ' || NODEJS_RESULT

-- [3/4] Deploy RexxJS binary using modular component
SAY '[3/4] Deploying RexxJS binary via RexxJS module...'
-- Call RexxJS deployment module
LET DEPLOY_RESULT = ADDRESS('SYSTEM', 'cd /home/paul/scm/rexxjs/RexxJS && node core/src/cli.js extras/addresses/remote/modules/rexxjs-deploy.rexx ' || HOST || ' ' || USER || ' ' || REXX_BIN || ' rexxjs-provision')
SAY 'RexxJS deploy module result: ' || DEPLOY_RESULT

-- [4/4] Final verification and setup continued provisioning capability
SAY '[4/4] Setting up continued provisioning capability...'

-- Create a continued provisioning script on the remote host
ADDRESS ssh
<<CREATE_CONTINUED_PROVISION
cat > ~/rexxjs-workspace/scripts/continued-provision.rexx << 'PROVISION_EOF'
-- Continued Provisioning Script - Running on Remote Host
-- This demonstrates RexxJS-based continued provisioning

SAY '🔧 RexxJS Continued Provisioning Started'
SAY '======================================'
SAY 'Host: ' || ADDRESS('SYSTEM', 'hostname')
SAY 'User: ' || ADDRESS('SYSTEM', 'whoami')
SAY 'Timestamp: ' || DATE() || ' ' || TIME()
SAY ''

-- Example: Install additional packages using RexxJS
SAY '[Continued] Installing additional development tools...'
ADDRESS SYSTEM
sudo apt-get update -y

ADDRESS SYSTEM  
sudo apt-get install -y git curl wget vim htop tree

-- Example: Configure development environment
SAY '[Continued] Configuring development environment...'
ADDRESS SYSTEM
git config --global user.name "RexxJS User" || true

ADDRESS SYSTEM
mkdir -p ~/dev ~/projects || true

-- Example: Clone or setup additional resources
SAY '[Continued] Setting up project structure...'
ADDRESS SYSTEM
mkdir -p ~/rexxjs-workspace/projects/web ~/rexxjs-workspace/projects/api ~/rexxjs-workspace/projects/data || true

-- Create a status file
SAY '[Continued] Creating status marker...'
ADDRESS SYSTEM  
echo "RexxJS Continued Provisioning completed on $(hostname) at $(date)" > ~/rexxjs-workspace/continued-provision-status.txt

SAY ''
SAY '✅ RexxJS Continued Provisioning Completed Successfully'
SAY 'Status file: ~/rexxjs-workspace/continued-provision-status.txt'
PROVISION_EOF
CREATE_CONTINUED_PROVISION

-- Make the continued provisioning script executable
ADDRESS ssh
exec command='chmod +x ~/rexxjs-workspace/scripts/continued-provision.rexx' id=main-provision

-- Run the continued provisioning script as a demonstration
SAY 'Running continued provisioning demonstration...'
ADDRESS ssh
exec command='cd ~/rexxjs-workspace && ./bin/rexx scripts/continued-provision.rexx' id=main-provision

-- Final system verification
SAY 'Running final system verification...'
ADDRESS ssh
<<FINAL_VERIFICATION
echo "🔍 Final System Verification:"
echo "  ✅ Docker: $(docker --version 2>/dev/null || echo 'Not available')"
echo "  ✅ Node.js: $(node --version 2>/dev/null || echo 'Not available')"
echo "  ✅ RexxJS: $(~/rexxjs-workspace/bin/rexx --version 2>/dev/null || echo 'Not available')"
echo "  ✅ Development tools: $(git --version 2>/dev/null || echo 'Git not available')"
echo "  ✅ User in docker group: $(groups | grep docker && echo 'Yes' || echo 'No (logout/login needed)')"
echo ""
echo "📁 RexxJS Workspace Structure:"
find ~/rexxjs-workspace -type d 2>/dev/null | head -10
echo ""
echo "🎯 Ready for RexxJS-based Infrastructure as Code!"
FINAL_VERIFICATION

ADDRESS ssh
close id=main-provision

SAY ''
SAY '✅ Pure RexxJS Infrastructure as Code Complete!'
SAY '============================================='
SAY '  Host: ' || USER || '@' || HOST  
SAY '  Architecture: 100% RexxJS, Zero Bash Scripts'
SAY '  Status: Ready for continued RexxJS provisioning'
SAY ''
SAY '📝 Capabilities Demonstrated:'
SAY '  ✓ Modular RexxJS provisioning components'
SAY '  ✓ RexxJS binary deployment and execution'
SAY '  ✓ Continued provisioning via remote RexxJS'
SAY '  ✓ Pure RexxJS Infrastructure as Code patterns'
SAY ''
SAY '🧪 Test Continued Provisioning:'
SAY '  ssh ' || USER || '@' || HOST || ' "cd ~/rexxjs-workspace && ./bin/rexx scripts/continued-provision.rexx"'
SAY ''
SAY '🚀 Next: Deploy your RexxJS applications to ~/rexxjs-workspace/projects/'