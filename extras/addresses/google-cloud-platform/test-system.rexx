#!/usr/bin/env rexx
/* Simple test of ADDRESS SYSTEM HEREDOC functionality */

SAY "Testing ADDRESS SYSTEM HEREDOC..."
REQUIRE "../system/system-address.js"
SAY "✓ System address handler loaded"

SAY "Writing test file using HEREDOC..."
ADDRESS SYSTEM
<<TEST_SCRIPT
#!/bin/sh
echo "Testing HEREDOC file writing..."
cat > /tmp/test-heredoc.txt << 'EOF'
Hello World from HEREDOC!
This is a test file.
Line 3 of the test.
EOF
echo "✓ Test file created"
TEST_SCRIPT

SAY "Checking if test file was created..."
ADDRESS SYSTEM 'ls -la /tmp/test-heredoc.txt'
ADDRESS SYSTEM 'cat /tmp/test-heredoc.txt'

exit 0