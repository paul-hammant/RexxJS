#!/usr/bin/env rexx
/*
 * SCRO (Source-Controlled Remote Orchestration) Deployment Demonstration
 * Shows complete workflow: container creation, RexxJS deployment, remote execution
 * 
 * Usage: rexx scro-demo-deployment.rexx
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

SAY "🚀 SCRO (Source-Controlled Remote Orchestration) Demonstration"
SAY "============================================================="
SAY ""

/* Configuration */
LET container_image = "debian:stable"
LET worker_name = "rexx-demo-worker"
LET rexx_binary = "./rexx-linux-x64"

SAY "📋 Configuration:"
SAY "  Container Image: " || container_image
SAY "  Worker Name: " || worker_name  
SAY "  RexxJS Binary: " || rexx_binary
SAY ""

/* Step 1: Container Deployment */
SAY "🐳 Step 1: Setting up container deployment..."

ADDRESS deployment
setup_container image=container_image name=worker_name interactive=false

SAY "✅ Container " || worker_name || " created and RexxJS deployed"
SAY ""

/* Step 2: Execute simple remote script */
SAY "🔧 Step 2: Executing simple script remotely..."

LET simple_script = "
SAY 'Hello from remote container!'
LET hostname = SYSTEM('hostname')
SAY 'Container hostname: ' || hostname
LET uptime = SYSTEM('uptime')
SAY 'System uptime: ' || uptime
"

execute_remote script=simple_script target=worker_name

SAY "✅ Simple script execution completed"
SAY ""

/* Step 3: Execute script with progress monitoring */
SAY "📊 Step 3: Executing script with progress monitoring..."

LET progress_script = "
SAY 'Starting data processing simulation...'
CHECKPOINT('started', 'Data processing initiated')

LET total_items = 50
LET processed = 0

DO i = 1 TO total_items
  /* Simulate some work */
  LET result = i * i
  LET processed = processed + 1
  
  /* Report progress every 10 items */
  IF i // 10 = 0 THEN DO
    CHECKPOINT('progress', processed, total_items)
    SAY 'Processed ' || processed || ' of ' || total_items || ' items'
  END
END

CHECKPOINT('completed', 'Processing finished successfully')
SAY 'All ' || total_items || ' items processed!'
"

execute_remote script=progress_script target=worker_name progress=true

SAY "✅ Progress monitoring script completed"
SAY ""

/* Step 4: Data processing workflow */
SAY "💾 Step 4: Data processing workflow..."

LET data_script = "
SAY 'Performing data analysis...'
CHECKPOINT('analysis_start', 'Beginning data analysis phase')

/* Create sample dataset */
LET data.1 = 'apple,5,red'
LET data.2 = 'banana,3,yellow'  
LET data.3 = 'orange,8,orange'
LET data.4 = 'grape,12,purple'
LET data.5 = 'cherry,20,red'
LET data.0 = 5

SAY 'Dataset created with ' || data.0 || ' items'
CHECKPOINT('data_created', data.0)

/* Process each item */
LET total_quantity = 0
DO i = 1 TO data.0
  LET item = data.i
  LET parts = SPLIT(item, ',')
  LET fruit = parts.1
  LET quantity = parts.2
  LET color = parts.3
  
  LET total_quantity = total_quantity + quantity
  SAY 'Processed: ' || fruit || ' (qty: ' || quantity || ', color: ' || color || ')'
  
  CHECKPOINT('item_processed', i, data.0, fruit, quantity)
END

SAY 'Analysis complete!'
SAY 'Total quantity across all fruits: ' || total_quantity
CHECKPOINT('analysis_complete', total_quantity)
"

execute_remote script=data_script target=worker_name progress=true

SAY "✅ Data processing workflow completed"
SAY ""

/* Step 5: File operations */
SAY "📂 Step 5: File operations demonstration..."

LET file_script = "
SAY 'Demonstrating file operations...'
CHECKPOINT('file_ops_start', 'Beginning file operations')

/* Create a report file */
LET report_file = '/tmp/rexx_report.txt'
LET report_content = 'RexxJS Remote Execution Report' || '0A'X ||,
                    '=============================' || '0A'X ||,
                    'Executed at: ' || DATE() || ' ' || TIME() || '0A'X ||,
                    'Container: " || worker_name || "'0A'X ||,
                    'Status: Successful' || '0A'X

/* Write report */
LET write_result = SYSTEM('echo \"' || report_content || '\" > ' || report_file)
SAY 'Report written to: ' || report_file

/* Verify file was created */
LET file_check = SYSTEM('ls -la ' || report_file)
SAY 'File verification: ' || file_check

CHECKPOINT('file_created', report_file)

/* Read and display file contents */
LET cat_result = SYSTEM('cat ' || report_file)
SAY 'Report contents:'
SAY cat_result

CHECKPOINT('file_ops_complete', 'All file operations successful')
"

execute_remote script=file_script target=worker_name

SAY "✅ File operations completed"
SAY ""

/* Step 6: Monitoring and status */
SAY "📈 Step 6: Monitoring deployment status..."

monitor_deployment target=worker_name

SAY ""

/* Step 7: One-shot deployment example */
SAY "⚡ Step 7: One-shot deployment example..."

LET oneshot_script = "
SAY 'This is a one-shot execution!'
SAY 'Container will be automatically cleaned up after execution.'
LET random_number = RANDOM(1, 1000)
SAY 'Generated random number: ' || random_number
CHECKPOINT('oneshot_complete', random_number)
"

deploy_and_execute script=oneshot_script image=container_image

SAY "✅ One-shot deployment completed and cleaned up"
SAY ""

/* Step 8: Cleanup */
SAY "🧹 Step 8: Cleaning up resources..."

cleanup_deployment target=worker_name

SAY "✅ Cleanup completed"
SAY ""

/* Summary */
SAY "🎉 SCRO Demonstration Complete!"
SAY "==============================="
SAY ""
SAY "Summary of operations performed:"
SAY "  ✓ Container creation and RexxJS deployment"
SAY "  ✓ Simple remote script execution"
SAY "  ✓ Progress-monitored script execution"
SAY "  ✓ Data processing workflow"
SAY "  ✓ File operations"
SAY "  ✓ Deployment monitoring"
SAY "  ✓ One-shot deployment"
SAY "  ✓ Resource cleanup"
SAY ""
SAY "🚀 SCRO (Source-Controlled Remote Orchestration) system is fully operational!"

EXIT 0