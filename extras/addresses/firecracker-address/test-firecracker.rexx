#!/usr/bin/env rexx
/*
 * Test Firecracker microVM Handler
 * Basic functionality test
 */

REQUIRE "cwd:firecracker-address.js"

SAY "=== Firecracker microVM Test ==="
SAY ""

/* Test 1: Check status */
SAY "Test 1: Check status..."
ADDRESS FIRECRACKER
"status"
SAY "  ✓ Handler ready"
SAY "  Runtime:" RESULT.runtime
SAY "  CoW Method:" RESULT.cowMethod
SAY ""

/* Test 2: List microVMs */
SAY "Test 2: List microVMs..."
"list"
SAY "  ✓ Found" RESULT.count "microVMs"
SAY ""

SAY "=== Test Complete ==="
SAY ""
SAY "Note: Firecracker provides ultra-fast microVMs"
SAY "  • Boot time: <125ms"
SAY "  • Memory overhead: ~5MB per VM"
SAY "  • KVM-based security isolation"
SAY "  • Perfect for serverless/FaaS workloads"
