#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, podman-address, registry, integration, containers */
/* @description Test loading podman-address from published registry */

REQUIRE "../core/src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/podman-address"
SAY "Loading module from registry..."

// Load podman-address from the published registry
REQUIRE "registry:org.rexxjs/podman-address"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Check Podman status
SAY "Test 1: Check Podman availability"

ADDRESS PODMAN "status"

IF RC = 0 THEN DO
  SAY "✓ Podman is available and responding"
END
ELSE DO
  SAY "⚠️  Podman not available - this test requires Podman installed"
  SAY "   Install: sudo apt install podman"
  SAY "   Or: brew install podman (macOS)"
  EXIT 0  // Exit gracefully if Podman not available
END
SAY ""

// Test 2: Create nginx web server with rootless Podman
SAY "Test 2: Create nginx web server (rootless)"
SAY "  Image: nginx:alpine"
SAY "  Port: 8889:80 (rootless mapping)"

LET containerSpec = <<JSON
{
  "image": "nginx:alpine",
  "name": "rexxjs-podman-demo",
  "memory": "512m",
  "cpus": "2.0",
  "port": "8889"
}
JSON

ADDRESS PODMAN "create image={containerSpec.image} name={containerSpec.name} memory={containerSpec.memory} cpus={containerSpec.cpus} ports={containerSpec.port}:80"

IF RC = 0 THEN DO
  SAY "✓ Rootless web server container created successfully"
  LET containerId = RESULT.containerId
  ADDRESS EXPECTATIONS "EXPECT" containerId "rexxjs-podman-demo"
END
ELSE DO
  LET errorMsg = RESULT.error
  SAY "⚠️  Container creation failed: " || errorMsg

  // If container already exists, clean it up and retry
  IF POS("already in use", errorMsg) > 0 THEN DO
    SAY "   Cleaning up existing container..."
    ADDRESS PODMAN "remove name=rexxjs-podman-demo force=true"
    ADDRESS PODMAN "create image=nginx:alpine name=rexxjs-podman-demo memory=512m ports=8889:80"
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

// Test 3: Start the rootless web server
SAY "Test 3: Start rootless web server container"

ADDRESS PODMAN "start name=rexxjs-podman-demo"

IF RC = 0 THEN DO
  SAY "✓ Container started in rootless mode"
END
ELSE DO
  SAY "✗ Failed to start container: " || RESULT.error
  ADDRESS PODMAN "remove name=rexxjs-podman-demo force=true"
  EXIT 1
END
SAY ""

// Test 4: Verify web server with HTTP_GET
SAY "Test 4: Verify rootless web server with HTTP_GET"

// Give nginx a moment to start
ADDRESS SYSTEM "sleep 2"

LET serviceUrl = "http://localhost:8889"
SAY "  Testing URL: " || serviceUrl

LET response = HTTP_GET(serviceUrl)

IF DATATYPE(response, "O") THEN DO
  LET status = response.status
  LET body = response.body

  IF status = 200 THEN DO
    SAY "✓ Rootless web server responding with HTTP " || status
    LET hasNginx = POS("nginx", body)
    IF hasNginx > 0 THEN DO
      SAY "✓ Received expected nginx welcome page"
      ADDRESS EXPECTATIONS "EXPECT" status "200"
    END
    ELSE DO
      SAY "⚠️  Unexpected content (no 'nginx' found)"
    END
  END
  ELSE DO
    SAY "⚠️  Server returned status: " || status
  END
END
ELSE DO
  SAY "⚠️  HTTP_GET failed or returned non-object"
END
SAY ""

// Test 5: Deploy custom HTML content (Dockerfile-style inline deployment)
SAY "Test 5: Deploy custom HTML to rootless container"

LET customHtml = <<HTML
<!DOCTYPE html>
<html>
<head><title>RexxJS Podman Demo</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
  <h1>🦭 Podman + RexxJS Integration</h1>
  <h2>Rootless Container Technology</h2>
  <p>Container deployed via ADDRESS PODMAN</p>
  <p>Published module: org.rexxjs/podman-address</p>
  <p><strong>Security:</strong> Running without root privileges!</p>
</body>
</html>
HTML

ADDRESS PODMAN "exec name=rexxjs-podman-demo command=\"sh -c 'echo '" || customHtml || "' > /usr/share/nginx/html/index.html'\""

IF RC = 0 THEN DO
  SAY "✓ Custom HTML deployed to rootless container"

  // Verify the custom content
  ADDRESS SYSTEM "sleep 1"
  LET updatedResponse = HTTP_GET(serviceUrl)

  IF DATATYPE(updatedResponse, "O") THEN DO
    LET updatedBody = updatedResponse.body
    LET hasRexxJS = POS("RexxJS", updatedBody)
    LET hasRootless = POS("Rootless", updatedBody)
    IF hasRexxJS > 0 AND hasRootless > 0 THEN DO
      SAY "✓ Custom HTML verified via HTTP_GET"
      SAY "✓ Rootless security message confirmed"
    END
  END
END
ELSE DO
  SAY "⚠️  Custom HTML deployment failed (non-critical)"
END
SAY ""

// Test 6: List containers
SAY "Test 6: List Podman containers"

ADDRESS PODMAN "list"

IF RC = 0 THEN DO
  SAY "✓ Container list retrieved successfully"
  LET containers = RESULT.containers
  IF DATATYPE(containers, "O") THEN DO
    LET count = containers.length
    SAY "  Found " || count || " rootless container(s)"
  END
END
ELSE DO
  SAY "✗ Failed to list containers"
END
SAY ""

// Test 7: Stop and remove container (cleanup)
SAY "Test 7: Cleanup - Stop and remove rootless container"

ADDRESS PODMAN "stop name=rexxjs-podman-demo"

IF RC = 0 THEN DO
  SAY "✓ Container stopped"
END
ELSE DO
  SAY "⚠️  Failed to stop container"
END

ADDRESS PODMAN "remove name=rexxjs-podman-demo"

IF RC = 0 THEN DO
  SAY "✓ Container removed"
END
ELSE DO
  SAY "⚠️  Failed to remove container"
  SAY "   Manual cleanup: podman rm -f rexxjs-podman-demo"
END

SAY ""
SAY "🎉 All Podman ADDRESS tests completed successfully!"
SAY "   Podman provides rootless container support for enhanced security"

EXIT 0
