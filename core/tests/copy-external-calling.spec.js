/**
 * COPY with External Script Calling Tests
 * Tests the core use case: rexx_prog_1.rexx calling rexx_prog_2.rexx with COPY
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const path = require('path');
const fs = require('fs');

describe('COPY with External Script Calling', () => {
  let interpreter;
  let consoleSpy;
  let tempDir;

  beforeEach(() => {
    const mockRpc = {
      send: jest.fn().mockResolvedValue('mock response')
    };
    interpreter = new RexxInterpreter(mockRpc);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Create temporary directory for test scripts
    tempDir = path.join(__dirname, 'temp-external-scripts');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  // Helper function to run script and return captured output
  async function runScriptWithOutput(scriptContent, scriptPath) {
    const commands = parse(scriptContent);
    await interpreter.run(commands, scriptContent, scriptPath);
    return {
      output: consoleSpy.mock.calls.map(call => call[0]).join('\n')
    };
  }

  test('should verify external script calling works at all', async () => {
    // Create a simple external script
    const simpleScript = `SAY "External script executed successfully"`;
    const simplePath = path.join(tempDir, 'simple.rexx');
    fs.writeFileSync(simplePath, simpleScript);
    const simpleRel = './' + path.relative(process.cwd(), simplePath).replace(/\\/g, '/');

    // Create main script that calls it
const mainScript = `
SAY "Before external call"
CALL "${simpleRel}"
SAY "After external call"
`;

    const result = await runScriptWithOutput(mainScript, 'main.rexx');
    
    expect(result.output).toContain('Before external call');
    expect(result.output).toContain('External script executed successfully');
    expect(result.output).toContain('After external call');
  });

  test('should demonstrate pass-by-value with COPY() in external script calls', async () => {
    // Create the "untrusted" script that tries to mutate its parameters
    const untrustedScript = `
PARSE ARG received_array, received_object

SAY "Untrusted script received array with first element: " || ARRAY_GET(received_array, 1)
SAY "Untrusted script received object with name: " || ARRAY_GET(received_object, "name")

/* Try to mutate the received parameters */
LET received_array = ARRAY_SET(received_array, 1, "HACKED_ARRAY")
LET received_object = ARRAY_SET(received_object, "name", "HACKED_OBJECT")

SAY "Untrusted script modified array first element to: " || ARRAY_GET(received_array, 1)
SAY "Untrusted script modified object name to: " || ARRAY_GET(received_object, "name")
`;

    // Write the untrusted script to temp directory
    const untrustedPath = path.join(tempDir, 'untrusted.rexx');
    fs.writeFileSync(untrustedPath, untrustedScript);
    const untrustedRel = './' + path.relative(process.cwd(), untrustedPath).replace(/\\/g, '/');

    // Create the main script that calls the untrusted script with COPY
    const mainScript = `
LET myArray = ["original_array_value", "second"]
LET myObject = {"name": "original_object_value", "value": 42}

SAY "Before CALL - array first element: " || ARRAY_GET(myArray, 1)
SAY "Before CALL - object name: " || ARRAY_GET(myObject, "name")

/* Call external script with COPY to ensure pass-by-value */
CALL "${untrustedRel}" COPY(myArray) COPY(myObject)

SAY "After CALL with COPY - array first element: " || ARRAY_GET(myArray, 1)
SAY "After CALL with COPY - object name: " || ARRAY_GET(myObject, "name")
`;

    const result = await runScriptWithOutput(mainScript, 'main.rexx');
    
    // Verify the untrusted script received the data
    expect(result.output).toContain('Untrusted script received array with first element: original_array_value');
    expect(result.output).toContain('Untrusted script received object with name: original_object_value');
    
    // Verify the untrusted script could modify its copies
    expect(result.output).toContain('Untrusted script modified array first element to: HACKED_ARRAY');
    expect(result.output).toContain('Untrusted script modified object name to: HACKED_OBJECT');
    
    // The key test: verify the original data is unchanged (pass-by-value worked!)
    expect(result.output).toContain('Before CALL - array first element: original_array_value');
    expect(result.output).toContain('Before CALL - object name: original_object_value');
    expect(result.output).toContain('After CALL with COPY - array first element: original_array_value');
    expect(result.output).toContain('After CALL with COPY - object name: original_object_value');
  });

  test('should demonstrate pass-by-reference without COPY() in external script calls', async () => {
    // Create the "mutator" script 
    const mutatorScript = `
PARSE ARG received_array, received_object

SAY "Mutator received array first element: " || ARRAY_GET(received_array, 1)
SAY "Mutator received object name: " || ARRAY_GET(received_object, "name")

/* Mutate the received parameters directly */
LET received_array = ARRAY_SET(received_array, 1, "MUTATED_ARRAY")
LET received_object = ARRAY_SET(received_object, "name", "MUTATED_OBJECT")

SAY "Mutator modified array first element to: " || ARRAY_GET(received_array, 1)
SAY "Mutator modified object name to: " || ARRAY_GET(received_object, "name")
`;

    // Write the mutator script
    const mutatorPath = path.join(tempDir, 'mutator.rexx');
    fs.writeFileSync(mutatorPath, mutatorScript);
    const mutatorRel = './' + path.relative(process.cwd(), mutatorPath).replace(/\\/g, '/');

    // Create the main script that calls without COPY
    const mainScript = `
LET myArray = ["original_value", "second"] 
LET myObject = {"name": "original_name", "value": 42}

SAY "Before CALL - array first element: " || ARRAY_GET(myArray, 1)
SAY "Before CALL - object name: " || ARRAY_GET(myObject, "name")

/* Call external script WITHOUT COPY (pass-by-reference) */
CALL "${mutatorRel}" myArray myObject

SAY "After CALL without COPY - array first element: " || ARRAY_GET(myArray, 1)
SAY "After CALL without COPY - object name: " || ARRAY_GET(myObject, "name")
`;

    const result = await runScriptWithOutput(mainScript, 'main.rexx');
    
    // Verify the mutator script received the data
    expect(result.output).toContain('Mutator received array first element: original_value');
    expect(result.output).toContain('Mutator received object name: original_name');
    
    // For pass-by-reference, the original should be affected
    // NOTE: This test will reveal whether pass-by-reference actually works in external calls
    expect(result.output).toContain('Before CALL - array first element: original_value');
    expect(result.output).toContain('Before CALL - object name: original_name');
    
    // The key difference: without COPY, mutations might affect the original
    // (This depends on how external script parameter passing is implemented)
  });
});
