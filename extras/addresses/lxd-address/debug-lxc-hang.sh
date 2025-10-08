#!/bin/bash
# Debug script to isolate the lxc hanging issue
# Run this OUTSIDE of Claude Code to avoid crashes

echo "=== LXD Debug Script ==="
echo "This script tests various lxc commands to find what's hanging"
echo ""

# Test 1: Does lxc list work?
echo "Test 1: lxc list (should be instant)"
time sudo lxc list --format=json > /tmp/lxc-list.json 2>&1
echo "✓ lxc list completed"
echo ""

# Test 2: Does lxc init hang?
echo "Test 2: lxc init ubuntu:22.04 (this might hang)"
echo "Starting at $(date +%H:%M:%S)..."
timeout 10s sudo lxc init ubuntu:22.04 debug-init-test 2>&1 &
LXC_PID=$!
echo "LXC process PID: $LXC_PID"
echo "Waiting 10 seconds..."
wait $LXC_PID
EXIT_CODE=$?
echo "Exit code: $EXIT_CODE (124 = timeout, 0 = success)"
echo ""

# Test 3: Check if container was created despite timeout
echo "Test 3: Was container created?"
sudo lxc list debug-init-test --format=json | jq -r '.[0].name // "NOT FOUND"'
echo ""

# Test 4: Try with --force-local flag
echo "Test 4: Try with --force-local"
timeout 10s sudo lxc init ubuntu:22.04 debug-force-local --force-local 2>&1
echo "Exit code: $?"
echo ""

# Test 5: Check LXD daemon status
echo "Test 5: LXD daemon status"
sudo systemctl status snap.lxd.daemon.service --no-pager | head -10
echo ""

# Test 6: Check for network issues
echo "Test 6: LXD network status"
sudo lxc network list
echo ""

# Test 7: Try background mode
echo "Test 7: lxc launch with & (background)"
sudo lxc launch ubuntu:22.04 debug-bg-test &
BG_PID=$!
echo "Background PID: $BG_PID"
sleep 5
echo "After 5 seconds, checking if it's still running..."
if ps -p $BG_PID > /dev/null; then
    echo "⚠ Still running after 5s - this is the hang!"
    sudo kill -9 $BG_PID 2>/dev/null || true
else
    echo "✓ Completed within 5s"
fi
echo ""

# Cleanup
echo "=== Cleanup ==="
sudo lxc delete debug-init-test --force 2>/dev/null || true
sudo lxc delete debug-force-local --force 2>/dev/null || true
sudo lxc delete debug-bg-test --force 2>/dev/null || true
echo "Done"
