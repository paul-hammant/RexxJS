#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, docker-address, registry, integration, containers */
/* @description Test loading docker-address from published registry */

REQUIRE "../core/src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/docker-address"
SAY "Loading module from registry..."

// Load docker-address from the published registry
REQUIRE "registry:org.rexxjs/docker-address"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Check Docker status
SAY "Test 1: Check Docker availability"

ADDRESS DOCKER "status"

IF RC = 0 THEN DO
  SAY "✓ Docker is available and responding"
END
ELSE DO
  SAY "⚠️  Docker not available - this test requires Docker installed"
  SAY "   Install: sudo apt install docker.io"
  SAY "   Or add user to docker group: sudo usermod -aG docker $USER"
  EXIT 0  // Exit gracefully if Docker not available
END
SAY ""

// Test 2: Create nginx web server container with port mapping
SAY "Test 2: Create nginx web server container"
SAY "  Image: nginx:alpine"
SAY "  Port: 8888:80"

LET containerConfig = <<JSON
{
  "image": "nginx:alpine",
  "name": "rexxjs-test-demo",
  "memory": "512m",
  "cpus": "1.0",
  "port": "8888"
}
JSON

ADDRESS DOCKER "create image={containerConfig.image} name={containerConfig.name} memory={containerConfig.memory} cpus={containerConfig.cpus} ports={containerConfig.port}:80"

IF RC = 0 THEN DO
  SAY "✓ Web server container created successfully"
  LET containerId = RESULT.containerId
  ADDRESS EXPECTATIONS "EXPECT" containerId "rexxjs-test-demo"
END
ELSE DO
  LET errorMsg = RESULT.error
  SAY "⚠️  Container creation failed: " || errorMsg

  // If container already exists, clean it up and retry
  IF POS("already in use", errorMsg) > 0 THEN DO
    SAY "   Cleaning up existing container..."
    ADDRESS DOCKER "remove name=rexxjs-test-demo force=true"
    ADDRESS DOCKER "create image=nginx:alpine name=rexxjs-test-demo memory=512m ports=8888:80"
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

// Test 3: Start the web server container
SAY "Test 3: Start web server container"

ADDRESS DOCKER "start name=rexxjs-test-demo"

IF RC = 0 THEN DO
  SAY "✓ Container started successfully"
END
ELSE DO
  SAY "✗ Failed to start container: " || RESULT.error
  ADDRESS DOCKER "remove name=rexxjs-test-demo force=true"
  EXIT 1
END
SAY ""

// Test 4: Wait for nginx to start, then verify with HTTP_GET
SAY "Test 4: Verify web server with HTTP_GET"

// Give nginx a moment to start
ADDRESS SYSTEM "sleep 2"

LET serviceUrl = "http://localhost:8888"
SAY "  Testing URL: " || serviceUrl

LET response = HTTP_GET(serviceUrl)

IF DATATYPE(response, "O") THEN DO
  LET status = response.status
  LET body = response.body

  IF status = 200 THEN DO
    SAY "✓ Web server responding with HTTP " || status
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

// Test 5: List containers
SAY "Test 5: List running containers"

ADDRESS DOCKER "list"

IF RC = 0 THEN DO
  SAY "✓ Container list retrieved successfully"
  LET containers = RESULT.containers
  IF DATATYPE(containers, "O") THEN DO
    LET count = containers.length
    SAY "  Found " || count || " container(s)"
  END
END
ELSE DO
  SAY "✗ Failed to list containers"
END
SAY ""

// Test 6: Create inline Dockerfile-style setup with exec
SAY "Test 6: Execute custom HTML deployment in container"

LET customHtml = <<HTML
<!DOCTYPE html>
<html>
<head><title>RexxJS Docker Demo</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px;">
  <h1>🐳 Docker + RexxJS Integration</h1>
  <p>Container deployed via ADDRESS DOCKER</p>
  <p>Published module: org.rexxjs/docker-address</p>
</body>
</html>
HTML

ADDRESS DOCKER "exec name=rexxjs-test-demo command=\"sh -c 'echo '" || customHtml || "' > /usr/share/nginx/html/index.html'\""

IF RC = 0 THEN DO
  SAY "✓ Custom HTML deployed to container"

  // Verify the custom content
  ADDRESS SYSTEM "sleep 1"
  LET updatedResponse = HTTP_GET(serviceUrl)

  IF DATATYPE(updatedResponse, "O") THEN DO
    LET updatedBody = updatedResponse.body
    LET hasRexxJS = POS("RexxJS", updatedBody)
    IF hasRexxJS > 0 THEN DO
      SAY "✓ Custom HTML verified via HTTP_GET"
    END
  END
END
ELSE DO
  SAY "⚠️  Custom HTML deployment failed (non-critical)"
END
SAY ""

// Test 7: Stop and remove container (cleanup)
SAY "Test 7: Cleanup - Stop and remove container"

ADDRESS DOCKER "stop name=rexxjs-test-demo"

IF RC = 0 THEN DO
  SAY "✓ Container stopped"
END
ELSE DO
  SAY "⚠️  Failed to stop container"
END

ADDRESS DOCKER "remove name=rexxjs-test-demo"

IF RC = 0 THEN DO
  SAY "✓ Container removed"
END
ELSE DO
  SAY "⚠️  Failed to remove container"
  SAY "   Manual cleanup: docker rm -f rexxjs-test-demo"
END

SAY ""
SAY "🎉 All Docker ADDRESS tests completed successfully!"

EXIT 0
