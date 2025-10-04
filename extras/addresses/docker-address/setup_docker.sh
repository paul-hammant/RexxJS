#!/bin/bash
set -e

echo "=== Setting up Docker on Ubuntu 25 ==="

# Update package list
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group for rootless operation
sudo usermod -aG docker $USER

# Enable and start docker
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
sudo docker --version
sudo docker run --rm hello-world

echo "=== Docker setup complete ==="
echo "Note: You may need to log out and back in for docker group membership to take effect"
