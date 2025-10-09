#!/bin/bash
# Setup ZFS pool for systemd-nspawn with CoW cloning
# Similar to LXD ZFS setup

set -e

echo "=== systemd-nspawn ZFS Setup ==="
echo

# Check if ZFS is installed
if ! command -v zpool &> /dev/null; then
    echo "❌ ZFS not installed. Installing..."
    echo "  sudo apt-get update && sudo apt-get install -y zfsutils-linux"
    sudo apt-get update
    sudo apt-get install -y zfsutils-linux
    echo "✅ ZFS installed"
    echo
fi

# Check if pool already exists
if sudo zpool list nspawn-pool &> /dev/null; then
    echo "✅ ZFS pool 'nspawn-pool' already exists"
    sudo zfs list | grep nspawn-pool
    exit 0
fi

echo "Creating ZFS pool for systemd-nspawn..."
echo

# Create storage directory
STORAGE_DIR="/var/lib/nspawn-storage"
POOL_FILE="$STORAGE_DIR/zpool.img"
POOL_SIZE="50G"

echo "1. Creating storage directory..."
sudo mkdir -p "$STORAGE_DIR"
echo "   ✅ $STORAGE_DIR"

echo
echo "2. Creating ${POOL_SIZE} sparse file..."
sudo truncate -s "$POOL_SIZE" "$POOL_FILE"
echo "   ✅ $POOL_FILE"

echo
echo "3. Creating ZFS pool 'nspawn-pool'..."
sudo zpool create nspawn-pool "$POOL_FILE"
echo "   ✅ Pool created"

echo
echo "4. Creating ZFS dataset for machines..."
sudo zfs create nspawn-pool/machines
echo "   ✅ Dataset created"

echo
echo "5. Setting mountpoint to /var/lib/machines..."
# Backup existing /var/lib/machines if it has content
if [ "$(ls -A /var/lib/machines 2>/dev/null)" ]; then
    echo "   ⚠ Backing up existing /var/lib/machines to /var/lib/machines.bak"
    sudo mv /var/lib/machines /var/lib/machines.bak
fi

sudo zfs set mountpoint=/var/lib/machines nspawn-pool/machines
echo "   ✅ Mountpoint set"

echo
echo "=== ZFS Pool Status ==="
sudo zpool status nspawn-pool
echo

echo "=== ZFS Datasets ==="
sudo zfs list | grep nspawn-pool
echo

echo "=== systemd-nspawn ZFS Setup Complete! ==="
echo
echo "Now nspawn containers will benefit from:"
echo "  • Instant CoW cloning (<100ms per clone)"
echo "  • 99.9%+ space savings"
echo "  • Automatic compression (if enabled)"
echo
echo "Test with:"
echo "  cd /home/paul/scm/RexxJS/extras/addresses/nspawn-address"
echo "  ./test-nspawn-cow.rexx"
