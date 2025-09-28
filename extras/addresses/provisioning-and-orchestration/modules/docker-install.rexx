-- RexxJS Infrastructure Module: Docker Installation
-- Pure RexxJS implementation replacing bash apt commands
-- Usage: Include with REQUIRE or call as standalone module

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"

PARSE ARG HOST, USER, SESSION_ID
IF SESSION_ID = '' THEN SESSION_ID = 'docker-install'

SAY '[Docker Module] Installing Docker on ' || USER || '@' || HOST

ADDRESS ssh
connect host=HOST user=USER id=SESSION_ID

-- Check current Docker status  
SAY '[Docker Module] Checking existing Docker installation...'
ADDRESS ssh
<<CHECK_DOCKER_STATUS
if command -v docker >/dev/null 2>&1; then
  echo "DOCKER_STATUS=installed"
  echo "DOCKER_VERSION=$(docker --version)"
else
  echo "DOCKER_STATUS=not_installed"
fi
CHECK_DOCKER_STATUS

-- Install Docker using pure RexxJS commands (no bash scripts)
SAY '[Docker Module] Installing Docker CE for Ubuntu...'
ADDRESS ssh
exec command='echo "[docker-install] Starting Docker installation on $(hostname)"' id=SESSION_ID

-- Update package index
ADDRESS ssh  
exec command='sudo apt-get update -y' id=SESSION_ID

-- Install prerequisites
ADDRESS ssh
exec command='sudo apt-get install -y ca-certificates curl gnupg lsb-release' id=SESSION_ID

-- Add Docker GPG key
ADDRESS ssh
exec command='sudo mkdir -p /etc/apt/keyrings' id=SESSION_ID

ADDRESS ssh
exec command='curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg' id=SESSION_ID

-- Add Docker repository
ADDRESS ssh  
<<ADD_DOCKER_REPO
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
ADD_DOCKER_REPO

-- Update package list with Docker repo
ADDRESS ssh
exec command='sudo apt-get update -y' id=SESSION_ID

-- Install Docker packages
ADDRESS ssh
exec command='sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin' id=SESSION_ID

-- Enable and start Docker service
ADDRESS ssh
exec command='sudo systemctl enable docker' id=SESSION_ID

ADDRESS ssh  
exec command='sudo systemctl start docker' id=SESSION_ID

-- Add user to docker group
ADDRESS ssh
exec command='sudo usermod -aG docker ' || USER id=SESSION_ID

-- Verify installation
SAY '[Docker Module] Verifying Docker installation...'
ADDRESS ssh
exec command='docker --version' id=SESSION_ID

ADDRESS ssh
exec command='sudo systemctl is-active docker' id=SESSION_ID

-- Create installation marker
ADDRESS ssh
exec command='touch ~/.rexxjs-docker-install-marker' id=SESSION_ID

SAY '[Docker Module] Docker installation completed on ' || USER || '@' || HOST
SAY '[Docker Module] Note: User may need to logout/login to use Docker without sudo'