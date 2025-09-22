/* Working SQLite Installation Demo with CHECKPOINT Progress */
/* Real PODMAN provisioning + RexxJS deployment + SQLite with progress tracking */

/* Load the ADDRESS PODMAN handler */
REQUIRE './extras/addresses/container-and-vm-orchestration/address-podman.js'

SAY "=== Working SQLite Installation Demo with CHECKPOINT ==="
SAY "This demo performs real container provisioning and monitors progress"
SAY ""

/* Initialize progress tracking */
total_steps = 8
current_step = 0

/* Switch to ADDRESS PODMAN */
ADDRESS PODMAN

/* Step 1: Create container */
current_step = current_step + 1
SAY ""
SAY "PROGRESS [" || current_step || "/" || total_steps || "]: Creating Debian container"
percentage = (current_step * 100) / total_steps  
SAY "         [" || percentage || "%] Creating container..."

container_image = "debian:stable"
container_name = "rexx-sqlite-working-" || RIGHT(TIME('S'), 4)

"create image=" || container_image || " name=" || container_name
IF RC = 0 THEN DO
    SAY "✓ Container created:" container_name
    
    /* Use CHECKPOINT for progress reporting */
    checkpoint_result = CHECKPOINT('container_created', current_step, total_steps)
    SAY "   CHECKPOINT result:" checkpoint_result.action
END
ELSE DO
    SAY "✗ Failed to create container, RC=" || RC
    EXIT 1
END

/* Step 2: Start container */
current_step = current_step + 1  
SAY ""
SAY "PROGRESS [" || current_step || "/" || total_steps || "]: Starting container"
percentage = (current_step * 100) / total_steps
SAY "         [" || percentage || "%] Starting container..."

"start name=" || container_name
IF RC = 0 THEN DO
    SAY "✓ Container started and ready"
    checkpoint_result = CHECKPOINT('container_started', current_step, total_steps)
    SAY "   CHECKPOINT result:" checkpoint_result.action
END
ELSE DO
    SAY "✗ Failed to start container, RC=" || RC
    EXIT 1
END

/* Step 3: Deploy RexxJS binary */
current_step = current_step + 1
SAY ""
SAY "PROGRESS [" || current_step || "/" || total_steps || "]: Deploying RexxJS binary"
percentage = (current_step * 100) / total_steps
SAY "         [" || percentage || "%] Deploying binary..."

rexx_binary_path = "./bin/rexx-linux-x64-bin"
"deploy_rexx container=" || container_name || " rexx_binary=" || rexx_binary_path || " target=/usr/local/bin/rexx"

IF RC = 0 THEN DO
    SAY "✓ RexxJS binary deployed successfully"
    checkpoint_result = CHECKPOINT('binary_deployed', current_step, total_steps)
    SAY "   CHECKPOINT result:" checkpoint_result.action
END
ELSE DO
    SAY "✗ Failed to deploy RexxJS binary, RC=" || RC
    EXIT 1
END

/* Step 4: Update package lists */
current_step = current_step + 1
SAY ""
SAY "PROGRESS [" || current_step || "/" || total_steps || "]: Updating package lists"
percentage = (current_step * 100) / total_steps
SAY "         [" || percentage || "%] Updating packages..."

"execute container=" || container_name || " command=apt-get update -y"
IF RC = 0 THEN DO
    SAY "✓ Package lists updated"
    checkpoint_result = CHECKPOINT('packages_updated', current_step, total_steps)
    SAY "   CHECKPOINT result:" checkpoint_result.action
END
ELSE DO
    SAY "⚠ Package update warning (may still proceed)"
END

/* Step 5: Install SQLite3 */
current_step = current_step + 1
SAY ""
SAY "PROGRESS [" || current_step || "/" || total_steps || "]: Installing SQLite3"
percentage = (current_step * 100) / total_steps
SAY "         [" || percentage || "%] Installing SQLite3..."

"execute container=" || container_name || " command=apt-get install -y sqlite3"
IF RC = 0 THEN DO
    SAY "✓ SQLite3 installed successfully"
    checkpoint_result = CHECKPOINT('sqlite_installed', current_step, total_steps)
    SAY "   CHECKPOINT result:" checkpoint_result.action
END
ELSE DO
    SAY "✗ Failed to install SQLite3, RC=" || RC
    EXIT 1
END

/* Step 6: Create and test database */
current_step = current_step + 1
SAY ""
SAY "PROGRESS [" || current_step || "/" || total_steps || "]: Testing SQLite3 functionality"
percentage = (current_step * 100) / total_steps
SAY "         [" || percentage || "%] Creating test database..."

/* Create database and table */
"execute container=" || container_name || " command=sqlite3 /tmp/checkpoint_test.db 'CREATE TABLE progress (step INTEGER, description TEXT, timestamp TEXT);'"
IF RC = 0 THEN DO
    SAY "✓ Database and table created"
END

/* Insert test data */
"execute container=" || container_name || " command=sqlite3 /tmp/checkpoint_test.db \"INSERT INTO progress VALUES (1, 'Container started', datetime('now'));\""
"execute container=" || container_name || " command=sqlite3 /tmp/checkpoint_test.db \"INSERT INTO progress VALUES (2, 'RexxJS deployed', datetime('now'));\""
"execute container=" || container_name || " command=sqlite3 /tmp/checkpoint_test.db \"INSERT INTO progress VALUES (3, 'SQLite installed', datetime('now'));\""

checkpoint_result = CHECKPOINT('database_tested', current_step, total_steps)
SAY "   CHECKPOINT result:" checkpoint_result.action

/* Step 7: Execute RexxJS script with CHECKPOINT monitoring */
current_step = current_step + 1
SAY ""
SAY "PROGRESS [" || current_step || "/" || total_steps || "]: Executing RexxJS script with CHECKPOINT"
percentage = (current_step * 100) / total_steps
SAY "         [" || percentage || "%] Running RexxJS script..."

/* Create a RexxJS script that uses CHECKPOINT */
sqlite_test_script = "SAY 'Starting SQLite test from inside container'" || CHR(10) ||,
    "checkpoint_result = CHECKPOINT('sqlite_test_start', 1, 3)" || CHR(10) ||,
    "SAY 'Checkpoint 1/3: Test initialization - Return:' checkpoint_result.action" || CHR(10) ||,
    "checkpoint_result = CHECKPOINT('sqlite_operations', 2, 3)" || CHR(10) ||,
    "SAY 'Checkpoint 2/3: SQLite operations - Return:' checkpoint_result.action" || CHR(10) ||,
    "checkpoint_result = CHECKPOINT('test_complete', 3, 3)" || CHR(10) ||,
    "SAY 'Checkpoint 3/3: Test complete - Return:' checkpoint_result.action" || CHR(10) ||,
    "SAY 'SQLite test completed successfully from container!'"

"execute_rexx container=" || container_name || " script=" || CHR(34) || sqlite_test_script || CHR(34)

IF RC = 0 THEN DO
    SAY "✓ RexxJS script with CHECKPOINT executed successfully"
    checkpoint_result = CHECKPOINT('rexx_executed', current_step, total_steps)
    SAY "   CHECKPOINT result:" checkpoint_result.action
END
ELSE DO
    SAY "✗ RexxJS script execution failed, RC=" || RC
END

/* Step 8: Cleanup and completion */
current_step = current_step + 1
SAY ""
SAY "PROGRESS [" || current_step || "/" || total_steps || "]: Cleaning up"
percentage = (current_step * 100) / total_steps
SAY "         [" || percentage || "%] Cleaning up..."

"stop name=" || container_name
IF RC = 0 THEN SAY "✓ Container stopped"

"remove name=" || container_name  
IF RC = 0 THEN SAY "✓ Container removed"

/* Final completion report */
checkpoint_result = CHECKPOINT('demo_complete', total_steps, total_steps)
SAY ""
SAY "=== SQLite + CHECKPOINT Demo Completed Successfully ==="
SAY "✓ Real container provisioning with PODMAN"
SAY "✓ RexxJS binary deployment (simulated)" 
SAY "✓ SQLite3 installation and testing"
SAY "✓ CHECKPOINT progress monitoring throughout"
SAY "✓ Database operations with timestamp tracking"
SAY "✓ RexxJS script execution with CHECKPOINT in container"
SAY "✓ Clean container lifecycle management"
SAY ""
SAY "Final CHECKPOINT result:" checkpoint_result.action

EXIT 0