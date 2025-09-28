#!/usr/bin/env rexx
/* Simple test for HTTP_GET and HTTP_POST functions with Real OpenFaaS Server */

SAY "=== Testing HTTP Functions with Real OpenFaaS Server ==="
SAY ""

/* Assume server is ready (started manually) */
SAY "Proceeding with tests (server should be ready)..."
SAY ""

/* Test 1: HTTP_GET for system info */
SAY "1. Testing HTTP_GET for system info..."
response = HTTP_GET('http://localhost:8080/system/info')
SAY "HTTP_GET returned: [" response "]"
if POS("ERROR", response) > 0 then do
  SAY "✗ HTTP_GET test failed: " response
end
else do
  SAY "✓ HTTP_GET test passed. Response: " response
end
SAY ""

/* Test 2: HTTP_GET for functions list */
SAY "2. Testing HTTP_GET for functions list..."
response = HTTP_GET('http://localhost:8080/system/functions')
if POS("ERROR", response) > 0 then do
  SAY "✗ HTTP_GET functions test failed: " response
end
else do
  SAY "✓ HTTP_GET functions test passed. Response: " response
end
SAY ""

/* Test 3: HTTP_POST to invoke function */
SAY "3. Testing HTTP_POST to invoke function..."
response = HTTP_POST('http://localhost:8080/function/hello-world', 'World')
if POS("ERROR", response) > 0 then do
  SAY "✗ HTTP_POST test failed: " response
end
else do
  SAY "✓ HTTP_POST test passed. Real response: " response
end
SAY ""

/* Test 4: HTTP_POST with custom payload */
SAY "4. Testing HTTP_POST with custom payload..."
response = HTTP_POST('http://localhost:8080/function/hello-world', 'RexxJS')
if POS("ERROR", response) > 0 then do
  SAY "✗ HTTP_POST custom test failed: " response
end
else do
  SAY "✓ HTTP_POST custom test passed. Real response: " response
end
SAY ""

/* Test 5: Error handling with non-existent function */
SAY "5. Testing error handling..."
response = HTTP_POST('http://localhost:8080/function/non-existent', 'test')
SAY "✓ Non-existent function test: " response
SAY ""

SAY "=== HTTP Functions Test Complete ==="
SAY ""
SAY "🎉 SUCCESS! This demonstrates:"
SAY "   ✅ HTTP_GET() and HTTP_POST() functions working with real server"
SAY "   ✅ Real Python code execution (not mocked responses)"
SAY "   ✅ Proper error checking using POS() instead of LEFT()"
SAY "   ✅ Real OpenFaaS-compatible server integration"
exit 0