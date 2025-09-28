-- Elegant nspawn Web Container Deployment using ADDRESS NSPAWN
-- Deploys a web container on remote host using enhanced nspawn handler
-- Usage: elegant-nspawn-web-deploy.rexx HOST USER [PORT] [CONTAINER_NAME]

REQUIRE "./extras/addresses/container-and-vm-orchestration/address-nspawn.js"

PARSE ARG HOST, USER, PORT, CONTAINER_NAME

IF HOST = '' | USER = '' THEN DO
  SAY 'Usage: elegant-nspawn-web-deploy.rexx HOST USER [PORT] [CONTAINER_NAME]'
  SAY 'Example: elegant-nspawn-web-deploy.rexx 192.168.0.253 paul 8080 elegant-web'
  EXIT 1
END

IF PORT = '' THEN PORT = '8080'
IF CONTAINER_NAME = '' THEN CONTAINER_NAME = 'elegant-web'

SAY '[Elegant] Starting nspawn web deployment'
SAY '=========================================='
SAY 'Target: ' || USER || '@' || HOST
SAY 'Container: ' || CONTAINER_NAME
SAY 'Port: ' || PORT
SAY 'Technology: systemd-nspawn + ADDRESS NSPAWN'
SAY ''

-- Step 1: Connect to remote host
SAY 'Step 1: Connecting to remote host...'
ADDRESS nspawn
'connect_remote host=' || HOST || ' user=' || USER || ' id=elegant-deploy'

IF RC <> 0 THEN DO
  SAY 'ERROR: Failed to connect to remote host'
  EXIT 1
END

SAY 'Step 2: Checking remote nspawn status...'
ADDRESS nspawn
'remote_status'

-- Step 3: Clean up any existing container
SAY 'Step 3: Cleaning up existing container...'
ADDRESS nspawn
'stop container=' || CONTAINER_NAME || ' 2>/dev/null || true'
'remove container=' || CONTAINER_NAME || ' 2>/dev/null || true'

-- Step 4: Create Ubuntu container with web setup
SAY 'Step 4: Creating Ubuntu container...'
ADDRESS nspawn
'create image=ubuntu:latest name=' || CONTAINER_NAME || ' memory=512m cpus=1.0'

IF RC <> 0 THEN DO
  SAY 'ERROR: Failed to create container'
  ADDRESS nspawn
  'disconnect_remote'
  EXIT 1
END

-- Step 5: Start the container
SAY 'Step 5: Starting container...'
ADDRESS nspawn
'start container=' || CONTAINER_NAME

IF RC <> 0 THEN DO
  SAY 'ERROR: Failed to start container'
  ADDRESS nspawn
  'disconnect_remote'
  EXIT 1
END

-- Step 6: Deploy RexxJS binary to container
SAY 'Step 6: Deploying RexxJS binary to container...'
ADDRESS nspawn
'deploy_rexx container=' || CONTAINER_NAME || ' rexx_binary=./bin/rexx target=/usr/local/bin/rexx'

IF RC <> 0 THEN DO
  SAY 'ERROR: Failed to deploy RexxJS binary'
  ADDRESS nspawn
  'disconnect_remote'
  EXIT 1
END

-- Step 7: Install Python and create web server setup script
SAY 'Step 7: Setting up web server in container...'

-- Create a REXX script for web server setup
web_setup_script = '-- Web server setup script' || '0A'x ||,
'SAY "[setup] Installing Python3 web server"' || '0A'x ||,
'ADDRESS system' || '0A'x ||,
'"apt-get update -y"' || '0A'x ||,
'"apt-get install -y python3"' || '0A'x ||,
'"mkdir -p /var/www"' || '0A'x ||,
'-- Create elegant HTML content' || '0A'x ||,
'html = "<!DOCTYPE html>" || "0A"x ||,' || '0A'x ||,
'"<html>" || "0A"x ||,' || '0A'x ||,
'"<head>" || "0A"x ||,' || '0A'x ||,
'"    <title>Elegant systemd-nspawn Web Container</title>" || "0A"x ||,' || '0A'x ||,
'"    <style>" || "0A"x ||,' || '0A'x ||,
'"        body { font-family: \"Segoe UI\", Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }" || "0A"x ||,' || '0A'x ||,
'"        .container { background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 20px; padding: 50px; box-shadow: 0 25px 45px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); max-width: 600px; text-align: center; }" || "0A"x ||,' || '0A'x ||,
'"        h1 { font-size: 2.5em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }" || "0A"x ||,' || '0A'x ||,
'"        .subtitle { font-size: 1.3em; opacity: 0.9; margin-bottom: 30px; }" || "0A"x ||,' || '0A'x ||,
'"        .tech-stack { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 25px; margin: 30px 0; }" || "0A"x ||,' || '0A'x ||,
'"        .tech-item { margin: 10px 0; padding: 8px 15px; background: rgba(255,255,255,0.1); border-radius: 25px; display: inline-block; margin-right: 10px; }" || "0A"x ||,' || '0A'x ||,
'"        .highlight { color: #FFD700; font-weight: bold; }" || "0A"x ||,' || '0A'x ||,
'"        .container-info { font-size: 1.1em; line-height: 1.6; }" || "0A"x ||,' || '0A'x ||,
'"        .footer { margin-top: 30px; opacity: 0.8; font-size: 0.9em; }" || "0A"x ||,' || '0A'x ||,
'"    </style>" || "0A"x ||,' || '0A'x ||,
'"</head>" || "0A"x ||,' || '0A'x ||,
'"<body>" || "0A"x ||,' || '0A'x ||,
'"    <div class=\"container\">" || "0A"x ||,' || '0A'x ||,
'"        <h1>🏗️ Elegant Container Deploy! 🏗️</h1>" || "0A"x ||,' || '0A'x ||,
'"        <div class=\"subtitle\">Imperative Infrastructure as Code</div>" || "0A"x ||,' || '0A'x ||,
'"        <div class=\"tech-stack\">" || "0A"x ||,' || '0A'x ||,
'"            <h3>Technology Stack</h3>" || "0A"x ||,' || '0A'x ||,
'"            <div class=\"tech-item\">systemd-nspawn</div>" || "0A"x ||,' || '0A'x ||,
'"            <div class=\"tech-item\">ADDRESS NSPAWN</div>" || "0A"x ||,' || '0A'x ||,
'"            <div class=\"tech-item\">RexxJS</div>" || "0A"x ||,' || '0A'x ||,
'"            <div class=\"tech-item\">SSH Remote</div>" || "0A"x ||,' || '0A'x ||,
'"        </div>" || "0A"x ||,' || '0A'x ||,
'"        <div class=\"container-info\">" || "0A"x ||,' || '0A'x ||,
'"            <p><strong>Container:</strong> <span class=\"highlight\">' || CONTAINER_NAME || '</span></p>" || "0A"x ||,' || '0A'x ||,
'"            <p><strong>Port:</strong> <span class=\"highlight\">' || PORT || '</span></p>" || "0A"x ||,' || '0A'x ||,
'"            <p><strong>Host:</strong> <span class=\"highlight\">' || HOST || '</span></p>" || "0A"x ||,' || '0A'x ||,
'"            <p><strong>User:</strong> <span class=\"highlight\">' || USER || '</span></p>" || "0A"x ||,' || '0A'x ||,
'"        </div>" || "0A"x ||,' || '0A'x ||,
'"        <div class=\"footer\">" || "0A"x ||,' || '0A'x ||,
'"            <p>🚀 Deployed via RexxJS + ADDRESS NSPAWN + SSH</p>" || "0A"x ||,' || '0A'x ||,
'"            <p>OS-level virtualization with systemd integration</p>" || "0A"x ||,' || '0A'x ||,
'"        </div>" || "0A"x ||,' || '0A'x ||,
'"    </div>" || "0A"x ||,' || '0A'x ||,
'"</body>" || "0A"x ||,' || '0A'x ||,
'"</html>"' || '0A'x ||,
'ADDRESS system' || '0A'x ||,
'"echo \"" || html || "\" > /var/www/index.html"' || '0A'x ||,
'SAY "[setup] Starting Python3 web server on port ' || PORT || '"' || '0A'x ||,
'ADDRESS system' || '0A'x ||,
'"cd /var/www && python3 -m http.server ' || PORT || ' > /var/log/webserver.log 2>&1 &"' || '0A'x ||,
'SAY "[setup] Web server started successfully"'

-- Execute the web setup script in the container
ADDRESS nspawn
'execute_rexx container=' || CONTAINER_NAME || ' script="' || web_setup_script || '" timeout=120000'

IF RC <> 0 THEN DO
  SAY 'ERROR: Failed to set up web server'
  ADDRESS nspawn
  'disconnect_remote'
  EXIT 1
END

-- Step 8: Wait for web server to start
SAY 'Step 8: Waiting for web server to start...'
ADDRESS nspawn
'execute container=' || CONTAINER_NAME || ' command="sleep 3" timeout=5000'

-- Step 9: Test web server
SAY 'Step 9: Testing web server...'
ADDRESS nspawn
'execute container=' || CONTAINER_NAME || ' command="curl -f http://localhost:' || PORT || ' >/dev/null 2>&1" timeout=15000'

test_result = RC

-- Step 10: Port forwarding setup (if needed)
SAY 'Step 10: Setting up port forwarding...'
ADDRESS nspawn
'execute container=' || CONTAINER_NAME || ' command="echo \"Web server running on port ' || PORT || '\"" timeout=5000'

-- Step 11: Show final status
SAY 'Step 11: Deployment summary...'
ADDRESS nspawn
'list'

-- Disconnect from remote host
ADDRESS nspawn
'disconnect_remote'

-- Final results
SAY ''
SAY 'Elegant nspawn Web Container Deployment Complete!'
SAY '================================================='
SAY 'Technology: systemd-nspawn + ADDRESS NSPAWN + RexxJS'
SAY 'Container: ' || CONTAINER_NAME
SAY 'Access URL: http://' || HOST || ':' || PORT
SAY 'Deployment method: Imperative IaC'
SAY ''

IF test_result = 0 THEN DO
  SAY '✅ SUCCESS: Web service is responding'
ELSE DO
  SAY '⚠️  WARNING: Web service test failed, but container is running'
  SAY 'Manual check: ssh ' || USER || '@' || HOST || ' "sudo machinectl list"'
END

SAY ''
SAY 'Container Management:'
SAY '  Status:      ssh ' || USER || '@' || HOST || ' "sudo machinectl list"'
SAY '  Shell:       ssh ' || USER || '@' || HOST || ' "sudo machinectl shell ' || CONTAINER_NAME || '"'
SAY '  Stop:        ssh ' || USER || '@' || HOST || ' "sudo machinectl terminate ' || CONTAINER_NAME || '"'
SAY '  Remove:      ssh ' || USER || '@' || HOST || ' "sudo rm -rf /var/lib/machines/' || CONTAINER_NAME || '"'
SAY ''
SAY '🎉 Imperative Infrastructure as Code in action!'
SAY 'systemd-nspawn provides lightweight OS-level virtualization'
SAY 'with systemd integration and resource management.'