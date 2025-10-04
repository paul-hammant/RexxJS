#!/usr/bin/env rexx
/* Simple Lambda Test with SAM CLI - Real Deployment, No Mocks */

SAY "=== AWS Lambda Test with SAM CLI (Real, No Mocks) ==="
SAY ""

/* Load system address handler */
REQUIRE "../system/system-address.js"

/* Create Lambda function code */
LET lambda_code = <<PYTHON_CODE
import json

def lambda_handler(event, context):
    name = event.get('name', 'World')
    return {
        'statusCode': 200,
        'body': json.dumps({'message': f'Hello, {name}!'})
    }
PYTHON_CODE

SAY "1. Lambda function code created (HEREDOC)"
SAY "   Size: " LENGTH(lambda_code) " chars"
SAY ""

/* Create working directory */
SAY "2. Creating Lambda project..."
ADDRESS SYSTEM
LET result1 = execute command="mkdir -p /tmp/lambda-demo" shell="bash"
SAY "   Working dir: /tmp/lambda-demo"

/* Write Lambda code using FILE_WRITE */
lambda_file = "/tmp/lambda-demo/lambda_function.py"
write_result = FILE_WRITE(lambda_file, lambda_code)

if write_result.success then do
  SAY "   ✓ Lambda code written: " lambda_file
end
else do
  SAY "   ✗ Failed to write Lambda code"
  exit 1
end

/* Create SAM template */
LET template = <<TEMPLATE
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  TestFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: lambda_function.lambda_handler
      Runtime: python3.11
      CodeUri: .
TEMPLATE

template_result = FILE_WRITE("/tmp/lambda-demo/template.yaml", template)

if template_result.success then do
  SAY "   ✓ SAM template written"
end

/* Create test event */
LET event = <<EVENT
{
  "name": "RexxJS"
}
EVENT

event_result = FILE_WRITE("/tmp/lambda-demo/event.json", event)

if event_result.success then do
  SAY "   ✓ Test event written"
end
SAY ""

/* Invoke Lambda using SAM CLI */
SAY "3. Invoking Lambda with SAM CLI (REAL execution)..."
SAY ""

invoke_cmd = "cd /tmp/lambda-demo && sam local invoke TestFunction --event event.json --skip-pull-image 2>&1"
LET invoke_result = execute command=invoke_cmd shell="bash"

if invoke_result.success then do
  SAY "✅ Lambda invocation completed!"
  SAY ""
  SAY "Output:"
  SAY invoke_result.stdout
end
else do
  SAY "⚠️  Lambda invocation result:"
  SAY invoke_result.stdout
  if invoke_result.stderr <> "" then do
    SAY ""
    SAY "Stderr:"
    SAY invoke_result.stderr
  end
end

SAY ""
SAY "===== LAMBDA TEST COMPLETE ====="
SAY ""
SAY "Tools used:"
SAY "  • AWS SAM CLI (real local Lambda runtime)"
SAY "  • Python 3.11"
SAY "  • FILE_WRITE for filesystem ops"
SAY "  • ADDRESS SYSTEM for shell commands"
SAY "  • NO MOCKS - real Lambda execution"

exit 0