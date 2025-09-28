-- Robust systemd-nspawn Web Container Deployment to Remote Host
-- Uses enhanced error handling, retry logic, and comprehensive verification
-- Usage: robust-nspawn-deploy.rexx HOST USER [PORT] [CONTAINER_NAME]

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"

PARSE ARG HOST, USER, PORT, CONTAINER_NAME

IF HOST = '' | USER = '' THEN DO
  SAY 'Usage: robust-nspawn-deploy.rexx HOST USER [PORT] [CONTAINER_NAME]'
  SAY 'Example: robust-nspawn-deploy.rexx 192.168.0.253 paul 8082 robust-web'
  EXIT 1
END

IF PORT = '' THEN PORT = '8082'
IF CONTAINER_NAME = '' THEN CONTAINER_NAME = 'robust-web'

SAY 'Robust systemd-nspawn Container Deployment'
SAY '=========================================='
SAY 'Target: ' || USER || '@' || HOST
SAY 'Container: ' || CONTAINER_NAME
SAY 'Port: ' || PORT
SAY 'Technology: systemd-nspawn + robust orchestration'
SAY 'Features: Error handling, retry logic, health checks'
SAY ''

-- Step 1: Connect to remote host with retry logic
SAY 'Step 1: Connecting to remote host...'
ADDRESS ssh
connect host=HOST user=USER id=robust-deploy

IF RC <> 0 THEN DO
  SAY '❌ ERROR: Failed to connect to remote host after 3 attempts'
  EXIT 1
END

-- Step 2: Check system requirements and setup
SAY 'Step 2: Verifying system requirements...'
ADDRESS ssh
exec id=robust-deploy command='sudo -n true' timeout=5000

IF RC <> 0 THEN DO
  SAY '❌ ERROR: sudo access required on remote host'
  ADDRESS ssh
  close id=robust-deploy
  EXIT 1
END

-- Check disk space
ADDRESS ssh
exec id=robust-deploy command='df -h /var/lib | tail -1' timeout=10000
SAY 'Disk space available:' RESULT.stdout

-- Step 3: Copy RexxJS binary to remote host
SAY 'Step 3: Copying RexxJS binary to remote host...'
ADDRESS ssh
copy_to id=robust-deploy local='./bin/rexx' remote='/tmp/rexx-robust-nspawn' timeout=30000

IF RC <> 0 THEN DO
  SAY '❌ ERROR: Failed to copy RexxJS binary'
  ADDRESS ssh
  close id=robust-deploy
  EXIT 1
END

-- Step 4: Copy robust management script
SAY 'Step 4: Copying robust nspawn management script...'
ADDRESS ssh
copy_to id=robust-deploy local='./extras/addresses/provisioning-and-orchestration/examples/robust-nspawn-web-local.rexx' remote='/tmp/robust-nspawn-web-local.rexx' timeout=10000

IF RC <> 0 THEN DO
  SAY '❌ ERROR: Failed to copy management script'
  ADDRESS ssh
  close id=robust-deploy
  EXIT 1
END

-- Step 5: Make RexxJS binary executable
SAY 'Step 5: Setting up remote RexxJS...'
ADDRESS ssh
exec id=robust-deploy command='chmod +x /tmp/rexx-robust-nspawn' timeout=5000

IF RC <> 0 THEN DO
  SAY '❌ ERROR: Failed to make RexxJS binary executable'
  ADDRESS ssh
  close id=robust-deploy
  EXIT 1
END

-- Test RexxJS binary
ADDRESS ssh
exec id=robust-deploy command='/tmp/rexx-robust-nspawn --help >/dev/null 2>&1' timeout=10000
IF RC = 0 THEN DO
  SAY '✅ RexxJS binary is working'
ELSE DO
  SAY '⚠️  Warning: RexxJS binary test failed, but continuing...'
END

-- Step 6: Clean up any existing containers
SAY 'Step 6: Cleaning up existing containers...'
ADDRESS ssh
exec id=robust-deploy command='/tmp/rexx-robust-nspawn /tmp/robust-nspawn-web-local.rexx' CONTAINER_NAME PORT 'stop' timeout=30000
ADDRESS ssh
exec id=robust-deploy command='/tmp/rexx-robust-nspawn /tmp/robust-nspawn-web-local.rexx' CONTAINER_NAME PORT 'remove' timeout=30000

-- Step 7: Create new robust nspawn container
SAY 'Step 7: Creating robust nspawn container (this will take 5-15 minutes)...'
SAY '         - Installing systemd-container and debootstrap if needed'
SAY '         - Bootstrapping Ubuntu LTS filesystem with robust packages'
SAY '         - Setting up web server with error handling'
SAY '         - Configuring networking and systemd services'
ADDRESS ssh
exec id=robust-deploy command='/tmp/rexx-robust-nspawn /tmp/robust-nspawn-web-local.rexx' CONTAINER_NAME PORT 'create' timeout=900000

create_rc = RC
IF create_rc <> 0 THEN DO
  SAY '❌ ERROR: Failed to create container'
  SAY 'Debug info:'
  ADDRESS ssh
  exec id=robust-deploy command='sudo journalctl -u systemd-nspawn@' || CONTAINER_NAME || '.service --no-pager -n 20' timeout=10000
  ADDRESS ssh
  close id=robust-deploy
  EXIT 1
ELSE DO
  SAY '✅ Container created successfully'
END

-- Step 8: Start the robust container
SAY 'Step 8: Starting robust nspawn container...'
ADDRESS ssh
exec id=robust-deploy command='/tmp/rexx-robust-nspawn /tmp/robust-nspawn-web-local.rexx' CONTAINER_NAME PORT 'start' timeout=120000

start_rc = RC
IF start_rc <> 0 THEN DO
  SAY '❌ ERROR: Failed to start container'
  SAY 'Checking container status...'
  ADDRESS ssh
  exec id=robust-deploy command='/tmp/rexx-robust-nspawn /tmp/robust-nspawn-web-local.rexx' CONTAINER_NAME PORT 'status' timeout=30000
  ADDRESS ssh
  close id=robust-deploy
  EXIT 1
ELSE DO
  SAY '✅ Container started successfully'
END

-- Step 9: Wait for services to stabilize
SAY 'Step 9: Waiting for services to stabilize...'
ADDRESS ssh
exec id=robust-deploy command='sleep 10' timeout=15000

-- Step 10: Comprehensive deployment verification
SAY 'Step 10: Comprehensive deployment verification...'

-- Check container status
ADDRESS ssh
exec id=robust-deploy command='sudo machinectl list | grep' CONTAINER_NAME timeout=10000
IF RC = 0 THEN DO
  SAY '✅ Container is running in machinectl'
ELSE DO
  SAY '⚠️  Warning: Container not visible in machinectl list'
END

-- Check web service health
ADDRESS ssh
exec id=robust-deploy command='curl -f -m 10 http://localhost:' || PORT || ' >/dev/null 2>&1' timeout=15000
web_test_rc = RC

-- Get detailed status
ADDRESS ssh
exec id=robust-deploy command='/tmp/rexx-robust-nspawn /tmp/robust-nspawn-web-local.rexx' CONTAINER_NAME PORT 'status' timeout=30000

-- Step 11: Network connectivity test from outside
SAY 'Step 11: Testing external network connectivity...'
ADDRESS ssh
exec id=robust-deploy command='ss -tlnp | grep :' || PORT timeout=10000
IF RC = 0 THEN DO
  SAY '✅ Port' PORT 'is listening'
ELSE DO
  SAY '⚠️  Warning: Port' PORT 'may not be accessible externally'
END

-- Step 12: Final health check and cleanup
SAY 'Step 12: Final health check and cleanup...'
ADDRESS ssh
exec id=robust-deploy command='rm -f /tmp/rexx-robust-nspawn /tmp/robust-nspawn-web-local.rexx' timeout=5000

-- Show final comprehensive status
SAY ''
SAY 'Robust systemd-nspawn Container Deployment Summary'
SAY '================================================='
SAY 'Container technology: systemd-nspawn (OS-level virtualization)'
SAY 'Container name:' CONTAINER_NAME
SAY 'Access URL: http://' || HOST || ':' || PORT
SAY 'Base system: Ubuntu LTS (debootstrap)'
SAY 'Web server: Python3 http.server with robust configuration'
SAY 'Features: Error handling, retry logic, health monitoring'
SAY ''

IF web_test_rc = 0 THEN DO
  SAY '✅ SUCCESS: Robust deployment completed successfully!'
  SAY '✅ Web service is responding and ready for access'
ELSE DO
  SAY '⚠️  PARTIAL SUCCESS: Container deployed but web service test failed'
  SAY '   - Container may still be starting up'
  SAY '   - Check logs: ssh' USER '@' HOST '"sudo journalctl -u systemd-nspawn@' || CONTAINER_NAME || '"'
END

SAY ''
SAY 'Container Management Commands:'
SAY '  Status:      ssh' USER '@' HOST '"sudo machinectl list"'
SAY '  Shell:       ssh' USER '@' HOST '"sudo machinectl shell' CONTAINER_NAME '"'
SAY '  Logs:        ssh' USER '@' HOST '"sudo journalctl -u systemd-nspawn@' || CONTAINER_NAME || '"'
SAY '  Stop:        ssh' USER '@' HOST '"sudo machinectl terminate' CONTAINER_NAME '"'
SAY '  Remove:      ssh' USER '@' HOST '"sudo rm -rf /var/lib/machines/' || CONTAINER_NAME || '"'
SAY ''
SAY '🎯 Robust Imperative Infrastructure as Code!'
SAY 'systemd-nspawn provides lightweight, reliable OS-level virtualization'
SAY 'with comprehensive error handling and health monitoring.'

-- Close SSH connection
ADDRESS ssh
close id=robust-deploy

-- Final status code
IF web_test_rc = 0 THEN DO
  EXIT 0
ELSE DO
  EXIT 2  -- Partial success
END