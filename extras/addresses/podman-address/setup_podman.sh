#!/bin/bash
set -e

echo "=== Setting up Podman on Ubuntu 25 ==="

# Update package list
sudo apt-get update

# Install podman
sudo apt-get install -y podman

# Verify installation
podman --version

# Enable podman socket for rootless operation
systemctl --user enable --now podman.socket || true

# Test podman
podman run --rm hello-world || echo "Note: podman test may fail if no images are available"

echo "=== Podman setup complete ==="
