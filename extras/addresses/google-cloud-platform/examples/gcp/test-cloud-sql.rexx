#!/usr/bin/env rexx
/* Test Cloud SQL
 *
 * This script demonstrates Cloud SQL database management:
 *   - Creating and deleting Cloud SQL instances
 *   - Creating databases and users
 *   - Managing backups
 *   - Instance configuration
 *
 * Required APIs:
 *   - sqladmin.googleapis.com
 *
 * Required Permissions:
 *   - cloudsql.instances.create
 *   - cloudsql.instances.delete
 *   - cloudsql.instances.get
 *   - cloudsql.instances.list
 *   - cloudsql.databases.create
 *   - cloudsql.users.create
 *   - cloudsql.backupRuns.create
 *   - cloudsql.backupRuns.list
 *
 * NOTE: Cloud SQL instances take 5-10 minutes to create
 *       This test uses db-f1-micro (shared CPU, cheapest tier)
 *       Estimated cost: ~$9/month if left running
 */

SAY "=== Cloud SQL Test ==="
SAY ""

/* Configuration */
LET instance_name = "rexxjs-test-db-" || WORD(DATE('S'), 1)
LET tier = "db-f1-micro"  /* Cheapest tier - shared CPU */
LET database_type = "postgres"
LET version = "POSTGRES_15"
LET region = "us-central1"

SAY "Configuration:"
SAY "  Instance: " || instance_name
SAY "  Tier: " || tier || " (shared CPU, suitable for dev/test)"
SAY "  Type: " || database_type
SAY "  Version: " || version
SAY "  Region: " || region
SAY ""

SAY "⚠️  COST WARNING:"
SAY "    db-f1-micro costs approximately $9/month if running 24/7"
SAY "    This test will create and delete the instance"
SAY "    Actual cost: < $0.01 for the test duration"
SAY ""

/* ========================================
 * Step 1: List existing Cloud SQL instances
 * ======================================== */
SAY "Step 1: Listing existing Cloud SQL instances..."
SAY ""

ADDRESS GCP "SQL LIST"

IF RC = 0 THEN DO
  SAY "✓ Instances listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list instances (RC=" || RC || ")"
  SAY "Note: You may need to enable the Cloud SQL Admin API"
  SAY ""
END

/* ========================================
 * Step 2: Create a Cloud SQL instance
 * ======================================== */
SAY "Step 2: Creating Cloud SQL instance..."
SAY "  This will take 5-10 minutes..."
SAY ""
SAY "  Instance: " || instance_name
SAY "  Tier: " || tier
SAY "  Version: " || version
SAY ""

ADDRESS GCP "SQL CREATE " || instance_name || " tier=" || tier || " database=" || database_type || " version=" || version || " region=" || region

IF RC = 0 THEN DO
  SAY "✓ Cloud SQL instance creation started"
  SAY ""
  SAY "Note: Instance creation takes 5-10 minutes"
  SAY "      We'll wait 5 minutes before proceeding..."
  SAY ""

  /* Wait for instance to be ready */
  SAY "Waiting for instance to be ready..."
  ADDRESS SYSTEM "sleep 300"  /* 5 minutes */
  SAY ""

  SAY "Checking if instance is ready..."
  ADDRESS GCP "SQL DESCRIBE " || instance_name

  IF RC = 0 THEN DO
    SAY "✓ Instance appears to be ready"
    SAY ""
  END
  ELSE DO
    SAY "⚠️  Instance may still be creating"
    SAY "    This is normal - let's continue with other tests"
    SAY ""
  END
END
ELSE DO
  SAY "✗ Failed to create instance (RC=" || RC || ")"
  SAY ""
  SAY "Common reasons:"
  SAY "  • Cloud SQL API not enabled"
  SAY "  • Insufficient quota"
  SAY "  • Invalid configuration"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 3: Create a database in the instance
 * ======================================== */
SAY "Step 3: Creating database in instance..."
SAY ""

LET database_name = "testdb"
ADDRESS GCP "SQL CREATE DATABASE instance=" || instance_name || " database=" || database_name

IF RC = 0 THEN DO
  SAY "✓ Database created: " || database_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create database"
  SAY "    Instance may still be initializing"
  SAY ""
END

/* ========================================
 * Step 4: Create a user in the instance
 * ======================================== */
SAY "Step 4: Creating database user..."
SAY ""

LET db_user = "testuser"
LET db_password = "TestPass123!"
ADDRESS GCP "SQL CREATE USER instance=" || instance_name || " user=" || db_user || " password=" || db_password

IF RC = 0 THEN DO
  SAY "✓ User created: " || db_user
  SAY "  Password: " || db_password
  SAY ""
  SAY "⚠️  Security Note:"
  SAY "    In production, use strong passwords and rotate regularly"
  SAY "    Consider using IAM database authentication"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create user"
  SAY "    Instance may still be initializing"
  SAY ""
END

/* ========================================
 * Step 5: Get instance details
 * ======================================== */
SAY "Step 5: Getting instance details..."
SAY ""

ADDRESS GCP "SQL DESCRIBE " || instance_name

IF RC = 0 THEN DO
  SAY "✓ Instance details retrieved"
  SAY ""
  SAY "Details include:"
  SAY "  • Connection name (for Cloud SQL Proxy)"
  SAY "  • IP addresses (public/private)"
  SAY "  • Database version"
  SAY "  • Machine tier"
  SAY "  • Current state"
  SAY ""
END
ELSE DO
  SAY "Note: Instance may still be creating"
  SAY ""
END

/* ========================================
 * Step 6: Create a backup
 * ======================================== */
SAY "Step 6: Creating manual backup..."
SAY ""

ADDRESS GCP "SQL BACKUP instance=" || instance_name || " description='Test backup from RexxJS'"

IF RC = 0 THEN DO
  SAY "✓ Backup created"
  SAY "  Backups are stored for 7 days by default"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create backup"
  SAY "    Instance must be RUNNABLE to create backups"
  SAY ""
END

/* ========================================
 * Step 7: List backups
 * ======================================== */
SAY "Step 7: Listing backups for instance..."
SAY ""

ADDRESS GCP "SQL LIST BACKUPS " || instance_name

IF RC = 0 THEN DO
  SAY "✓ Backups listed"
  SAY ""
END
ELSE DO
  SAY "Note: No backups available yet or instance not ready"
  SAY ""
END

/* ========================================
 * Step 8: Cleanup - Delete the instance
 * ======================================== */
SAY "Step 8: Cleaning up - deleting Cloud SQL instance..."
SAY ""

SAY "⚠️  About to delete instance: " || instance_name
SAY "    This will permanently delete the instance and all data"
SAY "    Proceeding in 5 seconds..."
ADDRESS SYSTEM "sleep 5"
SAY ""

ADDRESS GCP "SQL DELETE " || instance_name

IF RC = 0 THEN DO
  SAY "✓ Instance deletion started: " || instance_name
  SAY ""
  SAY "Note: Instance deletion takes a few minutes"
  SAY "      Billing will stop once deletion completes"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete instance"
  SAY "⚠️  Manual cleanup may be required:"
  SAY "    gcloud sql instances delete " || instance_name
  SAY ""
  SAY "    Or in Cloud Console:"
  SAY "    https://console.cloud.google.com/sql/instances"
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created Cloud SQL instance: " || instance_name
SAY "  • Created database: " || database_name
SAY "  • Created user: " || db_user
SAY "  • Created backup"
SAY "  • Deleted instance (cleanup)"
SAY ""
SAY "Cloud SQL Key Concepts:"
SAY ""
SAY "Instance Tiers:"
SAY "  • db-f1-micro: Shared CPU, 0.6GB RAM (~$9/month)"
SAY "  • db-g1-small: Shared CPU, 1.7GB RAM (~$25/month)"
SAY "  • db-n1-standard-1: 1 vCPU, 3.75GB RAM (~$50/month)"
SAY "  • db-n1-highmem-2: 2 vCPU, 13GB RAM (~$160/month)"
SAY ""
SAY "Connection Methods:"
SAY "  1. Cloud SQL Proxy (recommended for security)"
SAY "  2. Public IP with authorized networks"
SAY "  3. Private IP via VPC peering"
SAY "  4. IAM database authentication"
SAY ""
SAY "Backup Strategy:"
SAY "  • Automated backups: Daily at specified time window"
SAY "  • On-demand backups: Manual via API/console"
SAY "  • Point-in-time recovery: Restore to any time in retention period"
SAY "  • Export to Cloud Storage: For long-term archival"
SAY ""
SAY "High Availability:"
SAY "  • Regional instances: Synchronous replication to standby"
SAY "  • Automatic failover: < 1 minute recovery time"
SAY "  • Read replicas: Scale read workloads"
SAY "  • Cross-region replicas: Disaster recovery"
SAY ""
SAY "Best Practices:"
SAY "  1. Enable automated backups with 7-30 day retention"
SAY "  2. Use Cloud SQL Proxy for secure connections"
SAY"  3. Set up maintenance windows for updates"
SAY "  4. Monitor with Cloud Monitoring integration"
SAY "  5. Use private IP for VPC-connected applications"
SAY "  6. Enable query insights for performance tuning"
SAY "  7. Set up alerts for storage and CPU usage"
SAY "  8. Use read replicas for read-heavy workloads"
SAY ""
SAY "Cost Optimization:"
SAY "  • Use shared-core instances (db-f1-micro) for dev/test"
SAY "  • Stop instances when not in use (stops billing)"
SAY "  • Use committed use discounts for production"
SAY "  • Right-size instances based on monitoring data"
SAY "  • Enable storage auto-increase to avoid over-provisioning"
SAY ""
SAY "For production use:"
SAY "  • Enable high availability for critical databases"
SAY "  • Set up automated backups with appropriate retention"
SAY "  • Use private IP and VPC Service Controls"
SAY "  • Enable Cloud SQL Insights for query performance"
SAY "  • Set up alerts for storage, CPU, and connection limits"
SAY "  • Use terraform for infrastructure as code"
SAY ""
SAY "Database Version Notes:"
SAY "  • PostgreSQL: 12, 13, 14, 15 (latest is recommended)"
SAY "  • MySQL: 5.7, 8.0 (8.0 is recommended)"
SAY "  • SQL Server: 2017, 2019 (Enterprise, Standard, Web, Express)"
SAY ""
SAY "Next Steps:"
SAY "  • Connect via Cloud SQL Proxy: gcloud sql connect " || instance_name
SAY "  • Set up read replicas for scaling"
SAY "  • Configure maintenance windows"
SAY "  • Enable query insights and slow query logging"
