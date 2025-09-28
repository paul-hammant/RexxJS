-- Simple three-tier demo: Local -> SSH Remote -> Docker Container
-- No CHECKPOINT, just basic execution to prove the architecture

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"

PARSE ARG HOST, USER, REXX_BIN

SAY 'Three-tier demo: Local -> SSH(' || USER || '@' || HOST || ') -> Docker Container'

-- Step 1: Connect to remote host
ADDRESS ssh
connect host=HOST user=USER id=demo

-- Step 2: Deploy RexxJS binary to remote host
SAY 'Deploying RexxJS binary to remote host...'
ADDRESS ssh  
copy_to id=demo local=REXX_BIN remote=/tmp/rexx-demo timeout=60000

-- Step 3: Create intermediate script that uses docker on remote host
SAY 'Creating intermediate script on remote host...'
ADDRESS ssh
exec id=demo command='cat > /tmp/demo-script.rexx << '\''EOF'\''
-- Intermediate RexxJS script running on remote host
SAY '\''[REMOTE] RexxJS running on '\'' || ADDRESS('\''SYSTEM'\'', '\''hostname'\'')

-- Use shell commands to work with docker (no RexxJS docker handler needed)
SAY '\''[REMOTE] Creating Ubuntu container...'\''
ADDRESS SYSTEM
docker pull ubuntu:24.04 >/dev/null 2>&1 || true
docker create --name demo-container ubuntu:24.04 bash
docker start demo-container

-- Execute simple commands in container  
SAY '\''[REMOTE] Running commands in container...'\''
ADDRESS SYSTEM
docker exec demo-container echo "[CONTAINER] Hello from inside container"
docker exec demo-container whoami  
docker exec demo-container pwd
docker exec demo-container ls /

-- Cleanup container
SAY '\''[REMOTE] Cleaning up container...'\''
ADDRESS SYSTEM  
docker stop demo-container
docker rm demo-container

SAY '\''[REMOTE] Three-tier demo completed successfully!'\''
EOF' timeout=30000

-- Step 4: Execute the intermediate script on remote host
SAY 'Executing three-tier chain...'  
ADDRESS ssh
exec id=demo command='chmod +x /tmp/rexx-demo && /tmp/rexx-demo /tmp/demo-script.rexx' timeout=180000

-- Step 5: Cleanup
SAY 'Cleaning up...'
ADDRESS ssh
exec id=demo command='rm -f /tmp/rexx-demo /tmp/demo-script.rexx' timeout=10000

ADDRESS ssh
close id=demo

SAY 'Three-tier demo completed!'