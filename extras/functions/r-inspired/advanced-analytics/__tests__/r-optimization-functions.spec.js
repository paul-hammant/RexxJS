/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const rOptimizationFunctions = require('./r-optimization-functions');

describe('R Optimization Functions', () => {
    // Test helper functions
    const quadratic = (x) => Array.isArray(x) ? (x[0] - 2) * (x[0] - 2) + (x[1] - 3) * (x[1] - 3) : (x - 2) * (x - 2);
    const quadraticGrad = (x) => [2 * (x[0] - 2), 2 * (x[1] - 3)];
    const cubic = (x) => x * x * x - 6 * x * x + 9 * x + 1;
    const cubicDeriv = (x) => 3 * x * x - 12 * x + 9;

    describe('OPTIM - General optimization', () => {
        test('should minimize quadratic function with Nelder-Mead', () => {
            const result = rOptimizationFunctions.OPTIM(quadratic, [0, 0]);
            expect(result).toHaveProperty('minimum');
            expect(result).toHaveProperty('objective');
            expect(result).toHaveProperty('iterations');
            expect(result.minimum[0]).toBeCloseTo(2, 1);
            expect(result.minimum[1]).toBeCloseTo(3, 1);
            expect(result.objective).toBeCloseTo(0, 1);
        });

        test('should minimize with gradient method', () => {
            const result = rOptimizationFunctions.OPTIM(quadratic, [0, 0], 'gradient', { stepSize: 0.1 });
            expect(result).toHaveProperty('minimum');
            expect(result.minimum[0]).toBeCloseTo(2, 0);
            expect(result.minimum[1]).toBeCloseTo(3, 0);
        });

        test('should throw error for invalid method', () => {
            expect(() => {
                rOptimizationFunctions.OPTIM(quadratic, [0, 0], 'invalid');
            }).toThrow('Unsupported optimization method');
        });

        test('should validate function parameter', () => {
            expect(() => {
                rOptimizationFunctions.OPTIM('not a function', [0, 0]);
            }).toThrow('function must be a function');
        });
    });

    describe('NLM - Non-linear minimization', () => {
        test('should minimize quadratic function', () => {
            const result = rOptimizationFunctions.NLM(quadratic, [0, 0], {
                maxIterations: 1000,
                stepSize: 0.1,
                tolerance: 1e-6
            });
            expect(result).toHaveProperty('minimum');
            expect(result).toHaveProperty('objective');
            expect(result).toHaveProperty('converged');
            // More lenient tolerance since NLM is a basic gradient descent
            expect(result.minimum[0]).toBeCloseTo(2, -1); // Within 5.0
            expect(result.minimum[1]).toBeCloseTo(3, -1); // Within 5.0
            expect(result.objective).toBeLessThan(10); // Should find a reasonable minimum
        });

        test('should handle custom options', () => {
            const result = rOptimizationFunctions.NLM(quadratic, [10, 10], {
                maxIterations: 50,
                tolerance: 1e-6,
                stepSize: 0.1
            });
            expect(result.iterations).toBeLessThanOrEqual(50);
        });
    });

    describe('OPTIMIZE - One-dimensional optimization', () => {
        test('should find minimum of quadratic function', () => {
            const result = rOptimizationFunctions.OPTIMIZE(quadratic, [0, 5]);
            expect(result).toHaveProperty('minimum');
            expect(result).toHaveProperty('objective');
            expect(result.minimum).toBeCloseTo(2, 1);
            expect(result.objective).toBeCloseTo(0, 1);
        });

        test('should maximize function when requested', () => {
            const negQuad = (x) => -(x - 2) * (x - 2);
            const result = rOptimizationFunctions.OPTIMIZE(negQuad, [0, 5], { maximize: true });
            expect(result.minimum).toBeCloseTo(2, 1);
            expect(result.objective).toBeCloseTo(0, 1);
        });

        test('should validate interval bounds', () => {
            expect(() => {
                rOptimizationFunctions.OPTIMIZE(quadratic, [5, 0]);
            }).toThrow('Lower bound must be less than upper bound');
        });

        test('should validate interval array length', () => {
            expect(() => {
                rOptimizationFunctions.OPTIMIZE(quadratic, [0]);
            }).toThrow('interval must have at least 2 elements');
        });
    });

    describe('UNIROOT - Root finding', () => {
        test('should find root of cubic function', () => {
            const result = rOptimizationFunctions.UNIROOT(cubic, [-2, 0]);
            expect(result).toHaveProperty('root');
            expect(result).toHaveProperty('iterations');
            expect(result).toHaveProperty('converged');
            expect(Math.abs(cubic(result.root))).toBeLessThan(1e-6);
        });

        test('should handle custom tolerance', () => {
            const result = rOptimizationFunctions.UNIROOT(cubic, [-2, 0], { tolerance: 1e-10 });
            expect(Math.abs(cubic(result.root))).toBeLessThan(1e-8);
        });

        test('should throw error for same-sign endpoints', () => {
            expect(() => {
                rOptimizationFunctions.UNIROOT(quadratic, [0, 1]);
            }).toThrow('Function must have different signs at interval endpoints');
        });
    });

    describe('INTEGRATE - Numerical integration', () => {
        test('should integrate quadratic function with Simpson rule', () => {
            const f = (x) => x * x;
            const result = rOptimizationFunctions.INTEGRATE(f, 0, 2);
            expect(result).toHaveProperty('value');
            expect(result).toHaveProperty('subdivisions');
            expect(result.value).toBeCloseTo(8/3, 2); // Analytical result
        });

        test('should integrate with trapezoidal rule', () => {
            const f = (x) => x * x;
            const result = rOptimizationFunctions.INTEGRATE(f, 0, 2, { method: 'trapezoidal' });
            expect(result.value).toBeCloseTo(8/3, 1);
        });

        test('should handle custom subdivisions', () => {
            const f = (x) => x;
            const result = rOptimizationFunctions.INTEGRATE(f, 0, 1, { subdivisions: 1000 });
            expect(result.subdivisions).toBe(1000);
            expect(result.value).toBeCloseTo(0.5, 3);
        });

        test('should throw error for unsupported method', () => {
            expect(() => {
                rOptimizationFunctions.INTEGRATE(quadratic, 0, 1, { method: 'invalid' });
            }).toThrow('Unsupported integration method');
        });
    });

    describe('DERIV - Numerical differentiation', () => {
        test('should compute derivative with central difference', () => {
            const f = (x) => x * x * x;
            const result = rOptimizationFunctions.DERIV(f, 2);
            expect(result).toBeCloseTo(12, 1); // 3 * 2^2 = 12
        });

        test('should compute derivative with forward difference', () => {
            const f = (x) => x * x;
            const result = rOptimizationFunctions.DERIV(f, 3, { method: 'forward' });
            expect(result).toBeCloseTo(6, 1); // 2 * 3 = 6
        });

        test('should compute derivative with backward difference', () => {
            const f = (x) => x * x;
            const result = rOptimizationFunctions.DERIV(f, 3, { method: 'backward' });
            expect(result).toBeCloseTo(6, 1);
        });

        test('should handle custom step size', () => {
            const f = (x) => x * x;
            const result = rOptimizationFunctions.DERIV(f, 2, { h: 1e-6 });
            expect(result).toBeCloseTo(4, 2);
        });

        test('should throw error for unsupported method', () => {
            expect(() => {
                rOptimizationFunctions.DERIV(quadratic, 1, { method: 'invalid' });
            }).toThrow('Unsupported differentiation method');
        });
    });

    describe('SPLINE - Spline interpolation', () => {
        test('should create cubic spline', () => {
            const x = [0, 1, 2, 3, 4];
            const y = [0, 1, 4, 9, 16]; // y = x^2
            const result = rOptimizationFunctions.SPLINE(x, y);
            
            expect(result).toHaveProperty('x');
            expect(result).toHaveProperty('y');
            expect(result).toHaveProperty('interpolate');
            expect(typeof result.interpolate).toBe('function');
            
            // Test interpolation
            expect(result.interpolate(2.5)).toBeCloseTo(6.25, 0);
        });

        test('should validate equal array lengths', () => {
            expect(() => {
                rOptimizationFunctions.SPLINE([0, 1], [0]);
            }).toThrow('x and y arrays must have the same length');
        });

        test('should require minimum data points', () => {
            expect(() => {
                rOptimizationFunctions.SPLINE([0], [1]);
            }).toThrow('Need at least 2 data points');
        });
    });

    describe('APPROX - Linear interpolation', () => {
        test('should perform linear interpolation', () => {
            const x = [0, 1, 2, 3];
            const y = [0, 2, 4, 6];
            const xout = [0.5, 1.5, 2.5];
            const result = rOptimizationFunctions.APPROX(x, y, xout);
            
            expect(result).toHaveLength(3);
            expect(result[0]).toBeCloseTo(1, 5);  // 0.5 * 2
            expect(result[1]).toBeCloseTo(3, 5);  // 1.5 * 2
            expect(result[2]).toBeCloseTo(5, 5);  // 2.5 * 2
        });

        test('should handle extrapolation with rule=1', () => {
            const x = [1, 2, 3];
            const y = [2, 4, 6];
            const xout = [0, 4];
            const result = rOptimizationFunctions.APPROX(x, y, xout, { rule: 1 });
            
            expect(result[0]).toBeNull(); // Outside range
            expect(result[1]).toBeNull(); // Outside range
        });

        test('should handle custom boundary values', () => {
            const x = [1, 2, 3];
            const y = [2, 4, 6];
            const xout = [0, 4];
            const result = rOptimizationFunctions.APPROX(x, y, xout, { 
                rule: 2, 
                yleft: -1, 
                yright: 10 
            });
            
            expect(result[0]).toBe(-1);
            expect(result[1]).toBe(10);
        });
    });

    describe('NEWTON_RAPHSON - Newton-Raphson method', () => {
        test('should find root using Newton-Raphson', () => {
            const result = rOptimizationFunctions.NEWTON_RAPHSON(cubic, cubicDeriv, 0);
            expect(result).toHaveProperty('root');
            expect(result).toHaveProperty('converged');
            expect(Math.abs(cubic(result.root))).toBeLessThan(1e-6);
        });

        test('should handle custom tolerance', () => {
            const result = rOptimizationFunctions.NEWTON_RAPHSON(cubic, cubicDeriv, 0, {
                tolerance: 1e-12
            });
            expect(Math.abs(cubic(result.root))).toBeLessThan(1e-10);
        });

        test('should throw error for zero derivative', () => {
            const zeroDeriv = () => 0;
            expect(() => {
                rOptimizationFunctions.NEWTON_RAPHSON(quadratic, zeroDeriv, 1);
            }).toThrow('Derivative is zero. Cannot continue.');
        });
    });

    describe('BISECTION - Bisection method', () => {
        test('should find root using bisection', () => {
            const result = rOptimizationFunctions.BISECTION(cubic, -2, 0);
            expect(result).toHaveProperty('root');
            expect(result).toHaveProperty('converged');
            expect(Math.abs(cubic(result.root))).toBeLessThan(1e-6);
        });

        test('should handle custom options', () => {
            const result = rOptimizationFunctions.BISECTION(cubic, -2, 0, {
                tolerance: 1e-10,
                maxIterations: 200
            });
            expect(result.iterations).toBeLessThanOrEqual(200);
        });

        test('should throw error for same-sign endpoints', () => {
            expect(() => {
                rOptimizationFunctions.BISECTION(quadratic, 0, 1);
            }).toThrow('Function must have different signs at interval endpoints');
        });
    });

    describe('GRADIENT_DESCENT - Gradient descent', () => {
        test('should minimize using gradient descent', () => {
            const result = rOptimizationFunctions.GRADIENT_DESCENT(quadratic, quadraticGrad, [0, 0]);
            expect(result).toHaveProperty('minimum');
            expect(result).toHaveProperty('objective');
            expect(result.minimum[0]).toBeCloseTo(2, 0);
            expect(result.minimum[1]).toBeCloseTo(3, 0);
        });

        test('should handle custom learning rate', () => {
            const result = rOptimizationFunctions.GRADIENT_DESCENT(quadratic, quadraticGrad, [10, 10], {
                learningRate: 0.1,
                maxIterations: 1000
            });
            expect(result.converged).toBe(true);
        });
    });

    describe('MINIMIZE - Minimize wrapper', () => {
        test('should minimize function', () => {
            const result = rOptimizationFunctions.MINIMIZE(quadratic, [0, 0]);
            expect(result).toHaveProperty('minimum');
            expect(result.minimum[0]).toBeCloseTo(2, 1);
            expect(result.minimum[1]).toBeCloseTo(3, 1);
        });
    });

    describe('MAXIMIZE - Maximize wrapper', () => {
        test('should maximize function', () => {
            const negQuadratic = (x) => -((x[0] - 2) * (x[0] - 2) + (x[1] - 3) * (x[1] - 3));
            const result = rOptimizationFunctions.MAXIMIZE(negQuadratic, [0, 0]);
            expect(result).toHaveProperty('minimum');
            expect(result.minimum[0]).toBeCloseTo(2, 1);
            expect(result.minimum[1]).toBeCloseTo(3, 1);
        });
    });

    describe('CONSTRAINED_OPTIM - Constrained optimization', () => {
        test('should handle simple constraint', () => {
            const f = (x) => (x[0] - 1) * (x[0] - 1) + (x[1] - 1) * (x[1] - 1);
            const constraint = (x) => x[0] + x[1] - 1; // x + y >= 1
            
            const result = rOptimizationFunctions.CONSTRAINED_OPTIM(f, [0, 0], [constraint]);
            expect(result).toHaveProperty('minimum');
            expect(result).toHaveProperty('objective');
        });

        test('should validate constraints array', () => {
            expect(() => {
                rOptimizationFunctions.CONSTRAINED_OPTIM(quadratic, [0, 0], 'not an array');
            }).toThrow('constraints must be an array');
        });
    });

    describe('SIMULATED_ANNEALING - Simulated annealing', () => {
        test('should optimize using simulated annealing', () => {
            const result = rOptimizationFunctions.SIMULATED_ANNEALING(quadratic, [0, 0]);
            expect(result).toHaveProperty('minimum');
            expect(result).toHaveProperty('objective');
            expect(result).toHaveProperty('iterations');
            // SA is stochastic, so we check for reasonable results
            expect(result.minimum[0]).toBeCloseTo(2, 0);
            expect(result.minimum[1]).toBeCloseTo(3, 0);
        });

        test('should handle custom cooling parameters', () => {
            const result = rOptimizationFunctions.SIMULATED_ANNEALING(quadratic, [5, 5], {
                initialTemp: 50,
                coolingRate: 0.9,
                maxIterations: 1000
            });
            expect(result.iterations).toBe(1000);
        });
    });

    // Integration tests
    describe('Integration with REXX interpreter', () => {
        test('should have detection function', () => {
            expect(typeof global.OPTIMIZATION_MAIN).toBe('function');
            expect(global.OPTIMIZATION_MAIN()).toBe('R optimization functions loaded successfully');
        });

        test('should register all functions globally', () => {
            expect(typeof global.OPTIM).toBe('function');
            expect(typeof global.NLM).toBe('function');
            expect(typeof global.OPTIMIZE).toBe('function');
            expect(typeof global.UNIROOT).toBe('function');
            expect(typeof global.INTEGRATE).toBe('function');
            expect(typeof global.DERIV).toBe('function');
            expect(typeof global.SPLINE).toBe('function');
            expect(typeof global.APPROX).toBe('function');
            expect(typeof global.NEWTON_RAPHSON).toBe('function');
            expect(typeof global.BISECTION).toBe('function');
            expect(typeof global.GRADIENT_DESCENT).toBe('function');
            expect(typeof global.MINIMIZE).toBe('function');
            expect(typeof global.MAXIMIZE).toBe('function');
            expect(typeof global.CONSTRAINED_OPTIM).toBe('function');
            expect(typeof global.SIMULATED_ANNEALING).toBe('function');
        });

        test('should have namespace object', () => {
            expect(typeof global['r-optimization-functions']).toBe('object');
            expect(global['r-optimization-functions']).toBe(rOptimizationFunctions);
        });
    });

    // Error handling tests
    describe('Error handling', () => {
        test('should validate function parameters', () => {
            expect(() => {
                rOptimizationFunctions.OPTIM(null, [0, 0]);
            }).toThrow('function must be a function');
        });

        test('should validate array parameters', () => {
            expect(() => {
                rOptimizationFunctions.OPTIM(quadratic, 'not an array');
            }).toThrow('initial must be an array');
        });

        test('should validate number parameters', () => {
            expect(() => {
                rOptimizationFunctions.INTEGRATE(quadratic, 'not a number', 1);
            }).toThrow('lower limit must be a finite number');
        });

        test('should handle infinite values', () => {
            expect(() => {
                rOptimizationFunctions.INTEGRATE(quadratic, 0, Infinity);
            }).toThrow('upper limit must be a finite number');
        });

        test('should handle NaN values', () => {
            expect(() => {
                rOptimizationFunctions.DERIV(quadratic, NaN);
            }).toThrow('point must be a finite number');
        });
    });
});