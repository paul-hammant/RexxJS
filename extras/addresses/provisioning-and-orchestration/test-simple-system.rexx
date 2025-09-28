#!/usr/bin/env rexx
/* Simple test of ADDRESS SYSTEM basic functionality */

SAY "Testing basic ADDRESS SYSTEM..."
REQUIRE "../system/system-address.js"
SAY "✓ System address handler loaded"

SAY "Testing simple echo command..."
ADDRESS SYSTEM 'echo "Hello from ADDRESS SYSTEM" > /tmp/simple-test.txt'

SAY "Checking if file was created..."
ADDRESS SYSTEM 'ls -la /tmp/simple-test.txt'
ADDRESS SYSTEM 'cat /tmp/simple-test.txt'

SAY "✓ Basic ADDRESS SYSTEM test complete"
exit 0