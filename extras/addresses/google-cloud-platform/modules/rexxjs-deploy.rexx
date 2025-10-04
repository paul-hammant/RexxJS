-- RexxJS Infrastructure Module: RexxJS Binary Deployment
-- Deploy RexxJS binary to remote host and setup execution environment
-- Usage: Include with REQUIRE or call as standalone module

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"

PARSE ARG HOST, USER, REXX_BIN, SESSION_ID
IF SESSION_ID = '' THEN SESSION_ID = 'rexxjs-deploy'
IF REXX_BIN = '' THEN REXX_BIN = './bin/rexx-linux-x64-bin'

SAY '[RexxJS Deploy] Deploying RexxJS binary to ' || USER || '@' || HOST
SAY '[RexxJS Deploy] Local binary: ' || REXX_BIN

ADDRESS ssh  
connect host=HOST user=USER id=SESSION_ID

-- Create RexxJS workspace
SAY '[RexxJS Deploy] Creating RexxJS workspace...'
ADDRESS ssh
exec command='mkdir -p ~/rexxjs-workspace/bin' id=SESSION_ID

ADDRESS ssh
exec command='mkdir -p ~/rexxjs-workspace/scripts' id=SESSION_ID

ADDRESS ssh
exec command='mkdir -p ~/rexxjs-workspace/logs' id=SESSION_ID

-- Upload RexxJS binary
SAY '[RexxJS Deploy] Uploading RexxJS binary...'
ADDRESS ssh
put local=REXX_BIN remote='~/rexxjs-workspace/bin/rexx' id=SESSION_ID

-- Set executable permissions
ADDRESS ssh
exec command='chmod +x ~/rexxjs-workspace/bin/rexx' id=SESSION_ID

-- Verify binary works
SAY '[RexxJS Deploy] Verifying RexxJS binary...'
ADDRESS ssh
exec command='~/rexxjs-workspace/bin/rexx --version' id=SESSION_ID

-- Create convenience scripts
SAY '[RexxJS Deploy] Creating convenience scripts...'
ADDRESS ssh
<<CREATE_TEST_SCRIPT
cat > ~/rexxjs-workspace/test-rexx.sh << 'SCRIPT_EOF'
#!/usr/bin/env bash
echo "Testing RexxJS on remote host..."
cd ~/rexxjs-workspace
./bin/rexx -c 'SAY "Hello from RexxJS on " || ADDRESS("SYSTEM", "hostname")'
echo "RexxJS test completed."
SCRIPT_EOF
CREATE_TEST_SCRIPT

ADDRESS ssh
exec command='chmod +x ~/rexxjs-workspace/test-rexx.sh' id=SESSION_ID

-- Create RexxJS environment script
ADDRESS ssh
<<CREATE_ENV_SCRIPT
cat > ~/rexxjs-workspace/rexx-env.sh << 'ENV_EOF'
#!/usr/bin/env bash
# RexxJS Environment Setup
export PATH="$HOME/rexxjs-workspace/bin:$PATH"
export REXXJS_WORKSPACE="$HOME/rexxjs-workspace"
echo "RexxJS environment loaded"
echo "  - REXX binary: $(which rexx)"
echo "  - Workspace: $REXXJS_WORKSPACE"
ENV_EOF
CREATE_ENV_SCRIPT

ADDRESS ssh
exec command='chmod +x ~/rexxjs-workspace/rexx-env.sh' id=SESSION_ID

-- Create a sample RexxJS script for continued provisioning
ADDRESS ssh
<<CREATE_SAMPLE_SCRIPT
cat > ~/rexxjs-workspace/scripts/system-info.rexx << 'REXX_EOF'
-- System Information RexxJS Script
-- Shows how to use RexxJS for continued provisioning

SAY '=== System Information ==='
SAY 'Hostname: ' || ADDRESS('SYSTEM', 'hostname')
SAY 'Current User: ' || ADDRESS('SYSTEM', 'whoami')
SAY 'Uptime: ' || ADDRESS('SYSTEM', 'uptime')
SAY 'Disk Usage: '

ADDRESS SYSTEM
df -h /

SAY ''
SAY 'Docker Status:'
ADDRESS SYSTEM
docker --version 2>/dev/null || echo 'Docker not available'

SAY ''
SAY 'Node.js Status:'
ADDRESS SYSTEM  
node --version 2>/dev/null || echo 'Node.js not available'

SAY ''
SAY '=== RexxJS Environment Ready ==='
REXX_EOF
CREATE_SAMPLE_SCRIPT

-- Test the sample script
SAY '[RexxJS Deploy] Testing sample RexxJS script...'
ADDRESS ssh
exec command='cd ~/rexxjs-workspace && ./bin/rexx scripts/system-info.rexx' id=SESSION_ID

-- Create deployment marker
ADDRESS ssh
exec command='echo "$(date): RexxJS deployed successfully" > ~/.rexxjs-deploy-marker' id=SESSION_ID

SAY '[RexxJS Deploy] RexxJS binary deployment completed on ' || USER || '@' || HOST
SAY '[RexxJS Deploy] Workspace: ~/rexxjs-workspace'
SAY '[RexxJS Deploy] Test command: ssh ' || USER || '@' || HOST || ' "~/rexxjs-workspace/test-rexx.sh"'