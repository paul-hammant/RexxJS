# Google Cloud Platform (GCP) Unified ADDRESS Handler

**The modern cloud orchestration language for Google Cloud Platform**

RexxJS's unified GCP ADDRESS handler provides service-specific command languages for all major Google Cloud services, designed for both simple operations and complex HEREDOC-style orchestration.

## 🚀 Killer Features

### **Direct Spreadsheet Access**
```rexx
ADDRESS GCP
"SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Sales' WHERE amount > 1000"
```
No connection setup needed - just use the spreadsheet ID directly!

### **SQL-like Operations on Google Sheets**
```rexx
"SHEETS CONNECT spreadsheet='abc123'"
"SHEETS SELECT product, SUM(revenue) FROM 'Q1 Sales' GROUP BY product"
"SHEETS INSERT INTO 'Orders' VALUES ('Widget', 299.99, 'pending')"
"SHEETS UPDATE 'Inventory' SET quantity = quantity - 1 WHERE sku = 'WIDGET001'"
```

### **HEREDOC Orchestration**
```rexx
LET workflow = <<DAILY_OPS
SHEETS SELECT * FROM 'Orders' WHERE date = TODAY()
BIGQUERY INSERT INTO analytics.daily_orders SELECT * FROM SHEETS_RESULT
FIRESTORE SET /metrics/today {"orders": 342, "revenue": 125000}
PUBSUB PUBLISH daily-metrics MESSAGE '{"status": "complete"}'
STORAGE UPLOAD FILE report.pdf TO bucket='reports' AS 'daily/report.pdf'
DAILY_OPS

DO cmd OVER LINES(workflow)
  ADDRESS GCP cmd
END
```

### **Cross-Service Data Flow**
```rexx
# Extract from Sheets → Analyze in BigQuery → Store in Firestore → Notify via Pub/Sub
ADDRESS GCP
"SHEETS SELECT * FROM 'Customer Data'"
"BIGQUERY SELECT customer_id, predicted_churn FROM ML.PREDICT(MODEL churn_model, TABLE SHEETS_RESULT)"
"FIRESTORE SET /predictions/batch_{timestamp} BIGQUERY_RESULT"
"PUBSUB PUBLISH churn-alerts MESSAGE 'Batch prediction complete'"
```

## 🎯 What This Replaces

- **Google Apps Script** - Superior function library and local/cloud flexibility
- **Complex gcloud scripting** - Natural, readable command syntax
- **Zapier/IFTTT integrations** - Native cross-service workflows
- **ETL pipeline tools** - Direct data flow between services
- **Multiple SDK integrations** - Single unified interface

## 📊 Supported Services

| Service | Keywords | Purpose |
|---------|----------|---------|
| **Google Sheets** | `SHEETS`, `SHEET` | SQL-like spreadsheet operations |
| **BigQuery** | `BIGQUERY`, `BQ` | Analytics, ML, large dataset processing |
| **Firestore** | `FIRESTORE`, `FS` | Real-time document database |
| **Cloud Storage** | `STORAGE`, `GCS` | File and object storage |
| **Pub/Sub** | `PUBSUB` | Message queuing and event streaming |
| **Cloud Functions** | `FUNCTIONS`, `FUNCTION` | Serverless function deployment |
| **Cloud Run** | `RUN` | Containerized service deployment |
| **Compute Engine** | `COMPUTE`, `VM` | Virtual machine management |

## 🏁 Quick Start

### Prerequisites
```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate and set project
gcloud init
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### Basic Usage
```rexx
#!/usr/bin/env rexx
REQUIRE "extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP
"SHEETS 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Data'"
SAY "Found " || RESULT.count || " rows"
```

## 📝 Service-Specific Languages

### **SHEETS** - Google Sheets Operations

#### Connection and Direct Access
```rexx
# Method 1: Connect to spreadsheet
"SHEETS CONNECT spreadsheet='1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'"
"SHEETS SELECT * FROM 'Sales Data'"

# Method 2: Direct access (no CONNECT needed)
"SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Sales Data'"
```

#### SQL-like Operations
```rexx
# Data querying
"SHEETS SELECT A:D FROM 'Q1 Sales' WHERE revenue > 1000"
"SHEETS SELECT product, SUM(revenue) FROM 'Sales' GROUP BY product"

# Data modification
"SHEETS INSERT INTO 'Orders' VALUES ('Product A', 299.99, 'pending', TODAY())"
"SHEETS UPDATE 'Inventory' SET quantity = quantity - 5 WHERE sku = 'ABC123'"
"SHEETS DELETE FROM 'Temp Data' WHERE processed = true"

# Sheet management
"SHEETS CREATE SHEET 'Monthly Report' WITH COLUMNS ('Date', 'Revenue', 'Orders')"
"SHEETS FORMULA B10 '=SUM(B1:B9)'"
"SHEETS FORMAT A1:D1 BOLD TRUE BACKGROUND 'yellow'"
```

### **BIGQUERY** - Analytics and Machine Learning

#### Dataset and Query Operations
```rexx
# Dataset selection
"BIGQUERY USE DATASET analytics.sales_data"

# Standard SQL queries
"BIGQUERY SELECT
   product_category,
   SUM(revenue) as total_revenue,
   COUNT(*) as transactions
 FROM daily_sales
 WHERE date >= CURRENT_DATE() - 30
 GROUP BY product_category
 ORDER BY total_revenue DESC"

# Data loading
"BIGQUERY INSERT INTO staging_table SELECT * FROM SHEETS_RESULT"
"BIGQUERY CREATE TABLE monthly_summary AS SELECT * FROM daily_aggregates"

# ML operations
"BIGQUERY CREATE OR REPLACE MODEL customer_churn
 OPTIONS(model_type='logistic_reg', input_label_cols=['churn'])
 AS SELECT * FROM training_data"

"BIGQUERY SELECT * FROM ML.PREDICT(MODEL customer_churn, TABLE new_customers)"
```

### **FIRESTORE** - Document Database

#### Path-based Operations
```rexx
# Document operations
"FIRESTORE GET /users/john/profile"
"FIRESTORE SET /users/john/preferences {theme: 'dark', notifications: true}"
"FIRESTORE DELETE /sessions/expired/*"

# Queries
"FIRESTORE QUERY /orders WHERE status = 'pending' AND total > 100"
"FIRESTORE QUERY /products WHERE category = 'electronics' ORDER BY price"

# Real-time monitoring
"FIRESTORE WATCH /inventory/* FOR changes"
"FIRESTORE WATCH /orders WHERE status = 'pending'"
```

### **STORAGE** - File and Object Storage

#### File Operations
```rexx
# Upload/Download
"STORAGE UPLOAD FILE '/tmp/report.pdf' TO bucket='reports' AS '2024/jan/report.pdf'"
"STORAGE DOWNLOAD 'gs://backups/database.sql' TO '/tmp/restore.sql'"

# Bucket management
"STORAGE CREATE BUCKET 'new-archive' LOCATION 'us-central1' CLASS 'NEARLINE'"
"STORAGE LIST BUCKET 'images' PREFIX 'thumbnails/'"
"STORAGE DELETE 'gs://temp-files/*' OLDER_THAN '30 days'"

# Batch operations
"STORAGE SYNC LOCAL '/data/' TO 'gs://backup-bucket/data/'"
```

### **PUBSUB** - Message Queuing

#### Topic and Message Operations
```rexx
# Topic management
"PUBSUB CREATE TOPIC order-events"
"PUBSUB CREATE SUBSCRIPTION order-processor TOPIC order-events"

# Publishing
"PUBSUB PUBLISH order-events MESSAGE '{\"order_id\": 12345, \"status\": \"shipped\"}'"
"PUBSUB PUBLISH notifications MESSAGE 'Daily report generated'"

# Subscribing and processing
"PUBSUB SUBSCRIBE TO order-events AS order-processor"
"PUBSUB PULL order-processor MAX 10"
"PUBSUB ACK order-processor MESSAGE_ID 'abc123'"
```

### **FUNCTIONS** - Serverless Deployment

#### Function Management
```rexx
# Deploy functions
"FUNCTIONS DEPLOY process-image SOURCE './src' TRIGGER 'storage:images-bucket' RUNTIME 'python39'"
"FUNCTIONS DEPLOY api-handler SOURCE './api' TRIGGER 'http' RUNTIME 'nodejs20'"

# Function operations
"FUNCTIONS INVOKE process-image DATA '{\"file\": \"photo.jpg\"}'"
"FUNCTIONS DELETE old-function"
"FUNCTIONS LIST"
"FUNCTIONS LOGS process-image LIMIT 50"
```

### **RUN** - Container Services

#### Service Deployment
```rexx
# Deploy services
"RUN DEPLOY hello-app IMAGE 'gcr.io/project/hello:latest' REGION 'us-central1'"
"RUN DEPLOY api-service IMAGE 'gcr.io/project/api:v2' MEMORY '2Gi' CPU '2'"

# Service management
"RUN UPDATE hello-app SET memory='4Gi' max_instances=20"
"RUN TRAFFIC hello-app SPLIT 'v1=50,v2=50'"
"RUN DELETE old-service"
"RUN LIST REGION 'us-central1'"
```

## 🔥 Real-World Examples

### E-commerce Dashboard Automation
```rexx
#!/usr/bin/env rexx
/* Automated daily e-commerce dashboard update */

REQUIRE "address-gcp.js"
ADDRESS GCP

LET dashboard_update = <<DASHBOARD
# Pull overnight orders
SHEETS CONNECT spreadsheet='orders-live-2024'
SHEETS SELECT order_id, total, customer FROM 'New Orders' WHERE DATE(timestamp) = TODAY()

# Analyze in BigQuery
BIGQUERY USE DATASET ecommerce.analytics
BIGQUERY INSERT INTO daily_orders SELECT * FROM SHEETS_RESULT
BIGQUERY SELECT SUM(total) as revenue, COUNT(*) as orders, AVG(total) as avg_order FROM daily_orders

# Update metrics in Firestore
FIRESTORE SET /dashboard/today BIGQUERY_RESULT

# Generate report
STORAGE UPLOAD CONTENT 'Daily report generated' TO bucket='reports' AS 'daily/report.txt'

# Notify team
PUBSUB PUBLISH dashboard-ready MESSAGE 'Daily dashboard updated'
DASHBOARD

DO cmd OVER LINES(dashboard_update)
  IF LEFT(cmd, 1) <> '#' & LENGTH(STRIP(cmd)) > 0 THEN DO
    ADDRESS GCP cmd
    SAY "✓ " || WORD(cmd, 1) || " " || WORD(cmd, 2)
  END
END
```

### Customer Churn Prediction Pipeline
```rexx
#!/usr/bin/env rexx
/* ML pipeline for customer churn prediction */

LET ml_pipeline = <<ML_WORKFLOW
# Extract training data from Sheets
SHEETS CONNECT spreadsheet='customer-analytics'
SHEETS SELECT customer_id, recency, frequency, monetary, churn FROM 'Training Data'

# Load into BigQuery
BIGQUERY USE DATASET ml_models.customer_analytics
BIGQUERY CREATE OR REPLACE TABLE training_data AS SELECT * FROM SHEETS_RESULT

# Train churn prediction model
BIGQUERY CREATE OR REPLACE MODEL churn_predictor
OPTIONS(model_type='logistic_reg', input_label_cols=['churn'])
AS SELECT recency, frequency, monetary, churn FROM training_data

# Score current customers
SHEETS SELECT customer_id, recency, frequency, monetary FROM 'Current Customers'
BIGQUERY CREATE OR REPLACE TABLE predictions AS
SELECT customer_id, predicted_churn, predicted_churn_probs
FROM ML.PREDICT(MODEL churn_predictor, (SELECT * FROM SHEETS_RESULT))

# Store high-risk customers in Firestore
FIRESTORE DELETE /churn_alerts/*
BIGQUERY SELECT customer_id, predicted_churn_probs[OFFSET(1)] as risk_score
FROM predictions WHERE predicted_churn = 1

FIRESTORE SET /churn_alerts/high_risk BIGQUERY_RESULT

# Alert customer success team
PUBSUB PUBLISH customer-alerts MESSAGE 'New churn predictions available'
ML_WORKFLOW

SAY "🤖 Running ML pipeline..."
DO cmd OVER LINES(ml_pipeline)
  IF LEFT(cmd, 1) <> '#' & LENGTH(STRIP(cmd)) > 0 THEN ADDRESS GCP cmd
END
```

### Multi-Service Application Deployment
```rexx
#!/usr/bin/env rexx
/* Deploy complete application stack */

LET deployment = <<DEPLOY_STACK
# Infrastructure
STORAGE CREATE BUCKET 'app-storage-prod' LOCATION 'us-central1'
PUBSUB CREATE TOPIC app-events
PUBSUB CREATE TOPIC user-notifications

# Backend services
FUNCTIONS DEPLOY event-processor SOURCE './functions/events' TRIGGER 'pubsub:app-events' RUNTIME 'python311'
FUNCTIONS DEPLOY notification-sender SOURCE './functions/notify' TRIGGER 'pubsub:user-notifications' RUNTIME 'nodejs20'

# API and web services
RUN DEPLOY api-service IMAGE 'gcr.io/project/api:v1.0.0' REGION 'us-central1' MEMORY '1Gi'
RUN DEPLOY web-frontend IMAGE 'gcr.io/project/web:v1.0.0' REGION 'us-central1' MEMORY '512Mi'

# Database initialization
FIRESTORE SET /config/app {version: '1.0.0', deployed: TODAY()}
FIRESTORE SET /metrics/init {users: 0, orders: 0, revenue: 0}

# Backup and monitoring setup
BIGQUERY USE DATASET analytics.application
BIGQUERY CREATE TABLE app_logs AS SELECT timestamp, level, message FROM EXTERNAL_TABLE
DEPLOY_STACK

SAY "🚀 Deploying application stack..."
DO cmd OVER LINES(deployment)
  IF LEFT(cmd, 1) <> '#' & LENGTH(STRIP(cmd)) > 0 THEN DO
    ADDRESS GCP cmd
    IF RESULT.success THEN SAY "  ✓ " || WORD(cmd, 1) || " " || WORD(cmd, 2)
  END
END
```

## 💡 Advanced Features

### Conditional Workflows
```rexx
LET workflow = <<CONDITIONAL
CONDITION: DAY(DATE()) = 1  # First of month
BIGQUERY CREATE TABLE monthly_summary AS SELECT * FROM daily_metrics
SHEETS CREATE SHEET 'Month Summary'
STORAGE UPLOAD FILE monthly_report.pdf TO bucket='reports'

CONDITION: HOUR(TIME()) < 9  # Morning hours
SHEETS SELECT * FROM 'Overnight Orders'
PUBSUB PUBLISH morning-batch MESSAGE 'Processing overnight orders'
CONDITIONAL
```

### Dynamic Command Generation
```rexx
# Generate commands based on data
ADDRESS GCP
"SHEETS SELECT sku, quantity FROM 'Inventory' WHERE quantity < reorder_point"
LET low_stock = RESULT

DO i = 1 TO low_stock.count
  LET item = low_stock.rows[i]
  ADDRESS GCP "PUBSUB PUBLISH reorder-queue MESSAGE '{\"sku\":\"" || item.sku || "\"}'"
END
```

### Cross-Service Error Handling
```rexx
ADDRESS GCP
"BIGQUERY SELECT * FROM analytics.daily_sales"
IF RESULT.success THEN DO
  "SHEETS INSERT INTO 'Dashboard' VALUES " || RESULT.summary
  IF RESULT.success THEN DO
    "PUBSUB PUBLISH dashboard-updated MESSAGE 'Success'"
  END
  ELSE DO
    "PUBSUB PUBLISH errors MESSAGE 'Sheet update failed'"
  END
END
```

## 🧪 Testing

### Unit Tests
```bash
cd extras/addresses/provisioning-and-orchestration
npx jest __tests__/address-gcp-unified.test.js
```

### Integration Tests
```bash
# Run example scripts
./example-gcp-sheets-automation.rexx
./example-gcp-heredoc-orchestration.rexx
```

## 🔧 Configuration

### Authentication
```bash
# Required setup
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### Service Enablement
```bash
# Enable required APIs
gcloud services enable sheets.googleapis.com
gcloud services enable bigquery.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable run.googleapis.com
```

### Optional: Install Google Cloud SDKs for Direct API Access
```bash
npm install @google-cloud/bigquery @google-cloud/firestore @google-cloud/storage @google-cloud/pubsub googleapis
```
*Note: The handler falls back to gcloud CLI if SDKs aren't available*

## 🎯 Architecture Benefits

### **Unified Interface**
- Single ADDRESS handler for all GCP services
- Consistent command patterns across services
- Natural service-to-service data flow

### **Service-Specific Languages**
- Each service has appropriate command syntax
- SQL-like operations for Sheets and BigQuery
- Path-based operations for Firestore and Storage
- Message-oriented commands for Pub/Sub

### **HEREDOC-First Design**
- Complex workflows readable as documentation
- Comments inline with commands
- Conditional execution and loops
- Dynamic command generation

### **Local + Cloud Flexibility**
- Run locally for development
- Deploy as Cloud Functions for production
- Hybrid local/cloud workflows with CHECKPOINT

## 🚨 Troubleshooting

### Common Issues

**Authentication Errors**
```bash
gcloud auth login
gcloud auth application-default login
```

**Permission Denied**
```bash
# Check IAM roles
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

**API Not Enabled**
```bash
# Enable required services
gcloud services enable sheets.googleapis.com
gcloud services enable bigquery.googleapis.com
# ... etc
```

**Invalid Spreadsheet ID**
- Ensure spreadsheet is shared with your Google account
- Check that the ID is correct (from the URL)

### Debug Mode
```rexx
# Enable verbose logging
config.debug = true
ADDRESS GCP "SHEETS SELECT * FROM 'Debug'"
```

## 📚 Related Documentation

- [Example Scripts](./example-gcp-sheets-automation.rexx)
- [HEREDOC Orchestration Examples](./example-gcp-heredoc-orchestration.rexx)
- [Authentication Guide](./GCP-AUTHENTICATION.md)
- [RexxJS Documentation](../../README.md)

## 🎉 What Makes This Special

RexxJS's unified GCP ADDRESS handler is **the first cloud orchestration language** that:

1. **Treats Sheets as a Database** - SQL operations on spreadsheets
2. **Provides Service-Specific Languages** - Natural syntax for each service
3. **Enables HEREDOC Workflows** - Complex operations as readable documentation
4. **Works Locally and in Cloud** - Same code, multiple execution environments
5. **Replaces Multiple Tools** - Apps Script, gcloud scripting, Zapier, ETL tools

This isn't just another Google Cloud wrapper - it's a **new way to think about cloud orchestration**.

---

**License:** MIT - Same as RexxJS project