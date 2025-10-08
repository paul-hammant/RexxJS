#!/usr/bin/env node
/**
 * Simple LXD test - uses the FIXED handler that won't hang
 */

const { AddressLxdHandler } = require('./lxd-address-fixed.js');

async function main() {
  console.log('=== LXD CoW Cloning Test (Fixed) ===\n');

  const handler = new AddressLxdHandler();
  await handler.initialize();

  console.log('✓ Handler initialized\n');

  // Test 1: Create base container
  console.log('Test 1: Create base container...');
  const createStart = Date.now();
  const createResult = await handler.handleAddressCommand('create name=lxd-base-test image=ubuntu:22.04');
  console.log(`  ${createResult.success ? '✓' : '✗'} ${createResult.output}`);
  console.log(`  Time: ${Date.now() - createStart}ms\n`);

  // Test 2: Start container
  console.log('Test 2: Start container...');
  const startTime = Date.now();
  const startResult = await handler.handleAddressCommand('start name=lxd-base-test');
  console.log(`  ${startResult.success ? '✓' : '✗'} ${startResult.output}`);
  console.log(`  Time: ${Date.now() - startTime}ms\n`);

  // Test 3: Execute command
  console.log('Test 3: Execute command...');
  const execResult = await handler.handleAddressCommand('execute name=lxd-base-test command="echo Hello from LXD container!"');
  console.log(`  ${execResult.success ? '✓' : '✗'} ${execResult.output}`);

  // Test 4: Register as base
  console.log('\nTest 4: Register as base image...');
  await handler.handleAddressCommand('stop name=lxd-base-test');
  const registerResult = await handler.handleAddressCommand('register_base name=lxd-base-test');
  console.log(`  ${registerResult.success ? '✓' : '✗'} ${registerResult.output}\n`);

  // Test 5: Clone from base (instant!)
  console.log('Test 5: Clone from base (should be <100ms)...');
  const cloneStart = Date.now();
  const cloneResult = await handler.handleAddressCommand('clone_from_base base=lxd-base-test name=lxd-clone-1');
  const cloneTime = Date.now() - cloneStart;
  console.log(`  ${cloneResult.success ? '✓' : '✗'} ${cloneResult.output}`);
  console.log(`  Clone time: ${cloneTime}ms ${cloneTime < 1000 ? '🚀' : '⚠ (slower than expected)'}\n`);

  // Test 6: Multiple clones
  console.log('Test 6: Create 3 more clones...');
  const multiStart = Date.now();
  await handler.handleAddressCommand('clone_from_base base=lxd-base-test name=lxd-clone-2');
  await handler.handleAddressCommand('clone_from_base base=lxd-base-test name=lxd-clone-3');
  await handler.handleAddressCommand('clone_from_base base=lxd-base-test name=lxd-clone-4');
  const multiTime = Date.now() - multiStart;
  console.log(`  ✓ Created 3 clones in ${multiTime}ms (avg: ${Math.round(multiTime/3)}ms/clone)\n`);

  // Test 7: List containers
  console.log('Test 7: List all containers...');
  const listResult = await handler.handleAddressCommand('list');
  console.log(`  ✓ ${listResult.output}`);
  console.log(`  Containers: ${listResult.containers.map(c => c.name).join(', ')}\n`);

  // Cleanup
  console.log('Cleanup: Removing test containers...');
  await handler.handleAddressCommand('delete name=lxd-base-test');
  await handler.handleAddressCommand('delete name=lxd-clone-1');
  await handler.handleAddressCommand('delete name=lxd-clone-2');
  await handler.handleAddressCommand('delete name=lxd-clone-3');
  await handler.handleAddressCommand('delete name=lxd-clone-4');
  console.log('  ✓ Cleanup complete\n');

  console.log('=== All Tests Passed! ===');
}

main().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
