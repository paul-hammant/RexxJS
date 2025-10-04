#!/usr/bin/env rexx
/* Test Infrastructure with Monitoring & Logging
 *
 * This comprehensive script demonstrates:
 *   1. Creating a Compute Engine instance
 *   2. Setting up monitoring for the instance
 *   3. Reading instance-related logs
 *   4. Creating alerts based on instance metrics
 *   5. Cleaning up all resources
 *
 * This shows how COMPUTE, MONITORING, and LOGGING services work together
 * for infrastructure management.
 *
 * Required APIs:
 *   - compute.googleapis.com
 *   - monitoring.googleapis.com
 *   - logging.googleapis.com
 */

SAY "=== Infrastructure Monitoring & Logging Test ==="
SAY ""

/* Configuration */
LET instance_name = "rexxjs-monitored-" || WORD(DATE('S'), 1)
LET zone = "us-central1-a"
LET machine_type = "e2-micro"
LET image = "debian-11"

SAY "Configuration:"
SAY "  Instance: " || instance_name
SAY "  Zone: " || zone
SAY "  Type: " || machine_type
SAY ""

/* ========================================
 * PHASE 1: Infrastructure Setup
 * ======================================== */
SAY "=== PHASE 1: Infrastructure Setup ==="
SAY ""

SAY "Creating Compute Engine instance..."
ADDRESS GCP "COMPUTE CREATE " || instance_name || " machine=" || machine_type || " zone=" || zone || " image=" || image || " labels=env=test,managed-by=rexxjs"

IF RC = 0 THEN DO
  SAY "✓ Instance created: " || instance_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create instance"
  EXIT RC
END

/* Wait for instance to be fully running */
SAY "Waiting for instance to initialize..."
ADDRESS SYSTEM "sleep 15"
SAY ""

/* ========================================
 * PHASE 2: Monitoring Setup
 * ======================================== */
SAY "=== PHASE 2: Monitoring Setup ==="
SAY ""

SAY "Setting up custom metric for instance..."
LET metric_name = "custom.googleapis.com/rexxjs/instance_health"
ADDRESS GCP "MONITORING CREATE METRIC name='" || metric_name || "' type=gauge"

IF RC = 0 THEN DO
  SAY "✓ Custom metric created (placeholder)"
  SAY ""
END

SAY "Creating alert policy for high CPU usage..."
LET alert_name = "rexxjs-high-cpu-" || instance_name
ADDRESS GCP "MONITORING CREATE ALERT name=" || alert_name || " condition='cpu > 0.8'"

IF RC = 0 THEN DO
  SAY "✓ Alert policy created (placeholder)"
  SAY ""
  SAY "Note: Full alert creation requires @google-cloud/monitoring SDK"
  SAY "      For production, use:"
  SAY "        gcloud alpha monitoring policies create ..."
  SAY ""
END

SAY "Listing available metrics..."
ADDRESS GCP "MONITORING LIST METRICS"

IF RC = 0 THEN DO
  SAY "✓ Metrics listed"
  SAY ""
END

/* ========================================
 * PHASE 3: Log Analysis
 * ======================================== */
SAY "=== PHASE 3: Log Analysis ==="
SAY ""

SAY "Reading logs for the instance..."
LET log_filter = "resource.type=gce_instance AND resource.labels.instance_id:" || instance_name
ADDRESS GCP "LOGGING READ filter='" || log_filter || "' limit=10"

IF RC = 0 THEN DO
  SAY "✓ Instance logs retrieved"
  SAY ""
END
ELSE DO
  SAY "Note: No logs yet (instance just created)"
  SAY ""
END

SAY "Reading recent compute engine operations..."
ADDRESS GCP "LOGGING READ filter='resource.type=gce_instance AND operation.producer=\"compute.googleapis.com\"' limit=5"

IF RC = 0 THEN DO
  SAY "✓ Compute operation logs retrieved"
  SAY ""
END

/* Create log-based metric for instance errors */
SAY "Creating log-based metric for instance errors..."
LET log_metric_name = "rexxjs_instance_errors_" || WORD(DATE('S'), 1)
LET error_filter = "resource.type=gce_instance AND severity>=ERROR"
ADDRESS GCP "LOGGING CREATE METRIC " || log_metric_name || " filter='" || error_filter || "' description='Count of instance errors'"

IF RC = 0 THEN DO
  SAY "✓ Log-based metric created: " || log_metric_name
  SAY ""
END

/* ========================================
 * PHASE 4: Instance Management
 * ======================================== */
SAY "=== PHASE 4: Instance Management ==="
SAY ""

SAY "Getting instance details..."
ADDRESS GCP "COMPUTE DESCRIBE " || instance_name || " zone=" || zone

IF RC = 0 THEN DO
  SAY "✓ Instance details retrieved"
  SAY ""
END

SAY "Performing instance lifecycle test..."
SAY "  Stopping instance..."
ADDRESS GCP "COMPUTE STOP " || instance_name || " zone=" || zone

IF RC = 0 THEN DO
  SAY "  ✓ Instance stopped"
END

SAY "  Waiting for stop operation..."
ADDRESS SYSTEM "sleep 10"

SAY "  Starting instance..."
ADDRESS GCP "COMPUTE START " || instance_name || " zone=" || zone

IF RC = 0 THEN DO
  SAY "  ✓ Instance started"
END

SAY "  Waiting for start operation..."
ADDRESS SYSTEM "sleep 10"
SAY ""

/* ========================================
 * PHASE 5: Monitoring Verification
 * ======================================== */
SAY "=== PHASE 5: Monitoring Verification ==="
SAY ""

SAY "Reading logs for lifecycle events..."
LET lifecycle_filter = "resource.type=gce_instance AND protoPayload.methodName:(\"compute.instances.start\" OR \"compute.instances.stop\")"
ADDRESS GCP "LOGGING READ filter='" || lifecycle_filter || "' limit=5"

IF RC = 0 THEN DO
  SAY "✓ Lifecycle event logs retrieved"
  SAY ""
END

/* ========================================
 * PHASE 6: Cleanup
 * ======================================== */
SAY "=== PHASE 6: Cleanup ==="
SAY ""

SAY "Deleting instance..."
ADDRESS GCP "COMPUTE DELETE " || instance_name || " zone=" || zone

IF RC = 0 THEN DO
  SAY "✓ Instance deleted: " || instance_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete instance"
  SAY "⚠️  Manual cleanup required: " || instance_name
  SAY ""
END

SAY "Note: Log-based metric '" || log_metric_name || "' was created and will persist."
SAY "To delete manually:"
SAY "  gcloud logging metrics delete " || log_metric_name
SAY ""

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary of Operations:"
SAY ""
SAY "Infrastructure (COMPUTE):"
SAY "  ✓ Created VM instance: " || instance_name
SAY "  ✓ Managed instance lifecycle (stop/start)"
SAY "  ✓ Retrieved instance details"
SAY "  ✓ Deleted instance"
SAY ""
SAY "Monitoring (MONITORING):"
SAY "  ✓ Created custom metric (placeholder)"
SAY "  ✓ Created alert policy (placeholder)"
SAY "  ✓ Listed available metrics"
SAY ""
SAY "Logging (LOGGING):"
SAY "  ✓ Read instance-specific logs"
SAY "  ✓ Read compute operation logs"
SAY "  ✓ Created log-based metric: " || log_metric_name
SAY "  ✓ Tracked lifecycle events"
SAY ""
SAY "Integration Points:"
SAY "  • Instance labels (env=test, managed-by=rexxjs) enable filtering"
SAY "  • Log filters target specific resource types and instances"
SAY "  • Metrics can be used for both monitoring and alerting"
SAY "  • Log-based metrics provide additional observability"
SAY ""
SAY "Production Recommendations:"
SAY "  1. Use instance templates for repeatable deployments"
SAY "  2. Set up automatic log export to BigQuery for analysis"
SAY "  3. Create comprehensive alert policies with notification channels"
SAY "  4. Use Cloud Monitoring dashboards for visualization"
SAY "  5. Implement log-based metrics for business-specific events"
SAY ""
SAY "Next Steps:"
SAY "  • Implement full Monitoring SDK integration for real-time metrics"
SAY "  • Add notification channels (email, Slack, PagerDuty)"
SAY "  • Create uptime checks for service availability"
SAY "  • Set up log sinks for long-term archival"
