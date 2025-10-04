#!/usr/bin/env node
/**
 * Demo: Lambda Hello World Test
 * Shows how the ADDRESS LAMBDA handler works with a simple hello world example
 */

const { AddressLambdaHandler } = require('./address-lambda');
const fs = require('fs');
const path = require('path');

async function runLambdaHelloWorldDemo() {
  console.log('=== Lambda Hello World Demo ===\n');

  // Initialize handler for local environment
  const handler = new AddressLambdaHandler();
  await handler.initialize({ environment: 'local' });

  try {
    // 1. Check status
    console.log('1. Checking Lambda environment...');
    const status = await handler.handleAddressCommand('status');
    console.log('✓ Status:', status.environment);
    console.log();

    // 2. Create a simple Python hello world function
    console.log('2. Creating hello-world function...');
    const pythonCode = `import json

def lambda_handler(event, context):
    name = event.get('name', 'World')
    message = f"Hello, {name}!"
    return {
        'statusCode': 200,
        'body': json.dumps({'message': message})
    }`;

    // Write Python code to temp file
    const tempDir = '/tmp/lambda-demo';
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(`${tempDir}/lambda_function.py`, pythonCode);

    // Package the function
    const packageResult = await handler.handleAddressCommand(`package name=hello-world code_dir=${tempDir} runtime=python3.11`);
    if (packageResult.success) {
      console.log('✓ Function packaged successfully');
    } else {
      console.log('✗ Function packaging failed:', packageResult.error);
      return;
    }

    // Create the function
    const createResult = await handler.handleAddressCommand(`create name=hello-world runtime=python3.11 code=${packageResult.package_path} handler=lambda_function.lambda_handler`);
    if (createResult.success) {
      console.log('✓ Function created successfully');
    } else {
      console.log('✗ Function creation failed:', createResult.error);
      return;
    }
    console.log();

    // 3. Test with default payload
    console.log('3. Testing function with default payload...');
    const invokeResult1 = await handler.handleAddressCommand('local_invoke name=hello-world event={}');
    if (invokeResult1.success) {
      console.log('✓ Default test passed');
      console.log('Response:', invokeResult1.response);
    } else {
      console.log('✗ Default test failed:', invokeResult1.error);
    }
    console.log();

    // 4. Test with custom name
    console.log('4. Testing function with custom name...');
    const invokeResult2 = await handler.handleAddressCommand('local_invoke name=hello-world event={"name": "RexxJS"}');
    if (invokeResult2.success) {
      console.log('✓ Custom name test passed');
      console.log('Response:', invokeResult2.response);
    } else {
      console.log('✗ Custom name test failed:', invokeResult2.error);
    }
    console.log();

    // 5. Deploy a RexxJS function
    console.log('5. Creating RexxJS hello function...');
    const rexxScript = 'SAY "Hello from RexxJS Lambda!"';
    const rexxResult = await handler.handleAddressCommand(`deploy_rexx name=hello-rexx rexx_script="${rexxScript}" runtime=python3.11`);
    if (rexxResult.success) {
      console.log('✓ RexxJS function deployed');
      console.log('Function:', rexxResult.function);
    } else {
      console.log('✗ RexxJS function deployment failed:', rexxResult.error);
    }
    console.log();

    // 6. Test RexxJS function
    console.log('6. Testing RexxJS function...');
    const rexxInvokeResult = await handler.handleAddressCommand('invoke_rexx name=hello-rexx');
    if (rexxInvokeResult.success) {
      console.log('✓ RexxJS function test passed');
      console.log('Output:', rexxInvokeResult.output);
    } else {
      console.log('✗ RexxJS function test failed:', rexxInvokeResult.error);
    }
    console.log();

    // 7. List all functions
    console.log('7. Listing all functions...');
    const listResult = await handler.handleAddressCommand('list');
    if (listResult.success) {
      console.log('Functions:', listResult.functions.map(f => f.name || f.FunctionName).join(', '));
    }
    console.log();

    // 8. Cleanup
    console.log('8. Cleaning up...');
    await handler.handleAddressCommand('delete name=hello-world');
    await handler.handleAddressCommand('delete name=hello-rexx');
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✓ Cleanup completed');
    console.log();

    console.log('=== Lambda Hello World Demo Complete ===');

  } catch (error) {
    console.error('Demo failed:', error.message);
  }
}

// Run the demo if called directly
if (require.main === module) {
  runLambdaHelloWorldDemo().catch(console.error);
}

module.exports = { runLambdaHelloWorldDemo };