# GCP ADDRESS Handler TODO

## ✅ What's Working Now

### Core Services (Implemented & Tested)
- ✅ **Google Sheets** - SQL-like operations, aliases, natural language WHERE clauses
- ✅ **Cloud Functions (2nd gen)** - Deploy with inline Python code, JSON-based URL extraction, delete
- ✅ **Cloud Run** - Deploy containers from images, JSON-based URL extraction, delete
- ✅ **BigQuery** - Query operations, batch queries, transactions
- ✅ **Firestore** - Document operations (SET, GET, DELETE)
- ✅ **Cloud Storage** - Bucket and object operations (CREATE, UPLOAD, DOWNLOAD, DELETE)
- ✅ **Pub/Sub** - Publish/subscribe messaging (CREATE TOPIC, PUBLISH, SUBSCRIBE)
- ✅ **Apps Script** - Script deployment and execution

### Enhanced Features Working
- ✅ **Sheet aliases** - Readable names instead of long IDs
- ✅ **Result chains** - Explicit data flow with `→` operator
- ✅ **Natural language operators** - IS, ABOVE, BELOW, CONTAINS
- ✅ **Standardized parameters** - Consistent key="value" syntax
- ✅ **Intelligent error detection** - Auto-detects API/permission issues with fix instructions
- ✅ **JSON-based responses** - Structured data from gcloud describe commands
- ✅ **HTTP functions** - Return structured `{status, body, headers, ok}` objects

### Working Examples
- ✅ `test-cloudfunction-inline-python-helloworld.rexx` - Cloud Functions with HEREDOC Python
- ✅ `test-cloudrun-hello.rexx` - Cloud Run container deployment
- ✅ Both include deploy → test → cleanup workflows

---

## 🎯 High Priority - Infrastructure as Code (IaC)

### Compute Engine (VM Management)
```rexx
/* Instance lifecycle */
ADDRESS GCP "COMPUTE CREATE instance-name MACHINE n1-standard-1 ZONE us-central1-a IMAGE debian-11"
ADDRESS GCP "COMPUTE START instance-name"
ADDRESS GCP "COMPUTE STOP instance-name"
ADDRESS GCP "COMPUTE DELETE instance-name"
ADDRESS GCP "COMPUTE LIST → instances"

/* Instance templates & groups */
ADDRESS GCP "COMPUTE CREATE TEMPLATE web-server IMAGE container-vm CONTAINER nginx:latest"
ADDRESS GCP "COMPUTE CREATE INSTANCE-GROUP web-servers TEMPLATE web-server SIZE 3"
ADDRESS GCP "COMPUTE AUTOSCALE web-servers MIN 2 MAX 10 TARGET-CPU 0.8"
```

**Use Cases**:
- Automated VM provisioning for dev/test environments
- Instance template management
- Managed instance groups with autoscaling
- Spot/preemptible instance creation for cost savings

### VPC & Networking
```rexx
/* Network configuration */
ADDRESS GCP "VPC CREATE NETWORK prod-vpc SUBNET prod-subnet REGION us-central1 RANGE 10.0.0.0/24"
ADDRESS GCP "VPC CREATE FIREWALL allow-http NETWORK prod-vpc ALLOW tcp:80,tcp:443"
ADDRESS GCP "VPC CREATE LOAD-BALANCER web-lb BACKEND-SERVICE web-servers"

/* DNS management */
ADDRESS GCP "DNS CREATE ZONE example-com DOMAIN example.com"
ADDRESS GCP "DNS ADD-RECORD example-com TYPE A NAME www VALUE 35.1.2.3"
```

**Use Cases**:
- Automated network provisioning
- Firewall rule management
- Load balancer configuration
- DNS record updates for deployments

### IAM & Security
```rexx
/* Service accounts & permissions */
ADDRESS GCP "IAM CREATE SERVICE-ACCOUNT app-deploy DISPLAY 'App Deployment Account'"
ADDRESS GCP "IAM GRANT app-deploy@project.iam.gserviceaccount.com ROLE roles/run.admin"
ADDRESS GCP "IAM CREATE KEY app-deploy → credentials"

/* Policy management */
ADDRESS GCP "IAM GET-POLICY resource='//cloudresourcemanager.googleapis.com/projects/my-project' → policy"
ADDRESS GCP "IAM SET-POLICY resource='...' policy='@policy'"
```

**Use Cases**:
- Service account lifecycle management
- Least-privilege permission setup
- Key rotation automation
- Policy-as-code

### Cloud SQL
```rexx
/* Database provisioning */
ADDRESS GCP "SQL CREATE INSTANCE prod-db TIER db-n1-standard-1 DATABASE postgres VERSION 14"
ADDRESS GCP "SQL CREATE DATABASE appdb INSTANCE prod-db"
ADDRESS GCP "SQL CREATE USER appuser INSTANCE prod-db PASSWORD '{password}'"
ADDRESS GCP "SQL BACKUP INSTANCE prod-db → backup_info"
```

**Use Cases**:
- Database provisioning for applications
- Automated backups
- User management
- Point-in-time recovery

---

## 💰 Billing & Cost Management

### Cost Tracking
```rexx
/* Budget alerts */
ADDRESS GCP "BILLING CREATE BUDGET monthly-limit AMOUNT 1000 THRESHOLD 50,80,100 NOTIFY pubsub:billing-alerts"
ADDRESS GCP "BILLING GET-COSTS START 2025-10-01 END 2025-10-31 GROUP-BY service → costs"

/* Cost analysis */
ADDRESS GCP "BILLING EXPORT-TO-BIGQUERY DATASET billing_data TABLE gcp_costs"
ADDRESS BIGQUERY "SELECT service, SUM(cost) FROM billing_data.gcp_costs GROUP BY service → cost_breakdown"

/* Rightsizing recommendations */
ADDRESS GCP "RECOMMENDER LIST TYPE compute.instance.MachineTypeRecommender → recommendations"
```

**Use Cases**:
- Automated budget alerts
- Cost attribution by team/project
- Idle resource detection
- Rightsizing recommendations
- Forecasting based on trends

### Resource Quotas
```rexx
/* Quota management */
ADDRESS GCP "QUOTAS LIST SERVICE compute.googleapis.com → quotas"
ADDRESS GCP "QUOTAS GET METRIC compute.googleapis.com/cpus REGION us-central1 → cpu_quota"
ADDRESS GCP "QUOTAS REQUEST-INCREASE METRIC compute.googleapis.com/cpus VALUE 1000 REASON 'Black Friday preparation'"
```

**Use Cases**:
- Quota monitoring
- Proactive quota increase requests
- Multi-project quota tracking

---

## 📊 Monitoring & Observability

### Cloud Monitoring (Stackdriver)
```rexx
/* Metrics & alerts */
ADDRESS GCP "MONITORING CREATE METRIC custom.googleapis.com/app/requests_per_second TYPE gauge"
ADDRESS GCP "MONITORING WRITE custom.googleapis.com/app/requests_per_second VALUE 1250 LABELS 'service=api,region=us-central1'"

/* Alerting policies */
ADDRESS GCP "MONITORING CREATE ALERT high-cpu-alert
  CONDITION 'compute.googleapis.com/instance/cpu/utilization > 0.9 FOR 5m'
  NOTIFY pubsub:ops-alerts"

/* Uptime checks */
ADDRESS GCP "MONITORING CREATE UPTIME-CHECK api-health
  URL https://api.example.com/health
  INTERVAL 60s
  TIMEOUT 10s"
```

**Use Cases**:
- Custom application metrics
- Alert policy management
- SLO/SLI tracking
- Uptime monitoring

### Cloud Logging
```rexx
/* Log analysis */
ADDRESS GCP "LOGGING READ FILTER 'resource.type=cloud_function AND severity>=ERROR' LIMIT 100 → errors"
ADDRESS GCP "LOGGING CREATE SINK error-logs DESTINATION storage:error-log-bucket FILTER 'severity>=ERROR'"

/* Log-based metrics */
ADDRESS GCP "LOGGING CREATE METRIC error_count
  FILTER 'severity=ERROR'
  TYPE counter
  DESCRIPTION 'Count of error log entries'"
```

**Use Cases**:
- Error log aggregation
- Compliance log archival
- Log-based alerting
- Audit trail analysis

### Cloud Trace & Profiler
```rexx
/* Performance analysis */
ADDRESS GCP "TRACE GET TRACE-ID abc123 → trace_details"
ADDRESS GCP "PROFILER GET-DATA SERVICE frontend TIME-RANGE '1h' TYPE cpu → profile_data"
```

**Use Cases**:
- Distributed tracing analysis
- Performance bottleneck detection
- CPU/memory profiling

---

## 🔍 Audit & Compliance

### Cloud Audit Logs
```rexx
/* Audit log queries */
ADDRESS GCP "AUDIT-LOGS READ
  TIME-RANGE '7d'
  FILTER 'protoPayload.methodName=storage.objects.delete'
  → deletion_audit"

/* Admin activity tracking */
ADDRESS GCP "AUDIT-LOGS READ
  LOG-TYPE admin_activity
  FILTER 'protoPayload.authenticationInfo.principalEmail=*@example.com'
  → admin_changes"

/* Data access audit */
ADDRESS GCP "AUDIT-LOGS READ
  LOG-TYPE data_access
  RESOURCE projects/my-project/datasets/sensitive_data
  → data_access_logs"
```

**Use Cases**:
- Who deleted what and when
- Admin action tracking
- Data access auditing
- Compliance reporting (SOC2, HIPAA, etc.)

### Security Command Center
```rexx
/* Vulnerability scanning */
ADDRESS GCP "SECURITY FINDINGS LIST CATEGORY vulnerability → vulnerabilities"
ADDRESS GCP "SECURITY FINDINGS FILTER 'severity=HIGH AND state=ACTIVE' → critical_issues"

/* Compliance posture */
ADDRESS GCP "SECURITY COMPLIANCE-SCAN STANDARD pci-dss → compliance_report"
```

**Use Cases**:
- Security vulnerability tracking
- Compliance posture management
- Threat detection
- Misconfiguration identification

### Organization Policy
```rexx
/* Policy enforcement */
ADDRESS GCP "ORG-POLICY SET constraints/compute.vmExternalIpAccess DENY ALL"
ADDRESS GCP "ORG-POLICY SET constraints/iam.allowedPolicyMemberDomains ALLOW example.com"
ADDRESS GCP "ORG-POLICY LIST → policies"
```

**Use Cases**:
- Preventive security controls
- Resource restriction policies
- Multi-project governance

---

## 📦 Inventory & Asset Management

### Cloud Asset Inventory
```rexx
/* Resource discovery */
ADDRESS GCP "ASSETS LIST TYPE compute.googleapis.com/Instance → all_instances"
ADDRESS GCP "ASSETS LIST TYPE storage.googleapis.com/Bucket → all_buckets"
ADDRESS GCP "ASSETS SEARCH QUERY 'labels.env=prod' → prod_resources"

/* Change tracking */
ADDRESS GCP "ASSETS ANALYZE-IAM-POLICY IDENTITY user@example.com → user_access"
ADDRESS GCP "ASSETS EXPORT-ALL DESTINATION storage:asset-inventory-bucket SNAPSHOT-TIME now"

/* Resource relationships */
ADDRESS GCP "ASSETS LIST-RELATIONSHIPS RESOURCE projects/my-project/instances/web-1 → dependencies"
```

**Use Cases**:
- Resource inventory across projects
- Untagged resource detection
- Orphaned resource cleanup
- Impact analysis for changes
- IAM policy analysis

### Resource Tagging & Organization
```rexx
/* Label management */
ADDRESS GCP "LABELS SET RESOURCE compute/instances/web-1 LABELS 'env=prod,team=platform,cost-center=engineering'"
ADDRESS GCP "LABELS LIST-RESOURCES FILTER 'labels.env=dev AND labels.team=platform' → dev_platform_resources"

/* Resource hierarchy */
ADDRESS GCP "RESOURCE-MANAGER LIST-FOLDERS PARENT organizations/123456 → folders"
ADDRESS GCP "RESOURCE-MANAGER LIST-PROJECTS PARENT folders/789 → projects"
```

**Use Cases**:
- Cost allocation by team/environment
- Policy application by labels
- Resource organization
- Automated tagging enforcement

---

## 🚀 Advanced Integration Examples

### Multi-Service Orchestration
```rexx
#!/usr/bin/env rexx
/* Deploy application with full observability */

LET deployment = <<DEPLOY_APP
@SECTION infrastructure
COMPUTE CREATE INSTANCE app-server MACHINE n1-standard-2 ZONE us-central1-a
SQL CREATE INSTANCE app-db TIER db-n1-standard-1 DATABASE postgres
VPC CREATE FIREWALL allow-app NETWORK default ALLOW tcp:8080

@SECTION application
RUN DEPLOY api-service IMAGE gcr.io/project/api:v2.0 REGION us-central1
FUNCTIONS DEPLOY worker SOURCE ./worker TRIGGER pubsub:tasks RUNTIME python311

@SECTION monitoring
MONITORING CREATE ALERT api-errors
  CONDITION 'custom.googleapis.com/api/errors > 10 FOR 5m'
  NOTIFY pubsub:ops-alerts

@SECTION cost-control
BILLING CREATE BUDGET app-budget AMOUNT 500 THRESHOLD 80,100

@SECTION audit
AUDIT-LOGS CREATE SINK app-audit
  DESTINATION bigquery:audit_logs.app_events
  FILTER 'resource.type=cloud_run_revision OR resource.type=cloud_function'
DEPLOY_APP

ADDRESS GCP deployment
```

### Compliance & Security Automation
```rexx
#!/usr/bin/env rexx
/* Weekly compliance check */

ADDRESS GCP "SECURITY FINDINGS LIST CATEGORY vulnerability STATE ACTIVE → vulnerabilities"

IF @vulnerabilities.count > 0 THEN DO
  /* Store in BigQuery for tracking */
  ADDRESS GCP "BIGQUERY INSERT INTO security.vulnerabilities SELECT * FROM @vulnerabilities"

  /* Alert security team */
  ADDRESS GCP "PUBSUB PUBLISH topic='security-alerts'
    message='Found {vulnerabilities.count} active vulnerabilities'"
END

/* Check for public buckets */
ADDRESS GCP "STORAGE LIST-BUCKETS → buckets"
DO i = 1 TO @buckets.count
  LET bucket = @buckets[i]
  ADDRESS GCP "STORAGE GET-IAM bucket={bucket.name} → iam_policy"
  LET is_public = POS('allUsers', @iam_policy)
  IF is_public > 0 THEN DO
    SAY "⚠️  Public bucket found: " || bucket.name
    ADDRESS GCP "STORAGE REMOVE-PUBLIC bucket={bucket.name}"
  END
END
```

### Cost Optimization Workflow
```rexx
#!/usr/bin/env rexx
/* Monthly cost optimization */

/* Find idle instances */
ADDRESS GCP "MONITORING READ
  METRIC compute.googleapis.com/instance/cpu/utilization
  TIME-RANGE 7d → cpu_usage"

DO i = 1 TO @cpu_usage.timeSeries.length
  LET instance = @cpu_usage.timeSeries[i]
  LET avg_cpu = MEAN(instance.points)

  IF avg_cpu < 0.05 THEN DO
    SAY "Idle instance: " || instance.resource.instance_id
    /* Stop for cost savings */
    ADDRESS GCP "COMPUTE STOP {instance.resource.instance_id}"
  END
END

/* Analyze storage costs */
ADDRESS BIGQUERY "
  SELECT
    bucket_name,
    SUM(size_bytes) / 1024 / 1024 / 1024 as size_gb,
    storage_class,
    AVG(access_count) as avg_access
  FROM billing_data.storage_usage
  WHERE last_access < DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
  GROUP BY bucket_name, storage_class
  HAVING size_gb > 100
  → cold_storage"

/* Recommend storage class changes */
SAY "Cold storage candidates:"
DO i = 1 TO @cold_storage.rows.length
  LET bucket = @cold_storage.rows[i]
  SAY bucket.bucket_name || ": " || bucket.size_gb || "GB - recommend Coldline"
END
```

---

## 🛠️ Implementation Priority

### Phase 1: Core IaC (Next)
1. **Compute Engine** - Instance lifecycle, templates, groups
2. **VPC & Networking** - Networks, firewalls, load balancers
3. **Cloud SQL** - Database provisioning and management

### Phase 2: Billing & Cost (High Value)
1. **Billing API** - Budget creation, cost queries
2. **Recommender API** - Rightsizing, idle resources
3. **Quota Management** - Quota tracking and requests

### Phase 3: Monitoring (Operations)
1. **Cloud Monitoring** - Metrics, alerts, uptime checks
2. **Cloud Logging** - Log queries, sinks, metrics
3. **Error Reporting** - Error aggregation and analysis

### Phase 4: Security & Compliance
1. **IAM Management** - Service accounts, roles, policies
2. **Audit Logs** - Query and export capabilities
3. **Security Command Center** - Findings and compliance
4. **Organization Policy** - Policy enforcement

### Phase 5: Asset Management
1. **Cloud Asset Inventory** - Resource discovery, search
2. **Resource Manager** - Hierarchy management
3. **Tagging & Labels** - Organization and cost allocation

---

## 📝 Notes

### Authentication
All operations require proper authentication:
- Service account with appropriate roles
- `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Necessary APIs enabled

### Required APIs by Feature
- **Compute**: `compute.googleapis.com`
- **Networking**: `compute.googleapis.com`, `dns.googleapis.com`
- **SQL**: `sqladmin.googleapis.com`
- **Billing**: `cloudbilling.googleapis.com`, `bigquery.googleapis.com`
- **Monitoring**: `monitoring.googleapis.com`, `logging.googleapis.com`
- **Security**: `securitycenter.googleapis.com`
- **Assets**: `cloudasset.googleapis.com`
- **IAM**: `iam.googleapis.com`, `cloudresourcemanager.googleapis.com`

### Design Principles
1. **Consistent syntax** across all services
2. **Intelligent error detection** with actionable fix instructions
3. **JSON-based responses** for structured data
4. **Result chains** for cross-service workflows
5. **Natural language** where appropriate (IS, ABOVE, BELOW, etc.)
6. **Idempotent operations** where possible

---

**Last Updated**: 2025-10-01
**Status**: Cloud Functions & Cloud Run working with JSON extraction, HTTP structured responses
