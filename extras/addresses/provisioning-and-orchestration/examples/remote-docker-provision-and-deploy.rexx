-- Provision Docker on a remote host, deploy Rexx, and run a script with CHECKPOINT progress
-- Expects HOST, USER, REXX_BIN as positional args

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"
REQUIRE "./extras/addresses/provisioning-and-orchestration/bundled-container-handlers.js"

PARSE ARG HOST, USER, REXX_BIN

ADDRESS ssh
connect host=HOST user=USER id=provision-deploy

-- Ensure Docker installed and usable (Ubuntu)
ADDRESS ssh
<<ENSURE_DOCKER
if ! command -v docker >/dev/null 2>&1; then 
  sudo apt-get update -y && 
  sudo apt-get install -y docker.io && 
  sudo systemctl enable --now docker || true && 
  sudo usermod -aG docker {USER} || true
fi
ENSURE_DOCKER

-- Create and start a container
ADDRESS remote_docker
create host=HOST user=USER image=ubuntu:24.04 name=rexxtest sudo=true
start host=HOST user=USER name=rexxtest sudo=true

-- Deploy Rexx binary to the container
deploy_rexx host=HOST user=USER name=rexxtest local_binary=REXX_BIN rexx_binary=/usr/local/bin/rexx sudo=true

-- Run an in-container Rexx script with progress
LET SCRIPT = """
SAY 'Starting work in container'
SAY 'Container hostname: ' || ADDRESS('SYSTEM', 'hostname')
SAY 'Container user: ' || ADDRESS('SYSTEM', 'whoami') 
SAY 'Doing things...'
SAY 'Creating test file...'
ADDRESS SYSTEM
echo 'Hello from RexxJS in container!' > /tmp/rexx-test.txt
cat /tmp/rexx-test.txt
SAY 'Finishing up'
SAY 'Container work completed successfully!'
"""

execute_rexx host=HOST user=USER name=rexxtest script=SCRIPT progress_callback=true sudo=true

-- Tail logs as an example
logs host=HOST user=USER name=rexxtest lines=50 sudo=true

-- Stop and remove when done (optional)
stop host=HOST user=USER name=rexxtest sudo=true
remove host=HOST user=USER name=rexxtest sudo=true

-- Close SSH connection
ADDRESS ssh
close id=provision-deploy
