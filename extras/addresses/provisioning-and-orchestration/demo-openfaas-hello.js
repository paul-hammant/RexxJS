#!/usr/bin/env node
/**
 * Demo: OpenFaaS Hello World Test
 * Shows how the ADDRESS OPENFAAS handler works with a simple hello world example
 */

const { AddressOpenFaaSHandler } = require('./address-openfaas');
const fs = require('fs');

async function runOpenFaaSHelloWorldDemo() {
  console.log('=== OpenFaaS Hello World Demo ===\n');

  // Initialize handler for local environment
  const handler = new AddressOpenFaaSHandler();
  await handler.initialize({ environment: 'local' });

  try {
    // 1. Check status
    console.log('1. Checking OpenFaaS environment...');
    const status = await handler.handleAddressCommand('status');
    console.log('✓ Status:', status.message || 'OpenFaaS ready');
    console.log();

    // 2. List available templates
    console.log('2. Checking available templates...');
    const templateResult = await handler.handleAddressCommand('template_list');
    if (templateResult.success) {
      console.log('✓ Templates available');
      if (templateResult.templates) {
        console.log('Available templates:', templateResult.templates.slice(0, 5).join(', '), '...');
      }
    } else {
      console.log('⚠ Templates not listed, continuing with demo');
    }
    console.log();

    // 3. Create a simple Python hello world function
    console.log('3. Creating Python hello-world function...');
    const pythonHandler = `def handle(req):
    """Handle a request to the function"""
    name = req or "World"
    return f"Hello, {name}!"`;

    // Write Python handler to temp file
    const tempDir = '/tmp/openfaas-demo';
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(`${tempDir}/handler.py`, pythonHandler);

    // Deploy using Python3 template
    const deployResult = await handler.handleAddressCommand(`deploy name=hello-world image=hello-world:latest template=python3-http code_dir=${tempDir}`);
    if (deployResult.success) {
      console.log('✓ Function deployed successfully');
      console.log('Function URL:', deployResult.url);
    } else {
      console.log('✗ Function deployment failed:', deployResult.error);
      console.log('Note: This requires Docker and OpenFaaS to be running');
    }
    console.log();

    // 4. List functions
    console.log('4. Listing functions...');
    const listResult = await handler.handleAddressCommand('list');
    if (listResult.success) {
      console.log('✓ Functions listed');
      if (listResult.functions && listResult.functions.length > 0) {
        console.log('Functions:', listResult.functions.map(f => f.name).join(', '));
      }
    }
    console.log();

    // 5. Test the function with default payload
    console.log('5. Testing function with default payload...');
    const invokeResult1 = await handler.handleAddressCommand('invoke name=hello-world');
    if (invokeResult1.success) {
      console.log('✓ Default test passed');
      console.log('Response:', invokeResult1.output);
    } else {
      console.log('✗ Default test failed:', invokeResult1.error);
      console.log('Note: Function may still be starting up');
    }
    console.log();

    // 6. Test with custom payload
    console.log('6. Testing function with custom payload...');
    const invokeResult2 = await handler.handleAddressCommand('invoke name=hello-world payload=RexxJS');
    if (invokeResult2.success) {
      console.log('✓ Custom payload test passed');
      console.log('Response:', invokeResult2.output);
    } else {
      console.log('✗ Custom payload test failed:', invokeResult2.error);
    }
    console.log();

    // 7. Scale the function
    console.log('7. Scaling function to 2 replicas...');
    const scaleResult = await handler.handleAddressCommand('scale name=hello-world replicas=2');
    if (scaleResult.success) {
      console.log('✓ Function scaled successfully');
    } else {
      console.log('✗ Function scaling failed:', scaleResult.error);
    }
    console.log();

    // 8. Deploy a RexxJS function
    console.log('8. Creating RexxJS hello function...');
    const rexxScript = `parse arg input
if input = "" then input = "World"
SAY "Hello from RexxJS OpenFaaS, " || input || "!"`;

    const rexxResult = await handler.handleAddressCommand(`deploy_rexx name=hello-rexx rexx_script="${rexxScript}" image_base=alpine:latest`);
    if (rexxResult.success) {
      console.log('✓ RexxJS function deployed');
      console.log('Function:', rexxResult.function);
    } else {
      console.log('✗ RexxJS function deployment failed:', rexxResult.error);
      console.log('Note: This requires RexxJS binary and Docker build capability');
    }
    console.log();

    // 9. Test RexxJS function (if deployed)
    if (rexxResult.success) {
      console.log('9. Testing RexxJS function...');
      // Wait a moment for the function to be ready
      console.log('Waiting for function to be ready...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const rexxInvokeResult = await handler.handleAddressCommand('invoke name=hello-rexx payload=OpenFaaS');
      if (rexxInvokeResult.success) {
        console.log('✓ RexxJS function test passed');
        console.log('Output:', rexxInvokeResult.output);
      } else {
        console.log('✗ RexxJS function test failed:', rexxInvokeResult.error);
      }
      console.log();
    }

    // 10. Get function info
    console.log('10. Getting function details...');
    const infoResult = await handler.handleAddressCommand('info name=hello-world');
    if (infoResult.success) {
      console.log('✓ Function info retrieved');
      console.log('Replicas:', infoResult.replicas || 'unknown');
    }
    console.log();

    // 11. Cleanup
    console.log('11. Cleaning up...');
    await handler.handleAddressCommand('remove name=hello-world');
    if (rexxResult.success) {
      await handler.handleAddressCommand('remove name=hello-rexx');
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✓ Cleanup completed');
    console.log();

    console.log('=== OpenFaaS Hello World Demo Complete ===');
    console.log();
    console.log('Note: For full functionality, ensure:');
    console.log('- Docker is running');
    console.log('- OpenFaaS is deployed (docker stack or k3s)');
    console.log('- faas-cli is installed');
    console.log('- RexxJS binary is available for RexxJS functions');

  } catch (error) {
    console.error('Demo failed:', error.message);
  }
}

// Run the demo if called directly
if (require.main === module) {
  runOpenFaaSHelloWorldDemo().catch(console.error);
}

module.exports = { runOpenFaaSHelloWorldDemo };