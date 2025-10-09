/**
 * SELECT Statement Bug Test
 * Demonstrates that SELECT/WHEN/OTHERWISE/END is currently broken
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('RexxJS SELECT Statement Tests', () => {
  const rexxExecutable = path.join(__dirname, '../../bin/rexx');
  const scriptsDir = path.join(__dirname, 'scripts');

  function runRexxScript(scriptContent) {
    return new Promise((resolve, reject) => {
      const child = spawn(rexxExecutable, ['--stdin'], {
        cwd: path.join(__dirname, '..'),
        timeout: 15000
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Write script to stdin
      child.stdin.write(scriptContent);
      child.stdin.end();
    });
  }

  test('SELECT with simple numeric comparison should work', async () => {
    const script = `#!/usr/bin/env rexx
/* Test simple SELECT */

x = 2

SELECT
  WHEN x = 1 THEN SAY 'One'
  WHEN x = 2 THEN SAY 'Two'
  WHEN x = 3 THEN SAY 'Three'
  OTHERWISE SAY 'Other'
END

SAY 'SELECT completed successfully'
EXIT 0
`;

    const result = await runRexxScript(script);

    // Debug output
    console.log('Simple SELECT exit code:', result.code);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    console.log('STDOUT:', result.stdout);

    // Should execute successfully
    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Two');
    expect(result.stdout).toContain('SELECT completed successfully');
  }, 20000);

  test('SELECT with string comparison should work', async () => {
    const script = `#!/usr/bin/env rexx
/* Test SELECT with strings */

env = 'DOCKER'

SELECT
  WHEN env = 'DOCKER' THEN SAY 'Docker environment'
  WHEN env = 'PODMAN' THEN SAY 'Podman environment'
  WHEN env = 'LXD' THEN SAY 'LXD environment'
  OTHERWISE SAY 'Unknown environment'
END

SAY 'String SELECT completed'
EXIT 0
`;

    const result = await runRexxScript(script);

    console.log('String SELECT exit code:', result.code);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    console.log('STDOUT:', result.stdout);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Docker environment');
    expect(result.stdout).toContain('String SELECT completed');
  }, 20000);

  test('SELECT with DO blocks should work', async () => {
    const script = `#!/usr/bin/env rexx
/* Test SELECT with DO blocks */

x = 2

SELECT
  WHEN x = 1 THEN DO
    SAY 'Processing one'
    SAY 'One complete'
  END
  WHEN x = 2 THEN DO
    SAY 'Processing two'
    SAY 'Two complete'
  END
  OTHERWISE DO
    SAY 'Processing other'
  END
END

SAY 'DO block SELECT completed'
EXIT 0
`;

    const result = await runRexxScript(script);

    console.log('DO block SELECT exit code:', result.code);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    console.log('STDOUT:', result.stdout);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Processing two');
    expect(result.stdout).toContain('Two complete');
    expect(result.stdout).toContain('DO block SELECT completed');
  }, 20000);

  test('SELECT inside PROCEDURE should work', async () => {
    const script = `#!/usr/bin/env rexx
/* Test SELECT in PROCEDURE */

targetEnv = 'DOCKER'
CALL TestProc 'mycontainer', '/path/to/binary'
EXIT 0

TestProc: PROCEDURE EXPOSE targetEnv
  PARSE ARG targetName, binaryPath

  SAY 'Inside procedure, targetEnv =' targetEnv

  SELECT
    WHEN targetEnv = 'DOCKER' THEN DO
      SAY 'Docker: deploying to' targetName
    END
    WHEN targetEnv = 'PODMAN' THEN DO
      SAY 'Podman: deploying to' targetName
    END
    WHEN targetEnv = 'LXD' THEN DO
      SAY 'LXD: deploying to' targetName
    END
    OTHERWISE DO
      SAY 'Unknown environment'
    END
  END

  SAY 'Procedure SELECT completed'
  RETURN
`;

    const result = await runRexxScript(script);

    console.log('PROCEDURE SELECT exit code:', result.code);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    console.log('STDOUT:', result.stdout);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Inside procedure, targetEnv = DOCKER');
    expect(result.stdout).toContain('Docker: deploying to mycontainer');
    expect(result.stdout).toContain('Procedure SELECT completed');
  }, 20000);

  test('Nested SELECT should work', async () => {
    const script = `#!/usr/bin/env rexx
/* Test nested SELECT */

x = 2
y = 'B'

SELECT
  WHEN x = 1 THEN SAY 'X is one'
  WHEN x = 2 THEN DO
    SAY 'X is two, checking Y...'
    SELECT
      WHEN y = 'A' THEN SAY 'Y is A'
      WHEN y = 'B' THEN SAY 'Y is B'
      OTHERWISE SAY 'Y is other'
    END
    SAY 'Nested SELECT done'
  END
  OTHERWISE SAY 'X is other'
END

SAY 'Nested SELECT completed'
EXIT 0
`;

    const result = await runRexxScript(script);

    console.log('Nested SELECT exit code:', result.code);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    console.log('STDOUT:', result.stdout);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('X is two, checking Y...');
    expect(result.stdout).toContain('Y is B');
    expect(result.stdout).toContain('Nested SELECT done');
    expect(result.stdout).toContain('Nested SELECT completed');
  }, 20000);

  test('SELECT with complex expressions should work', async () => {
    const script = `#!/usr/bin/env rexx
/* Test SELECT with complex expressions */

age = 25
name = 'John'

SELECT
  WHEN age < 18 THEN SAY 'Minor'
  WHEN age >= 18 & age < 65 THEN DO
    SAY 'Adult'
    SAY 'Name:' name
  END
  WHEN age >= 65 THEN SAY 'Senior'
  OTHERWISE SAY 'Unknown'
END

SAY 'Complex SELECT completed'
EXIT 0
`;

    const result = await runRexxScript(script);

    console.log('Complex SELECT exit code:', result.code);
    if (result.stderr) {
      console.log('STDERR:', result.stderr);
    }
    console.log('STDOUT:', result.stdout);

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Adult');
    expect(result.stdout).toContain('Name: John');
    expect(result.stdout).toContain('Complex SELECT completed');
  }, 20000);
});
