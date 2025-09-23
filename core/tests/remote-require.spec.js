/**
 * Remote REQUIRE Tests - SCRO (Source-Controlled Remote Orchestration)
 * 
 * Tests for remote REQUIRE functionality using CHECKPOINT communication channel
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { RexxInterpreter } = require('../src/interpreter');

describe('Remote REQUIRE via CHECKPOINT', () => {
  let interpreter;
  let mockStreamingCallback;
  let mockMessageHandler;
  let mockResponsePromise;

  beforeEach(() => {
    interpreter = new RexxInterpreter();
    
    // Mock streaming callback to simulate CHECKPOINT communication
    mockStreamingCallback = jest.fn();
    interpreter.streamingProgressCallback = mockStreamingCallback;
    
    // Mock message handler for window.postMessage in browser environment
    mockMessageHandler = [];
    if (typeof window === 'undefined') {
      global.window = {
        parent: { postMessage: jest.fn() },
        addEventListener: jest.fn((type, handler) => mockMessageHandler.push(handler)),
        removeEventListener: jest.fn()
      };
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage.mockReset?.();
    }
  });

  describe('Remote Orchestration Detection', () => {
    test('should detect remote orchestration via environment variable', () => {
      process.env.SCRO_REMOTE = 'true';
      
      expect(interpreter.isRemoteOrchestrated()).toBe(true);
      
      delete process.env.SCRO_REMOTE;
    });

    test('should detect remote orchestration via context variable', () => {
      interpreter.variables.set('SCRO_REMOTE', 'true');
      
      expect(interpreter.isRemoteOrchestrated()).toBe(true);
    });

    test('should detect remote orchestration via streaming callback with orchestration ID', () => {
      interpreter.variables.set('SCRO_ORCHESTRATION_ID', 'orch_123');
      
      expect(interpreter.isRemoteOrchestrated()).toBe(true);
    });

    test('should not detect remote orchestration in normal context', () => {
      expect(interpreter.isRemoteOrchestrated()).toBe(false);
    });
  });

  describe('Built-in Library Detection', () => {
    test('should identify built-in libraries', () => {
      expect(interpreter.isBuiltinLibrary('string-functions')).toBe(true);
      expect(interpreter.isBuiltinLibrary('math-functions')).toBe(true);
      expect(interpreter.isBuiltinLibrary('json-functions')).toBe(true);
    });

    test('should identify src/ file paths as built-in', () => {
      expect(interpreter.isBuiltinLibrary('./src/local-lib.js')).toBe(true);
      expect(interpreter.isBuiltinLibrary('../src/parent-lib.js')).toBe(true);
    });

    test('should not identify non-src local files as built-in', () => {
      expect(interpreter.isBuiltinLibrary('./local-lib.js')).toBe(false);
      expect(interpreter.isBuiltinLibrary('../parent-lib.js')).toBe(false);
      expect(interpreter.isBuiltinLibrary('./tests/test-lib.js')).toBe(false);
    });

    test('should not identify external libraries as built-in', () => {
      expect(interpreter.isBuiltinLibrary('custom-library')).toBe(false);
      expect(interpreter.isBuiltinLibrary('github-user/repo')).toBe(false);
      expect(interpreter.isBuiltinLibrary('lodash')).toBe(false);
    });
  });

  describe('CHECKPOINT Message Handling', () => {
    test('should send CHECKPOINT message for remote REQUIRE', () => {
      const requireData = {
        type: 'require_request',
        libraryName: 'test-library',
        requireId: 'req_123',
        timestamp: Date.now()
      };
      
      interpreter.sendCheckpointMessage('require_request', requireData);
      
      expect(mockStreamingCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rexx-require',
          subtype: 'require_request',
          data: requireData
        })
      );
    });

    test('should handle CHECKPOINT response correctly', async () => {
      const requireId = 'req_test_123';
      const responseData = {
        type: 'rexx-require-response',
        requireId: requireId,
        success: true,
        libraryCode: 'module.exports = { test: function() { return "hello"; } };',
        libraryName: 'test-lib'
      };
      
      // Start waiting for response
      const responsePromise = interpreter.waitForCheckpointResponse(requireId, 1000);
      
      // Simulate response message
      setTimeout(() => {
        const messageEvent = { data: responseData };
        mockMessageHandler.forEach(handler => handler(messageEvent));
      }, 10);
      
      const response = await responsePromise;
      
      expect(response.success).toBe(true);
      expect(response.libraryCode).toContain('test: function()');
    });

    test('should timeout if no response received', async () => {
      const requireId = 'req_timeout_123';
      
      const response = await interpreter.waitForCheckpointResponse(requireId, 100); // 100ms timeout
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('timeout');
    });
  });

  describe('Remote Library Execution', () => {
    test('should execute remote library code in Node.js environment', async () => {
      const libraryCode = `
        function testFunction(input) {
          return input.toUpperCase();
        }
        
        module.exports = {
          TEST_FUNCTION: testFunction,
          LIBRARY_INFO: function() {
            return { type: 'test', loaded: true };
          }
        };
      `;
      
      await interpreter.executeRemoteLibraryCode('test-remote-lib', libraryCode);
      
      // Check that functions were registered
      expect(typeof interpreter.functions.TEST_FUNCTION).toBe('function');
      expect(typeof interpreter.functions.LIBRARY_INFO).toBe('function');
      
      // Test function works
      const result = interpreter.functions.TEST_FUNCTION('hello');
      expect(result).toBe('HELLO');
      
      // Check library is cached
      const cached = interpreter.libraryCache.get('test-remote-lib');
      expect(cached.loaded).toBe(true);
      expect(cached.code).toBe(libraryCode);
    });

    test('should handle execution errors gracefully', async () => {
      const invalidCode = 'this is not valid JavaScript code [syntax error]';
      
      await expect(
        interpreter.executeRemoteLibraryCode('invalid-lib', invalidCode)
      ).rejects.toThrow('Failed to execute remote library invalid-lib');
    });
  });

  describe('Integration: Remote REQUIRE Flow', () => {
    test('should route to remote REQUIRE when in orchestrated context', async () => {
      // Set up remote orchestration context
      interpreter.variables.set('SCRO_REMOTE', 'true');
      
      // Mock the remote REQUIRE process
      jest.spyOn(interpreter, 'requireViaCheckpoint').mockImplementation(async (libraryName) => {
        expect(libraryName).toBe('remote-test-lib');
        return true;
      });
      
      // Call loadSingleLibrary
      const result = await interpreter.loadSingleLibrary('remote-test-lib');
      
      expect(result).toBe(true);
      expect(interpreter.requireViaCheckpoint).toHaveBeenCalledWith('remote-test-lib');
    });

    test('should use normal REQUIRE for built-in libraries even in remote context', async () => {
      // Set up remote orchestration context
      interpreter.variables.set('SCRO_REMOTE', 'true');
      
      // Mock normal Node.js require
      jest.spyOn(interpreter, 'requireNodeJS').mockImplementation(async () => true);
      
      // Built-in libraries should not go through remote REQUIRE
      const result = await interpreter.loadSingleLibrary('string-functions');
      
      expect(interpreter.requireNodeJS).toHaveBeenCalled();
    });

    test('should complete full remote REQUIRE workflow', async () => {
      // Set up remote orchestration context
      interpreter.variables.set('SCRO_ORCHESTRATION_ID', 'test_123');
      
      const libraryName = 'workflow-test-lib';
      const requireId = 'req_workflow_456';
      const testLibraryCode = `
        module.exports = {
          WORKFLOW_TEST: function(data) {
            return { processed: data, timestamp: Date.now() };
          }
        };
      `;
      
      // Mock the CHECKPOINT communication
      jest.spyOn(interpreter, 'sendCheckpointMessage').mockImplementation(() => ({}));
      jest.spyOn(interpreter, 'waitForCheckpointResponse').mockImplementation(async () => ({
        success: true,
        libraryCode: testLibraryCode,
        libraryName: libraryName
      }));
      
      // Execute remote REQUIRE
      const result = await interpreter.requireViaCheckpoint(libraryName);
      
      expect(result).toBe(true);
      expect(interpreter.sendCheckpointMessage).toHaveBeenCalledWith(
        'require_request',
        expect.objectContaining({
          type: 'require_request',
          libraryName: libraryName
        })
      );
      expect(interpreter.waitForCheckpointResponse).toHaveBeenCalled();
      
      // Verify library was loaded
      expect(typeof interpreter.functions.WORKFLOW_TEST).toBe('function');
    });
  });

  describe('Error Handling', () => {
    test('should handle remote REQUIRE timeout', async () => {
      interpreter.variables.set('SCRO_REMOTE', 'true');
      
      jest.spyOn(interpreter, 'waitForCheckpointResponse').mockImplementation(async () => ({
        success: false,
        error: 'timeout'
      }));
      
      await expect(
        interpreter.requireViaCheckpoint('timeout-test-lib')
      ).rejects.toThrow('Remote REQUIRE failed for timeout-test-lib: timeout');
    });

    test('should handle library resolution error', async () => {
      interpreter.variables.set('SCRO_REMOTE', 'true');
      
      jest.spyOn(interpreter, 'waitForCheckpointResponse').mockImplementation(async () => ({
        success: false,
        error: 'Library not found'
      }));
      
      await expect(
        interpreter.requireViaCheckpoint('missing-lib')
      ).rejects.toThrow('Remote REQUIRE failed for missing-lib: Library not found');
    });

    test('should handle communication channel unavailable', async () => {
      // Remove streaming callback to simulate no communication channel
      interpreter.streamingProgressCallback = null;
      if (typeof window !== 'undefined') {
        delete window.parent;
      }
      
      const response = await interpreter.waitForCheckpointResponse('test_123', 100);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('no_communication_channel');
    });
  });
});