-- Deploy Web Container using ADDRESS NSPAWN
-- Creates a simple web server using systemd-nspawn
-- Usage: deploy-nspawn-web.rexx HOST USER [PORT] [CONTAINER_NAME]

REQUIRE "./extras/addresses/remote/address-ssh.js"

PARSE ARG HOST, USER, PORT, CONTAINER_NAME

IF HOST = '' | USER = '' THEN DO
  SAY 'Usage: deploy-nspawn-web.rexx HOST USER [PORT] [CONTAINER_NAME]'
  SAY 'Example: deploy-nspawn-web.rexx 192.168.0.253 paul 8082 web-nspawn'
  EXIT 1
END

IF PORT = '' THEN PORT = '8082'
IF CONTAINER_NAME = '' THEN CONTAINER_NAME = 'web-nspawn'

SAY 'Deploying nspawn Web Container'
SAY '==============================='
SAY 'Host:' HOST
SAY 'User:' USER  
SAY 'Port:' PORT
SAY 'Container:' CONTAINER_NAME
SAY ''

-- Connect to remote host
SAY 'Step 1: Connecting to remote host...'
ADDRESS ssh
connect host=HOST user=USER id=nspawn-web

-- Copy RexxJS binary to remote host
SAY 'Step 2: Copying RexxJS binary...'
ADDRESS ssh
copy_to id=nspawn-web local='./bin/rexx' remote='/tmp/rexx-nspawn-web' timeout=30000

SAY 'Step 3: Making RexxJS binary executable...'
ADDRESS ssh
exec id=nspawn-web command='chmod +x /tmp/rexx-nspawn-web' timeout=5000

-- Create REXX script for nspawn web server
SAY 'Step 4: Creating nspawn web server script...'
nspawn_script = '-- nspawn web server script' || '0A'x ||,
'SAY "[nspawn-web] Starting web server setup"' || '0A'x ||,
'-- Create web directory and content' || '0A'x ||,
'ADDRESS system' || '0A'x ||,
'ADDRESS system' || '0A'x ||,
'"mkdir -p /var/lib/machines/' || CONTAINER_NAME || '/var/www"' || '0A'x ||,
'-- Create HTML content' || '0A'x ||,
'html = "<!DOCTYPE html><html><head><title>Hello from nspawn!</title>"' || '0A'x ||,
'html = html || "<style>body{font-family:Arial;text-align:center;margin-top:100px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white}.container{background:rgba(255,255,255,0.1);padding:50px;border-radius:20px;display:inline-block}h1{font-size:3em}p{font-size:1.2em}</style>"' || '0A'x ||,
'html = html || "</head><body><div class=\"container\"><h1>🏗️ systemd-nspawn Web Server! 🏗️</h1>"' || '0A'x ||,
'html = html || "<p>Container technology: systemd-nspawn</p><p>Port: ' || PORT || '</p>"' || '0A'x ||,
'html = html || "<p>Deployed via RexxJS + SSH</p></div></body></html>"' || '0A'x ||,
'ADDRESS system' || '0A'x ||,
'"echo \"" || html || "\" > /var/lib/machines/' || CONTAINER_NAME || '/var/www/index.html"' || '0A'x ||,
'-- Start simple Python web server in container' || '0A'x ||,
'SAY "[nspawn-web] Starting Python web server on port ' || PORT || '"' || '0A'x ||,
'ADDRESS system' || '0A'x ||,
'"cd /var/lib/machines/' || CONTAINER_NAME || '/var/www && python3 -m http.server ' || PORT || ' &"' || '0A'x ||,
'SAY "[nspawn-web] Web server started"'

-- Copy nspawn script to remote host
ADDRESS ssh
exec id=nspawn-web command='cat > /tmp/nspawn-web-script.rexx << '"'"'EOF'"'"'' || '0A'x || nspawn_script || '0A'x || 'EOF' timeout=10000

-- Create nspawn container directory and setup
SAY 'Step 5: Setting up nspawn container...'
ADDRESS ssh
exec id=nspawn-web command='sudo mkdir -p /var/lib/machines/' || CONTAINER_NAME || '/var/www' timeout=10000

-- Execute nspawn setup script
SAY 'Step 6: Running nspawn setup...'
ADDRESS ssh
exec id=nspawn-web command='/tmp/rexx-nspawn-web /tmp/nspawn-web-script.rexx' timeout=60000

-- Start nspawn container with web server
SAY 'Step 7: Starting nspawn container...'
ADDRESS ssh
exec id=nspawn-web command='sudo systemd-nspawn --machine=' || CONTAINER_NAME || ' --directory=/var/lib/machines/' || CONTAINER_NAME || ' --port=' || PORT || ':' || PORT || ' --boot &' timeout=30000

-- Wait for container to start
SAY 'Step 8: Waiting for container startup...'
ADDRESS ssh
exec id=nspawn-web command='sleep 5' timeout=10000

-- Test web server
SAY 'Step 9: Testing web server...'
ADDRESS ssh
exec id=nspawn-web command='curl -f http://localhost:' || PORT || ' >/dev/null 2>&1' timeout=15000

-- Cleanup temporary files
SAY 'Step 10: Cleaning up...'
ADDRESS ssh
exec id=nspawn-web command='rm -f /tmp/rexx-nspawn-web /tmp/nspawn-web-script.rexx' timeout=5000

-- Show results
SAY ''
SAY 'nspawn Web Container Deployed!'
SAY '=============================='
SAY 'Container name:' CONTAINER_NAME
SAY 'Technology: systemd-nspawn'
SAY 'Access URL: http://' || HOST || ':' || PORT
SAY ''
SAY 'Container management:'
SAY '  Status: sudo machinectl list'
SAY '  Shell:  sudo machinectl shell' CONTAINER_NAME
SAY '  Stop:   sudo machinectl terminate' CONTAINER_NAME
SAY '  Remove: sudo rm -rf /var/lib/machines/' || CONTAINER_NAME
SAY ''
SAY 'systemd-nspawn provides lightweight OS-level virtualization!'

-- Close SSH connection
ADDRESS ssh
close id=nspawn-web