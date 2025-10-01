#!/usr/bin/env rexx
/* Test Secret Manager
 *
 * This script demonstrates Secret Manager operations:
 *   - Creating and managing secrets
 *   - Adding secret versions
 *   - Accessing secret values
 *   - Managing secret lifecycle
 *
 * Required APIs:
 *   - secretmanager.googleapis.com
 *
 * Required Permissions:
 *   - secretmanager.secrets.create
 *   - secretmanager.secrets.delete
 *   - secretmanager.secrets.get
 *   - secretmanager.secrets.list
 *   - secretmanager.versions.add
 *   - secretmanager.versions.access
 *   - secretmanager.versions.destroy
 *   - secretmanager.versions.list
 *
 * SECURITY NOTE:
 *   Secrets are encrypted at rest with AES-256 or better
 *   Use IAM to control who can access secrets
 *   Audit secret access in Cloud Logging
 */

SAY "=== Secret Manager Test ==="
SAY ""

/* Configuration */
LET secret_name = "rexxjs-test-secret-" || WORD(DATE('S'), 1)
LET secret_value = "MySecretPassword123!"
LET secret_value2 = "UpdatedPassword456!"

SAY "Configuration:"
SAY "  Secret name: " || secret_name
SAY "  Initial value: " || secret_value
SAY "  Updated value: " || secret_value2
SAY ""

SAY "🔒 SECURITY:"
SAY "    Secret Manager encrypts data at rest and in transit"
SAY "    Access is controlled via IAM"
SAY "    All access is logged for auditing"
SAY ""

/* ========================================
 * Step 1: List existing secrets
 * ======================================== */
SAY "Step 1: Listing existing secrets..."
SAY ""

ADDRESS GCP "SECRETS LIST"

IF RC = 0 THEN DO
  SAY "✓ Secrets listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list secrets (RC=" || RC || ")"
  SAY "Note: You may need to enable the Secret Manager API"
  SAY ""
END

/* ========================================
 * Step 2: Create a new secret
 * ======================================== */
SAY "Step 2: Creating new secret..."
SAY "  Name: " || secret_name
SAY "  Replication: automatic (all regions)"
SAY ""

ADDRESS GCP "SECRETS CREATE name=" || secret_name || " replication=automatic"

IF RC = 0 THEN DO
  SAY "✓ Secret created: " || secret_name
  SAY ""
  SAY "Replication Options:"
  SAY "  • automatic: Replicated to all GCP regions"
  SAY "  • user-managed: You specify which regions"
  SAY ""
  SAY "For this test, we use 'automatic' for simplicity"
  SAY ""
  SAY "Note: Creating a secret doesn't store any data yet"
  SAY "      We need to add a version with actual secret data"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create secret (RC=" || RC || ")"
  EXIT RC
END

/* ========================================
 * Step 3: Add first version with secret data
 * ======================================== */
SAY "Step 3: Adding first version with secret data..."
SAY "  Secret: " || secret_name
SAY "  Value: [REDACTED - not shown for security]"
SAY ""

ADDRESS GCP "SECRETS ADD-VERSION secret=" || secret_name || " data='" || secret_value || "'"

IF RC = 0 THEN DO
  SAY "✓ Secret version added (version 1)"
  SAY ""
  SAY "Each version has a unique ID and state:"
  SAY "  • ENABLED: Can be accessed"
  SAY "  • DISABLED: Cannot be accessed (temporary)"
  SAY "  • DESTROYED: Permanently deleted"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to add secret version"
  SAY "Note: Secret may still be creating"
  SAY ""
END

/* ========================================
 * Step 4: Access the secret value
 * ======================================== */
SAY "Step 4: Accessing secret value..."
SAY ""

ADDRESS GCP "SECRETS ACCESS secret=" || secret_name || " version=latest"

IF RC = 0 THEN DO
  SAY "✓ Secret accessed successfully"
  SAY ""
  SAY "The secret value is shown in the output above"
  SAY ""
  SAY "⚠️  IMPORTANT:"
  SAY "    In production, never log or print secret values"
  SAY "    This is a test, so we're showing it for demonstration"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to access secret"
  SAY ""
END

/* ========================================
 * Step 5: List versions of the secret
 * ======================================== */
SAY "Step 5: Listing secret versions..."
SAY ""

ADDRESS GCP "SECRETS LIST-VERSIONS secret=" || secret_name

IF RC = 0 THEN DO
  SAY "✓ Versions listed (should show version 1)"
  SAY ""
END

/* ========================================
 * Step 6: Add a new version (secret rotation)
 * ======================================== */
SAY "Step 6: Adding new version (rotating secret)..."
SAY "  Secret: " || secret_name
SAY "  New value: [REDACTED]"
SAY ""

ADDRESS GCP "SECRETS ADD-VERSION secret=" || secret_name || " data='" || secret_value2 || "'"

IF RC = 0 THEN DO
  SAY "✓ Secret version added (version 2)"
  SAY ""
  SAY "Secret Rotation:"
  SAY "  • Add new version with updated credentials"
  SAY "  • Update applications to use new version"
  SAY "  • Destroy old version when no longer needed"
  SAY "  • 'latest' always points to newest enabled version"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to add new version"
  SAY ""
END

/* ========================================
 * Step 7: Access the new version
 * ======================================== */
SAY "Step 7: Accessing the latest version..."
SAY ""

ADDRESS GCP "SECRETS ACCESS secret=" || secret_name || " version=latest"

IF RC = 0 THEN DO
  SAY "✓ Latest version accessed (should show version 2 value)"
  SAY ""
END

/* ========================================
 * Step 8: Access a specific version (version 1)
 * ======================================== */
SAY "Step 8: Accessing specific version (version 1)..."
SAY ""

ADDRESS GCP "SECRETS ACCESS secret=" || secret_name || " version=1"

IF RC = 0 THEN DO
  SAY "✓ Version 1 accessed (should show original value)"
  SAY ""
  SAY "You can access any version by number:"
  SAY "  • version=1, version=2, etc."
  SAY "  • version=latest (most recent enabled)"
  SAY ""
END

/* ========================================
 * Step 9: List all versions again
 * ======================================== */
SAY "Step 9: Listing all versions..."
SAY ""

ADDRESS GCP "SECRETS LIST-VERSIONS secret=" || secret_name

IF RC = 0 THEN DO
  SAY "✓ Versions listed (should show versions 1 and 2)"
  SAY ""
END

/* ========================================
 * Step 10: Destroy old version (version 1)
 * ======================================== */
SAY "Step 10: Destroying old version (version 1)..."
SAY ""

ADDRESS GCP "SECRETS DESTROY-VERSION secret=" || secret_name || " version=1"

IF RC = 0 THEN DO
  SAY "✓ Version 1 destroyed"
  SAY ""
  SAY "⚠️  DESTROYED versions cannot be recovered"
  SAY "    The data is permanently deleted"
  SAY ""
  SAY "Version States:"
  SAY "  • ENABLED → DISABLED: Temporary (can re-enable)"
  SAY "  • ENABLED → DESTROYED: Permanent (cannot undo)"
  SAY "  • DISABLED → DESTROYED: Permanent (cannot undo)"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to destroy version"
  SAY ""
END

/* ========================================
 * Step 11: Describe the secret
 * ======================================== */
SAY "Step 11: Getting secret details..."
SAY ""

ADDRESS GCP "SECRETS DESCRIBE " || secret_name

IF RC = 0 THEN DO
  SAY "✓ Secret details retrieved"
  SAY ""
  SAY "Details include:"
  SAY "  • Secret name and creation time"
  SAY "  • Replication policy"
  SAY "  • Labels and annotations"
  SAY "  • Rotation settings (if configured)"
  SAY ""
END

/* ========================================
 * Step 12: Cleanup - Delete the secret
 * ======================================== */
SAY "Step 12: Cleaning up - deleting secret..."
SAY ""

ADDRESS GCP "SECRETS DELETE " || secret_name

IF RC = 0 THEN DO
  SAY "✓ Secret deleted: " || secret_name
  SAY ""
  SAY "When you delete a secret:"
  SAY "  • All versions are destroyed"
  SAY "  • Data is permanently deleted"
  SAY "  • Cannot be recovered"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete secret"
  SAY "⚠️  Manual cleanup may be required:"
  SAY "    gcloud secrets delete " || secret_name
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created secret: " || secret_name
SAY "  • Added version 1 with initial value"
SAY "  • Accessed version 1"
SAY "  • Added version 2 (rotation)"
SAY "  • Accessed both versions"
SAY "  • Destroyed version 1"
SAY "  • Deleted secret"
SAY ""
SAY "Secret Manager Use Cases:"
SAY ""
SAY "1. Database Credentials:"
SAY "   • Store DB passwords"
SAY "   • Rotate regularly (30-90 days)"
SAY "   • Grant access only to specific service accounts"
SAY ""
SAY "2. API Keys:"
SAY "   • Third-party API keys (Stripe, Twilio, etc.)"
SAY "   • Internal API tokens"
SAY "   • OAuth client secrets"
SAY ""
SAY "3. TLS/SSL Certificates:"
SAY "   • Private keys for HTTPS"
SAY "   • Certificate chains"
SAY "   • Automatically rotate with new versions"
SAY ""
SAY "4. SSH Keys:"
SAY "   • Private SSH keys for deployments"
SAY "   • Service account keys (though Workload Identity is better)"
SAY ""
SAY "5. Environment Variables:"
SAY "   • Sensitive config values"
SAY "   • Feature flags with sensitive data"
SAY ""
SAY "Replication Strategies:"
SAY ""
SAY "Automatic Replication:"
SAY "  • Replicated to all GCP regions"
SAY "  • Highest availability"
SAY "  • Lowest latency globally"
SAY "  • Best for: Most applications"
SAY ""
SAY "User-Managed Replication:"
SAY "  • You choose specific regions"
SAY "  • Data sovereignty compliance"
SAY "  • Cost optimization (fewer replicas)"
SAY "  • Best for: Regulatory requirements"
SAY ""
SAY "Access Control Best Practices:"
SAY ""
SAY "1. Use Service Accounts:"
SAY "   • Grant secretmanager.secretAccessor role"
SAY "   • One service account per application"
SAY "   • Never use user accounts in production"
SAY ""
SAY "2. Principle of Least Privilege:"
SAY "   • Grant access to specific secrets only"
SAY "   • Use conditions for fine-grained control"
SAY "   • Example: Allow only from specific VPC"
SAY ""
SAY "3. Separate Environments:"
SAY "   • dev-db-password, staging-db-password, prod-db-password"
SAY "   • Different IAM policies per environment"
SAY "   • Prevents dev from accessing prod secrets"
SAY ""
SAY "4. Use Labels for Organization:"
SAY "   • environment=production"
SAY "   • team=backend"
SAY "   • criticality=high"
SAY ""
SAY "Secret Rotation Best Practices:"
SAY ""
SAY "1. Regular Rotation Schedule:"
SAY "   • Critical secrets: 30 days"
SAY "   • Standard secrets: 90 days"
SAY "   • Low-risk secrets: 180 days"
SAY ""
SAY "2. Zero-Downtime Rotation:"
SAY "   • Add new version (v2)"
SAY "   • Deploy app update to use v2"
SAY "   • Wait for all instances to update"
SAY "   • Destroy old version (v1)"
SAY ""
SAY "3. Automated Rotation:"
SAY "   • Use Cloud Functions + Cloud Scheduler"
SAY "   • Generate new credentials automatically"
SAY "   • Update secret version"
SAY "   • Notify applications"
SAY ""
SAY "Accessing Secrets from Applications:"
SAY ""
SAY "1. Cloud Run / Cloud Functions:"
SAY "   • Mount secrets as environment variables"
SAY "   • Mount secrets as files"
SAY "   • Use Secret Manager API directly"
SAY ""
SAY "2. Compute Engine / GKE:"
SAY "   • Use Workload Identity (GKE)"
SAY "   • Use instance service accounts (GCE)"
SAY "   • Fetch secrets at startup"
SAY ""
SAY "3. Cloud Build:"
SAY "   • Reference secrets in build steps"
SAY "   • Use substitution variables"
SAY "   • Never log secrets"
SAY ""
SAY "Monitoring and Auditing:"
SAY ""
SAY "1. Cloud Logging:"
SAY "   • Log every secret access"
SAY "   • Log version creation/destruction"
SAY "   • Set up alerts for unusual access patterns"
SAY ""
SAY "2. Cloud Monitoring:"
SAY "   • Track access frequency"
SAY "   • Monitor failed access attempts"
SAY "   • Alert on high-value secret access"
SAY ""
SAY "3. Cloud Asset Inventory:"
SAY "   • Track secret creation/deletion"
SAY "   • Audit IAM policy changes"
SAY "   • Compliance reporting"
SAY ""
SAY "Security Features:"
SAY ""
SAY "1. Encryption:"
SAY "   • AES-256 or better at rest"
SAY "   • TLS 1.2+ in transit"
SAY "   • Google-managed keys or CMEK"
SAY ""
SAY "2. Access Control:"
SAY "   • IAM integration"
SAY "   • VPC Service Controls"
SAY "   • Conditional access policies"
SAY ""
SAY "3. Auditing:"
SAY "   • Every access logged"
SAY "   • Data Access logs"
SAY "   • Admin Activity logs"
SAY ""
SAY "Cost Optimization:"
SAY ""
SAY "Pricing:"
SAY "  • $0.06 per secret version per month (first 6 free)"
SAY "  • $0.03 per 10,000 access operations"
SAY "  • Replication: No extra charge"
SAY ""
SAY "Tips:"
SAY "  • Delete old versions when no longer needed"
SAY "  • Use automatic replication unless required otherwise"
SAY "  • Cache secrets in memory (but refresh periodically)"
SAY "  • Don't access secrets on every request"
SAY ""
SAY "Common Patterns:"
SAY ""
SAY "1. Database Connection String:"
SAY "   Secret: prod-db-connection"
SAY "   Value: postgresql://user:pass@host:5432/db"
SAY "   Rotation: Update password monthly"
SAY ""
SAY "2. Multiple Related Secrets:"
SAY "   Secret: stripe-api-key-public"
SAY "   Secret: stripe-api-key-secret"
SAY "   Secret: stripe-webhook-secret"
SAY "   Rotation: Coordinate rotation together"
SAY ""
SAY "3. Environment-Specific Secrets:"
SAY "   Secret: api-key-dev (automatic, 90-day rotation)"
SAY "   Secret: api-key-staging (user-managed, 30-day rotation)"
SAY "   Secret: api-key-prod (user-managed, 30-day rotation)"
SAY ""
SAY "Integration with Other GCP Services:"
SAY ""
SAY "  • Cloud Build: Mount secrets in build steps"
SAY "  • Cloud Run: Inject as environment variables or volumes"
SAY "  • Cloud Functions: Same as Cloud Run"
SAY "  • GKE: Use Secrets Store CSI Driver"
SAY "  • Compute Engine: Fetch via API at startup"
SAY "  • Cloud Composer: Access in Airflow DAGs"
SAY ""
SAY "For more information:"
SAY "  https://cloud.google.com/secret-manager/docs"
