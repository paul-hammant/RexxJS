/**
 * Interpolation Integration Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');
const {
  interpolateMessage,
  extractVariables,
  validateContext,
  createResponse
} = require('../src/address-handler-utils');
const {
  setInterpolationPattern,
  resetToDefault,
  createCustomPattern
} = require('../src/interpolation-config');

describe('Interpolation Pattern Integration Tests', () => {
  let interpreter;
  let output;
  let mockAddressHandler;
  let mockAddressSender;

  beforeEach(() => {
    // Reset to default pattern before each test
    resetToDefault();
    
    output = [];
    mockAddressHandler = jest.fn().mockResolvedValue({ success: true });
    mockAddressSender = {
      sendToAddress: jest.fn(),
      send: jest.fn().mockResolvedValue({ success: true, result: null })
    };
    
    interpreter = new TestRexxInterpreter(mockAddressSender, {}, {
      output: (msg) => output.push(msg)
    });
    
    interpreter.addressTargets.set('testaddress', {
      handler: mockAddressHandler,
      methods: {},
      metadata: { name: 'Test Address' }
    });
  });

  afterEach(() => {
    // Reset to default after each test to avoid affecting other tests
    resetToDefault();
  });

  const executeRexxCode = async (rexxCode) => {
    const commands = parse(rexxCode);
    return await interpreter.run(commands, rexxCode);
  };

  describe('Default Handlebars Pattern {{var}}', () => {
    test('should interpolate with default handlebars pattern', async () => {
      const context = { username: 'Alice', status: 'active' };
      const template = 'User {{username}} is {{status}}';
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('User Alice is active');
    });

    test('should extract variables with default pattern', () => {
      const template = 'Hello {{first}} and {{second}}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['first', 'second']);
    });

    test('should work in ADDRESS context with default pattern', async () => {
      const rexxCode = `
        LET user_name = "Bob"
        LET user_score = 95
        
        ADDRESS testaddress
        "User {{user_name}} scored {{user_score}} points"
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'User {{user_name}} scored {{user_score}} points',
        expect.objectContaining({ user_name: 'Bob', user_score: 95 }),
        expect.anything()
      );
    });
  });

  describe('Handlebars Pattern {{var}}', () => {
    test('should switch to handlebars pattern and interpolate', async () => {
      setInterpolationPattern('handlebars');
      
      const context = { username: 'Charlie', status: 'admin' };
      const template = 'User {{username}} is {{status}}';
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('User Charlie is admin');
    });

    test('should extract variables with handlebars pattern', () => {
      setInterpolationPattern('handlebars');
      
      const template = 'Hello {{first}} and {{second}}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['first', 'second']);
    });

    test('should not interpolate shell pattern when handlebars is active', async () => {
      setInterpolationPattern('handlebars');
      
      const context = { username: 'Dave', status: 'user' };
      const template = 'User ${username} is {{status}}'; // Mixed patterns
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('User ${username} is user'); // Only {{status}} interpolated
    });

    test('should work in ADDRESS context with handlebars pattern', async () => {
      setInterpolationPattern('handlebars');
      
      const rexxCode = `
        LET user_name = "Eve"
        LET user_role = "manager"
        
        ADDRESS testaddress
        "User {{user_name}} has role {{user_role}}"
      `;
      
      await executeRexxCode(rexxCode);
      
      expect(mockAddressHandler).toHaveBeenCalledWith(
        'User {{user_name}} has role {{user_role}}',
        expect.objectContaining({ user_name: 'Eve', user_role: 'manager' }),
        expect.anything()
      );
    });
  });

  describe('Shell Pattern ${var}', () => {
    test('should switch to shell pattern and interpolate', async () => {
      setInterpolationPattern('shell');
      
      const context = { home: '/home/user', path: '/usr/bin' };
      const template = 'HOME=${home} PATH=${path}';
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('HOME=/home/user PATH=/usr/bin');
    });

    test('should extract variables with shell pattern', () => {
      setInterpolationPattern('shell');
      
      const template = 'echo ${HOME} and ${USER}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['HOME', 'USER']);
    });

    test('should handle complex shell-style variables', async () => {
      setInterpolationPattern('shell');
      
      const context = { 
        'config.database.url': 'postgresql://localhost:5432/app',
        'app.version': '1.2.3'
      };
      const template = 'Database: ${config.database.url}, Version: ${app.version}';
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('Database: postgresql://localhost:5432/app, Version: 1.2.3');
    });
  });

  describe('Batch Pattern %var%', () => {
    test('should switch to batch pattern and interpolate', async () => {
      setInterpolationPattern('batch');
      
      const context = { USERNAME: 'Administrator', TEMP: 'C:\\temp' };
      const template = 'User: %USERNAME%, Temp: %TEMP%';
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('User: Administrator, Temp: C:\\temp');
    });

    test('should extract variables with batch pattern', () => {
      setInterpolationPattern('batch');
      
      const template = 'set PATH=%PATH%;%JAVA_HOME%\\bin';
      const variables = extractVariables(template);
      expect(variables).toEqual(['PATH', 'JAVA_HOME']);
    });
  });

  describe('Doubledollar Pattern $$var$$', () => {
    test('should switch to doubledollar pattern and interpolate', async () => {
      setInterpolationPattern('doubledollar');
      
      const context = { service: 'web-api', port: '8080' };
      const template = 'Service $$service$$ running on port $$port$$';
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('Service web-api running on port 8080');
    });

    test('should extract variables with doubledollar pattern', () => {
      setInterpolationPattern('doubledollar');
      
      const template = 'Deploy $$app$$ to $$environment$$';
      const variables = extractVariables(template);
      expect(variables).toEqual(['app', 'environment']);
    });
  });


  describe('Custom Pattern Creation', () => {
    test('should create and use custom angle bracket pattern', async () => {
      const customPattern = createCustomPattern('angles', '<<', '>>');
      setInterpolationPattern(customPattern);
      
      const context = { name: 'Alice', status: 'active' };
      const template = 'User <<name>> is <<status>>';
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('User Alice is active');
    });

    test('should create and use custom hash pattern', async () => {
      const customPattern = createCustomPattern('hash', '#{', '}');
      setInterpolationPattern(customPattern);
      
      const context = { color: 'red', size: 'large' };
      const template = 'Style: #{color} #{size}';
      
      const result = await interpolateMessage(template, context);
      expect(result).toBe('Style: red large');
    });
  });

  describe('Pattern Switching During Runtime', () => {
    test('should handle pattern switching between operations', async () => {
      // Start with default pattern (handlebars)
      let context = { name: 'Alice' };
      let result1 = await interpolateMessage('Hello {{name}}', context);
      expect(result1).toBe('Hello Alice');
      
      // Switch to shell
      setInterpolationPattern('shell');
      let result2 = await interpolateMessage('Hello ${name}', context);
      expect(result2).toBe('Hello Alice');
      
      // Switch to batch
      setInterpolationPattern('batch');
      let result3 = await interpolateMessage('Hello %name%', context);
      expect(result3).toBe('Hello Alice');
      
      // Reset to default (handlebars)
      resetToDefault();
      let result4 = await interpolateMessage('Hello {{name}}', context);
      expect(result4).toBe('Hello Alice');
    });
  });

  describe('Validation Integration', () => {
    test('should validate context with different patterns', () => {
      const context = { username: 'test', password: 'secret' };
      
      // Test with each pattern
      const patterns = ['handlebars', 'shell', 'batch', 'doubledollar'];
      const templates = [
        'Login {{username}} with {{password}}',
        'Login ${username} with ${password}',
        'Login %username% with %password%',
        'Login $$username$$ with $$password$$'
      ];
      
      patterns.forEach((patternName, index) => {
        setInterpolationPattern(patternName);
        const validation = validateContext(templates[index], context);
        expect(validation.valid).toBe(true);
        expect(validation.found).toEqual(['username', 'password']);
        expect(validation.missing).toEqual([]);
      });
    });

    test('should identify missing variables with different patterns', () => {
      const context = { username: 'test' }; // Missing password
      
      setInterpolationPattern('handlebars');
      const validation = validateContext('Login {{username}} with {{password}}', context);
      expect(validation.valid).toBe(false);
      expect(validation.found).toEqual(['username']);
      expect(validation.missing).toEqual(['password']);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should handle missing variables gracefully with all patterns', async () => {
      const context = { name: 'Alice' }; // Missing 'age'
      const patterns = [
        { name: 'handlebars', template: '{{name}} is {{age}} years old' },
        { name: 'shell', template: '${name} is ${age} years old' },
        { name: 'batch', template: '%name% is %age% years old' }
      ];
      
      for (const { name, template } of patterns) {
        setInterpolationPattern(name);
        const result = await interpolateMessage(template, context);
        // Should interpolate found variables and leave missing ones as-is
        expect(result).toContain('Alice');
        expect(result).toMatch(new RegExp('age')); // Age variable should remain in some form
      }
    });

    test('should handle transform functions with different patterns', async () => {
      setInterpolationPattern('handlebars');
      
      const context = { price: 19.99, currency: 'USD' };
      const template = 'Price: {{price}} {{currency}}';
      
      const result = await interpolateMessage(template, context, {
        transform: async (varName, value) => {
          if (varName === 'price') return `$${value}`;
          return value;
        }
      });
      
      expect(result).toBe('Price: $19.99 USD');
    });
  });
});