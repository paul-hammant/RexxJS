/**
 * R Optimization & Numerical Methods Functions
 * Comprehensive optimization and numerical analysis capabilities
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function validateNumber(value, name) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        throw new Error(`${name} must be a finite number`);
    }
    return value;
}

function validateFunction(func, name) {
    if (typeof func !== 'function') {
        throw new Error(`${name} must be a function`);
    }
    return func;
}

function validateArray(arr, name, minLength = 0) {
    if (!Array.isArray(arr)) {
        throw new Error(`${name} must be an array`);
    }
    if (arr.length < minLength) {
        throw new Error(`${name} must have at least ${minLength} elements`);
    }
    return arr;
}

const rOptimizationFunctions = {
    // General-purpose optimization
    OPTIM: function(fn, initial, method = 'nelder-mead', options = {}) {
        validateFunction(fn, 'function');
        validateArray(initial, 'initial');
        
        const {
            maxIterations = 1000,
            tolerance = 1e-8,
            stepSize = 0.01
        } = options;

        if (method.toLowerCase() === 'nelder-mead') {
            return nelderMeadOptimization(fn, initial, maxIterations, tolerance);
        } else if (method.toLowerCase() === 'gradient') {
            return nonLinearMinimization(fn, initial, stepSize, maxIterations, tolerance);
        } else {
            throw new Error('Unsupported optimization method');
        }
    },

    // Non-linear minimization
    NLM: function(fn, initial, options = {}) {
        validateFunction(fn, 'function');
        validateArray(initial, 'initial');
        
        const {
            maxIterations = 500,
            tolerance = 1e-10,
            stepSize = 0.001
        } = options;

        return nonLinearMinimization(fn, initial, stepSize, maxIterations, tolerance);
    },

    // One-dimensional optimization
    OPTIMIZE: function(fn, interval, options = {}) {
        validateFunction(fn, 'function');
        validateArray(interval, 'interval', 2);
        
        const [lower, upper] = interval;
        validateNumber(lower, 'lower bound');
        validateNumber(upper, 'upper bound');
        
        if (lower >= upper) {
            throw new Error('Lower bound must be less than upper bound');
        }

        const {
            maxIterations = 100,
            tolerance = 1e-8,
            maximize = false
        } = options;

        const targetFn = maximize ? (x) => -fn(x) : fn;
        const result = goldenSectionSearch(targetFn, lower, upper, tolerance, maxIterations);
        
        return {
            minimum: maximize ? result.minimum : result.minimum,
            objective: maximize ? -result.objective : result.objective,
            iterations: result.iterations,
            converged: result.converged
        };
    },

    // Root finding for univariate functions
    UNIROOT: function(fn, interval, options = {}) {
        validateFunction(fn, 'function');
        validateArray(interval, 'interval', 2);
        
        const [lower, upper] = interval;
        validateNumber(lower, 'lower bound');
        validateNumber(upper, 'upper bound');
        
        const {
            tolerance = 1e-8,
            maxIterations = 100
        } = options;

        return brentMethod(fn, lower, upper, tolerance, maxIterations);
    },

    // Numerical integration (quadrature)
    INTEGRATE: function(fn, lower, upper, options = {}) {
        validateFunction(fn, 'function');
        validateNumber(lower, 'lower limit');
        validateNumber(upper, 'upper limit');
        
        const {
            method = 'simpson',
            subdivisions = 100,
            tolerance = 1e-8
        } = options;

        if (method === 'simpson') {
            return simpsonRule(fn, lower, upper, subdivisions);
        } else if (method === 'trapezoidal') {
            return trapezoidalRule(fn, lower, upper, subdivisions);
        } else {
            throw new Error('Unsupported integration method');
        }
    },

    // Numerical differentiation
    DERIV: function(fn, x, options = {}) {
        validateFunction(fn, 'function');
        validateNumber(x, 'point');
        
        const {
            method = 'central',
            h = 1e-8
        } = options;

        if (method === 'central') {
            return (fn(x + h) - fn(x - h)) / (2 * h);
        } else if (method === 'forward') {
            return (fn(x + h) - fn(x)) / h;
        } else if (method === 'backward') {
            return (fn(x) - fn(x - h)) / h;
        } else {
            throw new Error('Unsupported differentiation method');
        }
    },

    // Spline interpolation
    SPLINE: function(x, y, options = {}) {
        validateArray(x, 'x values');
        validateArray(y, 'y values');
        
        if (x.length !== y.length) {
            throw new Error('x and y arrays must have the same length');
        }
        if (x.length < 2) {
            throw new Error('Need at least 2 data points');
        }

        const {
            method = 'cubic',
            derivative1 = null,
            derivative2 = null
        } = options;

        return cubicSplineInterpolation(x, y, derivative1, derivative2);
    },

    // Linear interpolation
    APPROX: function(x, y, xout, options = {}) {
        validateArray(x, 'x values');
        validateArray(y, 'y values');
        validateArray(xout, 'interpolation points');
        
        if (x.length !== y.length) {
            throw new Error('x and y arrays must have the same length');
        }

        const {
            method = 'linear',
            rule = 1,
            yleft = null,
            yright = null
        } = options;

        return linearInterpolation(x, y, xout, rule, yleft, yright);
    },

    // Newton-Raphson method
    NEWTON_RAPHSON: function(fn, dfn, initial, options = {}) {
        validateFunction(fn, 'function');
        validateFunction(dfn, 'derivative function');
        validateNumber(initial, 'initial guess');
        
        const {
            maxIterations = 100,
            tolerance = 1e-8
        } = options;

        return newtonRaphsonMethod(fn, dfn, initial, tolerance, maxIterations);
    },

    // Bisection root finding
    BISECTION: function(fn, lower, upper, options = {}) {
        validateFunction(fn, 'function');
        validateNumber(lower, 'lower bound');
        validateNumber(upper, 'upper bound');
        
        const {
            tolerance = 1e-8,
            maxIterations = 100
        } = options;

        return bisectionMethod(fn, lower, upper, tolerance, maxIterations);
    },

    // Basic gradient descent
    GRADIENT_DESCENT: function(fn, gradient, initial, options = {}) {
        validateFunction(fn, 'function');
        validateFunction(gradient, 'gradient function');
        validateArray(initial, 'initial point');
        
        const {
            learningRate = 0.01,
            maxIterations = 1000,
            tolerance = 1e-8
        } = options;

        return gradientDescent(fn, gradient, initial, learningRate, maxIterations, tolerance);
    },

    // Minimize wrapper
    MINIMIZE: function(fn, initial, method = 'nelder-mead', options = {}) {
        return this.OPTIM(fn, initial, method, { ...options, maximize: false });
    },

    // Maximize wrapper  
    MAXIMIZE: function(fn, initial, method = 'nelder-mead', options = {}) {
        const result = this.OPTIM((x) => Array.isArray(x) ? -fn(x) : -fn(x), initial, method, options);
        return {
            ...result,
            objective: -result.objective
        };
    },

    // Constrained optimization
    CONSTRAINED_OPTIM: function(fn, initial, constraints = [], options = {}) {
        validateFunction(fn, 'function');
        validateArray(initial, 'initial point');
        validateArray(constraints, 'constraints');
        
        const {
            penalty = 1000,
            maxIterations = 1000,
            tolerance = 1e-8
        } = options;

        const penaltyFunction = (x) => {
            let value = fn(x);
            for (const constraint of constraints) {
                const violation = Math.max(0, constraint(x));
                value += penalty * violation * violation;
            }
            return value;
        };

        return this.OPTIM(penaltyFunction, initial, 'nelder-mead', { maxIterations, tolerance });
    },

    // Simulated annealing optimization
    SIMULATED_ANNEALING: function(fn, initial, options = {}) {
        validateFunction(fn, 'function');
        validateArray(initial, 'initial point');
        
        const {
            initialTemp = 100,
            coolingRate = 0.95,
            minTemp = 1e-8,
            maxIterations = 10000,
            stepSize = 1.0
        } = options;

        return simulatedAnnealing(fn, initial, initialTemp, coolingRate, minTemp, maxIterations, stepSize);
    }
};

// Helper function implementations

function nelderMeadOptimization(fn, initial, maxIterations, tolerance) {
    const n = initial.length;
    const alpha = 1.0;
    const gamma = 2.0;
    const rho = 0.5;
    const sigma = 0.5;

    // Create initial simplex
    let simplex = [initial.slice()];
    for (let i = 0; i < n; i++) {
        const vertex = initial.slice();
        vertex[i] += vertex[i] !== 0 ? 0.05 * vertex[i] : 0.00025;
        simplex.push(vertex);
    }

    // Evaluate initial simplex
    let values = simplex.map(fn);
    let iterations = 0;

    while (iterations < maxIterations) {
        // Sort vertices by function value
        const indices = Array.from({length: n + 1}, (_, i) => i);
        indices.sort((a, b) => values[a] - values[b]);
        
        const best = indices[0];
        const worst = indices[n];
        const secondWorst = indices[n - 1];

        // Check convergence
        const range = values[worst] - values[best];
        if (range < tolerance) {
            break;
        }

        // Calculate centroid
        const centroid = new Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                centroid[j] += simplex[indices[i]][j];
            }
        }
        for (let j = 0; j < n; j++) {
            centroid[j] /= n;
        }

        // Reflection
        const reflected = centroid.map((c, i) => c + alpha * (c - simplex[worst][i]));
        const reflectedValue = fn(reflected);

        if (values[best] <= reflectedValue && reflectedValue < values[secondWorst]) {
            simplex[worst] = reflected;
            values[worst] = reflectedValue;
        } else if (reflectedValue < values[best]) {
            // Expansion
            const expanded = centroid.map((c, i) => c + gamma * (reflected[i] - c));
            const expandedValue = fn(expanded);
            
            if (expandedValue < reflectedValue) {
                simplex[worst] = expanded;
                values[worst] = expandedValue;
            } else {
                simplex[worst] = reflected;
                values[worst] = reflectedValue;
            }
        } else {
            // Contraction
            const contracted = centroid.map((c, i) => c + rho * (simplex[worst][i] - c));
            const contractedValue = fn(contracted);
            
            if (contractedValue < values[worst]) {
                simplex[worst] = contracted;
                values[worst] = contractedValue;
            } else {
                // Shrink
                for (let i = 1; i <= n; i++) {
                    const idx = indices[i];
                    simplex[idx] = simplex[best].map((b, j) => b + sigma * (simplex[idx][j] - b));
                    values[idx] = fn(simplex[idx]);
                }
            }
        }

        iterations++;
    }

    const bestIndex = values.indexOf(Math.min(...values));
    return {
        minimum: simplex[bestIndex],
        objective: values[bestIndex],
        iterations,
        converged: iterations < maxIterations
    };
}

function nonLinearMinimization(fn, initial, stepSize, maxIterations, tolerance) {
    let x = initial.slice();
    let prevValue = fn(x);
    
    for (let iter = 0; iter < maxIterations; iter++) {
        // Compute numerical gradient
        const gradient = new Array(x.length);
        for (let i = 0; i < x.length; i++) {
            const h = stepSize * 0.001;
            const xPlus = x.slice();
            const xMinus = x.slice();
            xPlus[i] += h;
            xMinus[i] -= h;
            gradient[i] = (fn(xPlus) - fn(xMinus)) / (2 * h);
        }
        
        // Update x
        const gradNorm = Math.sqrt(gradient.reduce((sum, g) => sum + g * g, 0));
        if (gradNorm < tolerance) {
            return {
                minimum: x,
                objective: fn(x),
                iterations: iter + 1,
                converged: true
            };
        }
        
        // Adaptive step size
        let currentStepSize = stepSize;
        let newX = x.map((xi, i) => xi - currentStepSize * gradient[i]);
        let newValue = fn(newX);
        
        // Line search to ensure progress
        let backtrackIter = 0;
        while (newValue >= prevValue && backtrackIter < 10) {
            currentStepSize *= 0.5;
            newX = x.map((xi, i) => xi - currentStepSize * gradient[i]);
            newValue = fn(newX);
            backtrackIter++;
        }
        
        x = newX;
        
        if (Math.abs(newValue - prevValue) < tolerance) {
            return {
                minimum: x,
                objective: newValue,
                iterations: iter + 1,
                converged: true
            };
        }
        prevValue = newValue;
    }
    
    return {
        minimum: x,
        objective: fn(x),
        iterations: maxIterations,
        converged: false
    };
}

function goldenSectionSearch(fn, lower, upper, tolerance, maxIterations) {
    const phi = (1 + Math.sqrt(5)) / 2;
    const resphi = 2 - phi;
    
    let a = lower;
    let b = upper;
    let tol = tolerance;
    
    let x1 = a + resphi * (b - a);
    let x2 = a + (1 - resphi) * (b - a);
    let f1 = fn(x1);
    let f2 = fn(x2);
    
    for (let iter = 0; iter < maxIterations; iter++) {
        if (Math.abs(b - a) < tol) {
            const minimum = (a + b) / 2;
            return {
                minimum,
                objective: fn(minimum),
                iterations: iter + 1,
                converged: true
            };
        }
        
        if (f1 < f2) {
            b = x2;
            x2 = x1;
            f2 = f1;
            x1 = a + resphi * (b - a);
            f1 = fn(x1);
        } else {
            a = x1;
            x1 = x2;
            f1 = f2;
            x2 = a + (1 - resphi) * (b - a);
            f2 = fn(x2);
        }
    }
    
    const minimum = (a + b) / 2;
    return {
        minimum,
        objective: fn(minimum),
        iterations: maxIterations,
        converged: false
    };
}

function brentMethod(fn, a, b, tolerance, maxIterations) {
    let fa = fn(a);
    let fb = fn(b);
    
    if (fa * fb >= 0) {
        throw new Error('Function must have different signs at interval endpoints');
    }
    
    if (Math.abs(fa) < Math.abs(fb)) {
        [a, b] = [b, a];
        [fa, fb] = [fb, fa];
    }
    
    let c = a;
    let fc = fa;
    let mflag = true;
    
    for (let iter = 0; iter < maxIterations; iter++) {
        if (Math.abs(fb) < tolerance) {
            return {
                root: b,
                iterations: iter + 1,
                converged: true
            };
        }
        
        let s;
        if (fa !== fc && fb !== fc) {
            // Inverse quadratic interpolation
            s = (a * fb * fc) / ((fa - fb) * (fa - fc)) +
                (b * fa * fc) / ((fb - fa) * (fb - fc)) +
                (c * fa * fb) / ((fc - fa) * (fc - fb));
        } else {
            // Secant method
            s = b - fb * (b - a) / (fb - fa);
        }
        
        const condition1 = s < (3 * a + b) / 4 || s > b;
        const condition2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2;
        const condition3 = !mflag && Math.abs(s - b) >= Math.abs(c - a) / 2;
        const condition4 = mflag && Math.abs(b - c) < tolerance;
        const condition5 = !mflag && Math.abs(c - a) < tolerance;
        
        if (condition1 || condition2 || condition3 || condition4 || condition5) {
            s = (a + b) / 2;
            mflag = true;
        } else {
            mflag = false;
        }
        
        const fs = fn(s);
        a = c;
        fa = fc;
        c = b;
        fc = fb;
        
        if (fa * fs < 0) {
            b = s;
            fb = fs;
        } else {
            a = s;
            fa = fs;
        }
        
        if (Math.abs(fa) < Math.abs(fb)) {
            [a, b] = [b, a];
            [fa, fb] = [fb, fa];
        }
    }
    
    return {
        root: b,
        iterations: maxIterations,
        converged: false
    };
}

function simpsonRule(fn, a, b, n) {
    if (n % 2 === 1) n++; // Ensure even number of intervals
    
    const h = (b - a) / n;
    let sum = fn(a) + fn(b);
    
    for (let i = 1; i < n; i++) {
        const x = a + i * h;
        sum += (i % 2 === 0 ? 2 : 4) * fn(x);
    }
    
    return {
        value: (h / 3) * sum,
        subdivisions: n
    };
}

function trapezoidalRule(fn, a, b, n) {
    const h = (b - a) / n;
    let sum = (fn(a) + fn(b)) / 2;
    
    for (let i = 1; i < n; i++) {
        sum += fn(a + i * h);
    }
    
    return {
        value: h * sum,
        subdivisions: n
    };
}

function cubicSplineInterpolation(x, y, d1, d2) {
    const n = x.length;
    const h = new Array(n - 1);
    const alpha = new Array(n - 1);
    
    for (let i = 0; i < n - 1; i++) {
        h[i] = x[i + 1] - x[i];
        alpha[i] = (3 / h[i]) * (y[i + 1] - y[i]);
    }
    
    const l = new Array(n);
    const mu = new Array(n);
    const z = new Array(n);
    
    l[0] = 1;
    mu[0] = 0;
    z[0] = 0;
    
    for (let i = 1; i < n - 1; i++) {
        l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1];
        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - alpha[i - 1] - h[i - 1] * z[i - 1]) / l[i];
    }
    
    l[n - 1] = 1;
    z[n - 1] = 0;
    
    const c = new Array(n);
    c[n - 1] = 0;
    
    for (let j = n - 2; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j + 1];
    }
    
    const b = new Array(n - 1);
    const d = new Array(n - 1);
    
    for (let j = 0; j < n - 1; j++) {
        b[j] = (y[j + 1] - y[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }
    
    return {
        x: x,
        y: y,
        b: b,
        c: c,
        d: d,
        interpolate: function(xval) {
            let i = 0;
            while (i < n - 1 && x[i + 1] < xval) i++;
            const dx = xval - x[i];
            return y[i] + b[i] * dx + c[i] * dx * dx + d[i] * dx * dx * dx;
        }
    };
}

function linearInterpolation(x, y, xout, rule, yleft, yright) {
    const result = [];
    
    for (const xi of xout) {
        let i = 0;
        while (i < x.length - 1 && x[i + 1] < xi) i++;
        
        if (xi < x[0]) {
            result.push(yleft !== null ? yleft : (rule === 1 ? null : y[0]));
        } else if (xi > x[x.length - 1]) {
            result.push(yright !== null ? yright : (rule === 1 ? null : y[y.length - 1]));
        } else if (xi === x[i]) {
            result.push(y[i]);
        } else {
            const t = (xi - x[i]) / (x[i + 1] - x[i]);
            result.push(y[i] + t * (y[i + 1] - y[i]));
        }
    }
    
    return result;
}

function newtonRaphsonMethod(fn, dfn, x0, tolerance, maxIterations) {
    let x = x0;
    
    for (let iter = 0; iter < maxIterations; iter++) {
        const fx = fn(x);
        const dfx = dfn(x);
        
        if (Math.abs(dfx) < 1e-15) {
            throw new Error('Derivative is zero. Cannot continue.');
        }
        
        const xNew = x - fx / dfx;
        
        if (Math.abs(xNew - x) < tolerance) {
            return {
                root: xNew,
                iterations: iter + 1,
                converged: true
            };
        }
        
        x = xNew;
    }
    
    return {
        root: x,
        iterations: maxIterations,
        converged: false
    };
}

function bisectionMethod(fn, a, b, tolerance, maxIterations) {
    let fa = fn(a);
    let fb = fn(b);
    
    if (fa * fb >= 0) {
        throw new Error('Function must have different signs at interval endpoints');
    }
    
    for (let iter = 0; iter < maxIterations; iter++) {
        const c = (a + b) / 2;
        const fc = fn(c);
        
        if (Math.abs(fc) < tolerance || Math.abs(b - a) < tolerance) {
            return {
                root: c,
                iterations: iter + 1,
                converged: true
            };
        }
        
        if (fa * fc < 0) {
            b = c;
            fb = fc;
        } else {
            a = c;
            fa = fc;
        }
    }
    
    return {
        root: (a + b) / 2,
        iterations: maxIterations,
        converged: false
    };
}

function gradientDescent(fn, gradient, initial, learningRate, maxIterations, tolerance) {
    let x = initial.slice();
    
    for (let iter = 0; iter < maxIterations; iter++) {
        const grad = gradient(x);
        const gradNorm = Math.sqrt(grad.reduce((sum, g) => sum + g * g, 0));
        
        if (gradNorm < tolerance) {
            return {
                minimum: x,
                objective: fn(x),
                iterations: iter + 1,
                converged: true
            };
        }
        
        for (let i = 0; i < x.length; i++) {
            x[i] -= learningRate * grad[i];
        }
    }
    
    return {
        minimum: x,
        objective: fn(x),
        iterations: maxIterations,
        converged: false
    };
}

function simulatedAnnealing(fn, initial, initialTemp, coolingRate, minTemp, maxIterations, stepSize) {
    let current = initial.slice();
    let currentValue = fn(current);
    let best = current.slice();
    let bestValue = currentValue;
    let temp = initialTemp;
    
    for (let iter = 0; iter < maxIterations && temp > minTemp; iter++) {
        // Generate neighbor
        const neighbor = current.map(x => x + (Math.random() - 0.5) * stepSize);
        const neighborValue = fn(neighbor);
        
        // Accept or reject
        const delta = neighborValue - currentValue;
        if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
            current = neighbor;
            currentValue = neighborValue;
            
            if (neighborValue < bestValue) {
                best = neighbor.slice();
                bestValue = neighborValue;
            }
        }
        
        // Cool down
        temp *= coolingRate;
    }
    
    return {
        minimum: best,
        objective: bestValue,
        iterations: maxIterations,
        converged: temp <= minTemp
    };
}

// Self-registration for REQUIRE system
if (typeof global !== 'undefined') {
    global['r-optimization-functions'] = rOptimizationFunctions;
    
    // Register individual functions
    Object.assign(global, rOptimizationFunctions);
    
    // Register detection function
    global.OPTIMIZATION_MAIN = () => "R optimization functions loaded successfully";
    
    if (typeof global.registerLibraryDetectionFunction === 'function') {
        global.registerLibraryDetectionFunction('r-optimization-functions', 'OPTIMIZATION_MAIN');
    }
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = rOptimizationFunctions;
}