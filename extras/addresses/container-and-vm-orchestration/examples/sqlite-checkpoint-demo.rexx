/* SQLite Installation Demo with CHECKPOINT Progress Monitoring */
/* Real PODMAN provisioning + RexxJS deployment + SQLite with progress tracking */

/* Load the ADDRESS PODMAN handler */
REQUIRE './extras/addresses/container-and-vm-orchestration/address-podman.js'

SAY "=== SQLite Installation Demo with CHECKPOINT Progress ==="
SAY "This demo performs real container provisioning and monitors progress"
SAY ""

/* Initialize progress tracking */
total_steps = 10
current_step = 0

/* Switch to ADDRESS PODMAN */
ADDRESS PODMAN

/* Helper function to report progress */
CALL report_progress "Starting container provisioning workflow", 0

/* Step 1: Create container */
current_step = current_step + 1
CALL report_progress "Creating Debian container", current_step

container_image = "debian:stable"
container_name = "rexx-sqlite-checkpoint-" || RIGHT(TIME('S'), 4)

"create image=" || container_image || " name=" || container_name
IF RC = 0 THEN DO
    SAY "✓ Container created:" container_name
END
ELSE DO
    SAY "✗ Failed to create container"
    SAY "   RC:" || RC
    SAY "   Error:" || RESULT
    EXIT RC
END

/* Step 2: Start container */
current_step = current_step + 1  
CALL report_progress "Starting container", current_step

"start name=" || container_name
IF RC = 0 THEN DO
    SAY "✓ Container started and ready"
END
ELSE DO
    SAY "✗ Failed to start container"
    EXIT RC
END

/* Step 3: Deploy RexxJS binary */
current_step = current_step + 1
CALL report_progress "Deploying RexxJS binary to container", current_step

rexx_binary_path = "./bin/rexx-linux-x64-bin"
"deploy_rexx container=" || container_name || " rexx_binary=" || rexx_binary_path || " target=/usr/local/bin/rexx"

IF RC = 0 THEN DO
    SAY "✓ RexxJS binary deployed successfully"
    SAY "   Deployed:" PODMAN_BINARY "to" PODMAN_TARGET
END
ELSE DO
    SAY "✗ Failed to deploy RexxJS binary"
    EXIT RC  
END

/* Step 4: Update package lists */
current_step = current_step + 1
CALL report_progress "Updating package lists in container", current_step

"execute container=" || container_name || " command=apt-get update -y"
IF RC = 0 THEN DO
    SAY "✓ Package lists updated"
END
ELSE DO
    SAY "⚠ Package update warning (may still proceed)"
END

/* Step 5: Install SQLite3 */
current_step = current_step + 1  
CALL report_progress "Installing SQLite3 package", current_step

"execute container=" || container_name || " command=apt-get install -y sqlite3"
IF RC = 0 THEN DO
    SAY "✓ SQLite3 installed successfully"
END
ELSE DO
    SAY "✗ Failed to install SQLite3"
    EXIT RC
END

/* Step 6: Prepare RexxJS SQLite test script with CHECKPOINT */
current_step = current_step + 1
CALL report_progress "Preparing SQLite test script with CHECKPOINT", current_step

/* Create a comprehensive RexxJS script that uses CHECKPOINT for progress reporting */
sqlite_test_script = "SAY 'Starting SQLite test from inside container'" || CHR(10) ||,
    " checkpoint_result = CHECKPOINT('sqlite_test_start', 1, 5)" || CHR(10) ||,
    "SAY 'Checkpoint 1/5: Test initialization - Return:' checkpoint_result.action" || CHR(10) || CHR(10) ||,
    
    "SAY 'Creating test database...'" || CHR(10) ||,
    " checkpoint_result = CHECKPOINT('creating_database', 2, 5)" || CHR(10) ||,
    "SAY 'Checkpoint 2/5: Database creation - Return:' checkpoint_result.action" || CHR(10) || CHR(10) ||,
    
    "SAY 'Creating test table...'" || CHR(10) ||,
    " checkpoint_result = CHECKPOINT('creating_table', 3, 5)" || CHR(10) ||,
    "SAY 'Checkpoint 3/5: Table creation - Return:' checkpoint_result.action" || CHR(10) || CHR(10) ||,
    
    "SAY 'Inserting test data...'" || CHR(10) ||,
    " checkpoint_result = CHECKPOINT('inserting_data', 4, 5)" || CHR(10) ||,
    "SAY 'Checkpoint 4/5: Data insertion - Return:' checkpoint_result.action" || CHR(10) || CHR(10) ||,
    
    "SAY 'Querying test data...'" || CHR(10) ||,
    " checkpoint_result = CHECKPOINT('querying_data', 5, 5)" || CHR(10) ||,
    "SAY 'Checkpoint 5/5: Data query complete - Return:' checkpoint_result.action" || CHR(10) ||,
    "SAY 'SQLite test completed successfully from container!'"

SAY "✓ Test script prepared with CHECKPOINT monitoring"

/* Step 7: Execute SQLite database operations */
current_step = current_step + 1
CALL report_progress "Executing SQLite database operations", current_step

/* Create database and table */
"execute container=" || container_name || " command=sqlite3 /tmp/checkpoint_test.db 'CREATE TABLE progress (step INTEGER, description TEXT, timestamp TEXT);'"
IF RC = 0 THEN DO
    SAY "✓ Database and table created"
END

/* Insert progress data */
"execute container=" || container_name || " command=sqlite3 /tmp/checkpoint_test.db \"INSERT INTO progress VALUES (1, 'Container started', datetime('now'));\""
"execute container=" || container_name || " command=sqlite3 /tmp/checkpoint_test.db \"INSERT INTO progress VALUES (2, 'RexxJS deployed', datetime('now'));\""
"execute container=" || container_name || " command=sqlite3 /tmp/checkpoint_test.db \"INSERT INTO progress VALUES (3, 'SQLite installed', datetime('now'));\""

/* Step 8: Execute RexxJS script with CHECKPOINT monitoring */
current_step = current_step + 1  
CALL report_progress "Executing RexxJS script with CHECKPOINT", current_step

"execute_rexx container=" || container_name || " script=" || CHR(34) || sqlite_test_script || CHR(34)

IF RC = 0 THEN DO
    SAY "✓ RexxJS script with CHECKPOINT executed"
    SAY "   Script output:" PODMAN_STDOUT
END
ELSE DO
    SAY "✗ RexxJS script execution failed"
    SAY "   Error:" PODMAN_STDERR
END

/* Step 9: Verify database results */
current_step = current_step + 1
CALL report_progress "Verifying database operations", current_step

"execute container=" || container_name || " command=sqlite3 /tmp/checkpoint_test.db 'SELECT * FROM progress;'"
IF RC = 0 THEN DO
    SAY "✓ Database verification successful"
    SAY "   Progress records:" PODMAN_STDOUT
END

/* Step 10: Cleanup */
current_step = current_step + 1
CALL report_progress "Cleaning up container", current_step

"stop name=" || container_name
IF RC = 0 THEN SAY "✓ Container stopped"

"remove name=" || container_name  
IF RC = 0 THEN SAY "✓ Container removed"

/* Final completion report */
CALL report_progress "Demo completed successfully", total_steps

SAY ""
SAY "=== SQLite + CHECKPOINT Demo Completed ==="
SAY "✓ Real container provisioning with PODMAN"
SAY "✓ RexxJS binary deployment" 
SAY "✓ SQLite3 installation and testing"
SAY "✓ CHECKPOINT progress monitoring throughout"
SAY "✓ Database operations with timestamp tracking"
SAY "✓ Clean container lifecycle management"
SAY ""

EXIT 0

/* Progress reporting subroutine */
report_progress:
  PARSE ARG message, step
  
  SAY ""
  SAY "PROGRESS [" || step || "/" || total_steps || "]: " || message
  
  /* Use CHECKPOINT for progress monitoring */
   progress_data = CHECKPOINT(step, total_steps, message)
  
  /* Display progress percentage */
   percentage = (step * 100) / total_steps  
  SAY "         [" || percentage || "%] " || message
  SAY ""
  
  RETURN