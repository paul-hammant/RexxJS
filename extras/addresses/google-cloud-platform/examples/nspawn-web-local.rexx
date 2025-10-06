-- Local REXX script for nspawn container operations
-- This script runs on the remote host to manage nspawn containers
-- 
-- Usage: nspawn-web-local.rexx CONTAINER_NAME PORT [ACTION]
-- Actions: create, start, stop, remove, status

PARSE ARG CONTAINER_NAME, PORT, ACTION

IF CONTAINER_NAME = '' | PORT = '' THEN DO
  SAY 'Usage: nspawn-web-local.rexx CONTAINER_NAME PORT [ACTION]'
  SAY 'Actions: create, start, stop, remove, status'
  SAY 'Example: nspawn-web-local.rexx hello-nspawn 8081 create'
  EXIT 1
END

IF ACTION = '' THEN ACTION = 'create'

SAY '[nspawn-local] Starting nspawn operations'
SAY '[nspawn-local] Container:' CONTAINER_NAME
SAY '[nspawn-local] Port:' PORT  
SAY '[nspawn-local] Action:' ACTION
SAY '[nspawn-local] Host:' GETENV('HOSTNAME')

container_path = '/var/lib/machines/' || CONTAINER_NAME

SELECT
  WHEN ACTION = 'create' THEN DO
    CALL create_container
  END
  WHEN ACTION = 'start' THEN DO  
    CALL start_container
  END
  WHEN ACTION = 'stop' THEN DO
    CALL stop_container
  END
  WHEN ACTION = 'remove' THEN DO
    CALL remove_container
  END
  WHEN ACTION = 'status' THEN DO
    CALL show_status
  END
  OTHERWISE DO
    SAY '[nspawn-local] ERROR: Unknown action:' ACTION
    EXIT 1
  END
END

SAY '[nspawn-local] Operations completed'
EXIT 0

-- Create and setup nspawn container
create_container:
  SAY '[nspawn-local] Creating nspawn container...'
  
  -- Check if systemd-nspawn is available
  ADDRESS system
  'which systemd-nspawn'
  IF RC <> 0 THEN DO
    SAY '[nspawn-local] Installing systemd-container...'
    'sudo apt-get update -y && sudo apt-get install -y systemd-container'
    IF RC <> 0 THEN DO
      SAY '[nspawn-local] ERROR: Failed to install systemd-container'
      EXIT 1
    END
  END
  
  -- Create container directory
  SAY '[nspawn-local] Setting up container filesystem...'
  ADDRESS system
  'sudo mkdir -p' container_path
  IF RC <> 0 THEN DO
    SAY '[nspawn-local] ERROR: Failed to create container directory'
    EXIT 1
  END
  
  -- Bootstrap minimal Ubuntu system
  SAY '[nspawn-local] Bootstrapping Ubuntu system (this may take a few minutes)...'
  ADDRESS system
  'sudo debootstrap --include=systemd,python3,python3-http.server plucky' container_path
  IF RC <> 0 THEN DO
    SAY '[nspawn-local] ERROR: Failed to bootstrap container'
    EXIT 1
  END
  
  -- Create web content
  SAY '[nspawn-local] Creating web content...'
  web_content = '<!DOCTYPE html>' || '0A'x ||,
  '<html>' || '0A'x ||,
  '<head>' || '0A'x ||,
  '    <title>Hello from systemd-nspawn!</title>' || '0A'x ||,
  '    <style>' || '0A'x ||,
  '        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }' || '0A'x ||,
  '        .container { background: rgba(255,255,255,0.1); padding: 50px; border-radius: 20px; display: inline-block; }' || '0A'x ||,
  '        h1 { font-size: 3em; margin-bottom: 20px; }' || '0A'x ||,
  '        p { font-size: 1.2em; line-height: 1.6; }' || '0A'x ||,
  '        .info { background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; margin-top: 30px; }' || '0A'x ||,
  '        .tech { color: #ffeb3b; font-weight: bold; }' || '0A'x ||,
  '    </style>' || '0A'x ||,
  '</head>' || '0A'x ||,
  '<body>' || '0A'x ||,
  '    <div class="container">' || '0A'x ||,
  '        <h1>🚀 Hello from systemd-nspawn! 🚀</h1>' || '0A'x ||,
  '        <p>This container was deployed using <span class="tech">RexxJS + systemd-nspawn</span>!</p>' || '0A'x ||,
  '        <div class="info">' || '0A'x ||,
  '            <p><strong>Container Technology:</strong> systemd-nspawn</p>' || '0A'x ||,
  '            <p><strong>Container Name:</strong>' CONTAINER_NAME '</p>' || '0A'x ||,
  '            <p><strong>Port:</strong>' PORT '</p>' || '0A'x ||,
  '            <p><strong>Base System:</strong> Ubuntu (debootstrap)</p>' || '0A'x ||,
  '            <p><strong>Web Server:</strong> Python3 http.server</p>' || '0A'x ||,
  '            <p><strong>Deployed by:</strong> RexxJS Remote Orchestration</p>' || '0A'x ||,
  '        </div>' || '0A'x ||,
  '    </div>' || '0A'x ||,
  '</body>' || '0A'x ||,
  '</html>'
  
  ADDRESS system
  'sudo mkdir -p' container_path'/var/www'
  'echo "' || web_content || '" | sudo tee' container_path'/var/www/index.html > /dev/null'
  
  -- Create startup script inside container
  startup_script = '#!/bin/bash' || '0A'x ||,
  'cd /var/www' || '0A'x ||,
  'python3 -m http.server' PORT '|| python3 -m SimpleHTTPServer' PORT
  
  ADDRESS system
  'echo "' || startup_script || '" | sudo tee' container_path'/usr/local/bin/start-web.sh > /dev/null'
  'sudo chmod +x' container_path'/usr/local/bin/start-web.sh'
  
  -- Create systemd service file inside container
  service_content = '[Unit]' || '0A'x ||,
  'Description=Web Server' || '0A'x ||,
  'After=network.target' || '0A'x ||,
  '' || '0A'x ||,
  '[Service]' || '0A'x ||,
  'Type=simple' || '0A'x ||,
  'ExecStart=/usr/local/bin/start-web.sh' || '0A'x ||,
  'Restart=always' || '0A'x ||,
  'User=root' || '0A'x ||,
  '' || '0A'x ||,
  '[Install]' || '0A'x ||,
  'WantedBy=multi-user.target'
  
  ADDRESS system
  'sudo mkdir -p' container_path'/etc/systemd/system'
  'echo "' || service_content || '" | sudo tee' container_path'/etc/systemd/system/web-server.service > /dev/null'
  
  SAY '[nspawn-local] Container created successfully'
RETURN

-- Start nspawn container
start_container:
  SAY '[nspawn-local] Starting nspawn container...'
  
  -- Stop any existing instance
  ADDRESS system
  'sudo machinectl terminate' CONTAINER_NAME '2>/dev/null || true'
  'sleep 2'
  
  -- Start container in background
  SAY '[nspawn-local] Launching systemd-nspawn...'
  ADDRESS system
  'sudo systemd-nspawn -M' CONTAINER_NAME '-D' container_path '--boot --network-veth --port=' || PORT || ':' || PORT '&'
  
  -- Wait a moment for startup
  'sleep 5'
  
  -- Enable and start web service inside container
  SAY '[nspawn-local] Starting web service...'
  ADDRESS system
  'sudo machinectl shell' CONTAINER_NAME '/bin/systemctl enable web-server.service'
  'sudo machinectl shell' CONTAINER_NAME '/bin/systemctl start web-server.service'
  
  SAY '[nspawn-local] Container started successfully'
RETURN

-- Stop nspawn container  
stop_container:
  SAY '[nspawn-local] Stopping nspawn container...'
  ADDRESS system
  'sudo machinectl terminate' CONTAINER_NAME
  SAY '[nspawn-local] Container stopped'
RETURN

-- Remove nspawn container
remove_container:
  SAY '[nspawn-local] Removing nspawn container...'
  ADDRESS system
  'sudo machinectl terminate' CONTAINER_NAME '2>/dev/null || true'
  'sleep 2'
  'sudo rm -rf' container_path
  SAY '[nspawn-local] Container removed'
RETURN

-- Show container status
show_status:
  SAY '[nspawn-local] Container status:'
  ADDRESS system
  'sudo machinectl list | grep' CONTAINER_NAME '|| echo "Container not running"'
  'ls -la' container_path '2>/dev/null || echo "Container filesystem not found"'
RETURN