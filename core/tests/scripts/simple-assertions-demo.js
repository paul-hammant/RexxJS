#!/usr/bin/env ./rexxt

/**
 * Simple RexxJS Assertions Demo (JavaScript version for testing)
 * This demonstrates how the assertions work in a script context
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { ADDRESS_EXPECTATIONS_HANDLER } = require('../../src/expectations-address');

console.log('=== RexxJS Assertions Demo ===\n');

// Test data
const testData = {
  user_age: 25,
  user_name: "John Doe",
  scores: [85, 92, 78, 95],
  user_profile: {
    name: "Alice Smith",
    age: 30,
    email: "alice@example.com",
    active: true,
    roles: ["admin", "user"],
    settings: {
      theme: "dark",
      notifications: true
    }
  }
};

async function runAssertions() {
  try {
    console.log('Testing basic number assertions...');
    
    // Basic tests
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{25} should be 25' });
    console.log('✓ Literal number equality passed');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user_age} should be greater than 18', context: testData });
    console.log('✓ Age validation passed');
    
    console.log('\nTesting string assertions...');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user_name} should contain "John"', context: testData });
    console.log('✓ Name contains check passed');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{"hello@example.com"} should contain "@"' });
    console.log('✓ Email format check passed');
    
    console.log('\nTesting array assertions...');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{scores} should be an array', context: testData });
    console.log('✓ Array type check passed');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{scores} should have length 4', context: testData });
    console.log('✓ Array length check passed');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{scores} should contain 95', context: testData });
    console.log('✓ Array contains check passed');
    
    console.log('\nTesting object and nested property assertions...');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user_profile.name} should be "Alice Smith"', context: testData });
    console.log('✓ Nested property equality passed');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user_profile.age} should be greater than 25', context: testData });
    console.log('✓ Nested number comparison passed');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user_profile.settings.theme} should be "dark"', context: testData });
    console.log('✓ Deep nested property check passed');
    
    console.log('\nTesting negation assertions...');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user_age} should not be 30', context: testData });
    console.log('✓ Negated equality check passed');
    
    await ADDRESS_EXPECTATIONS_HANDLER('expect', { expression: '{user_profile.active} should not be falsy', context: testData });
    console.log('✓ Negated falsy check passed');
    
    console.log('\n=== All Assertions Passed! ===');
    console.log('RexxJS Assertions ADDRESS library is working correctly.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Assertion failed:', error.message);
    process.exit(1);
  }
}

runAssertions();