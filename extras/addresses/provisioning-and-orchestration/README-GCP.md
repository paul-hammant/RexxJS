# Google Cloud Platform (GCP) Unified ADDRESS Handler

**The modern cloud orchestration language for Google Cloud Platform with enhanced grammar**

RexxJS's unified GCP ADDRESS handler provides service-specific command languages for all major Google Cloud services, featuring enhanced grammar with aliases, result chains, natural language operators, and sectioned workflows.

## 🚀 Enhanced Grammar Features (v2.0)

### **Sheet Aliases for Readability**
```rexx
ADDRESS GCP
"SHEETS ALIAS orders='1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'"
"SHEETS SELECT * FROM orders.'New Orders' WHERE amount ABOVE 1000"
```
No more copying long spreadsheet IDs - use meaningful aliases!

### **Result Chain Syntax (→ operator)**
```rexx
"SHEETS SELECT * FROM orders.'Sales' WHERE date IS today → sales_data"
"BIGQUERY INSERT INTO staging SELECT * FROM @sales_data → staging_result"
"PUBSUB PUBLISH topic='alerts' message='@staging_result processed'"
```
Explicit data flow between services with variable references!

### **Natural Language Operators**
```rexx
"SHEETS SELECT * FROM 'Orders' WHERE amount ABOVE 1000"
"SHEETS SELECT * FROM 'Inventory' WHERE stock BELOW 10"
"SHEETS SELECT * FROM 'Users' WHERE status IS active"
"SHEETS SELECT * FROM 'Products' WHERE name CONTAINS 'widget'"
```
More intuitive than symbolic operators!

### **Standardized Parameter Syntax**
```rexx
"STORAGE UPLOAD file='report.pdf' bucket='company-docs' as='reports/monthly.pdf'"
"PUBSUB PUBLISH topic='notifications' message='Report ready'"
"SHEETS INSERT sheet='Orders' values='Widget,299.99,pending'"
```
Consistent key="value" format across all services!

### **Batch Operations**
```rexx
"SHEETS BATCH ['SELECT * FROM Q1', 'SELECT * FROM Q2', 'SELECT * FROM Q3'] → quarterly_data"
"BIGQUERY TRANSACTION ['CREATE TABLE temp AS SELECT * FROM @quarterly_data', 'DROP TABLE old_data']"
```
Multiple operations in a single command!

### **Sectioned HEREDOC Workflows**
```rexx
LET workflow = <<DAILY_ANALYTICS
@SECTION data-extraction
SHEETS ALIAS orders="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
SHEETS SELECT * FROM orders.'Daily Sales' WHERE date IS today → daily_orders

@SECTION analytics
BIGQUERY INSERT INTO staging SELECT * FROM @daily_orders → analysis_result
BIGQUERY SELECT SUM(revenue) as total FROM staging → revenue_total

@SECTION notifications
PUBSUB PUBLISH topic="daily-reports" message="Revenue: @revenue_total"
FIRESTORE SET /metrics/today {"revenue": "@revenue_total", "orders": "@analysis_result.count"}
DAILY_ANALYTICS

ADDRESS GCP workflow
```
Organized workflows with section-based results!

## 🎯 Killer Features

### **Direct Spreadsheet Access**
```rexx
ADDRESS GCP
"SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Sales' WHERE amount ABOVE 1000"
```
No connection setup needed - just use the spreadsheet ID directly!

### **SQL-like Operations on Google Sheets**
```rexx
"SHEETS CONNECT spreadsheet='abc123'"
"SHEETS SELECT product, SUM(revenue) FROM 'Q1 Sales' GROUP BY product"
"SHEETS INSERT sheet='Orders' values='Widget,299.99,pending'"
"SHEETS UPDATE 'Inventory' SET quantity = quantity - 1 WHERE sku = 'WIDGET001'"
```

### **Cross-Service Data Flow with Result Chains**
```rexx
# Extract from Sheets → Analyze in BigQuery → Store in Firestore → Notify via Pub/Sub
ADDRESS GCP
"SHEETS SELECT * FROM 'Customer Data' → customer_data"
"BIGQUERY SELECT customer_id, predicted_churn FROM ML.PREDICT(MODEL churn_model, TABLE @customer_data) → predictions"
"FIRESTORE SET /predictions/batch_{timestamp} @predictions"
"PUBSUB PUBLISH topic='churn-alerts' message='Batch prediction complete'"
```

## 🎯 What This Replaces

- **Google Apps Script** - Superior function library and local/cloud flexibility
- **Complex gcloud scripting** - Natural, readable command syntax
- **Zapier/IFTTT integrations** - Native cross-service workflows
- **ETL pipeline tools** - Direct data flow between services
- **Multiple SDK integrations** - Single unified interface

## 📊 Supported Services

| Service | Keywords | Enhanced Features |
|---------|----------|-------------------|
| **Google Sheets** | `SHEETS`, `SHEET` | Aliases, natural language WHERE clauses, batch operations |
| **BigQuery** | `BIGQUERY` | Result chains, batch queries, transactions |
| **Firestore** | `FIRESTORE` | Standardized syntax, result integration |
| **Cloud Storage** | `STORAGE` | Standardized file/bucket parameters |
| **Pub/Sub** | `PUBSUB` | Standardized topic/message syntax |
| **Cloud Functions** | `FUNCTIONS`, `FUNCTION` | Enhanced deployment options |
| **Cloud Run** | `RUN` | Container service deployment |
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

### Basic Usage with Enhanced Grammar
```rexx
#!/usr/bin/env rexx
REQUIRE "extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP
"SHEETS ALIAS sales='1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'"
"SHEETS SELECT * FROM sales.'Data' WHERE amount ABOVE 100 → filtered_data"
SAY "Found " || @filtered_data.count || " high-value transactions"
```

## 📝 Enhanced Service Languages

### **SHEETS** - Google Sheets Operations with Natural Language

#### Aliases and Enhanced Syntax
```rexx
# Set up aliases for readability
"SHEETS ALIAS orders='1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'"
"SHEETS ALIAS inventory='2CxjMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'"

# Use aliases in commands
"SHEETS SELECT * FROM orders.'New Orders' WHERE amount ABOVE 1000 → high_value"
"SHEETS SELECT * FROM inventory.'Stock' WHERE quantity BELOW 10 → low_stock"
```

#### Natural Language WHERE Clauses
```rexx
# Natural operators instead of symbols
"SHEETS SELECT * FROM 'Sales' WHERE date IS today"
"SHEETS SELECT * FROM 'Products' WHERE price ABOVE 100"
"SHEETS SELECT * FROM 'Inventory' WHERE stock BELOW reorder_point"
"SHEETS SELECT * FROM 'Customers' WHERE name CONTAINS 'Smith'"
"SHEETS SELECT * FROM 'Orders' WHERE status IS pending"
```

#### Standardized Parameters and Batch Operations
```rexx
# Standardized INSERT syntax
"SHEETS INSERT sheet='Orders' values='Product A,299.99,pending' → insert_result"

# Batch operations
"SHEETS BATCH ['SELECT * FROM Q1', 'SELECT * FROM Q2', 'SELECT * FROM Q3'] → quarterly_data"

# Result chains
"SHEETS SELECT * FROM 'Raw Data' → raw"
"SHEETS INSERT sheet='Processed' values='@raw' → processed"
```

### **BIGQUERY** - Enhanced Analytics and Machine Learning

#### Batch Queries and Transactions
```rexx
# Batch multiple queries
"BIGQUERY BATCH [
  'SELECT * FROM sales WHERE date = CURRENT_DATE()',
  'SELECT * FROM inventory WHERE quantity < 10'
] → daily_reports"

# Transaction support
"BIGQUERY TRANSACTION [
  'CREATE TABLE monthly_summary AS SELECT * FROM daily_sales',
  'DROP TABLE temp_processing'
] → transaction_result"

# Result chains with ML
"BIGQUERY SELECT * FROM customer_data → training_data"
"BIGQUERY CREATE MODEL churn_predictor OPTIONS(model_type='logistic_reg') AS SELECT * FROM @training_data → model_result"
```

### **Enhanced Cross-Service Integration**

#### Standardized Parameters Across Services
```rexx
# Consistent syntax across all services
"STORAGE UPLOAD file='report.pdf' bucket='documents' as='reports/monthly.pdf'"
"PUBSUB PUBLISH topic='notifications' message='Report uploaded'"
"FIRESTORE SET /metrics/today @upload_result"
```

## 🔥 Real-World Examples with Enhanced Grammar

### E-commerce Analytics Pipeline
```rexx
#!/usr/bin/env rexx
/* Enhanced e-commerce analytics with sectioned workflow */

REQUIRE "address-gcp.js"

LET analytics_pipeline = <<ECOMMERCE_ANALYTICS
@SECTION data-setup
SHEETS ALIAS orders="live-orders-2024"
SHEETS ALIAS products="product-catalog-2024"

@SECTION data-extraction
SHEETS SELECT order_id, product_id, quantity, total FROM orders.'Daily Orders' WHERE date IS today → daily_orders
SHEETS SELECT product_id, name, category, cost FROM products.'Catalog' → product_info

@SECTION data-processing
BIGQUERY CREATE TABLE staging.daily_orders AS SELECT * FROM @daily_orders → staging_orders
BIGQUERY SELECT 
  p.category,
  SUM(o.total) as revenue,
  COUNT(*) as orders,
  AVG(o.total) as avg_order
FROM @staging_orders o
JOIN @product_info p ON o.product_id = p.product_id
GROUP BY p.category → category_analysis

@SECTION storage-and-notification
FIRESTORE SET /analytics/daily @category_analysis
STORAGE UPLOAD file='daily_report.json' bucket='analytics-reports' as='daily/@category_analysis.date.json'
PUBSUB PUBLISH topic='analytics-ready' message='Daily analytics complete: @category_analysis.total_revenue revenue'
ECOMMERCE_ANALYTICS

ADDRESS GCP analytics_pipeline
SAY "Analytics pipeline completed with sectioned results:"
SAY "Data extraction: " || RESULT.'data-extraction'.success
SAY "Processing: " || RESULT.'data-processing'.success
SAY "Storage: " || RESULT.'storage-and-notification'.success
```

### Customer Segmentation with Natural Language
```rexx
#!/usr/bin/env rexx
/* Customer segmentation using natural language operators */

ADDRESS GCP

# Set up aliases
"SHEETS ALIAS customers='customer-database-2024'"

# Extract customer segments using natural language
"SHEETS SELECT * FROM customers.'Active' WHERE last_purchase_days BELOW 30 → recent_customers"
"SHEETS SELECT * FROM customers.'Active' WHERE lifetime_value ABOVE 1000 → high_value_customers"
"SHEETS SELECT * FROM customers.'Active' WHERE engagement_score BELOW 3 → at_risk_customers"

# Batch analysis in BigQuery
"BIGQUERY BATCH [
  'SELECT COUNT(*) as recent_count FROM @recent_customers',
  'SELECT AVG(lifetime_value) as avg_value FROM @high_value_customers',
  'SELECT COUNT(*) as at_risk_count FROM @at_risk_customers'
] → segment_analysis"

# Store results and trigger campaigns
"FIRESTORE SET /customer_segments/analysis @segment_analysis"
"PUBSUB PUBLISH topic='marketing-campaigns' message='New customer segments ready'"

SAY "Customer Segmentation Complete:"
SAY "Recent customers: " || @segment_analysis.results[0].recent_count
SAY "High-value avg: $" || @segment_analysis.results[1].avg_value
SAY "At-risk customers: " || @segment_analysis.results[2].at_risk_count
```

### Multi-Environment Deployment with Enhanced Syntax
```rexx
#!/usr/bin/env rexx
/* Deploy application with standardized parameters */

LET deployment = <<DEPLOY_ENHANCED
@SECTION infrastructure-setup
STORAGE CREATE BUCKET name='app-storage-prod' location='us-central1'
PUBSUB CREATE TOPIC app-events
PUBSUB CREATE TOPIC user-notifications

@SECTION function-deployment
FUNCTIONS DEPLOY event-processor source='./functions/events' trigger='pubsub:app-events' runtime='python311'
FUNCTIONS DEPLOY notification-sender source='./functions/notify' trigger='pubsub:user-notifications' runtime='nodejs20'

@SECTION service-deployment
RUN DEPLOY api-service image='gcr.io/project/api:v2.0.0' region='us-central1' memory='2Gi'
RUN DEPLOY web-frontend image='gcr.io/project/web:v2.0.0' region='us-central1' memory='1Gi'

@SECTION database-initialization
FIRESTORE SET /config/app {"version": "2.0.0", "deployed": "today", "features": ["enhanced-grammar"]}
FIRESTORE SET /metrics/deployment {"functions": 2, "services": 2, "buckets": 1}

@SECTION monitoring-setup
BIGQUERY CREATE TABLE analytics.deployment_logs AS SELECT timestamp, service, status FROM deployment_events
PUBSUB PUBLISH topic='deployment-complete' message='Application v2.0.0 deployed successfully'
DEPLOY_ENHANCED

ADDRESS GCP deployment
SAY "🚀 Enhanced deployment completed!"
SAY "Infrastructure: " || (RESULT.'infrastructure-setup'.success ? "✓" : "✗")
SAY "Functions: " || (RESULT.'function-deployment'.success ? "✓" : "✗") 
SAY "Services: " || (RESULT.'service-deployment'.success ? "✓" : "✗")
SAY "Database: " || (RESULT.'database-initialization'.success ? "✓" : "✗")
```

## 💡 Advanced Enhanced Features

### Complex Result Chains
```rexx
# Multi-step data processing with variable references
"SHEETS SELECT * FROM 'Raw Data' WHERE quality IS good → clean_data"
"BIGQUERY SELECT *, ML_PREDICT(model, @clean_data) as prediction → scored_data"
"SHEETS INSERT sheet='Predictions' values='@scored_data' → final_result"
"PUBSUB PUBLISH topic='ml-complete' message='Processed @final_result.count predictions'"
```

### Conditional Sectioned Workflows
```rexx
LET conditional_workflow = <<CONDITIONAL_WORK
@SECTION morning-batch
CONDITION: HOUR(NOW()) < 12
SHEETS SELECT * FROM orders.'Overnight' WHERE status IS pending → overnight_orders
PUBSUB PUBLISH topic='morning-processing' message='@overnight_orders.count orders to process'

@SECTION end-of-day
CONDITION: HOUR(NOW()) >= 17
SHEETS SELECT SUM(total) as daily_revenue FROM orders.'Today' → revenue_summary
FIRESTORE SET /daily_metrics/revenue @revenue_summary
CONDITIONAL_WORK
```

### Natural Language Batch Operations
```rexx
# Batch operations with natural language filtering
"SHEETS BATCH [
  'SELECT * FROM Sales WHERE amount ABOVE 1000',
  'SELECT * FROM Sales WHERE date IS today', 
  'SELECT * FROM Sales WHERE customer CONTAINS premium'
] → sales_segments"

# Process each segment
DO i = 1 TO @sales_segments.results.length
  LET segment = @sales_segments.results[i]
  "BIGQUERY INSERT INTO analytics.segment_" || i || " SELECT * FROM @segment"
END
```

## 🧪 Testing Enhanced Features

### Test Natural Language Operators
```rexx
#!/usr/bin/env rexx
/* Test enhanced grammar features */

ADDRESS GCP
"SHEETS ALIAS test='test-spreadsheet-id'"

# Test natural language operators
"SHEETS SELECT * FROM test.'Data' WHERE amount ABOVE 100 → high_amounts"
"SHEETS SELECT * FROM test.'Data' WHERE date IS today → today_data"
"SHEETS SELECT * FROM test.'Data' WHERE status CONTAINS active → active_items"

SAY "Natural language tests:"
SAY "High amounts: " || @high_amounts.count
SAY "Today's data: " || @today_data.count  
SAY "Active items: " || @active_items.count
```

### Test Result Chains and Sectioned Workflows
```bash
cd extras/addresses/provisioning-and-orchestration
npx jest __tests__/address-gcp-enhanced.test.js
```

## 🔧 Configuration

### Authentication (unchanged)
```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### Service Enablement (unchanged)
```bash
gcloud services enable sheets.googleapis.com bigquery.googleapis.com firestore.googleapis.com storage.googleapis.com pubsub.googleapis.com cloudfunctions.googleapis.com run.googleapis.com
```

## 🎯 Enhanced Architecture Benefits

### **Improved Readability**
- Natural language operators (IS, ABOVE, BELOW, CONTAINS)
- Meaningful aliases instead of long IDs
- Standardized parameter syntax across services
- Sectioned workflows with clear organization

### **Better Data Flow**
- Explicit result chains with → operator
- Variable references with @variable syntax
- Cross-section data sharing in workflows
- Batch operations for efficiency

### **Enhanced Maintainability**
- Consistent command patterns across all services
- Self-documenting sectioned workflows
- Clear error handling per section
- Version-controlled workflow definitions

## 🚀 Migration from v1.0 to v2.0

### Backward Compatibility
All v1.0 syntax continues to work! Enhanced features are additive:

```rexx
# v1.0 syntax (still works)
"SHEETS SELECT * FROM 'Data' WHERE amount > 100"

# v2.0 enhanced syntax (recommended)
"SHEETS SELECT * FROM 'Data' WHERE amount ABOVE 100 → filtered_data"
```

### Recommended Upgrades
1. **Add aliases** for frequently used spreadsheets
2. **Use natural language operators** for better readability
3. **Implement result chains** for explicit data flow
4. **Organize complex workflows** with @SECTION markers
5. **Standardize parameters** using key="value" format

## 📚 Related Documentation

- [Enhanced Grammar Examples](./examples-enhanced-grammar.rexx)
- [Migration Guide v1 to v2](./MIGRATION-GUIDE.md)
- [Natural Language Reference](./NATURAL-LANGUAGE-OPERATORS.md)
- [Result Chain Patterns](./RESULT-CHAIN-PATTERNS.md)
- [Authentication Guide](./GCP-AUTHENTICATION.md)
- [RexxJS Documentation](../../README.md)

## 🎉 What Makes This Special

RexxJS's enhanced GCP ADDRESS handler is **the most advanced cloud orchestration language** that provides:

1. **Natural Language Cloud Operations** - SQL-like syntax with human-readable operators
2. **Explicit Data Flow Management** - Result chains and variable references
3. **Organized Workflow Definition** - Sectioned HEREDOC with per-section results
4. **Unified Service Interface** - Consistent syntax across all Google Cloud services
5. **Complete Backward Compatibility** - Existing scripts continue to work unchanged

### New in v2.0:
- ✨ **Sheet aliases** for readable long IDs
- ✨ **Result chain syntax** (→) for explicit data flow
- ✨ **Natural language operators** (IS, ABOVE, BELOW, CONTAINS)
- ✨ **Standardized parameters** with key="value" format
- ✨ **Batch operations** for multiple commands
- ✨ **Sectioned workflows** with @SECTION markers
- ✨ **Variable references** with @variable syntax

This isn't just another Google Cloud wrapper - it's a **fundamentally new approach to cloud orchestration** that makes complex workflows readable, maintainable, and powerful.

---

**License:** MIT - Same as RexxJS project
**Version:** 2.0.0 - Enhanced Grammar Edition