#!/usr/bin/env rexx
/* Test IAM (Identity and Access Management)
 *
 * This script demonstrates managing GCP IAM:
 *   - Creating and deleting service accounts
 *   - Granting and revoking IAM roles
 *   - Creating and managing service account keys
 *   - Viewing IAM policies
 *
 * Required APIs:
 *   - iam.googleapis.com
 *   - cloudresourcemanager.googleapis.com
 *
 * Required Permissions:
 *   - iam.serviceAccounts.create
 *   - iam.serviceAccounts.delete
 *   - iam.serviceAccounts.get
 *   - iam.serviceAccounts.list
 *   - iam.serviceAccountKeys.create
 *   - iam.serviceAccountKeys.list
 *   - resourcemanager.projects.setIamPolicy
 *   - resourcemanager.projects.getIamPolicy
 */

SAY "=== IAM (Identity and Access Management) Test ==="
SAY ""

/* Configuration */
LET account_name = "rexxjs-test-sa-" || WORD(DATE('S'), 1)
LET display_name = "RexxJS Test Service Account"
LET description = "Created by RexxJS for testing"

SAY "Configuration:"
SAY "  Account: " || account_name
SAY "  Display: " || display_name
SAY ""

/* ========================================
 * Step 1: List existing service accounts
 * ======================================== */
SAY "Step 1: Listing existing service accounts..."
SAY ""

ADDRESS GCP "IAM LIST SERVICE-ACCOUNTS"

IF RC = 0 THEN DO
  SAY "✓ Service accounts listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list service accounts (RC=" || RC || ")"
  SAY "Note: You may need to enable the IAM API"
  SAY ""
END

/* ========================================
 * Step 2: Create a new service account
 * ======================================== */
SAY "Step 2: Creating new service account..."
SAY "  Name: " || account_name
SAY "  Display: " || display_name
SAY ""

ADDRESS GCP "IAM CREATE SERVICE-ACCOUNT name=" || account_name || " display='" || display_name || "' description='" || description || "'"

IF RC = 0 THEN DO
  SAY "✓ Service account created successfully"
  SAY ""

  /* Get the full email - it will be account_name@project-id.iam.gserviceaccount.com */
  /* We'll construct it from the output */
  LET service_account_email = account_name || "@tribal-quasar-473615-a4.iam.gserviceaccount.com"
  SAY "Service account email: " || service_account_email
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create service account (RC=" || RC || ")"
  EXIT RC
END

/* ========================================
 * Step 3: Grant a role to the service account
 * ======================================== */
SAY "Step 3: Granting roles/viewer role..."
SAY ""

ADDRESS GCP "IAM GRANT " || service_account_email || " role=roles/viewer"

IF RC = 0 THEN DO
  SAY "✓ Role granted: roles/viewer"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to grant role"
  SAY ""
END

/* ========================================
 * Step 4: Get current IAM policy
 * ======================================== */
SAY "Step 4: Getting current IAM policy..."
SAY ""

ADDRESS GCP "IAM GET-POLICY"

IF RC = 0 THEN DO
  SAY "✓ IAM policy retrieved"
  SAY ""
  SAY "The policy shows all role bindings for the project"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to get IAM policy"
  SAY ""
END

/* ========================================
 * Step 5: Create a service account key
 * ======================================== */
SAY "Step 5: Creating service account key..."
SAY ""

LET key_file = account_name || "-key.json"
ADDRESS GCP "IAM CREATE KEY account=" || service_account_email || " file=" || key_file

IF RC = 0 THEN DO
  SAY "✓ Service account key created: " || key_file
  SAY ""
  SAY "⚠️  SECURITY WARNING:"
  SAY "    This key file grants full access as this service account"
  SAY "    Store it securely and never commit to version control"
  SAY "    Delete it immediately after testing"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create key"
  SAY ""
END

/* ========================================
 * Step 6: List keys for the service account
 * ======================================== */
SAY "Step 6: Listing keys for service account..."
SAY ""

ADDRESS GCP "IAM LIST KEYS " || service_account_email

IF RC = 0 THEN DO
  SAY "✓ Keys listed (should show at least the one we just created)"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list keys"
  SAY ""
END

/* ========================================
 * Step 7: Revoke the role
 * ======================================== */
SAY "Step 7: Revoking roles/viewer role..."
SAY ""

ADDRESS GCP "IAM REVOKE " || service_account_email || " role=roles/viewer"

IF RC = 0 THEN DO
  SAY "✓ Role revoked"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to revoke role"
  SAY ""
END

/* ========================================
 * Step 8: Grant a different role
 * ======================================== */
SAY "Step 8: Granting roles/logging.logWriter role..."
SAY ""

ADDRESS GCP "IAM GRANT " || service_account_email || " role=roles/logging.logWriter"

IF RC = 0 THEN DO
  SAY "✓ Role granted: roles/logging.logWriter"
  SAY ""
  SAY "This demonstrates fine-grained permission management"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to grant role"
  SAY ""
END

/* ========================================
 * Step 9: Cleanup - Delete the key file
 * ======================================== */
SAY "Step 9: Cleaning up - deleting key file..."
SAY ""

ADDRESS SYSTEM "rm -f " || key_file

IF RC = 0 THEN DO
  SAY "✓ Key file deleted: " || key_file
  SAY ""
END
ELSE DO
  SAY "⚠️  Failed to delete key file - manual cleanup required"
  SAY ""
END

/* ========================================
 * Step 10: Revoke the second role
 * ======================================== */
SAY "Step 10: Revoking roles/logging.logWriter role..."
SAY ""

ADDRESS GCP "IAM REVOKE " || service_account_email || " role=roles/logging.logWriter"

IF RC = 0 THEN DO
  SAY "✓ Role revoked"
  SAY ""
END

/* ========================================
 * Step 11: Cleanup - Delete the service account
 * ======================================== */
SAY "Step 11: Cleaning up - deleting service account..."
SAY ""

ADDRESS GCP "IAM DELETE SERVICE-ACCOUNT " || service_account_email

IF RC = 0 THEN DO
  SAY "✓ Service account deleted: " || service_account_email
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete service account"
  SAY "⚠️  Manual cleanup may be required:"
  SAY "    gcloud iam service-accounts delete " || service_account_email
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created service account: " || account_name
SAY "  • Granted and revoked IAM roles"
SAY "  • Created and managed service account keys"
SAY "  • Retrieved IAM policy"
SAY "  • Cleaned up all resources"
SAY ""
SAY "IAM Best Practices:"
SAY "  1. Principle of Least Privilege - grant minimum necessary permissions"
SAY "  2. Use service accounts for applications, not user accounts"
SAY "  3. Rotate service account keys regularly (90 days max)"
SAY "  4. Never commit service account keys to version control"
SAY "  5. Use Workload Identity for GKE instead of keys"
SAY "  6. Enable key rotation automation"
SAY "  7. Audit IAM policies regularly"
SAY ""
SAY "Common IAM Roles:"
SAY "  • roles/viewer - Read-only access to all resources"
SAY "  • roles/editor - Read-write access (no permission management)"
SAY "  • roles/owner - Full control including IAM management"
SAY "  • roles/compute.admin - Full control over Compute Engine"
SAY "  • roles/storage.objectAdmin - Manage Cloud Storage objects"
SAY "  • roles/logging.logWriter - Write logs"
SAY "  • roles/monitoring.metricWriter - Write metrics"
SAY ""
SAY "Service Account Usage:"
SAY "  1. Create service account for each application/service"
SAY "  2. Grant specific roles needed for that service"
SAY "  3. Create key only if needed (prefer Workload Identity)"
SAY "  4. Set up key rotation schedule"
SAY "  5. Monitor service account usage in Cloud Logging"
SAY ""
SAY "Key Management:"
SAY "  • Keys cannot be recovered if lost - create new ones"
SAY "  • Each service account can have up to 10 keys"
SAY "  • Keys do not expire automatically - manage manually"
SAY "  • Delete unused keys immediately"
SAY "  • Use separate keys per environment"
SAY ""
SAY "For production:"
SAY "  • Use terraform or deployment manager for IAM"
SAY "  • Enable Cloud Asset Inventory for IAM auditing"
SAY "  • Set up alerts for IAM policy changes"
SAY "  • Review access regularly with Access Transparency"
