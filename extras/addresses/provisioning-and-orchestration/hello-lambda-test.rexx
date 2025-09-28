#!/usr/bin/env rexx
/* Hello World Lambda Test Script */

SAY "=== Local Lambda Hello World Test ==="
SAY ""

/* Initialize Lambda handler */
address_lambda = "lambda"

/* 1. Check environment setup */
SAY "1. Checking Lambda environment..."
ADDRESS (address_lambda) "status"
if RC \= 0 then do
  SAY "Error: Lambda environment not ready"
  exit 1
end
SAY "✓ Lambda environment ready"
SAY ""

/* 2. Create a simple hello world function */
SAY "2. Creating hello-world function..."
python_code = 'import json' || '0a'x || ,
               'def lambda_handler(event, context):' || '0a'x || ,
               '    name = event.get("name", "World")' || '0a'x || ,
               '    message = f"Hello, {name}!"' || '0a'x || ,
               '    return {' || '0a'x || ,
               '        "statusCode": 200,' || '0a'x || ,
               '        "body": json.dumps({"message": message})' || '0a'x || ,
               '    }'

/* Write the Python code to a file */
call lineout '/tmp/hello_lambda.py', python_code

/* Package and create the function */
ADDRESS (address_lambda) "package name=hello-world code_dir=/tmp runtime=python3.11"
if RC \= 0 then do
  SAY "Error: Failed to package function"
  exit 1
end

ADDRESS (address_lambda) "create name=hello-world runtime=python3.11 code=/tmp/hello-world.zip handler=hello_lambda.lambda_handler"
if RC \= 0 then do
  SAY "Error: Failed to create function"
  exit 1
end
SAY "✓ Function created successfully"
SAY ""

/* 3. Test the function with default payload */
SAY "3. Testing function with default payload..."
ADDRESS (address_lambda) "local_invoke name=hello-world event={}"
lambda_rc = RC
if lambda_rc = 0 then
  SAY "✓ Default test passed"
else
  SAY "✗ Default test failed (RC=" || lambda_rc || ")"
SAY ""

/* 4. Test with custom name */
SAY "4. Testing function with custom name..."
ADDRESS (address_lambda) 'local_invoke name=hello-world event={"name": "RexxJS"}'
lambda_rc = RC
if lambda_rc = 0 then
  SAY "✓ Custom name test passed"
else
  SAY "✗ Custom name test failed (RC=" || lambda_rc || ")"
SAY ""

/* 4b. Verify function exists in list */
SAY "4b. Verifying function exists..."
ADDRESS (address_lambda) "list"
if RC = 0 then
  SAY "✓ Function list retrieved"
else
  SAY "✗ Function list failed"
SAY ""

/* 5. Deploy a RexxJS function */
SAY "5. Creating RexxJS hello function..."
rexx_script = 'SAY "Hello from RexxJS Lambda!"'
ADDRESS (address_lambda) 'deploy_rexx name=hello-rexx rexx_script="' || rexx_script || '" runtime=python3.11'
if RC = 0 then
  SAY "✓ RexxJS function deployed"
else
  SAY "✗ RexxJS function deployment failed"
SAY ""

/* 6. Test RexxJS function */
SAY "6. Testing RexxJS function..."
ADDRESS (address_lambda) "invoke_rexx name=hello-rexx"
if RC = 0 then
  SAY "✓ RexxJS function test passed"
else
  SAY "✗ RexxJS function test failed"
SAY ""

/* 7. List all functions */
SAY "7. Listing all functions..."
ADDRESS (address_lambda) "list"
SAY ""

/* 8. Cleanup */
SAY "8. Cleaning up..."
ADDRESS (address_lambda) "delete name=hello-world"
ADDRESS (address_lambda) "delete name=hello-rexx"
call sysfiledelete '/tmp/hello_lambda.py'
call sysfiledelete '/tmp/hello-world.zip'
SAY "✓ Cleanup completed"
SAY ""

SAY "=== Lambda Hello World Test Complete ==="
exit 0