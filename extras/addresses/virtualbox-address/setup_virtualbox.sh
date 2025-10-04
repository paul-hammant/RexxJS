#!/bin/bash
set -e

echo "=== Setting up VirtualBox on Ubuntu 25 ==="

# Update package list
sudo apt-get update

# Install VirtualBox from Ubuntu repositories
# Note: Ubuntu 25 is too new for Oracle's VirtualBox repository, using Ubuntu's version
sudo apt-get install -y virtualbox virtualbox-ext-pack virtualbox-guest-additions-iso

# Add current user to vboxusers group
sudo usermod -aG vboxusers $USER

# Verify installation
vboxmanage --version

echo "=== VirtualBox setup complete ==="
echo "Note: You may need to log out and back in for group membership to take effect"
echo "Note: VirtualBox may require manual acceptance of license terms during installation"
