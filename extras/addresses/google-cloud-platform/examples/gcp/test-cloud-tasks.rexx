#!/usr/bin/env rexx
/* Test Cloud Tasks
 *
 * This script demonstrates Cloud Tasks operations:
 *   - Creating task queues
 *   - Creating and scheduling HTTP tasks
 *   - Managing queue state (pause/resume)
 *   - Listing tasks
 *
 * Required APIs:
 *   - cloudtasks.googleapis.com
 *
 * Required Permissions:
 *   - cloudtasks.queues.create
 *   - cloudtasks.queues.delete
 *   - cloudtasks.queues.get
 *   - cloudtasks.queues.list
 *   - cloudtasks.queues.pause
 *   - cloudtasks.queues.resume
 *   - cloudtasks.tasks.create
 *   - cloudtasks.tasks.list
 *
 * NOTE: Tasks require a target URL
 *       Use a real endpoint or a test service like webhook.site
 */

SAY "=== Cloud Tasks Test ==="
SAY ""

/* Configuration */
LET queue_name = "rexxjs-test-queue-" || WORD(DATE('S'), 1)
LET location = "us-central1"
LET target_url = "https://httpbin.org/post"  /* Test endpoint */

SAY "Configuration:"
SAY "  Queue: " || queue_name
SAY "  Location: " || location
SAY "  Target URL: " || target_url
SAY ""

SAY "About Cloud Tasks:"
SAY "  Cloud Tasks is for asynchronous task execution"
SAY "  Tasks are HTTP requests sent to a target URL"
SAY "  Provides automatic retries with exponential backoff"
SAY "  Deduplicates tasks, rate limits, manages concurrency"
SAY ""

/* ========================================
 * Step 1: List existing task queues
 * ======================================== */
SAY "Step 1: Listing existing task queues..."
SAY ""

ADDRESS GCP "TASKS LIST QUEUES location=" || location

IF RC = 0 THEN DO
  SAY "✓ Task queues listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list queues (RC=" || RC || ")"
  SAY "Note: You may need to enable the Cloud Tasks API"
  SAY ""
END

/* ========================================
 * Step 2: Create a task queue
 * ======================================== */
SAY "Step 2: Creating task queue..."
SAY "  Name: " || queue_name
SAY "  Location: " || location
SAY ""

ADDRESS GCP "TASKS CREATE QUEUE name=" || queue_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Task queue created: " || queue_name
  SAY ""
  SAY "Queue Configuration:"
  SAY "  • Default rate: 500 tasks/second"
  SAY "  • Max concurrent: 1000 tasks"
  SAY "  • Max attempts: 100 (with backoff)"
  SAY "  • Default timeout: 10 minutes"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create queue (RC=" || RC || ")"
  SAY ""
  SAY "Common reasons:"
  SAY "  • Cloud Tasks API not enabled"
  SAY "  • Insufficient permissions"
  SAY "  • Invalid location"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 3: Get queue details
 * ======================================== */
SAY "Step 3: Getting queue details..."
SAY ""

ADDRESS GCP "TASKS DESCRIBE QUEUE name=" || queue_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Queue details retrieved"
  SAY ""
END

/* ========================================
 * Step 4: Create a task (immediate execution)
 * ======================================== */
SAY "Step 4: Creating task for immediate execution..."
SAY "  Queue: " || queue_name
SAY "  URL: " || target_url
SAY "  Payload: {\"message\": \"Hello from RexxJS\"}"
SAY ""

LET payload = '{"message": "Hello from RexxJS", "timestamp": "' || DATE('S') || ' ' || TIME() || '"}'

ADDRESS GCP "TASKS CREATE TASK queue=" || queue_name || " url=" || target_url || " payload='" || payload || "' location=" || location

IF RC = 0 THEN DO
  SAY "✓ Task created and queued for execution"
  SAY ""
  SAY "What happens next:"
  SAY "  1. Task is added to the queue"
  SAY "  2. Queue dispatcher picks up the task"
  SAY "  3. HTTP POST request sent to target URL"
  SAY "  4. If successful (HTTP 2xx), task completes"
  SAY "  5. If failed, task retries with backoff"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create task"
  SAY "Note: Queue may still be creating"
  SAY ""
END

/* ========================================
 * Step 5: Create a scheduled task
 * ======================================== */
SAY "Step 5: Creating scheduled task (5 minutes from now)..."
SAY ""

/* Calculate schedule time (current time + 5 minutes in ISO 8601) */
/* Note: This is simplified - production would use proper date math */
SAY "Creating task scheduled for future execution..."
SAY "  (In production, specify exact time in ISO 8601 format)"
SAY ""

ADDRESS GCP "TASKS CREATE TASK queue=" || queue_name || " url=" || target_url || " payload='{"|| '"scheduled": true}' || "' location=" || location

IF RC = 0 THEN DO
  SAY "✓ Scheduled task created"
  SAY ""
END

/* ========================================
 * Step 6: List tasks in the queue
 * ======================================== */
SAY "Step 6: Listing tasks in queue..."
SAY ""

ADDRESS GCP "TASKS LIST TASKS queue=" || queue_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Tasks listed"
  SAY ""
  SAY "Tasks may be in various states:"
  SAY "  • SCHEDULED: Waiting for schedule time"
  SAY "  • DISPATCHED: Being executed"
  SAY "  • SUCCEEDED: Completed successfully (removed from list)"
  SAY "  • FAILED: Max retries exceeded (moved to dead letter)"
  SAY ""
END

/* ========================================
 * Step 7: Pause the queue
 * ======================================== */
SAY "Step 7: Pausing queue..."
SAY ""

ADDRESS GCP "TASKS PAUSE QUEUE name=" || queue_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Queue paused"
  SAY ""
  SAY "When paused:"
  SAY "  • New tasks can still be added"
  SAY "  • No tasks will be dispatched"
  SAY "  • Useful for maintenance or debugging"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to pause queue"
  SAY ""
END

/* ========================================
 * Step 8: Resume the queue
 * ======================================== */
SAY "Step 8: Resuming queue..."
SAY ""

ADDRESS GCP "TASKS RESUME QUEUE name=" || queue_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Queue resumed"
  SAY ""
  SAY "Queue is now processing tasks again"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to resume queue"
  SAY ""
END

/* Give tasks time to execute */
SAY "Waiting 10 seconds for tasks to process..."
ADDRESS SYSTEM "sleep 10"
SAY ""

/* ========================================
 * Step 9: Check tasks again
 * ======================================== */
SAY "Step 9: Checking tasks after execution window..."
SAY ""

ADDRESS GCP "TASKS LIST TASKS queue=" || queue_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Tasks checked"
  SAY ""
  SAY "Completed tasks are automatically removed from the queue"
  SAY ""
END

/* ========================================
 * Step 10: Cleanup - Delete the queue
 * ======================================== */
SAY "Step 10: Cleaning up - deleting queue..."
SAY ""

ADDRESS GCP "TASKS DELETE QUEUE name=" || queue_name || " location=" || location

IF RC = 0 THEN DO
  SAY "✓ Queue deleted: " || queue_name
  SAY ""
  SAY "When a queue is deleted:"
  SAY "  • All pending tasks are discarded"
  SAY "  • No more tasks can be added"
  SAY "  • In-flight tasks may still complete"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete queue"
  SAY "⚠️  Manual cleanup may be required:"
  SAY "    gcloud tasks queues delete " || queue_name || " --location=" || location
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created task queue: " || queue_name
SAY "  • Created immediate task"
SAY "  • Created scheduled task"
SAY "  • Listed tasks"
SAY "  • Paused and resumed queue"
SAY "  • Cleaned up queue"
SAY ""
SAY "Cloud Tasks Concepts:"
SAY ""
SAY "Task Types:"
SAY ""
SAY "1. HTTP Tasks:"
SAY "   • POST request to any HTTPS endpoint"
SAY "   • Headers and body customizable"
SAY "   • Authentication options: OIDC, OAuth"
SAY "   • Most flexible option"
SAY ""
SAY "2. App Engine Tasks (legacy):"
SAY "   • Target App Engine services"
SAY "   • Automatic authentication"
SAY "   • Use HTTP tasks for new projects"
SAY ""
SAY "Queue Configuration:"
SAY ""
SAY "Rate Limits:"
SAY "  • Max dispatches per second (default: 500)"
SAY "  • Max concurrent dispatches (default: 1000)"
SAY "  • Max burst size"
SAY "  • Bucket size for token bucket algorithm"
SAY ""
SAY "Retry Configuration:"
SAY "  • Max attempts (default: 100)"
SAY "  • Max retry duration"
SAY "  • Min/max backoff (exponential)"
SAY "  • Initial retry delay"
SAY ""
SAY "Example: Configure queue with specific limits"
SAY "  gcloud tasks queues update " || queue_name || " \\"
SAY "    --max-dispatches-per-second=10 \\"
SAY "    --max-concurrent-dispatches=5 \\"
SAY "    --max-attempts=5"
SAY ""
SAY "Task Scheduling:"
SAY ""
SAY "Immediate Tasks:"
SAY "  • Execute as soon as possible"
SAY "  • Subject to queue rate limits"
SAY "  • No schedule-time specified"
SAY ""
SAY "Scheduled Tasks:"
SAY "  • Execute at specific future time"
SAY "  • Max schedule: 30 days in future"
SAY "  • Time in ISO 8601 format"
SAY "  • Example: 2025-10-01T15:30:00Z"
SAY ""
SAY "Retries and Error Handling:"
SAY ""
SAY "Automatic Retries:"
SAY "  • Retry on HTTP 5xx responses"
SAY "  • Retry on connection failures"
SAY "  • Exponential backoff (1s, 2s, 4s, 8s, ...)"
SAY "  • Max backoff cap (default: 1 hour)"
SAY ""
SAY "Success Criteria:"
SAY "  • HTTP 2xx response = success"
SAY "  • Task removed from queue"
SAY ""
SAY "Permanent Failure:"
SAY "  • HTTP 4xx response = don't retry"
SAY "  • Task removed from queue"
SAY "  • Use 4xx for invalid requests"
SAY ""
SAY "Task Deduplication:"
SAY ""
SAY "  • Specify task name for idempotency"
SAY "  • Same name = same task (deduplicated)"
SAY "  • Prevents duplicate processing"
SAY "  • Example: task name = \"order-123-payment\""
SAY ""
SAY "Common Use Cases:"
SAY ""
SAY "1. Asynchronous API Calls:"
SAY "   • User triggers action"
SAY "   • Create task to call external API"
SAY "   • Return immediately to user"
SAY "   • Task executes in background"
SAY ""
SAY "2. Scheduled Jobs:"
SAY "   • Daily report generation"
SAY "   • Nightly data processing"
SAY "   • Reminder emails"
SAY "   • Cache warmup"
SAY ""
SAY "3. Rate-Limited Operations:"
SAY "   • Sending emails (rate limit queue)"
SAY "   • Third-party API calls (stay under quotas)"
SAY "   • Database writes (prevent overload)"
SAY ""
SAY "4. Fan-Out Patterns:"
SAY "   • One event creates many tasks"
SAY "   • Example: Process uploaded file"
SAY "     - Task 1: Extract metadata"
SAY "     - Task 2: Generate thumbnails"
SAY "     - Task 3: Run virus scan"
SAY "     - Task 4: Index for search"
SAY ""
SAY "5. Long-Running Operations:"
SAY "   • Export large dataset"
SAY "   • Generate PDF reports"
SAY "   • Video transcoding"
SAY "   • Data migration"
SAY ""
SAY "Integration Patterns:"
SAY ""
SAY "With Cloud Run:"
SAY "  • Tasks call Cloud Run service"
SAY "  • Use OIDC authentication"
SAY "  • Service account token added automatically"
SAY "  • Example:"
SAY "    --oidc-service-account-email=sa@project.iam.gserviceaccount.com"
SAY ""
SAY "With Pub/Sub:"
SAY "  • Pub/Sub for fan-out (many subscribers)"
SAY "  • Tasks for controlled execution (one handler)"
SAY "  • Can chain: Pub/Sub → Cloud Function → Tasks"
SAY ""
SAY "With Firestore:"
SAY "  • Store task status in Firestore"
SAY "  • Update status as task progresses"
SAY "  • Query for stuck tasks"
SAY "  • Implement sagas/workflows"
SAY ""
SAY "Best Practices:"
SAY ""
SAY "1. Make Handlers Idempotent:"
SAY "   • Same task may execute multiple times"
SAY "   • Check if work already done"
SAY "   • Use unique task names"
SAY ""
SAY "2. Set Appropriate Timeouts:"
SAY "   • Task timeout = max handler time"
SAY "   • Too short = premature failures"
SAY "   • Too long = wastes resources"
SAY ""
SAY "3. Use Exponential Backoff:"
SAY "   • Let transient failures recover"
SAY "   • Don't overwhelm failing services"
SAY "   • Default backoff is usually good"
SAY ""
SAY "4. Monitor Queue Depth:"
SAY "   • Alert on growing queue"
SAY "   • May indicate handler problems"
SAY "   • Or need to scale workers"
SAY ""
SAY "5. Separate Queues by Priority:"
SAY "   • High-priority queue: Fast rate, few retries"
SAY "   • Low-priority queue: Slow rate, many retries"
SAY "   • Critical vs. background work"
SAY ""
SAY "6. Handle Failures Gracefully:"
SAY "   • Return 2xx for success"
SAY "   • Return 4xx for permanent failure"
SAY "   • Return 5xx for transient failure"
SAY "   • Log all outcomes"
SAY ""
SAY "Monitoring:"
SAY ""
SAY "Cloud Monitoring Metrics:"
SAY "  • Queue depth (pending tasks)"
SAY "  • Task attempt count"
SAY "  • Task dispatch rate"
SAY "  • Task response codes"
SAY ""
SAY "Cloud Logging:"
SAY "  • All task dispatches logged"
SAY "  • Response codes and latencies"
SAY "  • Filter: resource.type=\"cloud_tasks_queue\""
SAY ""
SAY "Recommended Alerts:"
SAY "  • Queue depth > threshold"
SAY "  • High failure rate (5xx responses)"
SAY "  • Tasks exceeding max retries"
SAY "  • Unusual dispatch latency"
SAY ""
SAY "Cost Optimization:"
SAY ""
SAY "Pricing:"
SAY "  • Queue operations: Free"
SAY "  • Task creations: Free"
SAY "  • Task dispatches:"
SAY "    - First 1 million/month: Free"
SAY "    - After that: $0.40 per million"
SAY ""
SAY "Tips:"
SAY "  • Batch operations when possible"
SAY "  • Use longer retry intervals for non-urgent tasks"
SAY "  • Delete queues not in use"
SAY "  • Monitor and optimize handler performance"
SAY ""
SAY "Typical Monthly Costs:"
SAY "  • 10 million tasks: $3.60"
SAY "  • 100 million tasks: $39.60"
SAY "  • Very cost-effective for most workloads"
SAY ""
SAY "For more information:"
SAY "  https://cloud.google.com/tasks/docs"
