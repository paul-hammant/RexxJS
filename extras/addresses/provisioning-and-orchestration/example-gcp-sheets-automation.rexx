#!/usr/bin/env rexx
/* Google Sheets Automation with Unified GCP ADDRESS */

SAY "📊 === Google Sheets Business Intelligence Dashboard ==="
SAY ""

/* Load GCP address handler */
REQUIRE "address-gcp.js"
SAY "✓ GCP address handler loaded"
SAY ""

/* ============================================ */
/* Example 1: Direct Sheet Operations          */
/* ============================================ */

SAY "1. Direct Sheet Access (No CONNECT needed):"
ADDRESS GCP

/* Direct sheet reference with SQL-like operations */
LET commands = <<SHEETS_COMMANDS
SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Sales Data' WHERE amount > 1000
SHEETS_COMMANDS

"SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Sales Data' WHERE amount > 1000"
LET sales = RESULT
SAY "   Found " || sales.count || " high-value sales"

/* ============================================ */
/* Example 2: Multi-Sheet Dashboard Update     */
/* ============================================ */

SAY ""
SAY "2. Multi-Sheet Dashboard Update:"

/* Sales Report Sheet */
LET sales_commands = <<SALES_SHEET
SHEETS CONNECT spreadsheet='1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
SHEETS SELECT date, product, amount FROM 'January' WHERE amount > 500
SALES_SHEET

DO cmd OVER LINES(sales_commands)
  ADDRESS GCP cmd
END
LET january_sales = RESULT

/* Inventory Sheet */
ADDRESS GCP
"SHEET 2CyjNWt1YSB6oGMeKwCeBYkhnVVrqumos85PgvF3vqnt SELECT sku, quantity FROM 'Current Stock' WHERE quantity < 10"
LET low_stock = RESULT

/* Executive Dashboard - Update with aggregated data */
LET dashboard_updates = <<UPDATE_DASHBOARD
SHEETS CONNECT spreadsheet='3DzkoXu2ZTC7pHNflXDfCZlioWWsrvnpt96QhwG4wrou'
SHEETS DELETE FROM 'Daily Summary' WHERE row > 1
SHEETS INSERT INTO 'Daily Summary' VALUES (TODAY(), 'Revenue', 125000.50)
SHEETS INSERT INTO 'Daily Summary' VALUES (TODAY(), 'Transactions', 342)
SHEETS INSERT INTO 'Daily Summary' VALUES (TODAY(), 'Low Stock Items', 7)
SHEETS INSERT INTO 'Daily Summary' VALUES (TODAY(), 'Avg Order Value', 365.50)
SHEETS FORMULA B10 '=SUM(B2:B9)'
SHEETS FORMAT A1:C1 BOLD TRUE BACKGROUND 'yellow'
UPDATE_DASHBOARD

DO cmd OVER LINES(dashboard_updates)
  ADDRESS GCP cmd
  IF RESULT.success THEN DO
    SAY "   ✓ " || cmd
  END
END

/* ============================================ */
/* Example 3: Cross-Service Data Pipeline      */
/* ============================================ */

SAY ""
SAY "3. Cross-Service Data Pipeline (Sheets → BigQuery → PubSub):"

/* Extract from Sheets */
LET extract_analyze = <<EXTRACT_ANALYZE
# Extract sales data from Sheets
SHEETS CONNECT spreadsheet='1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
SHEETS SELECT * FROM 'Q1 Sales'

# Load into BigQuery for analysis
BIGQUERY USE DATASET analytics.sales_2024
BIGQUERY INSERT INTO staging_sales SELECT * FROM SHEETS_RESULT
BIGQUERY SELECT
  product_category,
  SUM(revenue) as total_revenue,
  AVG(margin) as avg_margin,
  COUNT(*) as transactions,
  STDDEV(revenue) as revenue_stddev
FROM staging_sales
GROUP BY product_category
HAVING total_revenue > 10000
ORDER BY total_revenue DESC

# Publish insights to Pub/Sub for downstream systems
PUBSUB CREATE TOPIC sales-insights
PUBSUB PUBLISH sales-insights MESSAGE '{"top_category": "Electronics", "revenue": 450000}'
EXTRACT_ANALYZE

/* Process each command */
DO cmd OVER LINES(extract_analyze)
  IF LEFT(cmd, 1) <> '#' & LENGTH(STRIP(cmd)) > 0 THEN DO
    ADDRESS GCP cmd
    SAY "   ✓ Executed: " || WORD(cmd, 1) || " " || WORD(cmd, 2)
  END
END

/* ============================================ */
/* Example 4: Real-time Monitoring             */
/* ============================================ */

SAY ""
SAY "4. Real-time Order Processing with Firestore:"

LET realtime_orders = <<PROCESS_ORDERS
# Check for new orders in Sheets
SHEETS CONNECT spreadsheet='4EalnYv3aUD8qIPohYEgDalmjXXtswpru07RixH5xspv'
SHEETS SELECT order_id, customer, total, status FROM 'Live Orders' WHERE status = 'pending'

# Store in Firestore for app access
FIRESTORE SET /orders/12345 {"customer": "John Doe", "total": 299.99, "status": "pending"}
FIRESTORE SET /orders/12346 {"customer": "Jane Smith", "total": 450.00, "status": "pending"}

# Query Firestore for high-value orders
FIRESTORE QUERY /orders WHERE total > 400 AND status = 'pending'

# Watch for changes (would run in background)
FIRESTORE WATCH /orders/* FOR changes
PROCESS_ORDERS

DO cmd OVER LINES(realtime_orders)
  IF LEFT(cmd, 1) <> '#' & LENGTH(STRIP(cmd)) > 0 THEN DO
    ADDRESS GCP cmd
    IF RESULT.success THEN DO
      SAY "   ✓ " || SUBSTR(cmd, 1, 50) || "..."
    END
  END
END

/* ============================================ */
/* Example 5: Automated Reporting              */
/* ============================================ */

SAY ""
SAY "5. Generate and Store Reports:"

LET reporting = <<GENERATE_REPORTS
# Generate report data from BigQuery
BIGQUERY SELECT
  DATE(timestamp) as date,
  COUNT(*) as orders,
  SUM(total) as revenue,
  AVG(total) as avg_order
FROM analytics.orders
WHERE DATE(timestamp) = CURRENT_DATE()
GROUP BY date

# Update master spreadsheet
SHEETS CONNECT spreadsheet='5FbmoZw4bVE9rJQpiZFhEbmokYYutyqsv18SjyI6ytqw'
SHEETS INSERT INTO 'Daily Reports' VALUES (TODAY(), 342, 125000.50, 365.50)

# Store report in Cloud Storage
STORAGE CREATE BUCKET daily-reports LOCATION 'us-central1' CLASS 'STANDARD'
STORAGE UPLOAD FILE '/tmp/report-2024-01-15.pdf' TO bucket='daily-reports' AS '2024/01/15-report.pdf'

# Notify via Pub/Sub
PUBSUB PUBLISH report-ready MESSAGE '{"date": "2024-01-15", "url": "gs://daily-reports/2024/01/15-report.pdf"}'
GENERATE_REPORTS

DO cmd OVER LINES(reporting)
  IF LEFT(cmd, 1) <> '#' & LENGTH(STRIP(cmd)) > 0 THEN DO
    ADDRESS GCP cmd
    SAY "   " || WORD(cmd, 1) || " " || WORD(cmd, 2) || " completed"
  END
END

/* ============================================ */
/* Example 6: Complex Sheet Formulas          */
/* ============================================ */

SAY ""
SAY "6. Advanced Sheet Formulas and Formatting:"

LET formula_commands = <<FORMULAS
SHEETS CONNECT spreadsheet='6GcnpAx5cWF0sKRqjAGiFcnplZZvuxrtw29TkzJ7zusx'

# Create pivot-like summary
SHEETS FORMULA A1 '"Product Category"'
SHEETS FORMULA B1 '"Total Sales"'
SHEETS FORMULA C1 '"Average"'
SHEETS FORMULA D1 '"Count"'

SHEETS FORMULA A2 '"Electronics"'
SHEETS FORMULA B2 '=SUMIF(Sales!B:B,"Electronics",Sales!D:D)'
SHEETS FORMULA C2 '=AVERAGEIF(Sales!B:B,"Electronics",Sales!D:D)'
SHEETS FORMULA D2 '=COUNTIF(Sales!B:B,"Electronics")'

SHEETS FORMULA A3 '"Clothing"'
SHEETS FORMULA B3 '=SUMIF(Sales!B:B,"Clothing",Sales!D:D)'
SHEETS FORMULA C3 '=AVERAGEIF(Sales!B:B,"Clothing",Sales!D:D)'
SHEETS FORMULA D3 '=COUNTIF(Sales!B:B,"Clothing")'

# Conditional formatting
SHEETS FORMAT B2:B10 IF value > 10000 THEN background='green' ELSE background='red'
SHEETS FORMAT A1:D1 BOLD TRUE BACKGROUND '#4285F4' COLOR 'white'

# Add chart (conceptual - would need chart API)
SHEETS CREATE CHART TYPE 'column' DATA 'A1:B10' POSITION 'F1'
FORMULAS

DO cmd OVER LINES(formula_commands)
  IF LEFT(cmd, 1) <> '#' & LENGTH(STRIP(cmd)) > 0 THEN DO
    ADDRESS GCP cmd
    IF POS('FORMULA', cmd) > 0 THEN DO
      SAY "   ✓ Set formula: " || WORD(cmd, 3)
    END
  END
END

/* ============================================ */
/* Example 7: ML Integration                   */
/* ============================================ */

SAY ""
SAY "7. Machine Learning Pipeline:"

LET ml_pipeline = <<ML_PIPELINE
# Extract training data from Sheets
SHEETS CONNECT spreadsheet='7HdoqBy6dXG1tLSrkBHjGdoqmZAvwysuxy30UlzK8zyty'
SHEETS SELECT customer_id, recency, frequency, monetary, churn FROM 'Training Data'

# Load into BigQuery
BIGQUERY USE DATASET ml_models.customer_analytics
BIGQUERY CREATE OR REPLACE TABLE training_data AS SELECT * FROM SHEETS_RESULT

# Train model
BIGQUERY CREATE OR REPLACE MODEL churn_predictor
OPTIONS(model_type='logistic_reg', input_label_cols=['churn'])
AS SELECT * FROM training_data

# Score new customers
SHEETS SELECT customer_id, recency, frequency, monetary FROM 'New Customers'
BIGQUERY CREATE TABLE predictions AS
SELECT * FROM ML.PREDICT(MODEL churn_predictor, (SELECT * FROM SHEETS_RESULT))

# Write predictions back to Sheets
SHEETS INSERT INTO 'Predictions' SELECT customer_id, predicted_churn_probability FROM predictions
ML_PIPELINE

SAY "   ML Pipeline: Extract → Train → Predict → Store"

/* ============================================ */
/* Summary                                     */
/* ============================================ */

SAY ""
SAY "🎯 === Unified GCP ADDRESS Capabilities Demonstrated ==="
SAY ""
SAY "✅ SHEETS: Direct SQL-like operations on spreadsheets"
SAY "✅ BIGQUERY: Analytics and ML on large datasets"
SAY "✅ FIRESTORE: Real-time document database operations"
SAY "✅ STORAGE: File and object storage management"
SAY "✅ PUBSUB: Message publishing and event streaming"
SAY ""
SAY "🔥 Key Benefits:"
SAY "   • Unified syntax across all GCP services"
SAY "   • Direct spreadsheet ID references (no setup needed)"
SAY "   • SQL-like operations on Sheets data"
SAY "   • Seamless data flow between services"
SAY "   • HEREDOC support for complex workflows"
SAY ""
SAY "📚 This replaces:"
SAY "   • Google Apps Script for Sheets automation"
SAY "   • Complex gcloud CLI scripting"
SAY "   • Multiple SDK integrations"
SAY "   • Zapier/IFTTT for service integration"

exit 0