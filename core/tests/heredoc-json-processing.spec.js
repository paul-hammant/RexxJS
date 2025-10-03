/**
 * HEREDOC JSON Processing Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');

describe('HEREDOC JSON Processing', () => {
  let interpreter;
  
  beforeEach(() => {
    const mockAddressSender = {
      send: async () => ({ success: true })
    };
    interpreter = new Interpreter(mockAddressSender);

    // Set script path for relative path resolution in inline scripts
    interpreter.scriptPath = __filename;
  });

  test('should auto-parse HEREDOC content with JSON delimiter', async () => {
    const script = `
      LET json_data = <<JSON
{
  "name": "Alice Smith",
  "age": 30,
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
JSON
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const jsonData = interpreter.getVariable('json_data');
    
    // Should auto-parse as JavaScript object due to JSON delimiter
    expect(typeof jsonData).toBe('object');
    expect(jsonData.name).toBe('Alice Smith');
    expect(jsonData.age).toBe(30);
    expect(jsonData.settings.theme).toBe('dark');
    expect(jsonData.settings.notifications).toBe(true);
  });

  test('should store non-JSON delimiters as strings', async () => {
    const script = `
      LET json_string = <<DATA
{
  "name": "Alice Smith",
  "age": 30,
  "settings": {
    "theme": "dark"
  }
}
DATA
      LET parsed_object = JSON_PARSE text=json_string
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const jsonString = interpreter.getVariable('json_string');
    const parsedObject = interpreter.getVariable('parsed_object');
    
    // Non-JSON delimiter should remain as string
    expect(typeof jsonString).toBe('string');
    expect(jsonString.trim().startsWith('{')).toBe(true);
    expect(jsonString.trim().endsWith('}')).toBe(true);
    
    // JSON_PARSE should convert the string to an object
    expect(typeof parsedObject).toBe('object');
    expect(parsedObject.name).toBe('Alice Smith');
    expect(parsedObject.age).toBe(30);
    expect(parsedObject.settings.theme).toBe('dark');
  });

  test('should handle property access on auto-parsed JSON objects', async () => {
    const script = `
      LET user_data = <<JSON
{"user": "Bob", "role": "admin", "active": true}
JSON
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const userData = interpreter.getVariable('user_data');
    
    // Should be auto-parsed as JavaScript object
    expect(typeof userData).toBe('object');
    expect(userData.user).toBe('Bob');
    expect(userData.role).toBe('admin');
    expect(userData.active).toBe(true);
    
    // Property access via dot notation should work
    const userValue = await interpreter.resolveValue('user_data.user');
    const roleValue = await interpreter.resolveValue('user_data.role');
    
    expect(userValue).toBe('Bob');
    expect(roleValue).toBe('admin');
  });

  test('should support auto-parsed HEREDOC JSON in ADDRESS assertion contexts', async () => {
    const script = `
      REQUIRE "../src/expectations-address.js"
      
      LET user_profile = <<JSON
{
  "name": "Alice Smith",
  "age": 30,
  "email": "alice@example.com"
}
JSON
      
      ADDRESS EXPECTATIONS "{user_profile.name} should be 'Alice Smith'"
      ADDRESS EXPECTATIONS "{user_profile.age} should be greater than 25"
    `;
    
    const commands = parse(script);
    
    // Should not throw assertion errors
    await expect(interpreter.run(commands)).resolves.not.toThrow();
    
    // Variables should be properly accessible
    const userProfile = interpreter.getVariable('user_profile');
    expect(userProfile.name).toBe('Alice Smith');
    expect(userProfile.age).toBe(30);
    expect(userProfile.email).toBe('alice@example.com');
  });

  test('should demonstrate delimiter case-insensitivity', async () => {
    const script = `
      LET data1 = <<json
{"test": "lowercase"}
json
      
      LET data2 = <<Json  
{"test": "mixedcase"}
Json
      
      LET data3 = <<MYJSON
{"test": "contains"}
MYJSON
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    const data1 = interpreter.getVariable('data1');
    const data2 = interpreter.getVariable('data2');
    const data3 = interpreter.getVariable('data3');
    
    // All should be auto-parsed due to JSON in delimiter
    expect(typeof data1).toBe('object');
    expect(data1.test).toBe('lowercase');
    
    expect(typeof data2).toBe('object'); 
    expect(data2.test).toBe('mixedcase');
    
    expect(typeof data3).toBe('object');
    expect(data3.test).toBe('contains');
  });

  describe('Exception Handling for Invalid JSON', () => {
    test('should throw exception when <<JSON contains invalid JSON syntax', async () => {
      const script = `
        LET broken_data = <<JSON
{
  "name": "Alice",
  "age": 30,
  "settings": {
    "theme": "dark"
    // Missing closing brace and comma
JSON
      `;
      
      const commands = parse(script);
      
      // Should throw an exception due to invalid JSON - NO FALLBACK
      await expect(interpreter.run(commands)).rejects.toThrow(/Content does not appear to be JSON but uses JSON delimiter|Invalid JSON/);
      
      // Should not create the variable
      expect(interpreter.getVariable('broken_data')).toBeUndefined();
    });

    test('should throw exception when <<JSON contains non-JSON content', async () => {
      const script = `
        LET not_json = <<JSON
This is just plain text, not JSON at all!
It has multiple lines and no JSON structure.
JSON
      `;
      
      const commands = parse(script);
      
      // Should throw an exception because content is not JSON - NO FALLBACK
      await expect(interpreter.run(commands)).rejects.toThrow(/Content does not appear to be JSON but uses JSON delimiter|Invalid JSON/);
      
      // Should not create the variable
      expect(interpreter.getVariable('not_json')).toBeUndefined();
    });

    test('should throw exception when <<JSON contains malformed JSON objects', async () => {
      const script = `
        LET malformed_data = <<JSON
{
  "name": "Bob",
  "age": thirty,
  "active": yes,
  "scores": [85, 90, ninety-five]
}
JSON
      `;
      
      const commands = parse(script);
      
      // Should throw an exception due to unquoted values and invalid syntax - NO FALLBACK
      await expect(interpreter.run(commands)).rejects.toThrow(/Invalid JSON|JSON.*parse|Unexpected token|SyntaxError/);
      
      // Should not create the variable
      expect(interpreter.getVariable('malformed_data')).toBeUndefined();
    });

    test('should throw exception when <<JSON contains JSON with trailing commas', async () => {
      const script = `
        LET trailing_comma = <<JSON
{
  "name": "Charlie",
  "age": 25,
  "settings": {
    "theme": "light",
    "notifications": true,
  },        
}
JSON
      `;
      
      const commands = parse(script);
      
      // Should throw an exception due to trailing commas (invalid in strict JSON) - NO FALLBACK
      await expect(interpreter.run(commands)).rejects.toThrow(/Invalid JSON in HEREDOC with JSON delimiter|Expected double-quoted property name/);
      
      // Should not create the variable
      expect(interpreter.getVariable('trailing_comma')).toBeUndefined();
    });

    test('should throw exception when <<JSON contains empty content', async () => {
      const script = `
        LET empty_json = <<JSON
JSON
      `;
      
      const commands = parse(script);
      
      // Should throw an exception due to empty JSON content - NO FALLBACK
      await expect(interpreter.run(commands)).rejects.toThrow(/Invalid JSON|JSON.*parse|Unexpected token|SyntaxError|empty/);
      
      // Should not create the variable
      expect(interpreter.getVariable('empty_json')).toBeUndefined();
    });

    test('should throw exception when <<JSON contains only whitespace', async () => {
      const script = `
        LET whitespace_json = <<JSON
        
        
JSON
      `;
      
      const commands = parse(script);
      
      // Should throw an exception due to whitespace-only content - NO FALLBACK
      await expect(interpreter.run(commands)).rejects.toThrow(/Invalid JSON|JSON.*parse|Unexpected token|SyntaxError|empty|whitespace/);
      
      // Should not create the variable
      expect(interpreter.getVariable('whitespace_json')).toBeUndefined();
    });
  });
});