#!/bin/bash
set -e

echo "=== Setting up QEMU on Ubuntu 25 ==="

# Update package list
sudo apt-get update

# Install QEMU and related tools
sudo apt-get install -y qemu-system qemu-utils qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils virt-manager

# Add current user to libvirt and kvm groups
sudo usermod -aG libvirt $USER
sudo usermod -aG kvm $USER

# Enable and start libvirtd
sudo systemctl enable libvirtd
sudo systemctl start libvirtd

# Verify installation
qemu-system-x86_64 --version
virsh --version

echo "=== QEMU setup complete ==="
echo "Note: You may need to log out and back in for group membership to take effect"
