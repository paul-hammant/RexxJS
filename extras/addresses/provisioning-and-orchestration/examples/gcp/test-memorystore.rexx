#!/usr/bin/env rexx
/* Test Cloud Memorystore (Redis/Memcached)
 *
 * Demonstrates Cloud Memorystore operations for Redis and Memcached.
 *
 * Required APIs: redis.googleapis.com
 * Required Permissions: redis.instances.*, redis.operations.*
 *
 * ⚠️ COST WARNING:
 *   Basic tier Redis (1GB): ~$40/month
 *   Standard tier Redis (HA, 1GB): ~$80/month
 *   Memcached (2 nodes, 1GB each): ~$60/month
 *   This test lists instances only to avoid charges.
 */

SAY "=== Cloud Memorystore Test ==="
SAY ""

SAY "About Cloud Memorystore:"
SAY "  Fully managed Redis and Memcached"
SAY "  Sub-millisecond latency"
SAY "  High availability with automatic failover"
SAY "  VPC-native (private IP, secure)"
SAY ""

/* ========================================
 * Step 1: List existing Redis instances
 * ======================================== */
SAY "Step 1: Listing Redis instances..."
SAY ""

ADDRESS GCP "MEMORYSTORE LIST REDIS"

IF RC = 0 THEN DO
  SAY "✓ Redis instances listed"
  SAY ""
END

/* ========================================
 * Step 2: List existing Memcached instances
 * ======================================== */
SAY "Step 2: Listing Memcached instances..."
SAY ""

ADDRESS GCP "MEMORYSTORE LIST MEMCACHED"

IF RC = 0 THEN DO
  SAY "✓ Memcached instances listed"
  SAY ""
END

/* ========================================
 * Step 3: Demonstrate Redis creation (NOT EXECUTED)
 * ======================================== */
SAY "Step 3: Redis instance creation (demonstration)..."
SAY ""

SAY "To create a basic Redis instance:"
SAY "  MEMORYSTORE CREATE REDIS name=my-redis tier=basic size=1"
SAY ""
SAY "To create HA Redis with auth:"
SAY "  MEMORYSTORE CREATE REDIS name=my-redis tier=standard size=1 enable-auth=true"
SAY ""
SAY "⚠️  Skipping creation to avoid costs (~$40-80/month)"
SAY ""

/* ========================================
 * Step 4: Demonstrate Memcached creation (NOT EXECUTED)
 * ======================================== */
SAY "Step 4: Memcached instance creation (demonstration)..."
SAY ""

SAY "To create Memcached instance:"
SAY "  MEMORYSTORE CREATE MEMCACHED name=my-memcached node-count=2 node-cpu=1 node-memory=1024"
SAY ""
SAY "⚠️  Skipping creation to avoid costs (~$60/month)"
SAY ""

SAY "=== Test Complete ===="
SAY ""

SAY "Cloud Memorystore Key Concepts:"
SAY ""
SAY "Redis Tiers:"
SAY "  • Basic: Single node, no HA (~$40/month for 1GB)"
SAY "  • Standard: HA with automatic failover (~$80/month for 1GB)"
SAY ""
SAY "Redis Features:"
SAY "  • AUTH enabled for security"
SAY "  • Transit encryption (TLS)"
SAY "  • Export/import for backups"
SAY "  • Version: Redis 6.x, 7.0"
SAY ""
SAY "Memcached Features:"
SAY "  • Multiple nodes for scalability"
SAY "  • LRU eviction"
SAY "  • No persistence"
SAY ""
SAY "Use Cases:"
SAY "  Redis: Session storage, caching, real-time analytics, pub/sub"
SAY "  Memcached: Simple caching, object caching"
SAY ""
SAY "For more: https://cloud.google.com/memorystore/docs"
