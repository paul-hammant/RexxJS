#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, system-address, registry, integration */
/* @description Test loading system-address from published registry */

REQUIRE "../core/src/expectations-address.js"

SAY "🧪 Testing Published Module: org.rexxjs/system-address"
SAY "Loading module from registry..."

// Load system-address from the published registry
REQUIRE "registry:org.rexxjs/system-address"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Execute simple command
SAY "Test 1: Execute 'echo' command"

ADDRESS SYSTEM "echo Hello from RexxJS"
LET output = RESULT

IF output <> "" THEN DO
  SAY "✓ Command executed: " || output
END
ELSE DO
  SAY "❌ Command failed"
  EXIT 1
END

SAY ""

// Test 2: Test current directory
SAY "Test 2: Get current directory"

ADDRESS SYSTEM "pwd"
LET pwd = RESULT

IF pwd <> "" THEN DO
  SAY "✓ Current directory: " || pwd
END
ELSE DO
  SAY "❌ Failed to get directory"
  EXIT 1
END

SAY ""

// Test 3: List files
SAY "Test 3: List files in current directory"

ADDRESS SYSTEM "ls -la | head -5"
LET files = RESULT

IF files <> "" THEN DO
  SAY "✓ Files listed:"
  SAY files
END
ELSE DO
  SAY "❌ Failed to list files"
  EXIT 1
END

SAY ""
SAY "🎉 All tests passed for org.rexxjs/system-address!"
