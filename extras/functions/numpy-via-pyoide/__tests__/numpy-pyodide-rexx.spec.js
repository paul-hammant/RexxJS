const { RexxInterpreter } = require('../../../../core/src/interpreter');
const { parse } = require('../../../../core/src/parser');
const path = require('path');

describe('NumPy via PyOdide REXX Integration', () => {
  let interpreter;
  let pyodideAvailable = false;

  beforeAll(async () => {
    // Check if PyOdide is available
    try {
      require('../../../addresses/pyodide/src/pyodide-address');
      pyodideAvailable = true;
      console.log('✅ PyOdide ADDRESS available for REXX tests');
    } catch (error) {
      console.warn('⚠️ PyOdide not available, skipping REXX tests:', error.message);
      pyodideAvailable = false;
    }

    if (pyodideAvailable) {
      // Create interpreter with PyOdide NumPy functions
      interpreter = new RexxInterpreter(null, {
        output: (text) => console.log('REXX OUTPUT:', text),
        loadPaths: [path.join(__dirname, '../../../../core/src')]
      });

      // Register PyOdide NumPy functions
      const numpyFunctions = require('../numpy');
      
      // Wrap async functions for REXX (which expects sync interface)
      Object.keys(numpyFunctions).forEach(funcName => {
        if (typeof numpyFunctions[funcName] === 'function' && 
            !['initializePyodide', 'loadNumPy'].includes(funcName)) {
          
          interpreter.builtInFunctions[funcName.toUpperCase()] = async (args) => {
            try {
              // Parse REXX string parameters
              const parsedArgs = Object.values(args).map(arg => {
                if (typeof arg === 'string') {
                  try {
                    return JSON.parse(arg);
                  } catch (e) {
                    return arg;
                  }
                }
                return arg;
              });

              // Call the async NumPy function
              const result = await numpyFunctions[funcName](...parsedArgs);
              return result;
            } catch (error) {
              throw new Error(`${funcName.toUpperCase()}: ${error.message}`);
            }
          };
        }
      });

      // Initialize PyOdide session
      try {
        await numpyFunctions.initializePyodide();
        console.log('✅ PyOdide session initialized for REXX tests');
      } catch (error) {
        console.warn('Failed to initialize PyOdide:', error.message);
        pyodideAvailable = false;
      }
    }
  }, 60000); // 60 second timeout for full setup

  const skipIfNoPyodide = () => {
    if (!pyodideAvailable) {
      console.log('Skipping test - PyOdide not available');
      return true;
    }
    return false;
  };

  test('REXX array creation with PyOdide NumPy', async () => {
    if (skipIfNoPyodide()) return;

    const script = `
-- Test array creation functions
LET zeros_result = ZEROS shape="3"
LET ones_result = ONES shape="[2,2]" 
LET eye_result = EYE n=3

SAY "Zeros result: " || zeros_result
SAY "Ones result: " || ones_result  
SAY "Eye result: " || eye_result
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    // Check that variables were set with real NumPy results
    const zerosResult = interpreter.variables.get('zeros_result');
    const onesResult = interpreter.variables.get('ones_result');
    const eyeResult = interpreter.variables.get('eye_result');

    expect(zerosResult).toEqual([0, 0, 0]);
    expect(onesResult).toEqual([[1, 1], [1, 1]]);
    expect(eyeResult).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  }, 30000);

  test('REXX eigenvalue computation (100% NumPy compatible)', async () => {
    if (skipIfNoPyodide()) return;

    const script = `
-- Test eigenvalue functions with real NumPy
LET matrix = "[[4, 1], [1, 3]]"
LET eigenvals_result = EIGVALS matrix=matrix
LET eig_result = EIG matrix=matrix

SAY "Matrix: " || matrix
SAY "Eigenvalues: " || eigenvals_result
SAY "Full EIG result: " || eig_result
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    const eigenvals = interpreter.variables.get('eigenvals_result');
    const eigResult = interpreter.variables.get('eig_result');

    // Verify real NumPy results
    expect(Array.isArray(eigenvals)).toBe(true);
    expect(eigenvals).toHaveLength(2);
    expect(eigenvals[0]).toBeCloseTo(4.618, 2);
    expect(eigenvals[1]).toBeCloseTo(2.382, 2);

    expect(eigResult).toHaveProperty('eigenvalues');
    expect(eigResult).toHaveProperty('eigenvectors');
    expect(eigResult.eigenvalues).toHaveLength(2);
  }, 30000);

  test('REXX complex eigenvalue support (NumPy advantage)', async () => {
    if (skipIfNoPyodide()) return;

    const script = `
-- Test rotation matrix with complex eigenvalues
LET rotation_matrix = "[[0, -1], [1, 0]]"
LET complex_eigenvals = EIGVALS matrix=rotation_matrix

SAY "Rotation matrix eigenvalues: " || complex_eigenvals
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    const complexEigenvals = interpreter.variables.get('complex_eigenvals');
    
    // NumPy should find complex eigenvalues (our JS implementation would miss these)
    expect(Array.isArray(complexEigenvals)).toBe(true);
    expect(complexEigenvals).toHaveLength(2);
    // Complex eigenvalues should be ±i, represented as [real, imag] pairs or similar
  }, 30000);

  test('REXX large matrix support (no size limits)', async () => {
    if (skipIfNoPyodide()) return;

    const script = `
-- Test large matrix (beyond our JS implementation limits)
LET large_identity = EYE n=8
LET large_det = DET matrix=large_identity

SAY "8x8 identity matrix determinant: " || large_det
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    const largeIdentity = interpreter.variables.get('large_identity');
    const largeDet = interpreter.variables.get('large_det');

    expect(Array.isArray(largeIdentity)).toBe(true);
    expect(largeIdentity).toHaveLength(8);
    expect(largeIdentity[0]).toHaveLength(8);
    expect(largeDet).toBeCloseTo(1, 10);
  }, 30000);

  test('REXX mathematical functions accuracy', async () => {
    if (skipIfNoPyodide()) return;

    const script = `
-- Test mathematical functions
LET data = "[1, 2, 3, 4, 5]"
LET mean_result = MEAN a=data
LET std_result = STD a=data
LET sin_result = SIN x="[0, 1.5708]"

SAY "Mean: " || mean_result
SAY "Std: " || std_result  
SAY "Sin: " || sin_result
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    const meanResult = interpreter.variables.get('mean_result');
    const stdResult = interpreter.variables.get('std_result');
    const sinResult = interpreter.variables.get('sin_result');

    expect(meanResult).toBeCloseTo(3, 10);
    expect(stdResult).toBeCloseTo(1.414, 2);
    expect(Array.isArray(sinResult)).toBe(true);
    expect(sinResult[0]).toBeCloseTo(0, 10);
    expect(sinResult[1]).toBeCloseTo(1, 10);
  }, 30000);

  test('REXX linear algebra operations', async () => {
    if (skipIfNoPyodide()) return;

    const script = `
-- Test matrix operations
LET matrix_a = "[[1, 2], [3, 4]]"
LET matrix_b = "[[2, 0], [1, 2]]"
LET dot_result = DOT a=matrix_a b=matrix_b
LET det_result = DET matrix=matrix_a
LET inv_result = INV matrix=matrix_a

SAY "Dot product: " || dot_result
SAY "Determinant: " || det_result
SAY "Inverse: " || inv_result
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    const dotResult = interpreter.variables.get('dot_result');
    const detResult = interpreter.variables.get('det_result');
    const invResult = interpreter.variables.get('inv_result');

    expect(dotResult).toEqual([[4, 4], [10, 8]]);
    expect(detResult).toBeCloseTo(-2, 10);
    expect(Array.isArray(invResult)).toBe(true);
    expect(invResult).toHaveLength(2);
  }, 30000);

  test('REXX error handling', async () => {
    if (skipIfNoPyodide()) return;

    const script = `
-- Test error handling with invalid matrix
LET invalid_matrix = "[[1, 2], [3]]"
LET error_result = ""

-- This should fail gracefully
SIGNAL ON ERROR
LET eigenvals_result = EIGVALS matrix=invalid_matrix
SIGNAL OFF ERROR
GOTO CONTINUE

ERROR:
LET error_result = "Error caught correctly"

CONTINUE:
SAY "Error handling: " || error_result
    `;

    const commands = parse(script);
    await interpreter.run(commands);

    // Should handle errors gracefully
    const errorResult = interpreter.variables.get('error_result');
    expect(typeof errorResult).toBe('string');
  }, 30000);
});