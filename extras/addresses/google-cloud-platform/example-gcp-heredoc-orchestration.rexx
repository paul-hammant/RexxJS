#!/usr/bin/env rexx
/* Advanced GCP Orchestration with HEREDOC Commands */

SAY "🚀 === GCP Multi-Service Orchestration with HEREDOC ==="
SAY ""

/* Load GCP handler */
REQUIRE "address-gcp.js"

/* ============================================ */
/* Scenario: E-commerce Daily Operations       */
/* ============================================ */

SAY "📦 Processing Daily E-commerce Operations..."
SAY ""

/* Define the entire daily workflow in a HEREDOC */
LET daily_workflow = <<DAILY_OPS
# ===== MORNING: Data Collection =====

# 1. Pull overnight orders from Sheets (small business using Sheets as order system)
SHEETS CONNECT spreadsheet='orders-2024-live'
SHEETS SELECT order_id, customer_email, products, total, timestamp FROM 'New Orders' WHERE DATE(timestamp) = TODAY()

# 2. Check inventory levels
SHEETS CONNECT spreadsheet='inventory-master'
SHEETS SELECT sku, product_name, quantity, reorder_point FROM 'Current Stock' WHERE quantity < reorder_point * 1.5

# 3. Get customer feedback
SHEETS CONNECT spreadsheet='customer-feedback'
SHEETS SELECT customer_id, rating, comment, timestamp FROM 'Reviews' WHERE DATE(timestamp) >= TODAY() - 7

# ===== PROCESSING: Analytics & ML =====

# 4. Load into BigQuery for analysis
BIGQUERY USE DATASET ecommerce.analytics
BIGQUERY CREATE OR REPLACE TABLE daily_orders AS SELECT * FROM ORDERS_RESULT
BIGQUERY CREATE OR REPLACE TABLE low_stock AS SELECT * FROM INVENTORY_RESULT
BIGQUERY CREATE OR REPLACE TABLE recent_reviews AS SELECT * FROM FEEDBACK_RESULT

# 5. Run revenue analysis
BIGQUERY SELECT
  DATE(timestamp) as date,
  COUNT(*) as order_count,
  SUM(total) as revenue,
  AVG(total) as avg_order_value,
  STDDEV(total) as order_stddev,
  MAX(total) as largest_order,
  APPROX_QUANTILES(total, 4)[OFFSET(2)] as median_order
FROM daily_orders
GROUP BY date

# 6. Customer segmentation with ML
BIGQUERY CREATE OR REPLACE MODEL customer_segments
OPTIONS(model_type='kmeans', num_clusters=4)
AS SELECT
  customer_id,
  COUNT(*) as order_count,
  SUM(total) as lifetime_value,
  AVG(total) as avg_order,
  DATE_DIFF(CURRENT_DATE(), MAX(DATE(timestamp)), DAY) as days_since_last_order
FROM ecommerce.all_orders
GROUP BY customer_id

# 7. Predict next day sales
BIGQUERY SELECT
  predicted_revenue,
  prediction_interval_lower_bound,
  prediction_interval_upper_bound
FROM ML.FORECAST(MODEL revenue_forecast, STRUCT(30 AS horizon))

# ===== REAL-TIME: Order Processing =====

# 8. Store orders in Firestore for web app
FIRESTORE SET /orders/order_12345 {"customer": "john@example.com", "total": 299.99, "status": "processing"}
FIRESTORE SET /orders/order_12346 {"customer": "jane@example.com", "total": 599.99, "status": "processing"}
FIRESTORE SET /metrics/daily {"revenue": 125000, "orders": 342, "avg_order": 365.50}

# 9. Update customer profiles
FIRESTORE SET /customers/john@example.com/stats {"lifetime_value": 2499.99, "order_count": 12, "segment": "vip"}
FIRESTORE SET /customers/jane@example.com/stats {"lifetime_value": 599.99, "order_count": 1, "segment": "new"}

# 10. Set up real-time monitoring
FIRESTORE WATCH /orders/* WHERE status = 'pending'
FIRESTORE QUERY /inventory WHERE quantity < 10

# ===== NOTIFICATIONS: Alerts & Reports =====

# 11. Publish to event streams
PUBSUB CREATE TOPIC daily-metrics
PUBSUB CREATE TOPIC inventory-alerts
PUBSUB CREATE TOPIC customer-segments

PUBSUB PUBLISH daily-metrics MESSAGE '{"date": "2024-01-15", "revenue": 125000, "orders": 342}'
PUBSUB PUBLISH inventory-alerts MESSAGE '{"sku": "WIDGET-001", "quantity": 5, "reorder_point": 20}'
PUBSUB PUBLISH customer-segments MESSAGE '{"segment": "vip", "count": 145, "avg_ltv": 2500}'

# 12. Subscribe to high-priority events
PUBSUB SUBSCRIBE TO inventory-alerts AS inventory-monitor
PUBSUB SUBSCRIBE TO high-value-orders AS vip-processor

# ===== STORAGE: Backups & Archives =====

# 13. Create daily backups
STORAGE CREATE BUCKET backups-2024 LOCATION 'us-central1' CLASS 'NEARLINE'
STORAGE UPLOAD FILE '/tmp/orders-2024-01-15.json' TO bucket='backups-2024' AS 'orders/2024-01-15.json'
STORAGE UPLOAD FILE '/tmp/inventory-2024-01-15.csv' TO bucket='backups-2024' AS 'inventory/2024-01-15.csv'

# 14. Archive old data
STORAGE LIST BUCKET 'backups-2023' PREFIX 'orders/'
STORAGE DELETE 'gs://temp-files/*' OLDER_THAN '30 days'

# ===== SERVERLESS: Deploy Updated Functions =====

# 15. Deploy order processor function
FUNCTIONS DEPLOY process-order SOURCE './functions/order-processor' TRIGGER 'pubsub:new-orders' RUNTIME 'nodejs20'
FUNCTIONS DEPLOY inventory-check SOURCE './functions/inventory' TRIGGER 'http' RUNTIME 'python311'

# 16. Deploy customer service bot
RUN DEPLOY customer-bot IMAGE 'gcr.io/project/customer-bot:latest' REGION 'us-central1'
RUN UPDATE customer-bot SET memory='2Gi' cpu='2' max_instances=10

# ===== REPORTING: Update Dashboards =====

# 17. Update executive dashboard
SHEETS CONNECT spreadsheet='executive-dashboard-2024'
SHEETS DELETE FROM 'Today' WHERE row > 1
SHEETS INSERT INTO 'Today' VALUES ('Date', TODAY())
SHEETS INSERT INTO 'Today' VALUES ('Revenue', 125000.50)
SHEETS INSERT INTO 'Today' VALUES ('Orders', 342)
SHEETS INSERT INTO 'Today' VALUES ('Avg Order', 365.50)
SHEETS INSERT INTO 'Today' VALUES ('Forecast Tomorrow', 135000)
SHEETS INSERT INTO 'Today' VALUES ('Low Stock SKUs', 7)
SHEETS INSERT INTO 'Today' VALUES ('VIP Customers', 145)

# 18. Apply formatting
SHEETS FORMAT 'Today'!A1:B1 BOLD TRUE BACKGROUND '#4285F4' COLOR 'white'
SHEETS FORMAT 'Today'!B2:B8 NUMBER_FORMAT '"$"#,##0.00'
SHEETS FORMULA B9 '=SUM(B2:B8)'

# 19. Create visualizations
SHEETS CREATE CHART TYPE 'line' DATA 'Historical!A:B' TITLE 'Revenue Trend'
SHEETS CREATE CHART TYPE 'pie' DATA 'Segments!A:B' TITLE 'Customer Segments'
DAILY_OPS

/* Process the entire workflow */
SAY "Executing workflow commands:"
SAY "─────────────────────────────"

LET command_count = 0
LET service_stats = MAP_CREATE()

DO cmd OVER LINES(daily_workflow)
  /* Skip comments and empty lines */
  IF LEFT(cmd, 1) = '#' | LENGTH(STRIP(cmd)) = 0 THEN DO
    IF LEFT(cmd, 1) = '#' THEN SAY cmd
    ITERATE
  END

  /* Execute GCP command */
  ADDRESS GCP cmd

  /* Track statistics */
  LET service = WORD(cmd, 1)
  LET current = MAP_GET(service_stats, service, 0)
  CALL MAP_PUT service_stats, service, current + 1
  command_count = command_count + 1

  /* Show progress */
  SAY "✓ " || service || ": " || SUBSTR(cmd, LENGTH(service) + 2, 40) || "..."

  /* Store results for cross-service operations */
  IF POS('SELECT', cmd) > 0 & RESULT.success THEN DO
    SELECT
      WHEN POS('orders', cmd) > 0 THEN LET orders_data = RESULT
      WHEN POS('inventory', cmd) > 0 THEN LET inventory_data = RESULT
      WHEN POS('reviews', cmd) > 0 THEN LET reviews_data = RESULT
    END
  END
END

/* ============================================ */
/* Advanced: Dynamic Command Generation        */
/* ============================================ */

SAY ""
SAY "📊 Dynamic Command Generation Based on Results:"
SAY "───────────────────────────────────────────────"

/* Generate commands based on data */
IF EXISTS('inventory_data') & inventory_data.count > 0 THEN DO
  SAY "Found " || inventory_data.count || " low stock items, generating reorder commands..."

  LET reorder_commands = ""
  DO i = 1 TO MIN(inventory_data.count, 5)
    LET item = inventory_data.rows[i]
    LET cmd = "PUBSUB PUBLISH reorder-queue MESSAGE '{\"sku\":\"" || item.sku || "\",\"quantity\":\"" || item.reorder_point * 2 || "\"}'"
    reorder_commands = reorder_commands || cmd || NEWLINE()
  END

  /* Execute generated commands */
  DO cmd OVER LINES(reorder_commands)
    IF LENGTH(STRIP(cmd)) > 0 THEN DO
      ADDRESS GCP cmd
      SAY "  ✓ Reorder triggered for " || WORD(cmd, 4)
    END
  END
END

/* ============================================ */
/* Conditional Workflow Execution              */
/* ============================================ */

SAY ""
SAY "🔄 Conditional Workflow Execution:"
SAY "──────────────────────────────────"

/* Different workflow based on day of week */
LET day_of_week = DAYNAME(DATE())

LET conditional_workflow = <<CONDITIONAL
# Weekend workflow
CONDITION: day_of_week = 'Saturday' | day_of_week = 'Sunday'
BIGQUERY SELECT * FROM analytics.weekend_metrics
SHEETS UPDATE 'Dashboard' SET status = 'Weekend Mode'
PUBSUB PUBLISH operations MESSAGE '{"mode": "weekend", "staff": "reduced"}'

# Weekday workflow
CONDITION: day_of_week <> 'Saturday' & day_of_week <> 'Sunday'
BIGQUERY SELECT * FROM analytics.weekday_metrics
SHEETS UPDATE 'Dashboard' SET status = 'Full Operations'
PUBSUB PUBLISH operations MESSAGE '{"mode": "weekday", "staff": "full"}'

# Month-end workflow
CONDITION: DAY(DATE()) >= 28
BIGQUERY CREATE TABLE monthly_summary AS SELECT * FROM analytics.month_to_date
STORAGE UPLOAD FILE '/tmp/month-end-report.pdf' TO bucket='reports' AS 'monthly/report.pdf'
SHEETS CREATE SHEET 'Month Summary'
CONDITIONAL

/* Process conditional commands */
LET current_condition = ""
DO cmd OVER LINES(conditional_workflow)
  IF LEFT(cmd, 10) = 'CONDITION:' THEN DO
    current_condition = SUBSTR(cmd, 11)
    IF INTERPRET(current_condition) THEN DO
      SAY "✓ Condition met: " || current_condition
    END
    ELSE DO
      SAY "✗ Condition not met: " || current_condition
    END
  END
  ELSE IF LENGTH(STRIP(cmd)) > 0 & LEFT(cmd, 1) <> '#' THEN DO
    IF INTERPRET(current_condition) THEN DO
      ADDRESS GCP cmd
      SAY "  → Executed: " || WORD(cmd, 1) || " " || WORD(cmd, 2)
    END
  END
END

/* ============================================ */
/* Summary Statistics                          */
/* ============================================ */

SAY ""
SAY "📈 === Workflow Execution Summary ==="
SAY ""
SAY "Total commands executed: " || command_count
SAY ""
SAY "Commands by service:"
DO service OVER MAP_KEYS(service_stats)
  SAY "  • " || service || ": " || MAP_GET(service_stats, service)
END

SAY ""
SAY "🎯 Benefits of HEREDOC Orchestration:"
SAY "  ✓ Entire workflow visible in one place"
SAY "  ✓ Easy to modify and maintain"
SAY "  ✓ Comments inline with commands"
SAY "  ✓ Conditional execution support"
SAY "  ✓ Dynamic command generation"
SAY "  ✓ Cross-service data flow"
SAY ""
SAY "💡 This single script replaces:"
SAY "  • Multiple Apps Script projects"
SAY "  • Complex bash scripts with gcloud"
SAY "  • Workflow orchestration tools"
SAY "  • ETL pipeline configurations"
SAY "  • Zapier/IFTTT integrations"

exit 0