/**
 * Address Handler Utils Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const {
  interpolateMessage,
  extractVariables,
  validateContext,
  createResponse,
  createErrorResponse,
  parseCommand,
  wrapHandler
} = require('../src/address-handler-utils');

describe('Address Handler Utilities', () => {
  describe('interpolateMessage', () => {
    test('should interpolate simple variables', async () => {
      const template = 'Hello {name}, you are {age} years old';
      const context = { name: 'Alice', age: 30 };
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('Hello Alice, you are 30 years old');
    });

    test('should handle missing variables with default behavior', async () => {
      const template = 'Hello {name}, you scored {score}';
      const context = { name: 'Bob' }; // missing 'score'
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('Hello Bob, you scored {score}'); // keeps original {score}
    });

    test('should throw on missing variables when configured', async () => {
      const template = 'Hello {missing}';
      const context = {};
      
      await expect(interpolateMessage(template, context, { throwOnMissing: true }))
        .rejects.toThrow("Variable 'missing' not found in context");
    });

    test('should use custom placeholder for missing variables', async () => {
      const template = 'Value: {missing}';
      const context = {};
      
      const result = await interpolateMessage(template, context, { 
        missingPlaceholder: '[NOT_FOUND]' 
      });
      expect(result).toBe('Value: [NOT_FOUND]');
    });

    test('should apply transform function to values', async () => {
      const template = 'Score: {score}, Grade: {grade}';
      const context = { score: 95, grade: 'A' };
      
      const result = await interpolateMessage(template, context, {
        transform: async (varName, value) => {
          if (varName === 'score') return `${value}%`;
          return value;
        }
      });
      expect(result).toBe('Score: 95%, Grade: A');
    });

    test('should handle templates without variables', async () => {
      const template = 'No variables here';
      const context = { unused: 'value' };
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('No variables here');
    });

    test('should handle multiple occurrences of same variable', async () => {
      const template = '{name} said hello to {name} in the mirror';
      const context = { name: 'Alice' };
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('Alice said hello to Alice in the mirror');
    });

    test('should handle complex variable names', async () => {
      const template = 'User: {user_name}, ID: {user_id}, Status: {is_active}';
      const context = { user_name: 'john_doe', user_id: 123, is_active: true };
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('User: john_doe, ID: 123, Status: true');
    });
  });

  describe('extractVariables', () => {
    test('should extract variable names from template', () => {
      const template = 'Hello {name}, you have {count} messages';
      const variables = extractVariables(template);
      expect(variables).toEqual(['name', 'count']);
    });

    test('should handle templates with no variables', () => {
      const template = 'No variables here';
      const variables = extractVariables(template);
      expect(variables).toEqual([]);
    });

    test('should handle duplicate variables', () => {
      const template = '{user} logged in as {user}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['user', 'user']);
    });

    test('should handle complex variable names', () => {
      const template = '{user_name} and {user_id} and {is_admin}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['user_name', 'user_id', 'is_admin']);
    });
  });

  describe('validateContext', () => {
    test('should validate when all variables present', () => {
      const template = 'Hello {name}, age {age}';
      const context = { name: 'Alice', age: 30, extra: 'ignored' };
      
      const result = validateContext(template, context);
      expect(result).toEqual({
        valid: true,
        missing: [],
        found: ['name', 'age']
      });
    });

    test('should identify missing variables', () => {
      const template = 'Hello {name}, score {score}';
      const context = { name: 'Bob' }; // missing 'score'
      
      const result = validateContext(template, context);
      expect(result).toEqual({
        valid: false,
        missing: ['score'],
        found: ['name']
      });
    });

    test('should validate against custom required list', () => {
      const template = 'Not used';
      const context = { name: 'Alice' };
      const required = ['name', 'age'];
      
      const result = validateContext(template, context, required);
      expect(result).toEqual({
        valid: false,
        missing: ['age'],
        found: ['name']
      });
    });

    test('should handle empty requirements', () => {
      const template = 'No variables';
      const context = { extra: 'value' };
      
      const result = validateContext(template, context);
      expect(result).toEqual({
        valid: true,
        missing: [],
        found: []
      });
    });
  });

  describe('createResponse', () => {
    test('should create basic success response', () => {
      const response = createResponse(true, { id: 123 }, 'Success');
      
      expect(response).toMatchObject({
        success: true,
        result: { id: 123 },
        message: 'Success'
      });
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp
    });

    test('should create response with metadata', () => {
      const response = createResponse(true, null, 'Done', { 
        operation: 'test',
        duration: 100 
      });
      
      expect(response).toMatchObject({
        success: true,
        message: 'Done',
        operation: 'test',
        duration: 100
      });
    });

    test('should create failure response with default message', () => {
      const response = createResponse(false);
      
      expect(response).toMatchObject({
        success: false,
        message: 'Operation failed'
      });
    });

    test('should handle null/undefined values correctly', () => {
      const response = createResponse(true, null, null);
      
      expect(response).toMatchObject({
        success: true
      });
      expect('result' in response).toBe(false);
      expect('message' in response).toBe(false);
    });
  });

  describe('createErrorResponse', () => {
    test('should create error response from Error object', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error, 'test_operation');
      
      expect(response).toMatchObject({
        success: false,
        message: 'Something went wrong',
        errorType: 'Error',
        operation: 'test_operation'
      });
    });

    test('should create error response from string', () => {
      const response = createErrorResponse('Invalid input', 'validation');
      
      expect(response).toMatchObject({
        success: false,
        message: 'Invalid input',
        errorType: 'Error',
        operation: 'validation'
      });
    });

    test('should include metadata in error response', () => {
      const response = createErrorResponse(
        'Database error', 
        'query',
        { table: 'users', query: 'SELECT * FROM users' }
      );
      
      expect(response).toMatchObject({
        success: false,
        message: 'Database error',
        operation: 'query',
        table: 'users',
        query: 'SELECT * FROM users'
      });
    });
  });

  describe('parseCommand', () => {
    test('should parse simple command', () => {
      const result = parseCommand('status');
      expect(result).toEqual({
        command: 'status',
        subcommand: '',
        params: {}
      });
    });

    test('should parse command with subcommand', () => {
      const result = parseCommand('create user');
      expect(result).toEqual({
        command: 'create',
        subcommand: 'user',
        params: {}
      });
    });

    test('should parse command with parameters', () => {
      const result = parseCommand('create user name=John age=25 active=true');
      expect(result).toEqual({
        command: 'create',
        subcommand: 'user',
        params: { name: 'John', age: '25', active: 'true' }
      });
    });

    test('should parse command with only parameters', () => {
      const result = parseCommand('query name=Alice status=active');
      expect(result).toEqual({
        command: 'query',
        subcommand: '',
        params: { name: 'Alice', status: 'active' }
      });
    });

    test('should handle parameters with = in values', () => {
      const result = parseCommand('set config url=http://example.com:8080/path=test');
      expect(result).toEqual({
        command: 'set',
        subcommand: 'config',
        params: { url: 'http://example.com:8080/path=test' }
      });
    });

    test('should handle empty input', () => {
      const result = parseCommand('');
      expect(result).toEqual({
        command: '',
        subcommand: '',
        params: {}
      });
    });

    test('should handle extra whitespace', () => {
      const result = parseCommand('  create   user   name=John  ');
      expect(result).toEqual({
        command: 'create',
        subcommand: 'user',
        params: { name: 'John' }
      });
    });
  });

  describe('wrapHandler', () => {
    test('should wrap handler without options', async () => {
      const mockHandler = jest.fn().mockResolvedValue({ result: 'test' });
      const wrapped = wrapHandler('test', mockHandler);
      
      const result = await wrapped('message', { var: 'value' }, {});
      
      expect(mockHandler).toHaveBeenCalledWith('message', { var: 'value' }, {});
      expect(result).toMatchObject({
        success: true,
        result: { result: 'test' },
        message: 'Operation completed'
      });
    });

    test('should auto-interpolate when configured', async () => {
      const mockHandler = jest.fn().mockResolvedValue('processed');
      const wrapped = wrapHandler('test', mockHandler, { autoInterpolate: true });
      
      await wrapped('Hello {name}', { name: 'Alice' }, {});
      
      expect(mockHandler).toHaveBeenCalledWith('Hello Alice', { name: 'Alice' }, {});
    });

    test('should validate context when configured', async () => {
      const mockHandler = jest.fn().mockResolvedValue('ok');
      const wrapped = wrapHandler('test', mockHandler, { 
        validateContext: true,
        requiredVars: ['name', 'age']
      });
      
      // Missing 'age' variable
      const result = await wrapped('Hello {name}', { name: 'Alice' }, {});
      
      expect(result).toMatchObject({
        success: false,
        message: expect.stringContaining('Missing required variables')
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    test('should handle handler errors gracefully', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Handler failed'));
      const wrapped = wrapHandler('test', mockHandler);
      
      const result = await wrapped('message', {}, {});
      
      expect(result).toMatchObject({
        success: false,
        message: 'Handler failed',
        errorType: 'Error',
        operation: 'handler_execution'
      });
    });

    test('should preserve standard response format from handler', async () => {
      const standardResponse = {
        success: true,
        result: { custom: 'data' },
        message: 'Custom message'
      };
      const mockHandler = jest.fn().mockResolvedValue(standardResponse);
      const wrapped = wrapHandler('test', mockHandler);
      
      const result = await wrapped('message', {}, {});
      
      expect(result).toBe(standardResponse); // Should return exact same object
    });

    test('should combine all wrapper features', async () => {
      const mockHandler = jest.fn().mockResolvedValue({ processed: true });
      const wrapped = wrapHandler('test', mockHandler, {
        autoInterpolate: true,
        validateContext: true,
        requiredVars: ['user'],
        logCalls: true // Would log to console
      });
      
      const result = await wrapped('User: {user}', { user: 'Alice' }, {});
      
      expect(mockHandler).toHaveBeenCalledWith('User: Alice', { user: 'Alice' }, {});
      expect(result).toMatchObject({
        success: true,
        result: { processed: true }
      });
    });
  });

  describe('Integration tests', () => {
    test('should work together for complete ADDRESS handler', async () => {
      // Create a realistic ADDRESS handler using utilities
      const emailHandler = async (message, context, sourceContext) => {
        // Validate required variables
        const validation = validateContext(message, context, ['to', 'subject']);
        if (!validation.valid) {
          return createErrorResponse(
            `Missing: ${validation.missing.join(', ')}`,
            'validation'
          );
        }
        
        // Parse command
        const { command, params } = parseCommand(message);
        
        // Interpolate parameters
        const interpolatedParams = {};
        for (const [key, value] of Object.entries(params)) {
          interpolatedParams[key] = await interpolateMessage(value, context);
        }
        
        if (command === 'send') {
          return createResponse(true, {
            messageId: 'msg_123',
            to: interpolatedParams.to,
            subject: interpolatedParams.subject
          }, 'Email sent successfully');
        }
        
        return createErrorResponse(`Unknown command: ${command}`, 'command_parsing');
      };
      
      // Wrap with common functionality
      const wrappedHandler = wrapHandler('email', emailHandler, {
        logCalls: false // Disable for testing
      });
      
      // Test successful case
      const context = { 
        to: 'alice@example.com',
        subject: 'Welcome Alice!',
        user_name: 'Alice'
      };
      
      const result = await wrappedHandler(
        'send to={to} subject={subject}',
        context,
        {}
      );
      
      expect(result).toMatchObject({
        success: true,
        result: {
          messageId: 'msg_123',
          to: 'alice@example.com',
          subject: 'Welcome Alice!'
        },
        message: 'Email sent successfully'
      });
    });
    
    test('should demonstrate ADDRESS MATCHING integration', async () => {
      // Simulate how this would work with ADDRESS MATCHING
      const logHandler = wrapHandler('logger', async (message, context) => {
        // message comes from ADDRESS MATCHING extraction
        // context contains all REXX variables
        const interpolated = await interpolateMessage(message, context);
        return createResponse(true, { logged: interpolated }, 'Logged');
      }, {
        autoInterpolate: false // Handle interpolation manually
      });
      
      // Simulate ADDRESS MATCHING call
      // Original line: "LOG: User {name} performed {action}"
      // Extracted by MATCHING("^LOG: (.*)$"): "User {name} performed {action}"
      const extractedMessage = 'User {name} performed {action}';
      const rexxContext = { 
        name: 'Bob', 
        action: 'login',
        _addressMatchingPattern: '^LOG: (.*)$'
      };
      
      const result = await logHandler(extractedMessage, rexxContext, {});
      
      expect(result).toMatchObject({
        success: true,
        result: { logged: 'User Bob performed login' }
      });
    });
  });
});