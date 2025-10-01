#!/usr/bin/env rexx
/*
 * Test Google Cloud Billing API integration
 *
 * IMPORTANT: Billing data has 24-48 hour lag!
 * This is NOT real-time and should only be used for daily monitoring.
 */

SAY "Google Cloud Billing Query Test"
SAY "=================================="
SAY ""
SAY "⚠️  WARNING: Billing data has 24-48 hour lag"
SAY "   Use only for daily budget checks, not real-time monitoring"
SAY ""

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

/* Test 1: Get billing handler info */
SAY "Step 1: Getting billing handler info..."
"BILLING INFO"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Billing handler initialized"
SAY "  Service: " || RESULT.service
SAY "  Version: " || RESULT.version
SAY "  Data Lag: " || RESULT.dataLag
SAY "  Billing Account: " || RESULT.billingAccountId
SAY ""

/* Test 2: Get billing status for current project */
SAY "Step 2: Checking billing status for current project..."
"BILLING STATUS"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  SAY ""
  SAY "Note: This might fail if:"
  SAY "  - No project is set (run: gcloud config set project YOUR_PROJECT)"
  SAY "  - Service account lacks billing.* permissions"
  SAY "  - Billing is not enabled for the project"
  EXIT 1
END

SAY "✓ Billing status retrieved"
SAY "  Project: " || RESULT.project
SAY "  Billing Enabled: " || RESULT.billingEnabled
SAY "  Billing Account: " || RESULT.billingAccountId
SAY "  Note: " || RESULT.note
SAY ""

/* Test 3: List billing accounts (optional) */
SAY "Step 3: Listing accessible billing accounts..."
"BILLING LIST_ACCOUNTS"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  SAY ""
  SAY "Note: This might fail if the service account doesn't have"
  SAY "      billing.accounts.list permission"
  EXIT 1
END

SAY "✓ Found " || RESULT.count || " billing account(s)"
IF RESULT.count > 0 THEN DO
  SAY "  First account: " || RESULT.accounts[1].displayName
END
SAY ""

/* Test 4: Attempt to query spend (will show limitation) */
SAY "Step 4: Attempting to query current spend..."
"BILLING QUERY_SPEND"

IF RC = 0 THEN DO
  IF RESULT.success = "false" THEN DO
    SAY "ℹ️  As expected, direct spend queries not yet available"
    SAY "  Reason: " || RESULT.explanation
    SAY ""
    SAY "  Alternatives:"
    DO i = 1 TO WORDS(RESULT.alternatives)
      SAY "    " || WORD(RESULT.alternatives, i)
    END
    SAY ""
    SAY "  Data lag even if implemented: " || RESULT.dataLag
  END
  ELSE DO
    SAY "✓ Spend data retrieved (unexpected - implementation added!)"
  END
END
ELSE DO
  SAY "✗ Query failed: " || ERRORTEXT
END

SAY ""
SAY "========================================="
SAY "✓ Billing handler test complete"
SAY ""
SAY "Key Takeaways:"
SAY "  • Billing API can check if billing is enabled"
SAY "  • Can list billing accounts you have access to"
SAY "  • Cannot get real-time spend data (24-48h lag)"
SAY "  • For safety: Use cost estimation + hard limits"
SAY "  • For monitoring: Export to BigQuery (future)"

EXIT 0
