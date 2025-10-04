#!/usr/bin/env rexx
/* Test Cloud Logging
 *
 * This script demonstrates using Google Cloud Logging to:
 *   - Read log entries
 *   - Create log sinks
 *   - Create log-based metrics
 *   - List and delete sinks
 *
 * Required APIs:
 *   - logging.googleapis.com
 *
 * Required Permissions:
 *   - logging.logEntries.list
 *   - logging.sinks.create
 *   - logging.sinks.delete
 *   - logging.sinks.list
 *   - logging.logMetrics.create
 *   - logging.logMetrics.list
 */

SAY "=== Cloud Logging Test ==="
SAY ""

/* Configuration */
LET sink_name = "rexxjs-test-sink-" || WORD(DATE('S'), 1)
LET metric_name = "rexxjs_test_metric_" || WORD(DATE('S'), 1)
LET bucket_name = "rexxjs-logging-test-" || WORD(DATE('S'), 1)

SAY "Test configuration:"
SAY "  Sink: " || sink_name
SAY "  Metric: " || metric_name
SAY "  Bucket: " || bucket_name
SAY ""

/* ========================================
 * Step 1: Read recent log entries
 * ======================================== */
SAY "Step 1: Reading recent log entries..."
SAY "  Filter: severity>=ERROR"
SAY "  Limit: 10"
SAY ""

ADDRESS GCP "LOGGING READ filter='severity>=ERROR' limit=10"

IF RC = 0 THEN DO
  SAY "✓ Log entries retrieved successfully"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to read log entries (RC=" || RC || ")"
  SAY "Note: You may need to enable the Logging API"
END

SAY ""

/* ========================================
 * Step 2: List existing log sinks
 * ======================================== */
SAY "Step 2: Listing existing log sinks..."
SAY ""

ADDRESS GCP "LOGGING LIST SINKS"

IF RC = 0 THEN DO
  SAY "✓ Sinks listed successfully"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list sinks"
END

SAY ""

/* ========================================
 * Step 3: Create a storage bucket for the sink
 * ======================================== */
SAY "Step 3: Creating storage bucket for log sink..."
SAY "  Bucket: " || bucket_name
SAY ""

ADDRESS GCP "STORAGE CREATE BUCKET " || bucket_name

IF RC = 0 THEN DO
  SAY "✓ Bucket created successfully"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create bucket (may already exist)"
  SAY "  Continuing anyway..."
  SAY ""
END

/* ========================================
 * Step 4: Create a log sink
 * ======================================== */
SAY "Step 4: Creating log sink..."
SAY "  Name: " || sink_name
SAY "  Destination: storage.googleapis.com/" || bucket_name
SAY "  Filter: severity>=ERROR"
SAY ""

LET destination = "storage.googleapis.com/" || bucket_name
ADDRESS GCP "LOGGING CREATE SINK " || sink_name || " destination='" || destination || "' filter='severity>=ERROR'"

IF RC = 0 THEN DO
  SAY "✓ Log sink created successfully"
  SAY ""
  SAY "Important: Grant the service account write permissions to the bucket:"
  SAY "  The gcloud command output shows the service account email."
  SAY "  Run: gsutil iam ch serviceAccount:[EMAIL]:objectCreator gs://" || bucket_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create log sink (RC=" || RC || ")"
  SAY "  Sink may already exist or permissions insufficient"
END

SAY ""

/* ========================================
 * Step 5: Create a log-based metric
 * ======================================== */
SAY "Step 5: Creating log-based metric..."
SAY "  Name: " || metric_name
SAY "  Filter: severity=ERROR"
SAY "  Description: Count of error log entries"
SAY ""

ADDRESS GCP "LOGGING CREATE METRIC " || metric_name || " filter='severity=ERROR' description='Count of error log entries from RexxJS test'"

IF RC = 0 THEN DO
  SAY "✓ Log-based metric created successfully"
  SAY ""
  SAY "This metric will appear in Cloud Monitoring as:"
  SAY "  logging.googleapis.com/user/" || metric_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create log metric (RC=" || RC || ")"
  SAY "  Metric may already exist"
END

SAY ""

/* ========================================
 * Step 6: Verify sink was created
 * ======================================== */
SAY "Step 6: Verifying sink creation..."
SAY ""

ADDRESS GCP "LOGGING LIST SINKS"

IF RC = 0 THEN DO
  SAY "✓ Sinks listed (should include " || sink_name || ")"
  SAY ""
END

SAY ""

/* ========================================
 * Step 7: Read logs with different filter
 * ======================================== */
SAY "Step 7: Reading logs with timestamp filter..."
SAY "  Filter: timestamp>=\"2025-01-01T00:00:00Z\""
SAY "  Limit: 5"
SAY ""

ADDRESS GCP "LOGGING READ filter='timestamp>=\"2025-01-01T00:00:00Z\"' limit=5"

IF RC = 0 THEN DO
  SAY "✓ Recent logs retrieved"
  SAY ""
END

SAY ""

/* ========================================
 * Step 8: Cleanup - Delete the sink
 * ======================================== */
SAY "Step 8: Cleaning up - deleting log sink..."
SAY ""

ADDRESS GCP "LOGGING DELETE SINK " || sink_name

IF RC = 0 THEN DO
  SAY "✓ Log sink deleted successfully"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete sink"
  SAY "⚠️  Manual cleanup may be required: " || sink_name
  SAY ""
END

/* ========================================
 * Step 9: Cleanup - Delete the bucket (optional)
 * ======================================== */
SAY "Step 9: Cleaning up - deleting storage bucket..."
SAY ""

ADDRESS GCP "STORAGE DELETE BUCKET " || bucket_name

IF RC = 0 THEN DO
  SAY "✓ Storage bucket deleted successfully"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete bucket (may not be empty or permissions issue)"
  SAY "⚠️  Manual cleanup may be required: gs://" || bucket_name
  SAY ""
  SAY "To delete manually:"
  SAY "  gsutil rm -r gs://" || bucket_name
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Read log entries with filters"
SAY "  • Created log sink to Cloud Storage: " || sink_name
SAY "  • Created log-based metric: " || metric_name
SAY "  • Listed existing sinks"
SAY "  • Cleaned up test resources"
SAY ""
SAY "Log-Based Metric:"
SAY "  The metric '" || metric_name || "' will continue counting ERROR logs."
SAY "  It can be viewed in Cloud Monitoring or used in alert policies."
SAY ""
SAY "  To delete the metric manually:"
SAY "    gcloud logging metrics delete " || metric_name
SAY ""
SAY "Common Log Filters:"
SAY "  • severity>=ERROR                   - Errors and above"
SAY "  • resource.type=cloud_function      - Cloud Functions logs"
SAY "  • resource.type=cloud_run_revision  - Cloud Run logs"
SAY "  • timestamp>=\"2025-01-01\"           - Logs since a date"
SAY "  • jsonPayload.message:\"error\"       - Search in message field"
SAY ""
SAY "For more information:"
SAY "  https://cloud.google.com/logging/docs/view/query-library"
