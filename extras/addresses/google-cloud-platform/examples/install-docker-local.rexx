-- Docker installation script for remote execution
-- This script runs locally on the target host to install Docker
--
-- Copyright (c) 2025 RexxJS Project | MIT License

SAY '[docker-install] Starting Docker installation on' ENV.HOSTNAME
SAY '[docker-install] User:' ENV.USER

-- Check if Docker is already installed
ADDRESS system
'which docker'
dockerInstalled = (RC = 0)

IF dockerInstalled THEN DO
  SAY '[docker-install] Docker is already installed'
  ADDRESS system
  'docker --version'
  SAY '[docker-install] Installation marker: already installed'
ELSE DO
  SAY '[docker-install] Docker not found, installing...'
  
  -- Update package list
  SAY '[docker-install] Updating package list...'
  ADDRESS system
  'sudo apt-get update -y'
  IF RC <> 0 THEN DO
    SAY '[docker-install] ERROR: Failed to update package list'
    EXIT 1
  END
  
  -- Install Docker
  SAY '[docker-install] Installing docker.io package...'
  ADDRESS system
  'sudo apt-get install -y docker.io'
  IF RC <> 0 THEN DO
    SAY '[docker-install] ERROR: Failed to install Docker'
    EXIT 1
  END
  
  -- Enable and start Docker service
  SAY '[docker-install] Enabling Docker service...'
  ADDRESS system
  'sudo systemctl enable --now docker'
  -- Ignore RC for systemctl (may not be needed on all systems)
  
  -- Add user to docker group
  SAY '[docker-install] Adding user to docker group...'
  ADDRESS system
  'sudo usermod -aG docker' ENV.USER
  -- Ignore RC for usermod (may already be in group)
  
  SAY '[docker-install] Docker installation completed'
END

-- Create installation marker
SAY '[docker-install] Creating installation marker...'
ADDRESS system
'touch ~/rexxjs-docker-install.ok'

-- Show final status
ADDRESS system
'docker --version'
IF RC = 0 THEN DO
  SAY '[docker-install] SUCCESS: Docker installation verified'
ELSE DO
  SAY '[docker-install] WARNING: Docker installation may need a logout/login to take effect'
END

SAY '[docker-install] Installation process finished'