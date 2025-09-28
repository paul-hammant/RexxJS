-- Deploy systemd-nspawn Web Container to Remote Host
-- Uses systemd-nspawn for lightweight containerization
-- Usage: deploy-nspawn-container.rexx HOST USER [PORT] [CONTAINER_NAME]

REQUIRE "./extras/addresses/remote/address-ssh.js"

PARSE ARG HOST, USER, PORT, CONTAINER_NAME

IF HOST = '' | USER = '' THEN DO
  SAY 'Usage: deploy-nspawn-container.rexx HOST USER [PORT] [CONTAINER_NAME]'
  SAY 'Example: deploy-nspawn-container.rexx 192.168.0.253 paul 8081 hello-nspawn'
  EXIT 1
END

IF PORT = '' THEN PORT = '8081'
IF CONTAINER_NAME = '' THEN CONTAINER_NAME = 'hello-nspawn'

SAY 'Deploying systemd-nspawn container to' USER '@' HOST
SAY '=================================================='
SAY 'Container name:' CONTAINER_NAME
SAY 'Port:' PORT
SAY 'Technology: systemd-nspawn + debootstrap'
SAY ''

-- Connect to remote host
SAY 'Step 1: Connecting to remote host...'
ADDRESS ssh
connect host=HOST user=USER id=nspawn-deploy

-- Check if we have sudo access
SAY 'Step 2: Checking system requirements...'
ADDRESS ssh
exec id=nspawn-deploy command='sudo -n true' timeout=5000

-- Copy RexxJS binary to remote host
SAY 'Step 3: Copying RexxJS binary to remote host...'
ADDRESS ssh
copy_to id=nspawn-deploy local='./bin/rexx' remote='/tmp/rexx-nspawn' timeout=30000

-- Copy nspawn management script
SAY 'Step 4: Copying nspawn management script...'
ADDRESS ssh
copy_to id=nspawn-deploy local='./extras/addresses/container-and-vm-orchestration/examples/nspawn-web-local.rexx' remote='/tmp/nspawn-web-local.rexx' timeout=10000

-- Make RexxJS binary executable
SAY 'Step 5: Setting up remote RexxJS...'
ADDRESS ssh
exec id=nspawn-deploy command='chmod +x /tmp/rexx-nspawn' timeout=5000

-- Stop and remove any existing container
SAY 'Step 6: Cleaning up existing containers...'
ADDRESS ssh
exec id=nspawn-deploy command='/tmp/rexx-nspawn /tmp/nspawn-web-local.rexx' CONTAINER_NAME PORT 'stop' timeout=30000
ADDRESS ssh
exec id=nspawn-deploy command='/tmp/rexx-nspawn /tmp/nspawn-web-local.rexx' CONTAINER_NAME PORT 'remove' timeout=30000

-- Create new nspawn container
SAY 'Step 7: Creating nspawn container (this will take several minutes)...'
SAY '         - Installing systemd-container if needed'
SAY '         - Bootstrapping Ubuntu filesystem'  
SAY '         - Setting up web server'
ADDRESS ssh
exec id=nspawn-deploy command='/tmp/rexx-nspawn /tmp/nspawn-web-local.rexx' CONTAINER_NAME PORT 'create' timeout=600000

-- Start the container
SAY 'Step 8: Starting nspawn container...'
ADDRESS ssh
exec id=nspawn-deploy command='/tmp/rexx-nspawn /tmp/nspawn-web-local.rexx' CONTAINER_NAME PORT 'start' timeout=60000

-- Wait for container to be ready
SAY 'Step 9: Waiting for container to be ready...'
ADDRESS ssh
exec id=nspawn-deploy command='sleep 10' timeout=15000

-- Verify container is running
SAY 'Step 10: Verifying deployment...'
ADDRESS ssh
exec id=nspawn-deploy command='sudo machinectl list | grep' CONTAINER_NAME timeout=10000

-- Test web service
SAY 'Step 11: Testing web service...'
ADDRESS ssh
exec id=nspawn-deploy command='curl -f http://localhost:' || PORT || ' >/dev/null 2>&1' timeout=15000
IF RC = 0 THEN DO
  SAY 'SUCCESS: Web service is responding'
ELSE DO
  SAY 'WARNING: Web service may not be ready yet'
  -- Try to get container logs
  ADDRESS ssh
  exec id=nspawn-deploy command='sudo machinectl status' CONTAINER_NAME timeout=10000
END

-- Clean up temporary files
SAY 'Step 12: Cleaning up temporary files...'
ADDRESS ssh
exec id=nspawn-deploy command='rm -f /tmp/rexx-nspawn /tmp/nspawn-web-local.rexx' timeout=5000

-- Show access information
SAY ''
SAY 'systemd-nspawn Container Deployment Complete!'
SAY '=============================================='
SAY 'Container technology: systemd-nspawn'
SAY 'Container name:' CONTAINER_NAME
SAY 'Access URL: http://' || HOST || ':' || PORT
SAY 'Base system: Ubuntu (debootstrap)'
SAY 'Web server: Python3 http.server'
SAY ''
SAY 'Container Management:'
SAY '  View status:    sudo machinectl list'
SAY '  Shell access:   sudo machinectl shell' CONTAINER_NAME
SAY '  Stop container: sudo machinectl terminate' CONTAINER_NAME
SAY '  Remove:         sudo rm -rf /var/lib/machines/' || CONTAINER_NAME
SAY ''
SAY 'systemd-nspawn provides:'
SAY '  - Lightweight OS-level virtualization'
SAY '  - Better isolation than chroot'
SAY '  - systemd integration'
SAY '  - Resource management'
SAY '  - Network namespace isolation'

-- Close SSH connection
ADDRESS ssh
close id=nspawn-deploy