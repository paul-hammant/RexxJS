/* HTTP Functions Demo */
SAY "=== HTTP Functions Demo ==="

/* Test HTTP_GET */
SAY "Testing HTTP_GET..."
result = HTTP_GET('https://httpbin.org/get')
if LEFT(result, 5) = "ERROR" then
  SAY "HTTP_GET failed: " result
else
  SAY "HTTP_GET success (length: " LENGTH(result) ")"

/* Test HTTP_POST */
SAY "Testing HTTP_POST..."
data = '{"message": "Hello from RexxJS"}'
result = HTTP_POST('https://httpbin.org/post', data)
if LEFT(result, 5) = "ERROR" then
  SAY "HTTP_POST failed: " result
else
  SAY "HTTP_POST success (length: " LENGTH(result) ")"

SAY "=== HTTP Demo Complete ==="