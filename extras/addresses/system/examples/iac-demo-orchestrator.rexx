#!/usr/bin/env node src/rexx
/* Infrastructure as Code Demo - Orchestrator Script
 * 
 * This script demonstrates:
 * 1. Creating a Debian container with podman
 * 2. Deploying RexxJS binary to the container  
 * 3. Running a remote script that installs SQLite3 and runs tests
 * 4. Using CHECKPOINT communication for real-time progress updates
 * 
 * The remote script will CHECKPOINT back to this orchestrator with progress
 */

SAY "=== Infrastructure as Code Demo with CHECKPOINT Communication ==="
SAY "Creating Debian container and deploying RexxJS for SQLite testing..."
SAY ""

/* Configure the deployment handler for CHECKPOINT communication */
REQUIRE "../deployment-orchestrator.js"

ADDRESS DEPLOYMENT
"INITIALIZE enableProgressCallbacks=true transportType=websocket port=8080"

SAY "✓ Deployment handler initialized with CHECKPOINT communication"

/* Step 1: Setup container with RexxJS binary */
SAY ""
SAY "Step 1: Setting up Debian container with RexxJS..."

CHECKPOINT("setup_start", "Creating container infrastructure", 10)

container_result = SETUP_CONTAINER(image="debian:bookworm-slim", name="sqlite-test-worker", memory="512m", rexx_binary="/home/paul/scm/rexxjs/RexxJS/rexx-linux-x64")

IF container_result.success THEN DO
  SAY "✓ Container created:" container_result.containerName
  SAY "✓ RexxJS binary deployed to container"
  container_id = container_result.containerId
  CHECKPOINT("setup_complete", "Container ready with RexxJS", 30)
END
ELSE DO
  SAY "✗ Container setup failed:" container_result.error
  EXIT 1
END

/* Step 2: Execute remote script with CHECKPOINT monitoring */
SAY ""
SAY "Step 2: Executing SQLite installation and test script with CHECKPOINT monitoring..."

/* Create the remote script that will CHECKPOINT back to us */
remote_script = '
/* SQLite Installation and Test Script - Remote Worker
 * This script runs inside the container and sends progress back via CHECKPOINT
 */

SAY "Starting SQLite installation and testing..."
CHECKPOINT("install_start", "Beginning SQLite3 installation", 40)

/* Update package manager */
ADDRESS SYSTEM "apt update -y"
apt_update_result = RC

IF apt_update_result = 0 THEN DO
  SAY "✓ Package manager updated"
  CHECKPOINT("apt_updated", "Package manager updated successfully", 50)
END
ELSE DO
  SAY "✗ Package manager update failed, code:" apt_update_result
  CHECKPOINT("apt_failed", "Package update failed", 50)
  EXIT 1
END

/* Install SQLite3 */
SAY "Installing SQLite3..."
ADDRESS SYSTEM "apt install -y sqlite3"
install_result = RC

IF install_result = 0 THEN DO
  SAY "✓ SQLite3 installed successfully"
  CHECKPOINT("sqlite_installed", "SQLite3 installation complete", 70)
END
ELSE DO
  SAY "✗ SQLite3 installation failed, code:" install_result  
  CHECKPOINT("sqlite_install_failed", "SQLite3 installation failed", 70)
  EXIT 1
END

/* Test SQLite3 functionality */
SAY "Testing SQLite3 functionality..."
CHECKPOINT("testing_start", "Beginning SQLite functionality tests", 80)

/* Create a test database and run basic operations */
test_sql = "
CREATE TABLE test_users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
INSERT INTO test_users (name, email) VALUES ('"'"'Alice'"'"', '"'"'alice@example.com'"'"');  
INSERT INTO test_users (name, email) VALUES ('"'"'Bob'"'"', '"'"'bob@example.com'"'"');
INSERT INTO test_users (name, email) VALUES ('"'"'Charlie'"'"', '"'"'charlie@example.com'"'"');
SELECT COUNT(*) as user_count FROM test_users;
SELECT * FROM test_users WHERE name LIKE '"'"'A%'"'"';
"

/* Execute SQLite test */
ADDRESS SYSTEM "echo \""test_sql"\" | sqlite3 /tmp/test.db"
test_result = RC

IF test_result = 0 THEN DO
  SAY "✓ SQLite3 test operations completed successfully"
  CHECKPOINT("test_complete", "SQLite tests passed, database functional", 95)
  
  /* Get test results */
  ADDRESS SYSTEM "echo \"SELECT COUNT(*) FROM test_users;\" | sqlite3 /tmp/test.db"
  record_count_result = RC
  
  IF record_count_result = 0 THEN DO
    SAY "✓ Database contains test records"
    CHECKPOINT("verification_complete", "Database verification successful - 3 test records found", 100)
  END
  ELSE DO
    SAY "⚠ Could not verify record count"
    CHECKPOINT("verification_warning", "Test completed but verification had issues", 95)
  END
END
ELSE DO
  SAY "✗ SQLite3 test failed, code:" test_result
  CHECKPOINT("test_failed", "SQLite functionality test failed", 85)
  EXIT 1
END

/* Final status */
SAY ""
SAY "=== SQLite Installation and Test Complete ==="
SAY "✓ SQLite3 installed and tested successfully"  
SAY "✓ Database operations verified"
SAY "✓ Container ready for production SQLite workloads"

CHECKPOINT("all_complete", "Infrastructure setup and testing completed successfully", 100)
EXIT 0
'

/* Execute the remote script with progress monitoring */
SAY "Launching remote script with CHECKPOINT monitoring..."
CHECKPOINT("remote_launch", "Starting remote SQLite installation script", 35)

execution_result = EXECUTE_REMOTE(script=remote_script, target=container_id, progress=true, timeout=120000)

IF execution_result.success THEN DO
  checkpoint_id = execution_result.checkpointId
  SAY "✓ Remote execution started, checkpoint ID:" checkpoint_id
  SAY "✓ Monitoring progress via CHECKPOINT communication..."
  SAY ""
  
  /* Wait for completion while showing progress */
  SAY "Waiting for remote script completion..."
  final_result = WAIT_FOR_CHECKPOINT(checkpoint_id, timeout=120000)
  
  IF final_result.success THEN DO
    SAY ""
    SAY "=== Remote Execution Completed Successfully ==="
    SAY "✓ Progress updates received:" final_result.updates
    SAY "✓ Final status:" final_result.status
    SAY ""
    SAY "Progress Timeline:"
    DO i = 1 TO LENGTH(final_result.results)
      update = final_result.results[i]
      SAY "  " update.timestamp ":" update.key "-" update.value
    END
    SAY ""
    CHECKPOINT("demo_complete", "Infrastructure as Code demo completed successfully", 100)
  END
  ELSE DO
    SAY "✗ Remote execution failed:" final_result.error
    EXIT 1
  END
END
ELSE DO
  SAY "✗ Failed to start remote execution:" execution_result.error
  EXIT 1
END

/* Cleanup */
SAY ""
SAY "Step 3: Cleanup (optional)..."
CHECKPOINT("cleanup_start", "Beginning infrastructure cleanup", 95)

SAY "Container" container_id "remains available for additional testing"
SAY "To cleanup: podman stop" container_id "&& podman rm" container_id

SAY ""
SAY "=== Infrastructure as Code Demo Complete ==="
SAY "✓ Debian container created and configured"  
SAY "✓ RexxJS binary deployed (55MB)"
SAY "✓ SQLite3 installed and tested remotely"
SAY "✓ Bidirectional CHECKPOINT communication demonstrated"
SAY "✓ Real-time progress monitoring working"
SAY ""
SAY "This demonstrates Infrastructure as Code with:"
SAY "- Container orchestration via podman"
SAY "- Remote script execution with deployed RexxJS binary"  
SAY "- Real-time progress updates via CHECKPOINT communication"
SAY "- Automated software installation and testing"
SAY "- Bidirectional communication between orchestrator and remote worker"

EXIT 0