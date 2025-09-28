-- Remote Docker Installation via RexxJS Script Transfer
-- Idempotent: safe to re-run. Expects HOST, USER, and REXX_BINARY_PATH as positional args.

REQUIRE "./extras/addresses/remote/address-ssh.js"

PARSE ARG HOST, USER, REXX_BINARY_PATH

IF HOST = '' | USER = '' THEN DO
  SAY 'Usage: remote-docker-install.rexx HOST USER [REXX_BINARY_PATH]'
  SAY 'Example: remote-docker-install.rexx 192.168.1.100 paul ./bin/rexx'
  EXIT 1
END

IF REXX_BINARY_PATH = '' THEN REXX_BINARY_PATH = './bin/rexx'

SAY 'Installing Docker on ' || USER || '@' || HOST || ' using RexxJS'
SAY 'RexxJS binary:' REXX_BINARY_PATH

ADDRESS ssh
connect host=HOST user=USER id=docker-install

SAY 'Step 1: Copying RexxJS binary to remote host...'
ADDRESS ssh
copy_to id=docker-install local=REXX_BINARY_PATH remote='/tmp/rexx' timeout=30000

SAY 'Step 2: Copying Docker installation script...'
ADDRESS ssh
copy_to id=docker-install local='./extras/addresses/container-and-vm-orchestration/examples/install-docker-local.rexx' remote='/tmp/install-docker-local.rexx' timeout=10000

SAY 'Step 3: Making RexxJS binary executable...'
ADDRESS ssh
exec id=docker-install command='chmod +x /tmp/rexx' timeout=5000

SAY 'Step 4: Executing Docker installation via RexxJS...'
ADDRESS ssh
exec id=docker-install command='/tmp/rexx /tmp/install-docker-local.rexx' timeout=600000

SAY 'Step 5: Cleaning up temporary files...'
ADDRESS ssh
exec id=docker-install command='rm -f /tmp/rexx /tmp/install-docker-local.rexx' timeout=5000

SAY 'Docker installation completed via RexxJS remote execution'

ADDRESS ssh  
close id=docker-install
