-- Simple systemd-nspawn Web Container
-- Creates a lightweight web container using systemd-nspawn
-- Usage: simple-nspawn-web.rexx CONTAINER_NAME PORT

PARSE ARG CONTAINER_NAME, PORT

IF CONTAINER_NAME = '' | PORT = '' THEN DO
  SAY 'Usage: simple-nspawn-web.rexx CONTAINER_NAME PORT'
  SAY 'Example: simple-nspawn-web.rexx hello-nspawn 8081'
  EXIT 1
END

SAY '[nspawn] Creating simple web container:' CONTAINER_NAME
SAY '[nspawn] Port:' PORT

container_path = '/var/lib/machines/' || CONTAINER_NAME

-- Clean up any existing container
SAY '[nspawn] Cleaning up existing container...'
ADDRESS system
'sudo machinectl terminate' CONTAINER_NAME '2>/dev/null || true'
'sudo rm -rf' container_path

-- Create container directory structure
SAY '[nspawn] Creating container filesystem...'
ADDRESS system
'sudo mkdir -p' container_path'/var/www'
'sudo mkdir -p' container_path'/usr/bin'
'sudo mkdir -p' container_path'/etc'

-- Copy basic system files
SAY '[nspawn] Setting up basic system...'
ADDRESS system
'sudo cp /usr/bin/python3 ' container_path'/usr/bin/ 2>/dev/null || sudo cp /usr/bin/python' container_path'/usr/bin/python3'
'sudo cp -r /usr/lib/python3* ' container_path'/usr/lib/ 2>/dev/null || true'

-- Create web content
SAY '[nspawn] Creating web content...'
web_content = '<!DOCTYPE html>' || '0A'x ||,
'<html>' || '0A'x ||,
'<head>' || '0A'x ||,
'    <title>Hello from systemd-nspawn!</title>' || '0A'x ||,
'    <style>' || '0A'x ||,
'        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); color: #333; }' || '0A'x ||,
'        .container { background: rgba(255,255,255,0.9); padding: 50px; border-radius: 20px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }' || '0A'x ||,
'        h1 { font-size: 3em; margin-bottom: 20px; color: #ff6b6b; }' || '0A'x ||,
'        p { font-size: 1.2em; line-height: 1.6; }' || '0A'x ||,
'        .info { background: rgba(255,107,107,0.1); padding: 20px; border-radius: 10px; margin-top: 30px; }' || '0A'x ||,
'        .tech { color: #4ecdc4; font-weight: bold; }' || '0A'x ||,
'        .highlight { color: #ff6b6b; font-weight: bold; }' || '0A'x ||,
'    </style>' || '0A'x ||,
'</head>' || '0A'x ||,
'<body>' || '0A'x ||,
'    <div class="container">' || '0A'x ||,
'        <h1>🏗️ Hello from systemd-nspawn! 🏗️</h1>' || '0A'x ||,
'        <p>This container uses <span class="tech">systemd-nspawn</span> for OS-level virtualization!</p>' || '0A'x ||,
'        <div class="info">' || '0A'x ||,
'            <p><strong>Technology:</strong> <span class="highlight">systemd-nspawn</span></p>' || '0A'x ||,
'            <p><strong>Container:</strong>' CONTAINER_NAME '</p>' || '0A'x ||,
'            <p><strong>Port:</strong>' PORT '</p>' || '0A'x ||,
'            <p><strong>Advantages:</strong></p>' || '0A'x ||,
'            <p>✓ Lighter than full VMs</p>' || '0A'x ||,
'            <p>✓ Better isolation than chroot</p>' || '0A'x ||,
'            <p>✓ systemd integration</p>' || '0A'x ||,
'            <p>✓ Resource management</p>' || '0A'x ||,
'            <p><strong>Deployed by:</strong> RexxJS + SSH</p>' || '0A'x ||,
'        </div>' || '0A'x ||,
'    </div>' || '0A'x ||,
'</body>' || '0A'x ||,
'</html>'

ADDRESS system
'echo "' || web_content || '" | sudo tee' container_path'/var/www/index.html > /dev/null'

-- Create startup script
startup_script = '#!/bin/bash' || '0A'x ||,
'cd /var/www' || '0A'x ||,
'exec python3 -m http.server' PORT

ADDRESS system
'echo "' || startup_script || '" | sudo tee' container_path'/start-web.sh > /dev/null'
'sudo chmod +x' container_path'/start-web.sh'

-- Start the container
SAY '[nspawn] Starting container...'
ADDRESS system
'sudo systemd-nspawn --machine=' || CONTAINER_NAME || ' --directory=' || container_path || ' --port=' || PORT || ':' || PORT || ' /start-web.sh &'

-- Wait a moment
'sleep 3'

SAY '[nspawn] Container should be running!'
SAY '[nspawn] Access URL: http://localhost:' || PORT
SAY '[nspawn] To stop: sudo machinectl terminate' CONTAINER_NAME