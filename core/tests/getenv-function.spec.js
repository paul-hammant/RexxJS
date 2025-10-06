/**
 * GETENV Function Tests
 * Tests for accessing OS environment variables from REXX scripts
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('GETENV Function', () => {
  let interpreter;
  const originalEnv = process.env;

  beforeEach(() => {
    interpreter = new RexxInterpreter();
    // Set up test environment variables
    process.env = {
      ...originalEnv,
      TEST_VAR: 'test_value',
      USER: 'testuser',
      HOSTNAME: 'testhost',
      PATH: '/usr/bin:/bin',
      EMPTY_VAR: ''
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should read existing environment variable', async () => {
    const script = `LET result = GETENV("TEST_VAR")`;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('result')).toBe('test_value');
  });

  it('should read USER environment variable', async () => {
    const script = `LET user = GETENV("USER")`;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('user')).toBe('testuser');
  });

  it('should read HOSTNAME environment variable', async () => {
    const script = `LET hostname = GETENV("HOSTNAME")`;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('hostname')).toBe('testhost');
  });

  it('should read PATH environment variable', async () => {
    const script = `LET path = GETENV("PATH")`;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('path')).toBe('/usr/bin:/bin');
  });

  it('should return empty string for non-existent variable', async () => {
    const script = `LET result = GETENV("NONEXISTENT_VAR")`;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('result')).toBe('');
  });

  it('should return empty string for variable with empty value', async () => {
    const script = `LET result = GETENV("EMPTY_VAR")`;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('result')).toBe('');
  });

  it('should work in conditional expressions', async () => {
    const script = `
      IF GETENV("USER") = "testuser" THEN DO
        LET result = "match"
      END
      ELSE DO
        LET result = "no_match"
      END
    `;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('result')).toBe('match');
  });

  it('should work in string concatenation', async () => {
    const script = `LET result = "Host: " || GETENV("HOSTNAME")`;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('result')).toBe('Host: testhost');
  });

  it('should handle variable names as expressions', async () => {
    const script = `
      LET var_name = "USER"
      LET result = GETENV(var_name)
    `;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('result')).toBe('testuser');
  });

  it('should work with LENGTH to check if variable exists', async () => {
    const script = `
      LET exists = LENGTH(GETENV("USER"))
      LET not_exists = LENGTH(GETENV("NONEXISTENT"))
    `;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('exists')).toBeGreaterThan(0);
    expect(interpreter.getVariable('not_exists')).toBe(0);
  });

  it('should be case-sensitive for variable names', async () => {
    process.env.CaseSensitive = 'uppercase';
    process.env.casesensitive = 'lowercase';

    const script = `
      LET upper = GETENV("CaseSensitive")
      LET lower = GETENV("casesensitive")
    `;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('upper')).toBe('uppercase');
    expect(interpreter.getVariable('lower')).toBe('lowercase');
  });

  it('should work in loops', async () => {
    process.env.VAR1 = 'value1';
    process.env.VAR2 = 'value2';
    process.env.VAR3 = 'value3';

    const script = `
      LET vars = ["VAR1", "VAR2", "VAR3"]
      LET result = ""
      DO var OVER vars
        LET result = result || GETENV(var) || ","
      END
    `;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('result')).toBe('value1,value2,value3,');
  });

  it('should handle special characters in environment values', async () => {
    process.env.SPECIAL = 'value with spaces and $pecial ch@rs!';

    const script = `LET result = GETENV("SPECIAL")`;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('result')).toBe('value with spaces and $pecial ch@rs!');
  });

  it('should work with SAY statement', async () => {
    const outputLines = [];
    interpreter.outputHandler = {
      write: (text) => outputLines.push(text),
      writeLine: (text) => outputLines.push(text),
      writeError: (text) => outputLines.push(text),
      output: (text) => outputLines.push(text)
    };

    const script = `SAY "User: " || GETENV("USER")`;
    await interpreter.run(parse(script));
    expect(outputLines[0]).toBe('User: testuser');
  });

  it('should allow conditional logic based on environment', async () => {
    process.env.APP_ENV = 'production';

    const script = `
      LET env = GETENV("APP_ENV")
      IF env = "production" THEN DO
        LET mode = "prod"
      END
      ELSE IF env = "development" THEN DO
        LET mode = "dev"
      END
      ELSE DO
        LET mode = "unknown"
      END
    `;
    await interpreter.run(parse(script));
    expect(interpreter.getVariable('mode')).toBe('prod');
  });
});
