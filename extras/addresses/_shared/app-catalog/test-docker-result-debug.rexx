#!/usr/bin/env rexx
/* Debug test to see what's in RESULT after docker create */

REQUIRE '/home/paul/scm/RexxJS/extras/addresses/docker-address/docker-address.js'
ADDRESS DOCKER

SAY '========================================='
SAY 'Testing RESULT variable resolution'
SAY '========================================='
SAY ''

SAY 'Step 1: Creating container...'
"create image=alpine:latest name=test-debug command=\"tail -f /dev/null\""
SAY ''

SAY 'Step 2: Inspecting RESULT variable with INTERPRET_JS...'
INTERPRET_JS "console.log('RESULT type:', typeof RESULT); console.log('RESULT value:', JSON.stringify(RESULT, null, 2));"
SAY ''

SAY 'Step 3: Trying to access RESULT properties...'
SAY 'RESULT.success =' RESULT.success
SAY 'RESULT.container =' RESULT.container
SAY 'RESULT.containerId =' RESULT.containerId
SAY 'RESULT.operation =' RESULT.operation
SAY ''

SAY 'Step 4: Checking what we got in plain RESULT...'
SAY 'Plain RESULT =' RESULT
SAY ''

SAY 'Step 5: Cleanup...'
"remove name=test-debug"

EXIT 0
