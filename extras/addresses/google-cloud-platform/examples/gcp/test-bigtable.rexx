#!/usr/bin/env rexx
/* Test Cloud Bigtable
 *
 * Demonstrates Cloud Bigtable operations for NoSQL wide-column database.
 *
 * Required APIs: bigtable.googleapis.com, bigtableadmin.googleapis.com
 * Required Permissions: bigtable.instances.*, bigtable.tables.*, bigtable.clusters.*
 *
 * ⚠️ COST WARNING:
 *   Development instance (1 node): ~$70/month
 *   Production instance (3 nodes): ~$210/month
 *   Storage: $0.17/GB/month (SSD), $0.026/GB/month (HDD)
 *   This test lists instances only to avoid charges.
 */

SAY "=== Cloud Bigtable Test ==="
SAY ""

SAY "About Cloud Bigtable:"
SAY "  Petabyte-scale NoSQL database"
SAY "  Low latency (<10ms for 99th percentile)"
SAY "  Ideal for time-series, IoT, financial data"
SAY "  Compatible with HBase API"
SAY ""

/* ========================================
 * Step 1: List existing instances
 * ======================================== */
SAY "Step 1: Listing Bigtable instances..."
SAY ""

ADDRESS GCP "BIGTABLE LIST INSTANCES"

IF RC = 0 THEN DO
  SAY "✓ Instances listed"
  SAY ""
END

/* ========================================
 * Step 2: Demonstrate instance creation (NOT EXECUTED)
 * ======================================== */
SAY "Step 2: Instance creation (demonstration)..."
SAY ""

SAY "To create development instance (1 node SSD):"
SAY "  BIGTABLE CREATE INSTANCE name=my-instance cluster=my-cluster cluster-zone=us-central1-a cluster-num-nodes=1 cluster-storage-type=ssd"
SAY ""
SAY "To create production instance (3 nodes):"
SAY "  BIGTABLE CREATE INSTANCE name=prod-instance cluster=prod-cluster cluster-zone=us-central1-a cluster-num-nodes=3 cluster-storage-type=ssd"
SAY ""
SAY "⚠️  Skipping creation to avoid costs (~$70+/month)"
SAY ""

SAY "=== Test Complete ==="
SAY ""

SAY "Cloud Bigtable Key Concepts:"
SAY ""
SAY "Data Model:"
SAY "  • Tables with rows and column families"
SAY "  • Row key for efficient lookups"
SAY "  • Columns grouped into families"
SAY "  • Timestamps for versioning"
SAY ""
SAY "Performance:"
SAY "  • Linear scalability (add nodes for more throughput)"
SAY "  • <10ms latency at 99th percentile"
SAY "  • Millions of ops/sec"
SAY ""
SAY "Use Cases:"
SAY "  • Time-series data (metrics, logs)"
SAY "  • IoT sensor data"
SAY "  • Financial transactions"
SAY "  • Real-time analytics"
SAY ""
SAY "For more: https://cloud.google.com/bigtable/docs"
