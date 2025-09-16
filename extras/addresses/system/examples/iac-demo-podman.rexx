#!/usr/bin/env node src/rexx
/* Infrastructure Demo - Podman Container Script
 * 
 * This script demonstrates:
 * 1. Creating a Debian container with podman
 * 2. Deploying RexxJS binary to the podman container  
 * 3. Running a remote script that installs SQLite3 and runs tests
 * 4. Using CHECKPOINT communication for real-time progress updates
 * 
 * The remote script will CHECKPOINT back to this orchestrator with progress
 */

SAY "=== Infrastructure Demo with Podman Container ==="
SAY "Creating Debian container with podman and deploying RexxJS for SQLite testing..."
SAY ""

/* Configure the deployment orchestrator for CHECKPOINT communication */
REQUIRE "../deployment-orchestrator.js"

ADDRESS DEPLOYMENT
"INITIALIZE enableProgressCallbacks=true transportType=websocket port=8080"

SAY "✓ Deployment orchestrator initialized with CHECKPOINT communication"

/* Step 1: Setup podman container with RexxJS binary */
SAY "Step 1: Setting up podman container..."

container_image = "debian:stable"
container_name = "rexx-sqlite-test-podman"
rexx_binary_path = "/home/paul/scm/rexxjs/RexxJS/rexx-linux-x64"

/* Use specific podman ADDRESS target */
ADDRESS PODMAN
"CREATE image=" || container_image || " name=" || container_name || " interactive=true"

IF RC = 0 THEN DO
    SAY "✓ Podman container created:" container_name
END
ELSE DO
    SAY "✗ Failed to create podman container"
    EXIT RC
END

/* Deploy RexxJS binary to the container */
"DEPLOY_REXX container=" || container_name || " rexx_binary=" || rexx_binary_path || " target=/usr/local/bin/rexx"

IF RC = 0 THEN DO
    SAY "✓ RexxJS binary deployed to podman container"
END
ELSE DO
    SAY "✗ Failed to deploy RexxJS binary"
    EXIT RC
END

/* Step 2: Execute remote script with CHECKPOINT progress monitoring */
SAY ""
SAY "Step 2: Executing remote SQLite3 installation and testing..."

remote_script = <<REMOTE_SCRIPT
/* Remote script that will run inside the podman container */
SAY "=== Remote Script Starting in Podman Container ==="

/* CHECKPOINT back to orchestrator */
CHECKPOINT("container_started", "Remote script started in podman container", 10)

/* Install SQLite3 */
SAY "Installing SQLite3..."
CHECKPOINT("installing_sqlite", "Installing SQLite3 package", 20)

ADDRESS SYSTEM
"apt-get update > /dev/null 2>&1"
"apt-get install -y sqlite3 > /dev/null 2>&1"

IF RC = 0 THEN DO
    SAY "✓ SQLite3 installed successfully"
    CHECKPOINT("sqlite_installed", "SQLite3 package installed", 50)
END
ELSE DO
    SAY "✗ Failed to install SQLite3"
    CHECKPOINT("sqlite_failed", "SQLite3 installation failed", 50)
    EXIT RC
END

/* Test SQLite3 functionality */
SAY "Testing SQLite3 functionality..."
CHECKPOINT("testing_sqlite", "Testing SQLite3 database operations", 70)

/* Create a test database and run some operations */
"sqlite3 /tmp/test.db 'CREATE TABLE test (id INTEGER, name TEXT);'"
"sqlite3 /tmp/test.db \"INSERT INTO test VALUES (1, 'Hello from Podman');\""
"sqlite3 /tmp/test.db 'SELECT * FROM test;'"

IF RC = 0 THEN DO
    SAY "✓ SQLite3 database operations successful"
    CHECKPOINT("test_complete", "All tests completed successfully in podman", 100)
END
ELSE DO
    SAY "✗ SQLite3 database operations failed"
    CHECKPOINT("test_failed", "Database tests failed", 100)
    EXIT RC
END

SAY "=== Remote Script Completed Successfully ==="
REMOTE_SCRIPT

/* Execute the remote script with progress monitoring */
ADDRESS DEPLOYMENT
"EXECUTE_REMOTE script=" || CHR(34) || remote_script || CHR(34) || " target=" || container_name || " progress=true container_runtime=podman"

IF RC = 0 THEN DO
    SAY ""
    SAY "✓ Remote script execution completed successfully!"
    SAY "✓ SQLite3 installed and tested in podman container"
END
ELSE DO
    SAY ""
    SAY "✗ Remote script execution failed"
    EXIT RC
END

/* Step 3: Cleanup */
SAY ""
SAY "Step 3: Cleanup..."

ADDRESS PODMAN
"CLEANUP container=" || container_name

IF RC = 0 THEN DO
    SAY "✓ Podman container cleaned up"
END
ELSE DO
    SAY "⚠ Warning: Container cleanup may have failed"
END

SAY ""
SAY "=== SCRO Podman Demo Completed Successfully ==="
SAY "✓ Container created with podman"
SAY "✓ RexxJS binary deployed (50MB)"  
SAY "✓ SQLite3 installed and tested remotely"
SAY "✓ Real-time progress via CHECKPOINT"
SAY "✓ Container cleaned up"
SAY ""
SAY "This demonstrates the SCRO lightweight remote orchestration:"
SAY "- Minimal dependencies (50MB binary)"
SAY "- Bidirectional communication"
SAY "- Clean deployment/cleanup cycle"