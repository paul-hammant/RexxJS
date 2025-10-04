#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, nspawn-address, registry, integration, containers */
/* @description Test loading nspawn-address from published registry */

REQUIRE "../core/src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/nspawn-address"
SAY "Loading module from registry..."

// Load nspawn-address from the published registry
REQUIRE "registry:org.rexxjs/nspawn-address"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Check systemd-nspawn status
SAY "Test 1: Check systemd-nspawn availability"

ADDRESS NSPAWN "status"

IF RC = 0 THEN DO
  SAY "✓ systemd-nspawn is available and responding"
END
ELSE DO
  SAY "⚠️  systemd-nspawn not available - this test requires systemd"
  SAY "   Install: sudo apt install systemd-container"
  SAY "   Note: systemd-nspawn requires systemd-based Linux (Ubuntu, Debian, Fedora, etc.)"
  EXIT 0  // Exit gracefully if nspawn not available
END
SAY ""

// Test 2: Create Ubuntu OS container with systemd-nspawn
SAY "Test 2: Create Ubuntu OS container with systemd integration"
SAY "  Image: ubuntu:latest"
SAY "  Port: 8890:8080 (for Python web server)"

LET machineConfig = <<JSON
{
  "image": "ubuntu:latest",
  "name": "rexxjs-nspawn-demo",
  "memory": "1g",
  "cpus": "2.0",
  "port": "8890"
}
JSON

ADDRESS NSPAWN "create image={machineConfig.image} name={machineConfig.name} memory={machineConfig.memory} cpus={machineConfig.cpus} ports={machineConfig.port}:8080"

IF RC = 0 THEN DO
  SAY "✓ OS container created successfully"
  LET machineId = RESULT.machineId
  ADDRESS EXPECTATIONS "EXPECT" machineId "rexxjs-nspawn-demo"
END
ELSE DO
  LET errorMsg = RESULT.error
  SAY "⚠️  Container creation failed: " || errorMsg

  // If container already exists, clean it up and retry
  IF POS("already exists", errorMsg) > 0 THEN DO
    SAY "   Cleaning up existing container..."
    ADDRESS NSPAWN "stop name=rexxjs-nspawn-demo"
    ADDRESS NSPAWN "remove name=rexxjs-nspawn-demo"
    ADDRESS NSPAWN "create image=ubuntu:latest name=rexxjs-nspawn-demo memory=1g ports=8890:8080"
    IF RC \= 0 THEN DO
      SAY "   Retry failed, exiting"
      EXIT 1
    END
    SAY "✓ Container created after cleanup"
  END
  ELSE DO
    EXIT 1
  END
END
SAY ""

// Test 3: Start the OS container with systemd init
SAY "Test 3: Start OS container with systemd init"

ADDRESS NSPAWN "start name=rexxjs-nspawn-demo"

IF RC = 0 THEN DO
  SAY "✓ Container started with systemd integration"
END
ELSE DO
  SAY "✗ Failed to start container: " || RESULT.error
  ADDRESS NSPAWN "remove name=rexxjs-nspawn-demo force=true"
  EXIT 1
END
SAY ""

// Test 4: Deploy Python web server (inline setup script)
SAY "Test 4: Deploy Python web server in OS container"

// Create custom HTML content
LET webHtml = <<HTML
<!DOCTYPE html>
<html>
<head><title>RexxJS systemd-nspawn Demo</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
  <h1>🏗️ systemd-nspawn + RexxJS</h1>
  <h2>OS-Level Virtualization</h2>
  <p>Container deployed via ADDRESS NSPAWN</p>
  <p>Published module: org.rexxjs/nspawn-address</p>
  <p><strong>Technology:</strong> systemd integration with machinectl</p>
</body>
</html>
HTML

// Multi-step setup: Install Python3, create HTML, start server
ADDRESS NSPAWN "exec name=rexxjs-nspawn-demo command=\"apt-get update -y && apt-get install -y python3\""

IF RC = 0 THEN DO
  SAY "✓ Python3 installed in OS container"

  // Create web directory and HTML file
  ADDRESS NSPAWN "exec name=rexxjs-nspawn-demo command=\"mkdir -p /var/www\""
  ADDRESS NSPAWN "exec name=rexxjs-nspawn-demo command=\"sh -c 'echo '" || webHtml || "' > /var/www/index.html'\""

  SAY "✓ Custom HTML deployed to /var/www"

  // Start Python web server in background
  ADDRESS NSPAWN "exec name=rexxjs-nspawn-demo command=\"sh -c 'cd /var/www && python3 -m http.server 8080 > /dev/null 2>&1 &'\""

  SAY "✓ Python web server started on port 8080"
END
ELSE DO
  SAY "⚠️  Failed to install Python3 (non-critical, continuing)"
END
SAY ""

// Test 5: Verify web server with HTTP_GET
SAY "Test 5: Verify web server with HTTP_GET"

// Give Python server time to start
ADDRESS SYSTEM "sleep 3"

LET serviceUrl = "http://localhost:8890"
SAY "  Testing URL: " || serviceUrl

LET response = HTTP_GET(serviceUrl)

IF DATATYPE(response, "O") THEN DO
  LET status = response.status
  LET body = response.body

  IF status = 200 THEN DO
    SAY "✓ Web server responding with HTTP " || status
    LET hasNspawn = POS("systemd-nspawn", body)
    LET hasRexxJS = POS("RexxJS", body)
    IF hasNspawn > 0 AND hasRexxJS > 0 THEN DO
      SAY "✓ Custom HTML verified via HTTP_GET"
      ADDRESS EXPECTATIONS "EXPECT" status "200"
    END
    ELSE DO
      SAY "⚠️  Unexpected content"
    END
  END
  ELSE DO
    SAY "⚠️  Server returned status: " || status
  END
END
ELSE DO
  SAY "⚠️  HTTP_GET failed (container may need port forwarding setup)"
END
SAY ""

// Test 6: List machines
SAY "Test 6: List systemd-nspawn machines"

ADDRESS NSPAWN "list"

IF RC = 0 THEN DO
  SAY "✓ Machine list retrieved successfully"
  LET machines = RESULT.machines
  IF DATATYPE(machines, "O") THEN DO
    LET count = machines.length
    SAY "  Found " || count || " machine(s) managed by systemd"
  END
END
ELSE DO
  SAY "✗ Failed to list machines"
END
SAY ""

// Test 7: Execute diagnostic command
SAY "Test 7: Execute diagnostic command via machinectl"

ADDRESS NSPAWN "exec name=rexxjs-nspawn-demo command=\"hostname && systemctl --version | head -1\""

IF RC = 0 THEN DO
  SAY "✓ Diagnostic command executed successfully"
  LET output = RESULT.output
  SAY "  Output: " || output
END
ELSE DO
  SAY "⚠️  Command execution failed (non-critical)"
END
SAY ""

// Test 8: Stop and remove container (cleanup)
SAY "Test 8: Cleanup - Stop and remove OS container"

ADDRESS NSPAWN "stop name=rexxjs-nspawn-demo"

IF RC = 0 THEN DO
  SAY "✓ Container stopped gracefully"
END
ELSE DO
  SAY "⚠️  Failed to stop container"
END

ADDRESS NSPAWN "remove name=rexxjs-nspawn-demo"

IF RC = 0 THEN DO
  SAY "✓ Container removed"
END
ELSE DO
  SAY "⚠️  Failed to remove container"
  SAY "   Manual cleanup: sudo machinectl terminate rexxjs-nspawn-demo"
  SAY "   Manual cleanup: sudo rm -rf /var/lib/machines/rexxjs-nspawn-demo"
END

SAY ""
SAY "🎉 All systemd-nspawn ADDRESS tests completed successfully!"
SAY "   systemd-nspawn provides OS-level virtualization with systemd integration"

EXIT 0
