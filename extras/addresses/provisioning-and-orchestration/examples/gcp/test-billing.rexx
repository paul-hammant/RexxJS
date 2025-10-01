#!/usr/bin/env rexx
/* Test Cloud Billing Operations
 *
 * This script demonstrates using Google Cloud Billing to:
 *   - Check billing status
 *   - List billing accounts
 *   - List billable services and SKUs
 *   - Create and manage budgets
 *   - Get cost information (requires BigQuery export)
 *
 * Required APIs:
 *   - cloudbilling.googleapis.com
 *
 * Required Permissions:
 *   - billing.accounts.get
 *   - billing.accounts.list
 *   - billing.budgets.create
 *   - billing.budgets.delete
 *   - billing.budgets.list
 *   - billing.resourceCosts.get
 */

SAY "=== Cloud Billing Test ==="
SAY ""

/* ========================================
 * Step 1: Check handler capabilities
 * ======================================== */
SAY "Step 1: Checking Billing handler capabilities..."
SAY ""

ADDRESS GCP "BILLING INFO"

IF RC = 0 THEN DO
  SAY "✓ Billing handler initialized"
  SAY ""
END

/* ========================================
 * Step 2: Check billing status for current project
 * ======================================== */
SAY "Step 2: Checking billing status for current project..."
SAY ""

ADDRESS GCP "BILLING STATUS"

IF RC = 0 THEN DO
  SAY "✓ Billing status retrieved"
  SAY ""
  SAY "Important: Billing data has 24-48 hour lag"
  SAY "           Not suitable for real-time cost monitoring"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to get billing status (RC=" || RC || ")"
  SAY "Note: You may need to enable the Cloud Billing API"
  SAY ""
END

/* ========================================
 * Step 3: List all billing accounts
 * ======================================== */
SAY "Step 3: Listing billing accounts..."
SAY ""

ADDRESS GCP "BILLING LIST ACCOUNTS"

IF RC = 0 THEN DO
  SAY "✓ Billing accounts listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list billing accounts"
  SAY "Note: Requires billing.accounts.list permission"
  SAY ""
END

/* ========================================
 * Step 4: List billable GCP services
 * ======================================== */
SAY "Step 4: Listing billable GCP services..."
SAY ""

ADDRESS GCP "BILLING LIST SERVICES"

IF RC = 0 THEN DO
  SAY "✓ Services listed"
  SAY ""
END
ELSE DO
  SAY "Note: Listing common services as fallback"
  SAY ""
END

/* ========================================
 * Step 5: List existing budgets
 * ======================================== */
SAY "Step 5: Listing existing budgets..."
SAY ""

ADDRESS GCP "BILLING LIST BUDGETS"

IF RC = 0 THEN DO
  SAY "✓ Budgets listed"
  SAY ""
END
ELSE DO
  SAY "Note: No budgets found or billing account not configured"
  SAY ""
END

/* ========================================
 * Step 6: Create a test budget
 * ======================================== */
LET budget_name = "rexxjs-test-budget-" || WORD(DATE('S'), 1)
LET budget_amount = "100"
LET threshold = "50,80,100"

SAY "Step 6: Creating test budget..."
SAY "  Name: " || budget_name
SAY "  Amount: $" || budget_amount
SAY "  Thresholds: " || threshold || "%"
SAY ""

ADDRESS GCP "BILLING CREATE BUDGET name=" || budget_name || " amount=" || budget_amount || " threshold=" || threshold

IF RC = 0 THEN DO
  SAY "✓ Budget created successfully"
  SAY ""
  SAY "Budget alerts will trigger at:"
  SAY "  • 50% = $50"
  SAY "  • 80% = $80"
  SAY "  • 100% = $100"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create budget (RC=" || RC || ")"
  SAY ""
  SAY "Common reasons:"
  SAY "  • No billing account found"
  SAY "  • Insufficient permissions"
  SAY "  • Budget API not enabled"
  SAY ""
END

/* ========================================
 * Step 7: Query costs (demonstrates BigQuery export requirement)
 * ======================================== */
SAY "Step 7: Attempting to query costs..."
SAY ""

ADDRESS GCP "BILLING GET-COSTS start=2025-10-01 end=2025-10-31 group=service"

IF RC = 0 THEN DO
  SAY "✓ Cost query succeeded (BigQuery export configured)"
  SAY ""
END
ELSE DO
  SAY "Note: Cost queries require BigQuery billing export to be configured"
  SAY ""
  SAY "To set up billing export:"
  SAY "  1. Go to https://console.cloud.google.com/billing"
  SAY "  2. Select your billing account"
  SAY "  3. Click 'Billing export' → BigQuery export"
  SAY "  4. Configure export to a BigQuery dataset"
  SAY "  5. Wait 24-48 hours for initial data"
  SAY ""
END

/* ========================================
 * Step 8: BigQuery export setup instructions
 * ======================================== */
SAY "Step 8: Getting BigQuery export setup instructions..."
SAY ""

ADDRESS GCP "BILLING EXPORT-TO-BIGQUERY dataset=billing_export"

IF RC = 0 THEN DO
  SAY "✓ Setup instructions provided"
  SAY ""
END

/* ========================================
 * Step 9: Cleanup - Delete test budget
 * ======================================== */
SAY "Step 9: Cleaning up - deleting test budget..."
SAY ""

ADDRESS GCP "BILLING DELETE BUDGET " || budget_name

IF RC = 0 THEN DO
  SAY "✓ Budget deleted successfully"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete budget"
  SAY "⚠️  Manual cleanup may be required:"
  SAY "    gcloud billing budgets delete " || budget_name || " --billing-account=YOUR_ACCOUNT_ID"
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Checked billing status and capabilities"
SAY "  • Listed billing accounts and services"
SAY "  • Created/deleted test budget: " || budget_name
SAY "  • Demonstrated cost query requirements"
SAY ""
SAY "Key Findings:"
SAY "  1. Billing data has 24-48 hour lag - NOT real-time"
SAY "  2. Use budgets for threshold alerts, not real-time monitoring"
SAY "  3. Cost queries require BigQuery export setup"
SAY "  4. Budget API is best for preventive cost controls"
SAY ""
SAY "Recommended Workflow:"
SAY "  • Set up BigQuery billing export (one-time setup)"
SAY "  • Create budgets with alerts at 50%, 80%, 100%"
SAY "  • Connect budget alerts to Pub/Sub for automation"
SAY "  • Query historical costs from BigQuery for analysis"
SAY "  • Use BILLING LIST SERVICES to identify cost drivers"
SAY ""
SAY "Budget Best Practices:"
SAY "  • Set multiple thresholds for early warning"
SAY "  • Use Pub/Sub notifications for automation"
SAY "  • Create separate budgets per environment (dev/staging/prod)"
SAY "  • Review and adjust monthly based on usage patterns"
SAY ""
SAY "For detailed cost analysis:"
SAY "  1. Configure BigQuery export"
SAY "  2. Wait 24-48 hours for data"
SAY "  3. Use BIGQUERY to query detailed cost breakdowns"
SAY "  4. Create dashboards in Data Studio"
