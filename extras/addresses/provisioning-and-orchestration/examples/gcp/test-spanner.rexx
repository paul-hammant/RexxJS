#!/usr/bin/env rexx
/* Test Cloud Spanner
 *
 * Demonstrates Cloud Spanner operations for globally distributed SQL database.
 *
 * Required APIs: spanner.googleapis.com
 * Required Permissions: spanner.instances.*, spanner.databases.*
 *
 * ⚠️ COST WARNING:
 *   Single node: ~$650/month
 *   100 processing units (0.1 node): ~$65/month
 *   Multi-region costs more
 *   This test lists instances only to avoid charges.
 */

SAY "=== Cloud Spanner Test ==="
SAY ""

SAY "About Cloud Spanner:"
SAY "  Globally distributed SQL database"
SAY "  Strong consistency across regions"
SAY "  Horizontal scalability"
SAY "  99.999% availability SLA"
SAY ""

/* ========================================
 * Step 1: List existing instances
 * ======================================== */
SAY "Step 1: Listing Spanner instances..."
SAY ""

ADDRESS GCP "SPANNER LIST INSTANCES"

IF RC = 0 THEN DO
  SAY "✓ Instances listed"
  SAY ""
END

/* ========================================
 * Step 2: Demonstrate instance creation (NOT EXECUTED)
 * ======================================== */
SAY "Step 2: Instance creation (demonstration)..."
SAY ""

SAY "To create regional instance (100 PUs = 0.1 node):"
SAY "  SPANNER CREATE INSTANCE name=my-instance config=regional-us-central1 processing-units=100"
SAY ""
SAY "To create full node instance:"
SAY "  SPANNER CREATE INSTANCE name=my-instance config=regional-us-central1 nodes=1"
SAY ""
SAY "⚠️  Skipping creation to avoid costs (~$65-650+/month)"
SAY ""

SAY "=== Test Complete ==="
SAY ""

SAY "Cloud Spanner Key Concepts:"
SAY ""
SAY "Global Distribution:"
SAY "  • Data replicated across regions"
SAY "  • Strong consistency (ACID)"
SAY "  • External consistency (TrueTime)"
SAY ""
SAY "Scalability:"
SAY "  • Processing units: 100 PU minimum, 1000 PU = 1 node"
SAY "  • Add nodes/PUs for more throughput"
SAY "  • Automatic sharding"
SAY ""
SAY "SQL Support:"
SAY "  • Standard SQL with extensions"
SAY "  • Interleaved tables for parent-child"
SAY "  • Secondary indexes"
SAY ""
SAY "Use Cases:"
SAY "  • Financial systems (transactions)"
SAY "  • Global inventory management"
SAY "  • Multi-region applications"
SAY "  • Mission-critical workloads"
SAY ""
SAY "For more: https://cloud.google.com/spanner/docs"
