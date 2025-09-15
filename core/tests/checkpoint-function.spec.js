/**
 * CHECKPOINT Function Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('CHECKPOINT Function Tests', () => {
  let interpreter;
  let progressUpdates;
  
  beforeEach(() => {
    progressUpdates = [];
    
    // Create interpreter with streaming callback
    interpreter = new RexxInterpreter(null, {
      output: (text) => console.log('SAY:', text)
    });
    
    // Add streaming callback to capture progress updates
    interpreter.streamingProgressCallback = (progressData) => {
      progressUpdates.push(progressData);
      console.log('Progress update:', progressData);
    };
  });

  test('should have CHECKPOINT function available', () => {
    expect(interpreter.builtInFunctions['CHECKPOINT']).toBeDefined();
    expect(typeof interpreter.builtInFunctions['CHECKPOINT']).toBe('function');
  });

  test('should call CHECKPOINT function and return dict', () => {
    const result = interpreter.builtInFunctions['CHECKPOINT'](1, 2, 3);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result.action).toBe('continue');
    expect(result.message).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  test('should send progress updates when CHECKPOINT is called', () => {
    // Set some variables
    interpreter.variables.set('count', 42);
    interpreter.variables.set('total', 100);
    
    // Call CHECKPOINT
    const result = interpreter.builtInFunctions['CHECKPOINT'](42, 100);
    
    // Verify progress update was sent
    expect(progressUpdates).toHaveLength(1);
    expect(progressUpdates[0]).toMatchObject({
      type: 'rexx-progress',
      variables: {
        count: 42,
        total: 100
      },
      params: [42, 100],
      line: 0
    });
    
    // Verify return value
    expect(result.action).toBe('continue');
  });

  test('should execute simple Rexx script with CHECKPOINT', async () => {
    const rexxCode = `
      SAY "Starting simple test"
      LET counter = 42
      LET result = CHECKPOINT(counter)
      SAY "CHECKPOINT returned:" result.action
      SAY "Test completed"
    `;
    
    const commands = parse(rexxCode);
    console.log('Parsed commands:', commands.length);
    
    await interpreter.run(commands);
    
    // Verify progress update was sent
    expect(progressUpdates).toHaveLength(1);
    expect(progressUpdates[0].variables).toHaveProperty('counter', 42);
    // Note: result variable won't be in progress update because CHECKPOINT is called before assignment completes
  });

  test('should handle CHECKPOINT in DO loop', async () => {
    const rexxCode = `
      SAY "Testing CHECKPOINT in loop"
      DO i = 1 TO 3
        SAY "Loop iteration:" i
        LET response = CHECKPOINT(i)
        SAY "Response action:" response.action
      END
      SAY "Loop completed"
    `;
    
    const commands = parse(rexxCode);
    console.log('Loop test commands:', commands.length);
    
    await interpreter.run(commands);
    
    // Should have 3 progress updates (one per CHECKPOINT call)
    expect(progressUpdates).toHaveLength(3);
    
    // Check that each update has the loop variable
    progressUpdates.forEach((update, index) => {
      expect(update.variables).toHaveProperty('i', index + 1);
      // Note: first iteration won't have response variable yet
      if (index > 0) {
        expect(update.variables).toHaveProperty('response');
      }
    });
  });

  test('should handle complex variable assignments', async () => {
    const rexxCode = `
      SAY "Testing variable assignments"
      LET total_records = 1000
      LET processed = 0
      LET batch_size = 100
      
      DO i = 1 TO 5
        LET processed = processed + 1
        LET response = CHECKPOINT(processed, total_records)
        SAY "Processed:" processed "Response:" response.action
      END
      
      SAY "Final processed:" processed
    `;
    
    const commands = parse(rexxCode);
    console.log('Complex test commands:', commands.length);
    
    await interpreter.run(commands);
    
    // Should have 5 progress updates
    expect(progressUpdates).toHaveLength(5);
    
    // Check final state
    expect(interpreter.variables.get('processed')).toBe(5);
    expect(interpreter.variables.get('total_records')).toBe(1000);
    expect(interpreter.variables.get('batch_size')).toBe(100);
  });

  test('should reproduce worker initialization scenario', async () => {
    // Simulate the exact initialization from streaming-worker.html
    const addressSender = null;
    const testInterpreter = new RexxInterpreter(addressSender, {
      output: (text) => console.log('Worker SAY:', text)
    });
    
    const testProgressUpdates = [];
    testInterpreter.streamingProgressCallback = (progressData) => {
      testProgressUpdates.push(progressData);
    };
    
    // Test the exact script pattern that was failing
    const rexxCode = `
      SAY "Starting streaming demo with total: 2000"
      LET count = 0
      LET total = 2000
      LET step = 200
      
      DO i = 1 TO 10
        LET count = i
        LET check = count // step
        IF check = 0 THEN DO
          SAY "At record:" count
          LET result = CHECKPOINT(count, total)
          SAY "Response:" result.action
        END
      END
      
      SAY "Demo completed. Final count:" count
    `;
    
    const commands = parse(rexxCode);
    console.log('Worker simulation commands:', commands.length);
    
    // This should reveal the exact error
    try {
      await testInterpreter.run(commands);
      console.log('Worker simulation completed successfully');
      console.log('Progress updates:', testProgressUpdates.length);
      console.log('Final variables:', Object.fromEntries(testInterpreter.variables));
    } catch (error) {
      console.error('Worker simulation failed:', error.message);
      throw error;
    }
  });
});