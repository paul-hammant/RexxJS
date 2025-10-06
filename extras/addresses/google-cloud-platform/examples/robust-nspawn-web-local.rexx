-- Robust Local REXX script for nspawn container operations
-- This script runs on the remote host to manage nspawn containers reliably
-- 
-- Usage: robust-nspawn-web-local.rexx CONTAINER_NAME PORT [ACTION]
-- Actions: create, start, stop, remove, status

PARSE ARG CONTAINER_NAME, PORT, ACTION

IF CONTAINER_NAME = '' | PORT = '' THEN DO
  SAY 'Usage: robust-nspawn-web-local.rexx CONTAINER_NAME PORT [ACTION]'
  SAY 'Actions: create, start, stop, remove, status'
  SAY 'Example: robust-nspawn-web-local.rexx robust-web 8081 create'
  EXIT 1
END

IF ACTION = '' THEN ACTION = 'create'

SAY '[robust-nspawn] Starting nspawn operations'
SAY '[robust-nspawn] Container:' CONTAINER_NAME
SAY '[robust-nspawn] Port:' PORT  
SAY '[robust-nspawn] Action:' ACTION
SAY '[robust-nspawn] Host:' GETENV('HOSTNAME')
SAY ''

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
    SAY '[robust-nspawn] ERROR: Unknown action:' ACTION
    EXIT 1
  END
END

SAY '[robust-nspawn] Operations completed successfully'
EXIT 0

-- Create and setup nspawn container with robust error handling
create_container:
  SAY '[robust-nspawn] Creating robust nspawn container...'
  
  -- Check if systemd-nspawn is available
  ADDRESS system
  'which systemd-nspawn >/dev/null 2>&1'
  IF RC <> 0 THEN DO
    SAY '[robust-nspawn] Installing systemd-container...'
    'sudo apt-get update -y'
    IF RC <> 0 THEN DO
      SAY '[robust-nspawn] ERROR: Failed to update package lists'
      EXIT 1
    END
    'sudo apt-get install -y systemd-container debootstrap'
    IF RC <> 0 THEN DO
      SAY '[robust-nspawn] ERROR: Failed to install systemd-container'
      EXIT 1
    END
    SAY '[robust-nspawn] systemd-container installed successfully'
  ELSE DO
    SAY '[robust-nspawn] systemd-nspawn already available'
  END
  
  -- Clean up any existing container
  SAY '[robust-nspawn] Cleaning up existing container...'
  ADDRESS system
  'sudo machinectl terminate' CONTAINER_NAME '2>/dev/null || true'
  'sleep 2'
  'sudo rm -rf' container_path
  
  -- Create container directory
  SAY '[robust-nspawn] Setting up container filesystem...'
  ADDRESS system
  'sudo mkdir -p' container_path
  IF RC <> 0 THEN DO
    SAY '[robust-nspawn] ERROR: Failed to create container directory'
    EXIT 1
  END
  
  -- Bootstrap minimal Ubuntu system with proper packages
  SAY '[robust-nspawn] Bootstrapping Ubuntu system (this may take 5-10 minutes)...'
  SAY '[robust-nspawn] This includes systemd, python3, and networking tools'
  ADDRESS system
  'sudo debootstrap --include=systemd,python3,curl,iproute2,systemd-resolved noble' container_path 'http://archive.ubuntu.com/ubuntu/'
  IF RC <> 0 THEN DO
    SAY '[robust-nspawn] ERROR: Failed to bootstrap container. Checking available Ubuntu releases...'
    'sudo debootstrap --include=systemd,python3,curl,iproute2,systemd-resolved jammy' container_path 'http://archive.ubuntu.com/ubuntu/'
    IF RC <> 0 THEN DO
      SAY '[robust-nspawn] ERROR: Failed to bootstrap container with jammy. Trying focal...'
      'sudo debootstrap --include=systemd,python3,curl,iproute2,systemd-resolved focal' container_path 'http://archive.ubuntu.com/ubuntu/'
      IF RC <> 0 THEN DO
        SAY '[robust-nspawn] ERROR: Failed to bootstrap container completely'
        EXIT 1
      END
    END
  END
  SAY '[robust-nspawn] Bootstrap completed successfully'
  
  -- Set up container hostname
  ADDRESS system
  'echo "' || CONTAINER_NAME || '" | sudo tee' container_path'/etc/hostname > /dev/null'
  
  -- Create web content directory and content
  SAY '[robust-nspawn] Creating web content...'
  web_content = '<!DOCTYPE html>' || '0A'x ||,
  '<html>' || '0A'x ||,
  '<head>' || '0A'x ||,
  '    <title>Robust systemd-nspawn Container</title>' || '0A'x ||,
  '    <style>' || '0A'x ||,
  '        body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }' || '0A'x ||,
  '        .container { background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 20px; padding: 50px; box-shadow: 0 25px 45px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); max-width: 700px; text-align: center; }' || '0A'x ||,
  '        h1 { font-size: 2.8em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }' || '0A'x ||,
  '        .subtitle { font-size: 1.4em; opacity: 0.9; margin-bottom: 30px; }' || '0A'x ||,
  '        .tech-stack { background: rgba(255,255,255,0.1); border-radius: 15px; padding: 25px; margin: 30px 0; }' || '0A'x ||,
  '        .tech-item { margin: 8px; padding: 8px 15px; background: rgba(255,255,255,0.1); border-radius: 25px; display: inline-block; }' || '0A'x ||,
  '        .highlight { color: #FFD700; font-weight: bold; }' || '0A'x ||,
  '        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; text-align: left; }' || '0A'x ||,
  '        .info-item { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; }' || '0A'x ||,
  '        .status { margin-top: 20px; padding: 15px; background: rgba(76, 175, 80, 0.3); border-radius: 10px; }' || '0A'x ||,
  '        @media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } }' || '0A'x ||,
  '    </style>' || '0A'x ||,
  '</head>' || '0A'x ||,
  '<body>' || '0A'x ||,
  '    <div class="container">' || '0A'x ||,
  '        <h1>🏗️ Robust systemd-nspawn! 🏗️</h1>' || '0A'x ||,
  '        <div class="subtitle">Bulletproof Container Deployment</div>' || '0A'x ||,
  '        <div class="tech-stack">' || '0A'x ||,
  '            <h3>Technology Stack</h3>' || '0A'x ||,
  '            <div class="tech-item">systemd-nspawn</div>' || '0A'x ||,
  '            <div class="tech-item">Ubuntu LTS</div>' || '0A'x ||,
  '            <div class="tech-item">RexxJS</div>' || '0A'x ||,
  '            <div class="tech-item">Robust Deployment</div>' || '0A'x ||,
  '        </div>' || '0A'x ||,
  '        <div class="info-grid">' || '0A'x ||,
  '            <div class="info-item"><strong>Container:</strong><br><span class="highlight">' || CONTAINER_NAME || '</span></div>' || '0A'x ||,
  '            <div class="info-item"><strong>Port:</strong><br><span class="highlight">' || PORT || '</span></div>' || '0A'x ||,
  '            <div class="info-item"><strong>Technology:</strong><br><span class="highlight">systemd-nspawn</span></div>' || '0A'x ||,
  '            <div class="info-item"><strong>Base System:</strong><br><span class="highlight">Ubuntu LTS</span></div>' || '0A'x ||,
  '        </div>' || '0A'x ||,
  '        <div class="status">' || '0A'x ||,
  '            <strong>✅ Status:</strong> Container running successfully!<br>' || '0A'x ||,
  '            <strong>🚀 Deployed by:</strong> RexxJS Robust Orchestration<br>' || '0A'x ||,
  '            <strong>🔧 Features:</strong> Error handling, retry logic, health checks' || '0A'x ||,
  '        </div>' || '0A'x ||,
  '    </div>' || '0A'x ||,
  '</body>' || '0A'x ||,
  '</html>'
  
  ADDRESS system
  'sudo mkdir -p' container_path'/var/www'
  'echo "' || web_content || '" | sudo tee' container_path'/var/www/index.html > /dev/null'
  IF RC <> 0 THEN DO
    SAY '[robust-nspawn] ERROR: Failed to create web content'
    EXIT 1
  END
  
  -- Create robust startup script inside container
  startup_script = '#!/bin/bash' || '0A'x ||,
  'set -e' || '0A'x ||,
  'echo "[web-server] Starting robust web server on port ' || PORT || '"' || '0A'x ||,
  'cd /var/www' || '0A'x ||,
  'echo "[web-server] Working directory: $(pwd)"' || '0A'x ||,
  'echo "[web-server] Files available: $(ls -la)"' || '0A'x ||,
  '# Try python3 first, fallback to python' || '0A'x ||,
  'if command -v python3 >/dev/null 2>&1; then' || '0A'x ||,
  '    echo "[web-server] Using python3"' || '0A'x ||,
  '    python3 -m http.server ' || PORT || '0A'x ||,
  'elif command -v python >/dev/null 2>&1; then' || '0A'x ||,
  '    echo "[web-server] Using python2 fallback"' || '0A'x ||,
  '    python -m SimpleHTTPServer ' || PORT || '0A'x ||,
  'else' || '0A'x ||,
  '    echo "[web-server] ERROR: No python interpreter found"' || '0A'x ||,
  '    exit 1' || '0A'x ||,
  'fi'
  
  ADDRESS system
  'echo "' || startup_script || '" | sudo tee' container_path'/usr/local/bin/start-web.sh > /dev/null'
  'sudo chmod +x' container_path'/usr/local/bin/start-web.sh'
  
  -- Create robust systemd service file inside container
  service_content = '[Unit]' || '0A'x ||,
  'Description=Robust Web Server for ' || CONTAINER_NAME || '0A'x ||,
  'After=network.target systemd-resolved.service' || '0A'x ||,
  'Wants=network.target' || '0A'x ||,
  '' || '0A'x ||,
  '[Service]' || '0A'x ||,
  'Type=simple' || '0A'x ||,
  'ExecStart=/usr/local/bin/start-web.sh' || '0A'x ||,
  'Restart=always' || '0A'x ||,
  'RestartSec=5' || '0A'x ||,
  'User=root' || '0A'x ||,
  'WorkingDirectory=/var/www' || '0A'x ||,
  'StandardOutput=journal' || '0A'x ||,
  'StandardError=journal' || '0A'x ||,
  '' || '0A'x ||,
  '[Install]' || '0A'x ||,
  'WantedBy=multi-user.target'
  
  ADDRESS system
  'sudo mkdir -p' container_path'/etc/systemd/system'
  'echo "' || service_content || '" | sudo tee' container_path'/etc/systemd/system/web-server.service > /dev/null'
  
  -- Set up basic networking configuration
  SAY '[robust-nspawn] Setting up networking...'
  ADDRESS system
  'sudo mkdir -p' container_path'/etc/systemd/network'
  network_config = '[Match]' || '0A'x ||,
  'Name=host0' || '0A'x ||,
  '' || '0A'x ||,
  '[Network]' || '0A'x ||,
  'DHCP=yes' || '0A'x ||,
  'IPForward=yes'
  'echo "' || network_config || '" | sudo tee' container_path'/etc/systemd/network/host0.network > /dev/null'
  
  SAY '[robust-nspawn] Container created successfully with robust configuration'
RETURN

-- Start nspawn container with robust startup
start_container:
  SAY '[robust-nspawn] Starting nspawn container with robust configuration...'
  
  -- Verify container exists
  ADDRESS system
  'test -d' container_path
  IF RC <> 0 THEN DO
    SAY '[robust-nspawn] ERROR: Container filesystem not found. Run create first.'
    EXIT 1
  END
  
  -- Stop any existing instance gracefully
  ADDRESS system
  'sudo machinectl terminate' CONTAINER_NAME '2>/dev/null || true'
  'sleep 3'
  
  -- Start container using machinectl (more robust than direct systemd-nspawn)
  SAY '[robust-nspawn] Starting container via machinectl...'
  ADDRESS system
  'sudo machinectl start' CONTAINER_NAME
  start_rc = RC
  
  IF start_rc <> 0 THEN DO
    SAY '[robust-nspawn] machinectl start failed, trying direct systemd-nspawn...'
    -- Fallback to direct systemd-nspawn
    ADDRESS system
    'sudo systemd-nspawn --machine=' || CONTAINER_NAME || ' --directory=' || container_path || ' --boot --network-veth --port=' || PORT || ':' || PORT || ' >/dev/null 2>&1 &'
    'sleep 8'
  ELSE DO
    SAY '[robust-nspawn] Container started via machinectl'
    'sleep 5'
  END
  
  -- Verify container is running
  SAY '[robust-nspawn] Verifying container status...'
  ADDRESS system
  'sudo machinectl list | grep' CONTAINER_NAME
  IF RC <> 0 THEN DO
    SAY '[robust-nspawn] ERROR: Container failed to start properly'
    EXIT 1
  END
  
  -- Wait for systemd to be ready inside container
  SAY '[robust-nspawn] Waiting for container systemd to be ready...'
  ADDRESS system
  'sleep 10'
  
  -- Enable and start web service inside container with retries
  SAY '[robust-nspawn] Starting web service with retry logic...'
  ADDRESS system
  'sudo machinectl shell' CONTAINER_NAME '/bin/systemctl daemon-reload'
  'sudo machinectl shell' CONTAINER_NAME '/bin/systemctl enable web-server.service'
  'sudo machinectl shell' CONTAINER_NAME '/bin/systemctl start web-server.service'
  service_rc = RC
  
  IF service_rc <> 0 THEN DO
    SAY '[robust-nspawn] First service start attempt failed, retrying once...'
    ADDRESS system
    'sleep 5'
    'sudo machinectl shell' CONTAINER_NAME '/bin/systemctl start web-server.service'
    service_rc = RC
  END
  
  IF service_rc <> 0 THEN DO
    SAY '[robust-nspawn] ERROR: Failed to start web service after 3 attempts'
    -- Show service status for debugging
    ADDRESS system
    'sudo machinectl shell' CONTAINER_NAME '/bin/systemctl status web-server.service'
    EXIT 1
  END
  
  -- Verify web service is responding
  SAY '[robust-nspawn] Testing web service accessibility...'
  ADDRESS system
  'sleep 5'
  'sudo machinectl shell' CONTAINER_NAME '/bin/curl -f http://localhost:' || PORT || ' >/dev/null 2>&1'
  IF RC = 0 THEN DO
    SAY '[robust-nspawn] ✅ Web service test successful!'
  ELSE DO
    SAY '[robust-nspawn] ⚠️  Web service test failed, but container is running'
  END
  
  SAY '[robust-nspawn] Container started successfully with robust startup sequence'
RETURN

-- Stop nspawn container gracefully
stop_container:
  SAY '[robust-nspawn] Stopping nspawn container gracefully...'
  ADDRESS system
  'sudo machinectl poweroff' CONTAINER_NAME '2>/dev/null || sudo machinectl terminate' CONTAINER_NAME
  'sleep 3'
  SAY '[robust-nspawn] Container stopped'
RETURN

-- Remove nspawn container completely
remove_container:
  SAY '[robust-nspawn] Removing nspawn container completely...'
  ADDRESS system
  'sudo machinectl terminate' CONTAINER_NAME '2>/dev/null || true'
  'sleep 3'
  'sudo rm -rf' container_path
  SAY '[robust-nspawn] Container removed completely'
RETURN

-- Show comprehensive container status
show_status:
  SAY '[robust-nspawn] Comprehensive container status:'
  SAY '============================================'
  ADDRESS system
  'echo "=== Machine Status ==="'
  'sudo machinectl list | grep' CONTAINER_NAME '|| echo "Container not running"'
  'echo ""'
  'echo "=== Container Filesystem ==="'
  'ls -la' container_path '2>/dev/null || echo "Container filesystem not found"'
  'echo ""'
  'echo "=== Web Service Status ==="'
  'sudo machinectl shell' CONTAINER_NAME '/bin/systemctl status web-server.service' '2>/dev/null || echo "Cannot check service status"'
  'echo ""'
  'echo "=== Network Test ==="'
  'curl -f -m 5 http://localhost:' || PORT || ' >/dev/null 2>&1 && echo "✅ Web service responding" || echo "❌ Web service not responding"'
RETURN