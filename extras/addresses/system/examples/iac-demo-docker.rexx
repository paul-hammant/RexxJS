#!/usr/bin/env node src/rexx
/* SCRO Infrastructure Demo - Docker Container Script
 * 
 * This script demonstrates:
 * 1. Creating a Debian container with docker
 * 2. Deploying RexxJS binary to the docker container  
 * 3. Running a remote script that installs SQLite3 and runs tests
 * 4. Using CHECKPOINT communication for real-time progress updates
 * 
 * The remote script will CHECKPOINT back to this orchestrator with progress
 */

SAY "=== SCRO Infrastructure Demo with Docker Container ==="
SAY "Creating Debian container with docker and deploying RexxJS for SQLite testing..."
SAY ""

/* Configure the SCRO orchestrator for CHECKPOINT communication */
REQUIRE "../scro-orchestrator.js"

ADDRESS SCRO
"INITIALIZE enableProgressCallbacks=true transportType=websocket port=8080"

SAY "✓ SCRO orchestrator initialized with CHECKPOINT communication"

/* Step 1: Setup docker container with RexxJS binary */
SAY "Step 1: Setting up docker container..."

container_image = "debian:stable"
container_name = "rexx-sqlite-test-docker"
rexx_binary_path = "/home/paul/scm/rexxjs/RexxJS/rexx-linux-x64"

/* Use specific docker ADDRESS target */
ADDRESS DOCKER
"CREATE image=" || container_image || " name=" || container_name || " interactive=true"

IF RC = 0 THEN DO
    SAY "✓ Docker container created:" container_name
END
ELSE DO
    SAY "✗ Failed to create docker container"
    EXIT RC
END

/* Deploy RexxJS binary to the container */
"DEPLOY_REXX container=" || container_name || " rexx_binary=" || rexx_binary_path || " target=/usr/local/bin/rexx"

IF RC = 0 THEN DO
    SAY "✓ RexxJS binary deployed to docker container"
END
ELSE DO
    SAY "✗ Failed to deploy RexxJS binary"
    EXIT RC
END

/* Step 2: Execute remote script with CHECKPOINT progress monitoring */
SAY ""
SAY "Step 2: Executing remote SQLite3 installation and testing..."

remote_script = <<REMOTE_SCRIPT
/* Remote script that will run inside the docker container */
SAY "=== Remote Script Starting in Docker Container ==="

/* CHECKPOINT back to orchestrator */
CHECKPOINT("container_started", "Remote script started in docker container", 10)

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
"sqlite3 /tmp/test.db \"INSERT INTO test VALUES (1, 'Hello from Docker');\""
"sqlite3 /tmp/test.db 'SELECT * FROM test;'"

IF RC = 0 THEN DO
    SAY "✓ SQLite3 database operations successful"
    CHECKPOINT("test_complete", "All tests completed successfully in docker", 100)
END
ELSE DO
    SAY "✗ SQLite3 database operations failed"
    CHECKPOINT("test_failed", "Database tests failed", 100)
    EXIT RC
END

SAY "=== Remote Script Completed Successfully ==="
REMOTE_SCRIPT

/* Execute the remote script with progress monitoring */
ADDRESS SCRO
"EXECUTE_REMOTE script=" || CHR(34) || remote_script || CHR(34) || " target=" || container_name || " progress=true container_runtime=docker"

IF RC = 0 THEN DO
    SAY ""
    SAY "✓ Remote script execution completed successfully!"
    SAY "✓ SQLite3 installed and tested in docker container"
END
ELSE DO
    SAY ""
    SAY "✗ Remote script execution failed"
    EXIT RC
END

/* Step 3: Cleanup */
SAY ""
SAY "Step 3: Cleanup..."

ADDRESS DOCKER
"CLEANUP container=" || container_name

IF RC = 0 THEN DO
    SAY "✓ Docker container cleaned up"
END
ELSE DO
    SAY "⚠ Warning: Container cleanup may have failed"
END

SAY ""
SAY "=== SCRO Docker Demo Completed Successfully ==="
SAY "✓ Container created with docker"
SAY "✓ RexxJS binary deployed (50MB)"  
SAY "✓ SQLite3 installed and tested remotely"
SAY "✓ Real-time progress via CHECKPOINT"
SAY "✓ Container cleaned up"
SAY ""
SAY "This demonstrates the SCRO lightweight remote orchestration:"
SAY "- Minimal dependencies (50MB binary)"
SAY "- Bidirectional communication"
SAY "- Clean deployment/cleanup cycle"