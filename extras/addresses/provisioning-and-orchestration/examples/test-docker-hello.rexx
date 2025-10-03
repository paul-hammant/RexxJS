#!/usr/bin/env rexx
/*
 * Test local Docker with hello-world container
 *
 * Prerequisites:
 *   1. Docker installed and running
 *   2. Current user in docker group OR sudo access
 *
 * Cost: FREE (runs locally)
 */

SAY "Docker Local Hello World Test"
SAY "============================="
SAY ""

REQUIRE "../address-docker.js"

CONTAINER_NAME = 'rexxjs-test-hello'
IMAGE = 'nginx:alpine'
WEB_PORT = '8888'

/* Step 1: Check Docker status */
SAY "Step 1: Checking Docker status..."
SAY ""

ADDRESS DOCKER "status"

IF RC \= 0 THEN DO
  SAY "✗ DOCKER STATUS CHECK FAILED"
  SAY ""
  SAY "Common issues:"
  SAY "  • Docker not installed: sudo apt install docker.io"
  SAY "  • Docker service not running: sudo systemctl start docker"
  SAY "  • Permission denied: sudo usermod -aG docker $USER (requires logout)"
  SAY "  • Or use sudo: sudo ./bin/rexx " || ARG(0)
  SAY ""
  EXIT 1
END

SAY "✓ Docker is available"
SAY ""

/* Step 2: Create container */
SAY "Step 2: Creating container..."
SAY "  Container: " || CONTAINER_NAME
SAY "  Image: " || IMAGE
SAY "  Port mapping: " || WEB_PORT || ":80"
SAY ""

ADDRESS DOCKER "create image={IMAGE} name={CONTAINER_NAME} ports={WEB_PORT}:80"

IF RC \= 0 THEN DO
  SAY "✗ CREATE FAILED"
  SAY ""
  LET errorText = RESULT.error
  SAY "Error: " || errorText
  SAY ""

  /* Check if container already exists */
  IF POS('already in use', errorText) > 0 THEN DO
    SAY "Container name already in use. Cleaning up..."
    ADDRESS DOCKER "remove name={CONTAINER_NAME} force=true"
    SAY "Retrying create..."
    ADDRESS DOCKER "create image={IMAGE} name={CONTAINER_NAME}"
    IF RC \= 0 THEN DO
      SAY "✗ Retry failed"
      EXIT 1
    END
  END
  ELSE DO
    EXIT 1
  END
END

SAY "✓ Container created successfully"
SAY ""

/* Step 3: Start container */
SAY "Step 3: Starting container..."
SAY ""

ADDRESS DOCKER "start name={CONTAINER_NAME}"

IF RC \= 0 THEN DO
  SAY "✗ START FAILED"
  SAY "Error: " || RESULT.error
  SAY ""
  SAY "Cleaning up..."
  ADDRESS DOCKER "remove name={CONTAINER_NAME} force=true"
  EXIT 1
END

SAY "✓ Container started successfully"
SAY ""

/* Step 4: Test web server with HTTP_GET */
SAY "Step 4: Testing web server with HTTP_GET..."
SAY ""

/* Give nginx a moment to start */
ADDRESS SYSTEM "sleep 2"

LET serviceUrl = 'http://localhost:' || WEB_PORT

SAY "Testing URL: " || serviceUrl
SAY ""

LET response = HTTP_GET(serviceUrl)

IF DATATYPE(response, 'O') THEN DO
  LET status = response.status
  LET body = response.body
  LET hasContent = POS('nginx', body)

  IF status = 200 THEN DO
    SAY "✓ Web server responding with HTTP " || status
    IF hasContent > 0 THEN DO
      SAY "✓ Received expected nginx welcome page"
      SAY "  Body preview: " || SUBSTR(body, 1, 100) || "..."
    END
    ELSE DO
      SAY "⚠️  Unexpected content (no 'nginx' found)"
      SAY "  Body: " || SUBSTR(body, 1, 200)
    END
  END
  ELSE DO
    SAY "⚠️  Server returned status: " || status
    SAY "  Body: " || body
  END
END
ELSE DO
  SAY "⚠️  HTTP_GET failed or returned non-object"
  SAY "  Response: " || response
END

SAY ""

/* Step 5: Check container is running */
SAY "Step 5: Listing containers..."
SAY ""

ADDRESS DOCKER "list"

IF RC = 0 THEN DO
  SAY "✓ Container list retrieved"
  IF RESULT.containers \= '' THEN DO
    SAY "  Active containers: " || RESULT.containers.length
  END
END
ELSE DO
  SAY "⚠️  Could not list containers"
END

SAY ""

/* Step 6: Execute RexxJS script inside container */
SAY "Step 6: Testing RexxJS execution in container..."
SAY ""

/* First deploy RexxJS binary if we have it */
LET rexxBinary = '/usr/local/bin/rexx'
LET binaryExists = 0

/* Check if rexx binary exists locally */
ADDRESS SYSTEM "test -f {rexxBinary}"
IF RC = 0 THEN DO
  binaryExists = 1
  SAY "Found RexxJS binary at: " || rexxBinary
  SAY "Deploying to container..."

  ADDRESS DOCKER "deploy_rexx name={CONTAINER_NAME} local_binary={rexxBinary}"

  IF RC = 0 THEN DO
    SAY "✓ RexxJS binary deployed to container"
    SAY ""

    /* Execute a simple RexxJS script */
    LET testScript = 'SAY "Hello from RexxJS inside Docker!"' || '0A'x || 'SAY "Container hostname: " || ADDRESS("SYSTEM", "hostname")'

    ADDRESS DOCKER "execute_rexx name={CONTAINER_NAME} script={testScript}"

    IF RC = 0 THEN DO
      SAY "✓ RexxJS script executed in container"
      SAY "  Output: " || RESULT.output
    END
    ELSE DO
      SAY "⚠️  RexxJS execution failed"
      SAY "  Error: " || RESULT.error
    END
  END
  ELSE DO
    SAY "⚠️  Could not deploy RexxJS binary"
    SAY "  Skipping RexxJS execution test"
  END
END
ELSE DO
  SAY "⚠️  RexxJS binary not found at " || rexxBinary
  SAY "  Skipping RexxJS execution test"
END

SAY ""

/* Step 7: View container logs */
SAY "Step 7: Checking container logs..."
SAY ""

ADDRESS DOCKER "logs name={CONTAINER_NAME} lines=20"

IF RC = 0 THEN DO
  SAY "✓ Logs retrieved"
  IF RESULT.output \= '' THEN DO
    SAY "─────────────────────────────────────────"
    SAY RESULT.output
    SAY "─────────────────────────────────────────"
  END
END
ELSE DO
  SAY "⚠️  Could not retrieve logs"
END

SAY ""
SAY "========================================="
SAY "✓ Docker local test complete!"
SAY ""

/* Step 8: Clean up - stop and remove container */
SAY "Step 8: Cleaning up test container..."
SAY ""

ADDRESS DOCKER "stop name={CONTAINER_NAME}"

IF RC = 0 THEN DO
  SAY "✓ Container stopped"
END
ELSE DO
  SAY "⚠️  Could not stop container"
END

ADDRESS DOCKER "remove name={CONTAINER_NAME}"

IF RC = 0 THEN DO
  SAY "✓ Container removed"
END
ELSE DO
  SAY "⚠️  Could not remove container"
  SAY "   Manual cleanup: docker rm -f " || CONTAINER_NAME
END

SAY ""
SAY "Test complete - container created, tested, and cleaned up!"

EXIT 0
