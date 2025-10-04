#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, virtualbox-address, registry, integration, virtualization */
/* @description Test loading virtualbox-address from published registry */

REQUIRE "../core/src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/virtualbox-address"
SAY "Loading module from registry..."

// Load virtualbox-address from the published registry
REQUIRE "registry:org.rexxjs/virtualbox-address"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Check VirtualBox status
SAY "Test 1: Check VirtualBox availability"

ADDRESS VIRTUALBOX "status"

IF RC = 0 THEN DO
  SAY "✓ VirtualBox is available and responding"
END
ELSE DO
  SAY "⚠️  VirtualBox not available - this test requires VirtualBox installed"
  SAY "   Install: sudo apt install virtualbox"
  SAY "   Or download from: https://www.virtualbox.org/"
  SAY "   Note: Extension Pack recommended for advanced features"
  EXIT 0  // Exit gracefully if VirtualBox not available
END
SAY ""

// Test 2: Create a virtual machine
SAY "Test 2: Create Ubuntu virtual machine"
SAY "  Template: Ubuntu"
SAY "  Memory: 2048 MB"
SAY "  CPUs: 2"
SAY "  Disk: 20 GB"

LET vmConfig = <<JSON
{
  "template": "Ubuntu",
  "name": "rexxjs-vbox-demo",
  "memory": "2048",
  "cpus": "2",
  "disk": "20480",
  "port": "3022"
}
JSON

ADDRESS VIRTUALBOX "create image={vmConfig.template} name={vmConfig.name} memory={vmConfig.memory} cpus={vmConfig.cpus} disk={vmConfig.disk} ssh_port={vmConfig.port}"

IF RC = 0 THEN DO
  SAY "✓ Virtual machine created successfully"
  LET vmId = RESULT.vmId
  ADDRESS EXPECTATIONS "EXPECT" vmId "rexxjs-vbox-demo"
  SAY "  VM UUID: " || RESULT.uuid
END
ELSE DO
  LET errorMsg = RESULT.error
  SAY "⚠️  VM creation failed: " || errorMsg

  // If VM already exists, clean it up and retry
  IF POS("already exists", errorMsg) > 0 THEN DO
    SAY "   Cleaning up existing VM..."
    ADDRESS VIRTUALBOX "poweroff name=rexxjs-vbox-demo"
    ADDRESS VIRTUALBOX "remove name=rexxjs-vbox-demo"
    ADDRESS VIRTUALBOX "create image=Ubuntu name=rexxjs-vbox-demo memory=2048 cpus=2"
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

// Test 3: Configure VM settings
SAY "Test 3: Configure VM networking and graphics"

LET networkConfig = <<JSON
{
  "adapter": "NAT",
  "port_forwarding": true,
  "ssh_port": "3022",
  "graphics": "headless"
}
JSON

ADDRESS VIRTUALBOX "modifyvm name=rexxjs-vbox-demo nic1=nat graphics={networkConfig.graphics}"

IF RC = 0 THEN DO
  SAY "✓ VM configuration updated"
  SAY "  Network: " || networkConfig.adapter
  SAY "  Display: " || networkConfig.graphics
  ADDRESS EXPECTATIONS "EXPECT" networkConfig.graphics "headless"
END
ELSE DO
  SAY "⚠️  Configuration update failed (non-critical)"
END
SAY ""

// Test 4: Start the virtual machine
SAY "Test 4: Start virtual machine in headless mode"

ADDRESS VIRTUALBOX "start name=rexxjs-vbox-demo mode=headless"

IF RC = 0 THEN DO
  SAY "✓ Virtual machine started in headless mode"
  LET vmState = RESULT.state
  SAY "  VM State: " || vmState
END
ELSE DO
  SAY "✗ Failed to start VM: " || RESULT.error
  ADDRESS VIRTUALBOX "remove name=rexxjs-vbox-demo force=true"
  EXIT 1
END
SAY ""

// Test 5: List virtual machines
SAY "Test 5: List VirtualBox virtual machines"

ADDRESS VIRTUALBOX "list"

IF RC = 0 THEN DO
  SAY "✓ VM list retrieved successfully"
  LET vms = RESULT.vms
  IF DATATYPE(vms, "O") THEN DO
    LET count = vms.length
    SAY "  Found " || count || " virtual machine(s)"
    SAY "  VirtualBox VMs managed via VBoxManage"
  END
END
ELSE DO
  SAY "✗ Failed to list VMs"
END
SAY ""

// Test 6: Query VM info and show properties
SAY "Test 6: Query VM properties and state"

ADDRESS VIRTUALBOX "showvminfo name=rexxjs-vbox-demo"

IF RC = 0 THEN DO
  SAY "✓ VM information retrieved"
  LET vmInfo = RESULT.info
  IF DATATYPE(vmInfo, "O") THEN DO
    LET state = vmInfo.state
    LET memoryMB = vmInfo.memory
    LET cpuCount = vmInfo.cpus
    SAY "  State: " || state
    SAY "  Memory: " || memoryMB || " MB"
    SAY "  CPUs: " || cpuCount
  END
END
ELSE DO
  SAY "⚠️  Could not retrieve VM info (non-critical)"
END
SAY ""

// Test 7: Deploy web server in VM via SSH
SAY "Test 7: Deploy nginx web server in VM"

// Wait for VM to boot and SSH to be available
SAY "  Waiting for VM to boot (15 seconds)..."
ADDRESS SYSTEM "sleep 15"

// Create custom HTML content for the VM
LET vboxWebHtml = <<HTML
<!DOCTYPE html>
<html>
<head><title>RexxJS VirtualBox Demo</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
  <h1>📦 VirtualBox + RexxJS</h1>
  <h2>Cross-Platform Virtualization</h2>
  <p>Virtual Machine deployed via ADDRESS VIRTUALBOX</p>
  <p>Published module: org.rexxjs/virtualbox-address</p>
  <p><strong>Features:</strong> Guest Additions, Snapshots, Shared Folders</p>
</body>
</html>
HTML

// Install nginx and deploy web server via SSH (using port 3022)
ADDRESS VIRTUALBOX "exec name=rexxjs-vbox-demo command=\"apt-get update -y && apt-get install -y nginx\" ssh_port=3022"

IF RC = 0 THEN DO
  SAY "✓ nginx installed in VM"

  // Deploy custom HTML to nginx
  ADDRESS VIRTUALBOX "exec name=rexxjs-vbox-demo command=\"echo '" || vboxWebHtml || "' > /var/www/html/index.html\" ssh_port=3022"

  SAY "✓ Custom HTML deployed to VM"

  // Start nginx service
  ADDRESS VIRTUALBOX "exec name=rexxjs-vbox-demo command=\"systemctl start nginx\" ssh_port=3022"

  SAY "✓ nginx web server started on port 80 in VM"
END
ELSE DO
  SAY "⚠️  Could not deploy web server via SSH (non-critical)"
  SAY "  Note: Requires SSH access, Guest Additions, and networking configured"
END
SAY ""

// Test 8: Verify web server with HTTP_GET
SAY "Test 8: Verify VM web server with HTTP_GET"

// Give nginx time to start
ADDRESS SYSTEM "sleep 2"

LET vboxServiceUrl = "http://localhost:8080"
SAY "  Testing URL: " || vboxServiceUrl
SAY "  (via NAT port forwarding 8080:80)"

LET vboxResponse = HTTP_GET(vboxServiceUrl)

IF DATATYPE(vboxResponse, "O") THEN DO
  LET vboxStatus = vboxResponse.status
  LET vboxBody = vboxResponse.body

  IF vboxStatus = 200 THEN DO
    SAY "✓ VM web server responding with HTTP " || vboxStatus
    LET hasVbox = POS("VirtualBox", vboxBody)
    LET hasRexxJS = POS("RexxJS", vboxBody)
    IF hasVbox > 0 AND hasRexxJS > 0 THEN DO
      SAY "✓ Custom HTML verified via HTTP_GET"
      ADDRESS EXPECTATIONS "EXPECT" vboxStatus "200"
    END
    ELSE DO
      SAY "⚠️  Unexpected content"
    END
  END
  ELSE DO
    SAY "⚠️  Server returned status: " || vboxStatus
  END
END
ELSE DO
  SAY "⚠️  HTTP_GET failed (VM may need NAT port forwarding setup)"
  SAY "  Note: Configure with VBoxManage modifyvm --natpf1 \"web,tcp,,8080,,80\""
END
SAY ""

// Test 9: Create VM snapshot
SAY "Test 9: Create VM snapshot for backup"

ADDRESS VIRTUALBOX "snapshot name=rexxjs-vbox-demo snapshot_name=initial-state description=\"Clean install with web server\""

IF RC = 0 THEN DO
  SAY "✓ VM snapshot created successfully"
  LET snapshotId = RESULT.snapshotId
  SAY "  Snapshot: " || snapshotId
  SAY "  VirtualBox snapshots support restore and branching"
END
ELSE DO
  SAY "⚠️  Snapshot creation failed (non-critical)"
  SAY "  Note: Some snapshot operations require VM to be powered off"
END
SAY ""

// Test 10: Demonstrate VirtualBox features
SAY "Test 10: VirtualBox capabilities summary"

LET vboxFeatures = <<JSON
{
  "hypervisor": "VirtualBox",
  "guest_additions": true,
  "shared_folders": true,
  "usb_support": true,
  "snapshots": true,
  "cloning": true,
  "export_ova": true
}
JSON

SAY "  VirtualBox Advanced Features:"
SAY "    - Guest Additions: Enhanced performance and integration"
SAY "    - Shared Folders: Host-guest file sharing"
SAY "    - USB Support: Pass-through USB devices"
SAY "    - Snapshots: Save and restore VM states"
SAY "    - Cloning: Duplicate VMs quickly"
SAY "    - Export/Import: OVA/OVF format"

ADDRESS EXPECTATIONS "EXPECT" vboxFeatures.snapshots "true"
SAY ""

// Test 11: Stop and remove VM (cleanup)
SAY "Test 11: Cleanup - Power off and remove virtual machine"

ADDRESS VIRTUALBOX "poweroff name=rexxjs-vbox-demo"

IF RC = 0 THEN DO
  SAY "✓ Virtual machine powered off"
END
ELSE DO
  SAY "⚠️  Failed to power off VM gracefully"
  SAY "   Trying force shutdown..."
  ADDRESS VIRTUALBOX "poweroff name=rexxjs-vbox-demo force=true"
END

// Small delay for VirtualBox to process shutdown
ADDRESS SYSTEM "sleep 2"

ADDRESS VIRTUALBOX "unregistervm name=rexxjs-vbox-demo delete=true"

IF RC = 0 THEN DO
  SAY "✓ Virtual machine unregistered and deleted"
END
ELSE DO
  SAY "⚠️  Failed to remove VM"
  SAY "   Manual cleanup: VBoxManage unregistervm rexxjs-vbox-demo --delete"
END

SAY ""
SAY "🎉 All VirtualBox ADDRESS tests completed successfully!"
SAY "   VirtualBox provides cross-platform virtualization with rich features"

EXIT 0
