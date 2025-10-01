#!/usr/bin/env rexx
/* Test Cloud Scheduler
 *
 * This script demonstrates Cloud Scheduler operations:
 *   - Creating scheduled jobs (cron)
 *   - HTTP and Pub/Sub targets
 *   - Running jobs manually
 *   - Pausing and resuming jobs
 *
 * Required APIs:
 *   - cloudscheduler.googleapis.com
 *   - (optional) pubsub.googleapis.com for Pub/Sub jobs
 *
 * Required Permissions:
 *   - cloudscheduler.jobs.create
 *   - cloudscheduler.jobs.delete
 *   - cloudscheduler.jobs.get
 *   - cloudscheduler.jobs.list
 *   - cloudscheduler.jobs.run
 *   - cloudscheduler.jobs.pause
 *   - cloudscheduler.jobs.resume
 */

SAY "=== Cloud Scheduler Test ==="
SAY ""

/* Configuration */
LET job_name = "rexxjs-test-job-" || WORD(DATE('S'), 1)
LET location = "us-central1"
LET schedule = "*/5 * * * *"  /* Every 5 minutes */
LET target_url = "https://httpbin.org/post"  /* Test endpoint */

SAY "Configuration:"
SAY "  Job name: " || job_name
SAY "  Location: " || location
SAY "  Schedule: " || schedule || " (every 5 minutes)"
SAY "  Target URL: " || target_url
SAY ""

SAY "About Cloud Scheduler:"
SAY "  Fully managed cron job service"
SAY "  Supports Unix cron format"
SAY "  Can target HTTP endpoints, Pub/Sub topics, App Engine"
SAY "  Automatic retries with exponential backoff"
SAY ""

/* ========================================
 * Step 1: List existing scheduled jobs
 * ======================================== */
SAY "Step 1: Listing existing scheduled jobs..."
SAY ""

ADDRESS GCP "SCHEDULER LIST JOBS location=" || location

IF RC = 0 THEN DO
  SAY "✓ Scheduled jobs listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list jobs (RC=" || RC || ")"
  SAY "Note: You may need to enable the Cloud Scheduler API"
  SAY ""
END

/* ========================================
 * Step 2: Create an HTTP scheduled job
 * ======================================== */
SAY "Step 2: Creating HTTP scheduled job..."
SAY "  Job: " || job_name
SAY "  Schedule: " || schedule
SAY "  Target: " || target_url
SAY ""

LET message_body = '{"source": "Cloud Scheduler", "job": "' || job_name || '", "time": "automated"}'

ADDRESS GCP "SCHEDULER CREATE JOB name=" || job_name || " schedule='" || schedule || "' uri=" || target_url || " message-body='" || message_body || "' location=" || location

IF RC = 0 THEN DO
  SAY "✓ Scheduled job created: " || job_name
  SAY ""
  SAY "Job will execute every 5 minutes:"
  SAY "  • POST request to " || target_url
  SAY "  • With message body (JSON payload)"
  SAY "  • Starting at next scheduled time"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create job (RC=" || RC || ")"
  SAY ""
  SAY "Common reasons:"
  SAY "  • Cloud Scheduler API not enabled"
  SAY "  • Insufficient permissions"
  SAY "  • Invalid cron schedule format"
  SAY "  • Invalid location"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 3: Get job details
 * ======================================== */
SAY "Step 3: Getting job details..."
SAY ""

ADDRESS GCP "SCHEDULER DESCRIBE JOB name=" || job_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Job details retrieved"
  SAY ""
  SAY "Details include:"
  SAY "  • Schedule (cron format)"
  SAY "  • Target (HTTP URL or Pub/Sub topic)"
  SAY "  • Next scheduled run time"
  SAY "  • Last run time and status"
  SAY "  • Retry configuration"
  SAY ""
END

/* ========================================
 * Step 4: Run the job manually
 * ======================================== */
SAY "Step 4: Running job manually (force execution)..."
SAY ""

ADDRESS GCP "SCHEDULER RUN JOB name=" || job_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Job executed manually"
  SAY ""
  SAY "Manual execution:"
  SAY "  • Runs job immediately"
  SAY "  • Does not affect regular schedule"
  SAY "  • Useful for testing or one-off needs"
  SAY "  • Response shows execution result"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to run job"
  SAY "Note: Job may still be creating"
  SAY ""
END

/* ========================================
 * Step 5: Pause the job
 * ======================================== */
SAY "Step 5: Pausing scheduled job..."
SAY ""

ADDRESS GCP "SCHEDULER PAUSE JOB name=" || job_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Job paused"
  SAY ""
  SAY "When paused:"
  SAY "  • Job will not run on schedule"
  SAY "  • Can still be run manually"
  SAY "  • State preserved"
  SAY "  • Useful for maintenance windows"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to pause job"
  SAY ""
END

/* ========================================
 * Step 6: Resume the job
 * ======================================== */
SAY "Step 6: Resuming scheduled job..."
SAY ""

ADDRESS GCP "SCHEDULER RESUME JOB name=" || job_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Job resumed"
  SAY ""
  SAY "Job is now running on schedule again"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to resume job"
  SAY ""
END

/* ========================================
 * Step 7: Create a Pub/Sub job (example)
 * ======================================== */
SAY "Step 7: Demonstrating Pub/Sub job creation..."
SAY ""

LET pubsub_job = job_name || "-pubsub"
LET topic_name = "rexxjs-test-topic"

SAY "To create a Pub/Sub job:"
SAY "  SCHEDULER CREATE JOB name=" || pubsub_job || " \\"
SAY "    schedule='0 * * * *' \\"
SAY "    topic=" || topic_name || " \\"
SAY "    message-body='{'\"event\":\""data-sync\"'}' \\"
SAY "    location=" || location
SAY ""
SAY "Note: Requires Pub/Sub topic to exist first"
SAY "      We're skipping actual creation in this test"
SAY ""

/* ========================================
 * Step 8: Cleanup - Delete the job
 * ======================================== */
SAY "Step 8: Cleaning up - deleting scheduled job..."
SAY ""

ADDRESS GCP "SCHEDULER DELETE JOB name=" || job_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Scheduled job deleted: " || job_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete job"
  SAY "⚠️  Manual cleanup may be required:"
  SAY "    gcloud scheduler jobs delete " || job_name || " --location=" || location
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created scheduled job: " || job_name
SAY "  • Ran job manually"
SAY "  • Paused and resumed job"
SAY "  • Deleted job"
SAY ""
SAY "Cloud Scheduler Concepts:"
SAY ""
SAY "Cron Schedule Format:"
SAY "  minute hour day month weekday"
SAY ""
SAY "Common Schedules:"
SAY "  • Every minute:        '* * * * *'"
SAY "  • Every 5 minutes:     '*/5 * * * *'"
SAY "  • Every hour:          '0 * * * *'"
SAY "  • Every day at 2am:    '0 2 * * *'"
SAY "  • Every Monday at 9am: '0 9 * * 1'"
SAY "  • First of month:      '0 0 1 * *'"
SAY "  • Weekdays at noon:    '0 12 * * 1-5'"
SAY ""
SAY "Field Values:"
SAY "  • minute: 0-59"
SAY "  • hour: 0-23"
SAY "  • day: 1-31"
SAY "  • month: 1-12 (or JAN-DEC)"
SAY "  • weekday: 0-6 (0=Sunday, or SUN-SAT)"
SAY ""
SAY "Special Characters:"
SAY "  • * (any): Match any value"
SAY "  • , (list): Multiple values (1,15,30)"
SAY "  • - (range): Range of values (1-5)"
SAY "  • / (step): Step values (*/15 = every 15)"
SAY ""
SAY "Target Types:"
SAY ""
SAY "1. HTTP Target:"
SAY "   • Any HTTPS endpoint"
SAY "   • GET or POST requests"
SAY "   • Custom headers supported"
SAY "   • Authentication: None, OIDC, OAuth"
SAY "   • Example: Trigger Cloud Run service"
SAY ""
SAY "2. Pub/Sub Target:"
SAY "   • Publish to Pub/Sub topic"
SAY "   • Message body in JSON or text"
SAY "   • Subscribers handle the work"
SAY "   • Good for fan-out patterns"
SAY ""
SAY "3. App Engine Target (legacy):"
SAY "   • Call App Engine service"
SAY "   • Automatic authentication"
SAY "   • Use HTTP target for new projects"
SAY ""
SAY "Job Configuration:"
SAY ""
SAY "Retry Configuration:"
SAY "  • Max retry attempts (default: 0)"
SAY "  • Retry interval (min/max backoff)"
SAY "  • Max doublings (exponential backoff)"
SAY "  • Example:"
SAY "    --max-retry-attempts=3 \\"
SAY "    --min-backoff=5s \\"
SAY "    --max-backoff=1h"
SAY ""
SAY "Timeout:"
SAY "  • Attempt deadline (default: 3 minutes)"
SAY "  • Job fails if target doesn't respond in time"
SAY ""
SAY "Time Zone:"
SAY "  • Default: UTC"
SAY "  • Can specify time zone:"
SAY "    --time-zone='America/New_York'"
SAY ""
SAY "Common Use Cases:"
SAY ""
SAY "1. Database Maintenance:"
SAY "   • Nightly backups"
SAY "   • Vacuum/optimize operations"
SAY "   • Archive old records"
SAY "   • Schedule: '0 2 * * *' (2am daily)"
SAY ""
SAY "2. Report Generation:"
SAY "   • Daily sales reports"
SAY "   • Weekly analytics summaries"
SAY "   • Monthly invoices"
SAY "   • Schedule: '0 8 * * 1' (Mondays at 8am)"
SAY ""
SAY "3. Data Synchronization:"
SAY "   • Sync with external systems"
SAY "   • Update caches"
SAY "   • Import/export data"
SAY "   • Schedule: '*/15 * * * *' (every 15 min)"
SAY ""
SAY "4. Health Checks:"
SAY "   • Ping services to keep warm"
SAY "   • Monitor endpoint availability"
SAY "   • Clear stale sessions"
SAY "   • Schedule: '*/5 * * * *' (every 5 min)"
SAY ""
SAY "5. Scheduled Notifications:"
SAY "   • Reminder emails"
SAY "   • Daily digest emails"
SAY "   • Alert summaries"
SAY "   • Schedule: '0 9 * * *' (9am daily)"
SAY ""
SAY "Integration Patterns:"
SAY ""
SAY "Scheduler → Cloud Run:"
SAY "  • Job triggers Cloud Run service"
SAY "  • Use OIDC authentication"
SAY "  • Service account token added automatically"
SAY "  • Example:"
SAY "    --oidc-service-account-email=sa@project.iam.gserviceaccount.com"
SAY ""
SAY "Scheduler → Pub/Sub → Functions:"
SAY "  • Job publishes to Pub/Sub"
SAY "  • Cloud Function subscribes to topic"
SAY "  • Decouples scheduler from worker"
SAY "  • Easy to add more subscribers"
SAY ""
SAY "Scheduler → Cloud Tasks:"
SAY "  • Job creates Cloud Tasks"
SAY "  • Tasks provide rate limiting, retries"
SAY "  • Good for batching operations"
SAY ""
SAY "Scheduler vs Cloud Tasks:"
SAY ""
SAY "Use Cloud Scheduler when:"
SAY "  • Time-based triggers (cron)"
SAY "  • Recurring schedules"
SAY "  • Fixed execution times"
SAY "  • Simple retry needs"
SAY ""
SAY "Use Cloud Tasks when:"
SAY "  • Event-driven triggers"
SAY "  • Dynamic scheduling"
SAY "  • Complex retry logic"
SAY "  • Rate limiting required"
SAY "  • High volume of tasks"
SAY ""
SAY "Often used together:"
SAY "  • Scheduler: Creates batches of Cloud Tasks"
SAY "  • Tasks: Process batch with rate limiting"
SAY ""
SAY "Best Practices:"
SAY ""
SAY "1. Use Idempotent Handlers:"
SAY "   • Jobs may execute multiple times"
SAY "   • Check if work already done"
SAY "   • Use unique identifiers"
SAY ""
SAY "2. Set Appropriate Timeouts:"
SAY "   • Don't set longer than needed"
SAY "   • Consider handler execution time"
SAY "   • Account for retry attempts"
SAY ""
SAY "3. Handle Failures Gracefully:"
SAY "   • Return 2xx for success"
SAY "   • Return 4xx for permanent failure"
SAY "   • Return 5xx for transient failure"
SAY "   • Log all outcomes"
SAY ""
SAY "4. Monitor Job Execution:"
SAY "   • Set up alerts for failures"
SAY "   • Track execution duration"
SAY "   • Monitor last success time"
SAY "   • Check for missed executions"
SAY ""
SAY "5. Use Pub/Sub for Fan-Out:"
SAY "   • One job, many subscribers"
SAY "   • Each subscriber does part of work"
SAY "   • Parallel processing"
SAY "   • Independent failure handling"
SAY ""
SAY "6. Consider Time Zones:"
SAY "   • Specify time zone explicitly"
SAY "   • Account for DST changes"
SAY "   • UTC recommended for server jobs"
SAY "   • Local time for user-facing jobs"
SAY ""
SAY "Monitoring:"
SAY ""
SAY "Cloud Monitoring Metrics:"
SAY "  • Job attempt count"
SAY "  • Job execution latency"
SAY "  • Job success/failure rate"
SAY "  • Jobs by state (enabled/paused)"
SAY ""
SAY "Cloud Logging:"
SAY "  • All job executions logged"
SAY "  • Response codes and errors"
SAY "  • Filter: resource.type=\"cloud_scheduler_job\""
SAY ""
SAY "Recommended Alerts:"
SAY "  • Job failing repeatedly"
SAY "  • Job not run in expected interval"
SAY "  • High latency (approaching timeout)"
SAY "  • Unusual execution patterns"
SAY ""
SAY "Error Handling:"
SAY ""
SAY "Success (HTTP 2xx):"
SAY "  • Job considered successful"
SAY "  • Next execution scheduled normally"
SAY ""
SAY "Permanent Failure (HTTP 4xx):"
SAY "  • Don't retry"
SAY "  • Log error"
SAY "  • Fix configuration or handler"
SAY ""
SAY "Transient Failure (HTTP 5xx, timeout):"
SAY "  • Retry with backoff"
SAY "  • Up to max-retry-attempts"
SAY "  • If all retries fail, job marked failed"
SAY ""
SAY "Cost Optimization:"
SAY ""
SAY "Pricing:"
SAY "  • Jobs: $0.10 per job per month"
SAY "  • Executions: Free (first 3 per job per month)"
SAY "  • After free tier: $0.10 per execution"
SAY ""
SAY "Examples:"
SAY "  • 10 jobs, each runs hourly:"
SAY "    - Jobs: 10 × $0.10 = $1.00"
SAY "    - Executions: 10 × 720/month = 7,200"
SAY "    - Free: 10 × 3 = 30"
SAY "    - Charged: 7,170 × $0.10 = $717.00"
SAY "    - Total: $718.00/month"
SAY ""
SAY "  • 1 job, runs daily:"
SAY "    - Jobs: $0.10"
SAY "    - Executions: 30/month (all free)"
SAY "    - Total: $0.10/month"
SAY ""
SAY "Tips:"
SAY "  • Consolidate jobs when possible"
SAY "  • Use Pub/Sub for fan-out (one job, many subscribers)"
SAY "  • Delete unused jobs"
SAY "  • Consider Cloud Tasks for high-frequency work"
SAY ""
SAY "Security:"
SAY ""
SAY "Authentication for HTTP Targets:"
SAY "  1. None (public endpoints only)"
SAY "  2. OIDC (OpenID Connect):"
SAY "     - Best for Cloud Run"
SAY "     - Service account token included"
SAY "  3. OAuth:"
SAY "     - Custom OAuth tokens"
SAY "     - For third-party APIs"
SAY ""
SAY "IAM Permissions:"
SAY "  • cloudscheduler.jobs.run - Run jobs"
SAY "  • cloudscheduler.jobs.create - Create jobs"
SAY "  • cloudscheduler.jobs.delete - Delete jobs"
SAY "  • cloudscheduler.jobs.update - Modify jobs"
SAY ""
SAY "Best Practices:"
SAY "  • Use service accounts for job identity"
SAY "  • Grant minimal permissions"
SAY "  • Validate incoming requests in handlers"
SAY "  • Log all job executions"
SAY "  • Use VPC-SC for sensitive workflows"
SAY ""
SAY "For more information:"
SAY "  https://cloud.google.com/scheduler/docs"
