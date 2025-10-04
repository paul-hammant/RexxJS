/* Infrastructure Demo - ADDRESS PODMAN with Binary Deployment and SQLite3 */

/* Load the ADDRESS PODMAN handler */
REQUIRE './extras/addresses/provisioning-and-orchestration/address-podman.js'

SAY "=== Infrastructure Demo with ADDRESS PODMAN ==="
SAY "Creating Debian container with PODMAN and deploying RexxJS for SQLite testing..."
SAY ""

/* Switch to ADDRESS PODMAN */
ADDRESS PODMAN

/* Step 1: Create and start container */
SAY "Step 1: Creating Debian container..."
container_image = "debian:stable"
container_name = "rexx-sqlite-test"

"create image=" || container_image || " name=" || container_name
IF RC = 0 THEN DO
    SAY "✓ Container created:" container_name
END
ELSE DO
    SAY "✗ Failed to create container"
    EXIT RC
END

SAY ""
SAY "Starting container..."
"start name=" || container_name
IF RC = 0 THEN DO
    SAY "✓ Container started:" container_name
END
ELSE DO
    SAY "✗ Failed to start container"
    EXIT RC
END

/* Step 2: Deploy RexxJS binary */
SAY ""
SAY "Step 2: Deploying RexxJS binary to container..."
rexx_binary_path = "./bin/rexx-linux-x64-bin"  /* Using bin directory binary */

"deploy_rexx container=" || container_name || " rexx_binary=" || rexx_binary_path || " target=/usr/local/bin/rexx"

IF RC = 0 THEN DO
    SAY "✓ RexxJS binary deployed to container"
    SAY "   Binary:" PODMAN_BINARY
    SAY "   Target:" PODMAN_TARGET
END
ELSE DO
    SAY "✗ Failed to deploy RexxJS binary"
    SAY "   Error:" RESULT
    EXIT RC
END

/* Step 3: Install SQLite3 in container */
SAY ""
SAY "Step 3: Installing SQLite3 in container..."

"execute container=" || container_name || " command=apt-get update"
IF RC = 0 THEN DO
    SAY "✓ Package list updated"
END
ELSE DO
    SAY "⚠ Package update may have failed"
END

"execute container=" || container_name || " command=apt-get install -y sqlite3"
IF RC = 0 THEN DO
    SAY "✓ SQLite3 installed successfully"
    SAY "   Command output:" PODMAN_STDOUT
END
ELSE DO
    SAY "✗ Failed to install SQLite3"
    SAY "   Error:" PODMAN_STDERR
    EXIT RC
END

/* Step 4: Test SQLite3 functionality */
SAY ""
SAY "Step 4: Testing SQLite3 functionality..."

"execute container=" || container_name || " command=sqlite3 /tmp/test.db 'CREATE TABLE test (id INTEGER, name TEXT);'"
IF RC = 0 THEN DO
    SAY "✓ Database table created"
END
ELSE DO
    SAY "✗ Failed to create database table"
    EXIT RC
END

"execute container=" || container_name || " command=sqlite3 /tmp/test.db \"INSERT INTO test VALUES (1, 'Hello from PODMAN');\""
IF RC = 0 THEN DO
    SAY "✓ Data inserted into database"
END
ELSE DO
    SAY "✗ Failed to insert data"
    EXIT RC
END

"execute container=" || container_name || " command=sqlite3 /tmp/test.db 'SELECT * FROM test;'"
IF RC = 0 THEN DO
    SAY "✓ Database query successful"
    SAY "   Query result:" PODMAN_STDOUT
END
ELSE DO
    SAY "✗ Database query failed"
    EXIT RC
END

/* Step 5: Execute RexxJS script in container */
SAY ""
SAY "Step 5: Testing RexxJS execution in container..."

remote_script = "SAY 'Hello from RexxJS inside container!';" || CHR(10) || "SAY 'Container name: " || container_name || "';" || CHR(10) || "SAY 'Testing complete!'"

"execute_rexx container=" || container_name || " script=" || CHR(34) || remote_script || CHR(34)

IF RC = 0 THEN DO
    SAY "✓ RexxJS script executed successfully"
    SAY "   Script output:" PODMAN_STDOUT
END
ELSE DO
    SAY "✗ RexxJS script execution failed"
    SAY "   Error:" PODMAN_STDERR
    EXIT RC
END

/* Step 6: Final status and cleanup */
SAY ""
SAY "Step 6: Final status and cleanup..."

"status"
SAY "Current status:" RESULT

SAY ""
SAY "Stopping container..."
"stop name=" || container_name
IF RC = 0 THEN DO
    SAY "✓ Container stopped"
END

SAY ""
SAY "Removing container..."
"remove name=" || container_name
IF RC = 0 THEN DO
    SAY "✓ Container removed"
END

SAY ""
SAY "=== Infrastructure Demo Completed Successfully ==="
SAY "✓ Container created and started"
SAY "✓ RexxJS binary deployed (simulated)"  
SAY "✓ SQLite3 installed and tested"
SAY "✓ RexxJS script executed remotely"
SAY "✓ Clean deployment/cleanup cycle"
SAY ""
SAY "This demonstrates lightweight container orchestration:"
SAY "- Container lifecycle management"
SAY "- Binary deployment simulation"  
SAY "- Remote command execution"
SAY "- Database operations testing"
SAY "- RexxJS remote script execution"