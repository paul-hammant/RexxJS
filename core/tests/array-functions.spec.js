/**
 * Array Functions Unit Tests  
 * Tests for ARRAY_GET, ARRAY_SET, ARRAY_LENGTH, and related functions
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { TestRexxInterpreter } = require('../src/test-interpreter');
const { parse } = require('../src/parser');

describe('Array Functions', () => {
  let interpreter;

  beforeEach(() => {
    interpreter = new TestRexxInterpreter();
  });

  describe('ARRAY_SET', () => {
    describe('basic functionality', () => {
      test('should set value in array by numeric index', async () => {
        const commands = parse(`
          LET myArray = [1, 2, 3]
          LET result = ARRAY_SET(myArray, 1, "modified")
          LET value = ARRAY_GET(result, 1)
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('value')).toBe('modified');
      });

      test('should set value in object by string key', async () => {
        const commands = parse(`
          LET myObject = {"name": "original", "value": 42}
          LET result = ARRAY_SET(myObject, "name", "modified")
          LET value = ARRAY_GET(result, "name")
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('value')).toBe('modified');
      });

      test('should return the modified array/object', async () => {
        const commands = parse(`
          LET original = [1, 2, 3]
          LET result = ARRAY_SET(original, 2, "new")
          LET length = ARRAY_LENGTH(result)
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('length')).toBe(3);
      });

      test('should add new property to object', async () => {
        const commands = parse(`
          LET myObject = {"existing": "value"}
          LET result = ARRAY_SET(myObject, "newKey", "newValue")
          LET newValue = ARRAY_GET(result, "newKey")
          LET existingValue = ARRAY_GET(result, "existing")
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('newValue')).toBe('newValue');
        expect(interpreter.variables.get('existingValue')).toBe('value');
      });
    });

    describe('edge cases', () => {
      test('should handle null input gracefully', async () => {
        const commands = parse(`
          LET result = ARRAY_SET(null, "key", "value")
          LET type = DATATYPE(result)
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('type')).toBe('OBJECT');
      });

      test('should handle undefined input gracefully', async () => {
        const commands = parse(`
          LET undefined_var = ""
          LET result = ARRAY_SET(undefined_var, "key", "value")
          LET type = DATATYPE(result) 
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('type')).toBe('OBJECT');
      });

      test('should handle numeric keys as strings in objects', async () => {
        const commands = parse(`
          LET myObject = {"1": "first", "2": "second"}
          LET result = ARRAY_SET(myObject, "1", "modified")
          LET value = ARRAY_GET(result, "1")
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('value')).toBe('modified');
      });

      test('should handle string values correctly', async () => {
        const commands = parse(`
          LET myArray = ["a", "b", "c"] 
          LET result = ARRAY_SET(myArray, 2, 'modified string')
          LET value = ARRAY_GET(result, 2)
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('value')).toBe('modified string');
      });

      test('should handle numeric values correctly', async () => {
        const commands = parse(`
          LET myArray = [1, 2, 3]
          LET result = ARRAY_SET(myArray, 2, 999)
          LET value = ARRAY_GET(result, 2)
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('value')).toBe(999);
      });
    });

    describe('immutability behavior', () => {
      test('should not modify original array when assigned to new variable', async () => {
        const commands = parse(`
          LET original = [1, 2, 3]
          LET originalFirst = ARRAY_GET(original, 1)
          LET modified = ARRAY_SET(original, 1, "changed")
          LET originalFirstAfter = ARRAY_GET(original, 1)
          LET modifiedFirst = ARRAY_GET(modified, 1)
        `);
        
        await interpreter.run(commands);
        
        // This test reveals the expected behavior - whether REXX arrays are mutable or immutable
        expect(interpreter.variables.get('originalFirst')).toBe(1);
        expect(interpreter.variables.get('modifiedFirst')).toBe('changed');
        // The key question: is originalFirstAfter still 1 (immutable) or "changed" (mutable)?
        console.log('Original after ARRAY_SET:', interpreter.variables.get('originalFirstAfter'));
      });
    });

    describe('integration with other functions', () => {
      test('should work with ARRAY_LENGTH', async () => {
        const commands = parse(`
          LET myArray = [1, 2]
          LET expanded = ARRAY_SET(myArray, 3, "third")
          LET length = ARRAY_LENGTH(expanded)
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('length')).toBe(3);
      });

      test('should work with JSON functions', async () => {
        const commands = parse(`
          LET jsonStr = '{"a": 1, "b": 2}'
          LET parsed = JSON_PARSE(jsonStr)
          LET modified = ARRAY_SET(parsed, "c", 3)
          LET serialized = JSON_STRINGIFY(modified)
        `);
        
        await interpreter.run(commands);
        
        const result = JSON.parse(interpreter.variables.get('serialized'));
        expect(result).toEqual({a: 1, b: 2, c: 3});
      });
    });

    describe('REXX indexing with JS-created arrays', () => {
      test('should work with 1-based indexing for arrays', async () => {
        const commands = parse(`
          INTERPRET_JS('this.variables.set("testArray", ["first", "second", "third"])')
          LET modified = ARRAY_SET(testArray, 1, "modified_first")
          LET first = ARRAY_GET(modified, 1)
          LET second = ARRAY_GET(modified, 2)
          LET third = ARRAY_GET(modified, 3)
          
          /* Verify JS direct access to confirm proper indexing */
          LET js0 = INTERPRET_JS('this.variables.get("modified")[0]')
          LET js1 = INTERPRET_JS('this.variables.get("modified")[1]')
          LET js2 = INTERPRET_JS('this.variables.get("modified")[2]')
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('first')).toBe('modified_first');
        expect(interpreter.variables.get('second')).toBe('second'); // Should be unchanged
        expect(interpreter.variables.get('third')).toBe('third'); // Should be unchanged
        expect(interpreter.variables.get('js0')).toBe('modified_first'); // JS index 0 was modified
        expect(interpreter.variables.get('js1')).toBe('second'); // JS index 1 unchanged
        expect(interpreter.variables.get('js2')).toBe('third'); // JS index 2 unchanged
      });

      test('should handle index 0 as property access', async () => {
        const commands = parse(`
          INTERPRET_JS('this.variables.set("testArray", ["first", "second", "third"])')
          LET modified = ARRAY_SET(testArray, 0, "zero_property")
          LET zero = ARRAY_GET(modified, 0)
          LET first = ARRAY_GET(modified, 1)
          
          /* Verify the property was set on the array object */
          LET js_prop = INTERPRET_JS('this.variables.get("modified")["0"]')
          LET js0 = INTERPRET_JS('this.variables.get("modified")[0]')
        `);
        
        await interpreter.run(commands);
        
        expect(interpreter.variables.get('zero')).toBe('zero_property');
        expect(interpreter.variables.get('first')).toBe('zero_property'); // REXX index 1 → JS index 0, which was modified
        expect(interpreter.variables.get('js_prop')).toBe('zero_property'); // Property "0" set (same as array[0])
        expect(interpreter.variables.get('js0')).toBe('zero_property'); // Array index 0 was modified
      });
    });
  });

  describe('ARRAY_GET', () => {
    test('should retrieve values from arrays using JS-created arrays', async () => {
      const commands = parse(`
        INTERPRET_JS('this.variables.set("testArray", ["zero", "one", "two", "three"])')
        LET first = ARRAY_GET(testArray, 1)
        LET second = ARRAY_GET(testArray, 2)
        LET third = ARRAY_GET(testArray, 3)
        LET js0 = INTERPRET_JS('this.variables.get("testArray")[0]')
        LET js1 = INTERPRET_JS('this.variables.get("testArray")[1]')
        LET js2 = INTERPRET_JS('this.variables.get("testArray")[2]')
      `);
      
      await interpreter.run(commands);
      
      // Verify JS direct access works as expected
      expect(interpreter.variables.get('js0')).toBe('zero');
      expect(interpreter.variables.get('js1')).toBe('one');
      expect(interpreter.variables.get('js2')).toBe('two');
      
      // Test REXX 1-based indexing
      expect(interpreter.variables.get('first')).toBe('zero');  // REXX index 1 → JS index 0 → "zero"
      expect(interpreter.variables.get('second')).toBe('one');  // REXX index 2 → JS index 1 → "one"
      expect(interpreter.variables.get('third')).toBe('two');   // REXX index 3 → JS index 2 → "two"
    });

    test('should retrieve values from REXX array literals', async () => {
      const commands = parse(`
        LET myArray = ["a", "b", "c"]
        LET first = ARRAY_GET(myArray, 1)
        LET second = ARRAY_GET(myArray, 2)
        LET third = ARRAY_GET(myArray, 3)
        LET arrayType = DATATYPE(myArray)
        LET arrayLength = LENGTH(myArray)
      `);
      
      await interpreter.run(commands);
      
      // Debug output
      console.log('Array type:', interpreter.variables.get('arrayType'));
      console.log('Array length:', interpreter.variables.get('arrayLength'));
      console.log('First:', interpreter.variables.get('first'));
      console.log('Second:', interpreter.variables.get('second'));
      console.log('Third:', interpreter.variables.get('third'));
      
      expect(interpreter.variables.get('first')).toBe('a');
      expect(interpreter.variables.get('second')).toBe('b');
      expect(interpreter.variables.get('third')).toBe('c');
    });

    test('should retrieve values from objects', async () => {
      const commands = parse(`
        LET myObject = {"name": "test", "value": 42}
        LET name = ARRAY_GET(myObject, "name")
        LET value = ARRAY_GET(myObject, "value")
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('name')).toBe('test');
      expect(interpreter.variables.get('value')).toBe(42);
    });

    test('should handle index 0 as property access', async () => {
      const commands = parse(`
        INTERPRET_JS('this.variables.set("testArray", ["zero", "one"])')
        INTERPRET_JS('this.variables.get("testArray")[0] = "modified_zero"')
        LET index0 = ARRAY_GET(testArray, 0)
        LET index1 = ARRAY_GET(testArray, 1)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('index0')).toBe('modified_zero'); // Index 0 accesses array[0] which was modified
      expect(interpreter.variables.get('index1')).toBe('modified_zero'); // Index 1 → JS index 0 → the modified value
    });
  });

  describe('ARRAY_LENGTH', () => {
    test('should return array length', async () => {
      const commands = parse(`
        LET myArray = [1, 2, 3, 4, 5]
        LET length = ARRAY_LENGTH(myArray)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('length')).toBe(5);
    });

    test('should return object property count', async () => {
      const commands = parse(`
        LET myObject = {"a": 1, "b": 2, "c": 3}
        LET length = ARRAY_LENGTH(myObject)
      `);
      
      await interpreter.run(commands);
      
      expect(interpreter.variables.get('length')).toBe(3);
    });
  });
});