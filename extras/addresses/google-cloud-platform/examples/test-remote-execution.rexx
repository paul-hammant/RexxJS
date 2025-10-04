-- Test script for remote RexxJS execution capabilities

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-ssh.js"

PARSE ARG HOST, USER, REXX_BINARY_PATH

IF HOST = '' | USER = '' THEN DO
  SAY 'Usage: test-remote-execution.rexx HOST USER [REXX_BINARY_PATH]'
  EXIT 1
END

IF REXX_BINARY_PATH = '' THEN REXX_BINARY_PATH = './bin/rexx'

SAY 'Testing remote RexxJS execution on' USER '@' HOST

ADDRESS ssh
connect host=HOST user=USER id=test

SAY 'Copying RexxJS binary...'
ADDRESS ssh
copy_to id=test local=REXX_BINARY_PATH remote='/tmp/rexx-test' timeout=30000

SAY 'Copying test script...'
ADDRESS ssh  
copy_to id=test local='./extras/addresses/provisioning-and-orchestration/examples/test-remote-rexx.rexx' remote='/tmp/test-remote-rexx.rexx' timeout=10000

SAY 'Making binary executable...'
ADDRESS ssh
exec id=test command='chmod +x /tmp/rexx-test' timeout=5000

SAY 'Executing remote RexxJS test...'
ADDRESS ssh
result = exec id=test command='/tmp/rexx-test /tmp/test-remote-rexx.rexx' timeout=30000
SAY 'Remote execution result:'
SAY result.stdout

SAY 'Cleaning up...'
ADDRESS ssh
exec id=test command='rm -f /tmp/rexx-test /tmp/test-remote-rexx.rexx' timeout=5000

SAY 'Remote RexxJS execution test completed'

ADDRESS ssh
close id=test