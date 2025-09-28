-- RexxJS Container Execute Demo
-- Demonstrates deploy_rexx and execute_rexx with real containers
-- Tests CHECKPOINT progress monitoring and error handling

SAY "=== RexxJS Container Execute Demo ==="
SAY ""

-- Initialize ADDRESS PODMAN with strict security
ADDRESS podman
initialize securityMode=strict trustedBinaries="../../rexx-linux-x64,../../bin/rexx-linux-x64" maxContainers=5

SAY "Step 1: Creating and starting container..."
create image=debian:stable name=rexx-demo-container
start name=rexx-demo-container
SAY "Container status: " RC

SAY ""
SAY "Step 2: Deploying RexxJS binary to container..."
-- Try to deploy RexxJS binary (will need real binary path)
deploy_rexx container=rexx-demo-container rexx_binary="../../rexx-linux-x64" target="/usr/local/bin/rexx"
IF RC = 0 THEN
  SAY "RexxJS deployed successfully!"
ELSE
  SAY "RexxJS deployment failed (RC=" RC "). Trying alternative path..."
  deploy_rexx container=rexx-demo-container rexx_binary="../../bin/rexx-linux-x64" target="/usr/local/bin/rexx"
  IF RC = 0 THEN
    SAY "RexxJS deployed successfully with alternative path!"
  ELSE
    SAY "Both deployment attempts failed. Exiting demo."
    cleanup all=true
    EXIT RC
  END
END

SAY ""
SAY "Step 3: Executing simple RexxJS script..."
execute_rexx container=rexx-demo-container script="SAY 'Hello from RexxJS container!'"
SAY "Simple execution RC: " RC

SAY ""
SAY "Step 4: Executing RexxJS script with progress monitoring..."
execute_rexx container=rexx-demo-container script="DO i = 1 TO 5; SAY 'Processing step' i; END" progress_callback=true
SAY "Progress execution RC: " RC

SAY ""
SAY "Step 5: Testing mathematical calculations..."
mathScript = "x = 42; y = 24; result = x + y; SAY 'The answer to everything plus 24 is:' result"
execute_rexx container=rexx-demo-container script=mathScript timeout=10000
SAY "Math calculation RC: " RC

SAY ""
SAY "Step 6: Testing CHECKPOINT functionality..."
checkpointScript = 'CHECKPOINT("INIT", "stage=initialization"); ' ||,
                   'DO i = 1 TO 3; ' ||,
                   '  SAY "Processing item" i; ' ||,
                   '  CHECKPOINT("PROGRESS", "stage=processing item=" i " percent=" (i*33)); ' ||,
                   'END; ' ||,
                   'CHECKPOINT("COMPLETE", "stage=done percent=100")'
execute_rexx container=rexx-demo-container script=checkpointScript progress_callback=true timeout=15000
SAY "Checkpoint test RC: " RC

SAY ""
SAY "Step 7: Testing error handling..."
execute_rexx container=rexx-demo-container script="CALL NonExistentFunction(); SAY 'This should not print'"
SAY "Error handling test RC: " RC " (expected non-zero)"

SAY ""
SAY "Step 8: Getting container logs..."
logs container=rexx-demo-container lines=20
SAY "Log retrieval RC: " RC

SAY ""
SAY "Step 9: Testing file script execution..."
-- Create a test script file
scriptContent = "-- Test script from file" || '0A'X ||,
                "SAY 'This script was loaded from a file'" || '0A'X ||,
                "DO i = 1 TO 3" || '0A'X ||,
                "  SAY 'File script iteration:' i" || '0A'X ||,
                "END" || '0A'X ||,
                "SAY 'File script execution complete'"

-- Write script to temporary file (this would need file handling)
-- For demo purposes, we'll use inline script
execute_rexx container=rexx-demo-container script=scriptContent
SAY "File script execution RC: " RC

SAY ""
SAY "Step 10: Performance test with larger script..."
performanceScript = "startTime = TIME('M');" ||,
                    "total = 0;" ||,
                    "DO i = 1 TO 1000;" ||,
                    "  total = total + i;" ||,
                    "END;" ||,
                    "endTime = TIME('M');" ||,
                    "SAY 'Calculated sum 1-1000:' total;" ||,
                    "SAY 'Execution time:' (endTime - startTime) 'milliseconds'"
execute_rexx container=rexx-demo-container script=performanceScript timeout=30000
SAY "Performance test RC: " RC

SAY ""
SAY "Step 11: Cleanup..."
stop name=rexx-demo-container
remove name=rexx-demo-container
SAY "Container cleanup RC: " RC

SAY ""
SAY "=== Demo Complete ==="
SAY "All execute_rexx functionality has been tested!"
SAY "Check the logs above for detailed results of each test."