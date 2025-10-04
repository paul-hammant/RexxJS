#!/usr/bin/env rexx
/* Test Compute Engine Instance Lifecycle
 *
 * This script demonstrates creating, managing, and cleaning up
 * Google Compute Engine VM instances using RexxJS.
 *
 * Required APIs:
 *   - compute.googleapis.com
 *
 * Required Permissions:
 *   - compute.instances.create
 *   - compute.instances.delete
 *   - compute.instances.get
 *   - compute.instances.list
 *   - compute.instances.start
 *   - compute.instances.stop
 *   - compute.instances.reset
 */

SAY "=== Compute Engine Lifecycle Test ==="
SAY ""

/* Configuration */
LET instance_name = "rexxjs-test-vm-" || WORD(DATE('S'), 1) || "-" || TIME('S')
LET zone = "us-central1-a"
LET machine_type = "e2-micro"  /* Free tier eligible */
LET image = "debian-11"

SAY "Test instance: " || instance_name
SAY "Zone: " || zone
SAY ""

/* ========================================
 * Step 1: List existing instances
 * ======================================== */
SAY "Step 1: Listing existing instances in zone..."
ADDRESS GCP "COMPUTE LIST zone=" || zone

SAY ""

/* ========================================
 * Step 2: Create a new instance
 * ======================================== */
SAY "Step 2: Creating new instance..."
SAY "  Name: " || instance_name
SAY "  Machine: " || machine_type
SAY "  Image: " || image
SAY ""

ADDRESS GCP "COMPUTE CREATE " || instance_name || " machine=" || machine_type || " zone=" || zone || " image=" || image || " disk=10"

IF RC = 0 THEN DO
  SAY "✓ Instance created successfully"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create instance (RC=" || RC || ")"
  EXIT RC
END

/* ========================================
 * Step 3: Wait a moment for instance to initialize
 * ======================================== */
SAY "Step 3: Waiting for instance to initialize..."
ADDRESS SYSTEM "sleep 5"
SAY ""

/* ========================================
 * Step 4: Describe the instance
 * ======================================== */
SAY "Step 4: Getting instance details..."
ADDRESS GCP "COMPUTE DESCRIBE " || instance_name || " zone=" || zone

IF RC = 0 THEN DO
  SAY "✓ Instance details retrieved"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to get instance details"
END

/* ========================================
 * Step 5: Stop the instance
 * ======================================== */
SAY "Step 5: Stopping instance..."
ADDRESS GCP "COMPUTE STOP " || instance_name || " zone=" || zone

IF RC = 0 THEN DO
  SAY "✓ Instance stopped"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to stop instance"
END

/* Wait for operation to complete */
SAY "Waiting for stop operation..."
ADDRESS SYSTEM "sleep 10"
SAY ""

/* ========================================
 * Step 6: Start the instance again
 * ======================================== */
SAY "Step 6: Starting instance..."
ADDRESS GCP "COMPUTE START " || instance_name || " zone=" || zone

IF RC = 0 THEN DO
  SAY "✓ Instance started"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to start instance"
END

/* Wait for operation to complete */
SAY "Waiting for start operation..."
ADDRESS SYSTEM "sleep 10"
SAY ""

/* ========================================
 * Step 7: Reset the instance (hard reboot)
 * ======================================== */
SAY "Step 7: Resetting instance (hard reboot)..."
ADDRESS GCP "COMPUTE RESET " || instance_name || " zone=" || zone

IF RC = 0 THEN DO
  SAY "✓ Instance reset"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to reset instance"
END

/* Wait for operation to complete */
SAY "Waiting for reset operation..."
ADDRESS SYSTEM "sleep 10"
SAY ""

/* ========================================
 * Step 8: Cleanup - Delete the instance
 * ======================================== */
SAY "Step 8: Cleaning up - deleting instance..."
ADDRESS GCP "COMPUTE DELETE " || instance_name || " zone=" || zone

IF RC = 0 THEN DO
  SAY "✓ Instance deleted successfully"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete instance"
  SAY "⚠️  Manual cleanup may be required: " || instance_name
END

/* ========================================
 * Step 9: Verify deletion
 * ======================================== */
SAY "Step 9: Verifying instance is deleted..."
ADDRESS GCP "COMPUTE LIST zone=" || zone

SAY ""
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created instance: " || instance_name
SAY "  • Tested stop/start cycle"
SAY "  • Tested instance reset"
SAY "  • Cleaned up resources"
SAY ""
SAY "Note: All operations used e2-micro (free tier eligible)"
SAY "      Check GCP console to verify cleanup"
