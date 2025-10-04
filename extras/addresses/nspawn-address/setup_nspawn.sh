#!/bin/bash
set -e

echo "=== Setting up systemd-nspawn on Ubuntu 25 ==="

# Update package list
sudo apt-get update

# Install systemd-container package
sudo apt-get install -y systemd-container debootstrap

# Verify installation
systemd-nspawn --version

# Create directory for containers
sudo mkdir -p /var/lib/machines

echo "=== systemd-nspawn setup complete ==="
echo "Note: systemd-nspawn is part of systemd and should now be ready to use"
