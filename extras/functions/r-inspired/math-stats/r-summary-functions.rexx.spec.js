/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const path = require('path');

// Import the Rexx interpreter from core
const { RexxInterpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');

// Import the function module for direct registration  
const { rSummaryFunctions } = require('./r-summary-functions');

describe('R Summary Functions - Rexx Integration Tests', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new RexxInterpreter(null, {
      output: (text) => {}, // Silent for tests
      loadPaths: [path.join(__dirname, '../../../../core/src')]
    });
    
    // Register R Summary functions directly with the interpreter
    // This verifies that functions are properly "hooked up" for REXX use
    Object.keys(rSummaryFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = rSummaryFunctions[funcName];
    });
  });

  test('should handle MEAN function through Rexx interpreter', async () => {
    const rexxCode = `
      LET values = "[1, 2, 3, 4, 5]"
      LET result = MEAN x=values
      SAY "MEAN result: " || result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    console.log('MEAN result received:', result);
    expect(result).toBe(3);
  });

  test('should handle MEDIAN function through Rexx interpreter', async () => {
    const rexxCode = `
      LET values = "[1, 2, 3, 4, 5]"
      LET result = MEDIAN x=values
      SAY "MEDIAN result: " || result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    console.log('MEDIAN result received:', result);
    expect(result).toBe(3);
  });

  test('should handle SUM function through Rexx interpreter', async () => {
    const rexxCode = `
      LET values = "[10, 20, 30, 40]"
      LET result = SUM x=values
      SAY "SUM result: " || result
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const result = interpreter.variables.get('result');
    expect(result).toBe(100);
  });

  test('should register LENGTH, MIN and MAX functions properly', () => {
    // Test that R functions are properly registered with interpreter
    // Note: These functions conflict with core REXX functions, so we test registration rather than execution
    expect(interpreter.builtInFunctions.LENGTH).toBeDefined();
    expect(interpreter.builtInFunctions.MIN).toBeDefined();
    expect(interpreter.builtInFunctions.MAX).toBeDefined();
    expect(typeof interpreter.builtInFunctions.LENGTH).toBe('function');
    expect(typeof interpreter.builtInFunctions.MIN).toBe('function');
    expect(typeof interpreter.builtInFunctions.MAX).toBe('function');
    
    // Test function execution directly to verify they work
    const testArray = [1, 2, 3, 4, 5, 6, 7];
    expect(interpreter.builtInFunctions.LENGTH(testArray)).toBe(7);
    expect(interpreter.builtInFunctions.MIN([10, 5, 20, 3, 15])).toBe(3);
    expect(interpreter.builtInFunctions.MAX([10, 5, 20, 3, 15])).toBe(20);
  });

  test('should handle na_rm parameter in statistical functions', async () => {
    const rexxCode = `
      LET valuesWithNaN = "[1, 2, null, 4, 5]"
      LET meanWithNa = MEAN x=valuesWithNaN na_rm="true"
      LET sumWithNa = SUM x=valuesWithNaN na_rm="true"
      SAY "Mean (na.rm=true): " || meanWithNa
      SAY "Sum (na.rm=true): " || sumWithNa
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    // Should compute mean and sum ignoring null values
    expect(interpreter.variables.get('meanWithNa')).toBe(3); // (1+2+4+5)/4 = 3
    expect(interpreter.variables.get('sumWithNa')).toBe(12); // 1+2+4+5 = 12
  });

  test('should handle new statistical functions through Rexx interpreter', async () => {
    const rexxCode = `
      LET x = "[1, 2, 3, 4, 5]"
      LET y = "[2, 4, 6, 8, 10]"
      LET cor = COR x=x y=y
      LET cov = COV x=x y=y
      LET data = "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
      LET scaled = SCALE x=data
      LET quantiles = QUANTILE x=data probs="[0.25, 0.5, 0.75]"
      LET iqr = IQR x=data
      SAY "Correlation: " || cor || ", Covariance: " || cov || ", IQR: " || iqr
    `;
    
    const commands = parse(rexxCode);
    await interpreter.run(commands);
    
    const correlation = interpreter.variables.get('cor');
    const covariance = interpreter.variables.get('cov');
    const scaled = interpreter.variables.get('scaled');
    const quantiles = interpreter.variables.get('quantiles');
    const iqr = interpreter.variables.get('iqr');
    
    expect(correlation).toBeCloseTo(1, 5); // Perfect positive correlation
    expect(covariance).toBeGreaterThan(0); // Positive covariance
    expect(Array.isArray(scaled)).toBe(true);
    expect(Array.isArray(quantiles)).toBe(true);
    expect(quantiles.length).toBe(3);
    expect(iqr).toBe(4.5); // For 1-10, Q3-Q1 = 7.75-3.25 = 4.5
  });
});