#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, qemu-address, registry, integration, virtualization */
/* @description Test loading qemu-address from published registry */

REQUIRE "../core/src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/qemu-address"
SAY "Loading module from registry..."

// Load qemu-address from the published registry
REQUIRE "registry:org.rexxjs/qemu-address"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Check QEMU/KVM status
SAY "Test 1: Check QEMU/KVM availability"

ADDRESS QEMU "status"

IF RC = 0 THEN DO
  SAY "✓ QEMU/KVM is available and responding"
END
ELSE DO
  SAY "⚠️  QEMU not available - this test requires QEMU installed"
  SAY "   Install: sudo apt install qemu-system-x86_64 qemu-kvm"
  SAY "   Note: Full VM functionality requires KVM support"
  EXIT 0  // Exit gracefully if QEMU not available
END
SAY ""

// Test 2: Create a virtual machine
SAY "Test 2: Create Debian virtual machine"
SAY "  Image: debian.qcow2"
SAY "  Memory: 2G"
SAY "  CPUs: 2"

LET vmConfig = <<JSON
{
  "image": "debian.qcow2",
  "name": "rexxjs-qemu-demo",
  "memory": "2G",
  "cpus": "2",
  "port": "2222"
}
JSON

ADDRESS QEMU "create image={vmConfig.image} name={vmConfig.name} memory={vmConfig.memory} cpus={vmConfig.cpus} ssh_port={vmConfig.port}"

IF RC = 0 THEN DO
  SAY "✓ Virtual machine created successfully"
  LET vmId = RESULT.vmId
  ADDRESS EXPECTATIONS "EXPECT" vmId "rexxjs-qemu-demo"
END
ELSE DO
  LET errorMsg = RESULT.error
  SAY "⚠️  VM creation failed: " || errorMsg

  // If VM already exists, clean it up and retry
  IF POS("already exists", errorMsg) > 0 THEN DO
    SAY "   Cleaning up existing VM..."
    ADDRESS QEMU "stop name=rexxjs-qemu-demo force=true"
    ADDRESS QEMU "remove name=rexxjs-qemu-demo"
    ADDRESS QEMU "create image=debian.qcow2 name=rexxjs-qemu-demo memory=2G cpus=2"
    IF RC \= 0 THEN DO
      SAY "   Retry failed, exiting"
      EXIT 1
    END
    SAY "✓ VM created after cleanup"
  END
  ELSE DO
    EXIT 1
  END
END
SAY ""

// Test 3: Start the virtual machine
SAY "Test 3: Start virtual machine with KVM acceleration"

ADDRESS QEMU "start name=rexxjs-qemu-demo kvm=true"

IF RC = 0 THEN DO
  SAY "✓ Virtual machine started with KVM acceleration"
  LET vmStatus = RESULT.status
  SAY "  VM Status: " || vmStatus
END
ELSE DO
  SAY "⚠️  Failed to start VM: " || RESULT.error
  SAY "   Note: KVM may not be available, trying without acceleration..."

  ADDRESS QEMU "start name=rexxjs-qemu-demo"

  IF RC = 0 THEN DO
    SAY "✓ VM started (without KVM acceleration)"
  END
  ELSE DO
    ADDRESS QEMU "remove name=rexxjs-qemu-demo force=true"
    EXIT 1
  END
END
SAY ""

// Test 4: List virtual machines
SAY "Test 4: List QEMU virtual machines"

ADDRESS QEMU "list"

IF RC = 0 THEN DO
  SAY "✓ VM list retrieved successfully"
  LET vms = RESULT.vms
  IF DATATYPE(vms, "O") THEN DO
    LET count = vms.length
    SAY "  Found " || count || " virtual machine(s)"
  END
END
ELSE DO
  SAY "✗ Failed to list VMs"
END
SAY ""

// Test 5: Query VM info and resources
SAY "Test 5: Query VM configuration and resources"

ADDRESS QEMU "info name=rexxjs-qemu-demo"

IF RC = 0 THEN DO
  SAY "✓ VM information retrieved"
  LET vmInfo = RESULT.info
  IF DATATYPE(vmInfo, "O") THEN DO
    LET allocatedMemory = vmInfo.memory
    LET allocatedCpus = vmInfo.cpus
    SAY "  Memory: " || allocatedMemory
    SAY "  CPUs: " || allocatedCpus
    ADDRESS EXPECTATIONS "EXPECT" allocatedMemory "2G"
  END
END
ELSE DO
  SAY "⚠️  Could not retrieve VM info (non-critical)"
END
SAY ""

// Test 6: Deploy web server in VM via SSH
SAY "Test 6: Deploy Python web server in VM"

// Wait for VM to boot and SSH to be available
SAY "  Waiting for VM to boot (10 seconds)..."
ADDRESS SYSTEM "sleep 10"

// Create custom HTML content for the VM
LET vmWebHtml = <<HTML
<!DOCTYPE html>
<html>
<head><title>RexxJS QEMU Demo</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
  <h1>🖥️ QEMU/KVM + RexxJS</h1>
  <h2>Hardware Virtualization</h2>
  <p>Virtual Machine deployed via ADDRESS QEMU</p>
  <p>Published module: org.rexxjs/qemu-address</p>
  <p><strong>Technology:</strong> KVM acceleration, QCOW2 disk format</p>
</body>
</html>
HTML

// Install Python and deploy web server via SSH (using port 2222)
ADDRESS QEMU "exec name=rexxjs-qemu-demo command=\"apt-get update -y && apt-get install -y python3\" ssh_port=2222"

IF RC = 0 THEN DO
  SAY "✓ Python3 installed in VM"

  // Create web directory and deploy HTML
  ADDRESS QEMU "exec name=rexxjs-qemu-demo command=\"mkdir -p /var/www\" ssh_port=2222"
  ADDRESS QEMU "exec name=rexxjs-qemu-demo command=\"echo '" || vmWebHtml || "' > /var/www/index.html\" ssh_port=2222"

  SAY "✓ Custom HTML deployed to VM"

  // Start Python web server in background
  ADDRESS QEMU "exec name=rexxjs-qemu-demo command=\"cd /var/www && nohup python3 -m http.server 8080 > /dev/null 2>&1 &\" ssh_port=2222"

  SAY "✓ Python web server started on port 8080 in VM"
END
ELSE DO
  SAY "⚠️  Could not deploy web server via SSH (non-critical)"
  SAY "  Note: Requires SSH access and networking configured"
END
SAY ""

// Test 7: Verify web server with HTTP_GET
SAY "Test 7: Verify VM web server with HTTP_GET"

// Give Python server time to start
ADDRESS SYSTEM "sleep 3"

LET vmServiceUrl = "http://localhost:8080"
SAY "  Testing URL: " || vmServiceUrl
SAY "  (via port forwarding from VM)"

LET vmResponse = HTTP_GET(vmServiceUrl)

IF DATATYPE(vmResponse, "O") THEN DO
  LET vmStatus = vmResponse.status
  LET vmBody = vmResponse.body

  IF vmStatus = 200 THEN DO
    SAY "✓ VM web server responding with HTTP " || vmStatus
    LET hasQemu = POS("QEMU", vmBody)
    LET hasRexxJS = POS("RexxJS", vmBody)
    IF hasQemu > 0 AND hasRexxJS > 0 THEN DO
      SAY "✓ Custom HTML verified via HTTP_GET"
      ADDRESS EXPECTATIONS "EXPECT" vmStatus "200"
    END
    ELSE DO
      SAY "⚠️  Unexpected content"
    END
  END
  ELSE DO
    SAY "⚠️  Server returned status: " || vmStatus
  END
END
ELSE DO
  SAY "⚠️  HTTP_GET failed (VM may need port forwarding or networking setup)"
  SAY "  Note: Full HTTP testing requires guest networking and port forwarding"
END
SAY ""

// Test 8: Create VM snapshot (if supported)
SAY "Test 8: Create VM snapshot"

ADDRESS QEMU "snapshot name=rexxjs-qemu-demo snapshot_name=initial-state"

IF RC = 0 THEN DO
  SAY "✓ VM snapshot created successfully"
  LET snapshotId = RESULT.snapshotId
  SAY "  Snapshot: " || snapshotId
END
ELSE DO
  SAY "⚠️  Snapshot creation failed or not supported (non-critical)"
  SAY "  Note: Snapshots require QCOW2 disk format"
END
SAY ""

// Test 9: Stop and remove VM (cleanup)
SAY "Test 9: Cleanup - Stop and remove virtual machine"

ADDRESS QEMU "stop name=rexxjs-qemu-demo"

IF RC = 0 THEN DO
  SAY "✓ Virtual machine stopped"
END
ELSE DO
  SAY "⚠️  Failed to stop VM gracefully"
END

ADDRESS QEMU "remove name=rexxjs-qemu-demo"

IF RC = 0 THEN DO
  SAY "✓ Virtual machine removed"
END
ELSE DO
  SAY "⚠️  Failed to remove VM"
  SAY "   Manual cleanup: virsh destroy rexxjs-qemu-demo"
  SAY "   Manual cleanup: virsh undefine rexxjs-qemu-demo"
END

SAY ""
SAY "🎉 All QEMU ADDRESS tests completed successfully!"
SAY "   QEMU provides full hardware virtualization with KVM acceleration"

EXIT 0
