# SymPy-Inspired Functions - REXX Reference Guide

A symbolic mathematics implementation inspired by Python's SymPy library, accessible from REXX. This module brings symbolic computation, algebraic manipulation, and symbolic differentiation capabilities to RexxJS environments.

## 🚀 **Quick Start**

```rexx
-- Load the SymPy-inspired functions
REQUIRE "sympy-inspired"

-- Create symbolic variables
LET x = SY_SYMBOL name="x"
LET y = SY_SYMBOL name="y"

-- Build symbolic expressions
LET expr = x.mul(2).add(y.pow(2))        -- 2*x + y^2
SAY "Expression: " || expr.toString()    -- "(2 * x + (y**2))"

-- Symbolic differentiation
LET dx = SY_DIFF expr=expr sym=x          -- d/dx(2*x + y^2) = 2
LET dy = SY_DIFF expr=expr sym=y          -- d/dy(2*x + y^2) = 2*y
SAY "d/dx: " || dx.toString()            -- "2"
SAY "d/dy: " || dy.toString()            -- "(2 * y)"
```

## 📚 **Complete Function Reference**

### **Core Symbolic Objects**

#### Symbol Creation
```rexx
-- Create symbolic variables
LET x = SY_SYMBOL name="x"               -- Variable x
LET y = SY_SYMBOL name="y"               -- Variable y
LET t = SY_SYMBOL name="theta"           -- Variable theta

-- Create symbolic numbers (explicit construction)
LET num_2 = SY_NUM value=2               -- Symbolic number 2
LET num_pi = SY_NUM value=3.14159        -- Symbolic π approximation
```

#### Expression Building
```rexx
-- Arithmetic operations (returns new symbolic expressions)
LET sum_expr = x.add(y)                  -- x + y
LET product_expr = x.mul(y)              -- x * y  
LET power_expr = x.pow(2)                -- x^2

-- Chained operations
LET complex_expr = x.pow(2).add(y.mul(3)).add(1)  -- x^2 + 3*y + 1

-- Mixed numeric and symbolic
LET mixed = x.mul(2.5).add(7)            -- 2.5*x + 7
```

### **Symbolic Differentiation**

#### Basic Differentiation
```rexx
-- Single variable differentiation
LET f = x.pow(3).add(x.mul(2))           -- f = x^3 + 2*x
LET df_dx = SY_DIFF expr=f sym=x         -- df/dx = 3*x^2 + 2

-- Multivariable expressions
LET g = x.mul(y).add(y.pow(2))           -- g = x*y + y^2
LET dg_dx = SY_DIFF expr=g sym=x         -- ∂g/∂x = y
LET dg_dy = SY_DIFF expr=g sym=y         -- ∂g/∂y = x + 2*y
```

#### Advanced Differentiation Rules
```rexx
-- Product rule: d/dx(u*v) = u'*v + u*v'
LET u = x.pow(2)                         -- u = x^2
LET v = x.add(1)                         -- v = x + 1
LET product = u.mul(v)                   -- u*v = x^2*(x + 1)
LET d_product = SY_DIFF expr=product sym=x  -- = 2*x*(x + 1) + x^2*1 = 3*x^2 + 2*x

-- Chain rule: d/dx(u^n) = n*u^(n-1)*u'
LET inner = x.add(3)                     -- inner = x + 3
LET chain_expr = inner.pow(4)            -- (x + 3)^4
LET d_chain = SY_DIFF expr=chain_expr sym=x  -- = 4*(x + 3)^3 * 1
```

### **Expression Manipulation**

#### String Representation
```rexx
-- Convert expressions to readable strings
LET expr = x.pow(2).add(y.mul(3)).add(1)
LET expr_str = expr.toString()           -- "((x**2) + ((3 * y) + 1))"

-- Individual components
SAY "Variable x: " || x.toString()       -- "x"
SAY "Number 5: " || SY_NUM(5).toString()  -- "5"
```

#### Expression Analysis
```rexx
-- Check expression types using internal classes
LET result = SY_DIFF expr=x.pow(2) sym=x  -- Returns Num(2)

-- Expression complexity
LET simple = x.add(1)                    -- Simple: x + 1
LET complex = x.pow(3).mul(y.pow(2)).add(x.mul(y)).add(5)  -- Complex polynomial
```

## 🧮 **Mathematical Examples**

### **Polynomial Differentiation**
```rexx
-- Quadratic function
LET a = SY_SYMBOL name="a"
LET b = SY_SYMBOL name="b"  
LET c = SY_SYMBOL name="c"
LET quadratic = a.mul(x.pow(2)).add(b.mul(x)).add(c)  -- ax^2 + bx + c

LET derivative = SY_DIFF expr=quadratic sym=x          -- 2*a*x + b
SAY "d/dx(ax² + bx + c) = " || derivative.toString()

-- Higher degree polynomial
LET poly = x.pow(4).add(x.pow(3).mul(3)).add(x.pow(2).mul(2)).add(x)
LET poly_deriv = SY_DIFF expr=poly sym=x               -- 4*x^3 + 9*x^2 + 4*x + 1
SAY "Polynomial derivative: " || poly_deriv.toString()
```

### **Multivariable Calculus**
```rexx
-- Function of two variables: f(x,y) = x^2*y + y^3
LET f = x.pow(2).mul(y).add(y.pow(3))

-- Partial derivatives
LET fx = SY_DIFF expr=f sym=x            -- ∂f/∂x = 2*x*y  
LET fy = SY_DIFF expr=f sym=y            -- ∂f/∂y = x^2 + 3*y^2

SAY "∂f/∂x = " || fx.toString()          -- "(2 * (x * y))"
SAY "∂f/∂y = " || fy.toString()          -- "((x**2) + (3 * (y**2)))"

-- Second partial derivatives
LET fxx = SY_DIFF expr=fx sym=x          -- ∂²f/∂x² = 2*y
LET fxy = SY_DIFF expr=fx sym=y          -- ∂²f/∂x∂y = 2*x
LET fyy = SY_DIFF expr=fy sym=y          -- ∂²f/∂y² = 6*y
```

### **Chain Rule Applications**
```rexx
-- Nested functions: g(f(x)) where f(x) = x + 1, g(u) = u^3
LET f_x = x.add(1)                       -- f(x) = x + 1
LET g_u = f_x.pow(3)                     -- g(f(x)) = (x + 1)^3

LET chain_deriv = SY_DIFF expr=g_u sym=x -- d/dx[(x + 1)^3] = 3*(x + 1)^2
SAY "Chain rule result: " || chain_deriv.toString()
```

### **Product Rule Verification**
```rexx
-- Verify product rule: d/dx(x^2 * sin(x)) ≈ d/dx(x^2 * x) for demonstration
LET f1 = x.pow(2)                        -- First function
LET f2 = x.pow(3)                        -- Second function (representing sin(x))
LET product = f1.mul(f2)                 -- x^2 * x^3 = x^5

LET manual_diff = x.pow(5)               -- x^5
LET manual_result = SY_DIFF expr=manual_diff sym=x  -- 5*x^4

LET product_result = SY_DIFF expr=product sym=x     -- Should also be 5*x^4
SAY "Manual differentiation: " || manual_result.toString()
SAY "Product rule result: " || product_result.toString()
```

## 🔬 **Advanced Symbolic Operations**

### **Building Complex Expressions**
```rexx
-- Physics equation: Kinetic energy KE = (1/2)*m*v^2
LET m = SY_SYMBOL name="m"               -- Mass
LET v = SY_SYMBOL name="v"               -- Velocity
LET half = SY_NUM value=0.5              -- 1/2

LET kinetic_energy = half.mul(m).mul(v.pow(2))
SAY "Kinetic Energy: " || kinetic_energy.toString()

-- Derivative with respect to velocity: dKE/dv = m*v
LET dKE_dv = SY_DIFF expr=kinetic_energy sym=v
SAY "dKE/dv = " || dKE_dv.toString()
```

### **Mathematical Analysis**
```rexx
-- Taylor series approximation setup
LET f = x.pow(3).add(x.pow(2).mul(2)).add(x)  -- f(x) = x^3 + 2x^2 + x

-- First few derivatives at x
LET f_prime = SY_DIFF expr=f sym=x       -- f'(x) = 3x^2 + 4x + 1
LET f_double_prime = SY_DIFF expr=f_prime sym=x  -- f''(x) = 6x + 4
LET f_triple_prime = SY_DIFF expr=f_double_prime sym=x  -- f'''(x) = 6

SAY "f(x) = " || f.toString()
SAY "f'(x) = " || f_prime.toString()
SAY "f''(x) = " || f_double_prime.toString()
SAY "f'''(x) = " || f_triple_prime.toString()
```

### **Optimization Analysis**
```rexx
-- Critical point analysis: f(x) = x^3 - 3x^2 + 2
LET optimization_f = x.pow(3).add(x.pow(2).mul(-3)).add(2)
LET first_deriv = SY_DIFF expr=optimization_f sym=x     -- 3x^2 - 6x
LET second_deriv = SY_DIFF expr=first_deriv sym=x       -- 6x - 6

SAY "Function: " || optimization_f.toString()
SAY "First derivative (set to 0 for critical points): " || first_deriv.toString()
SAY "Second derivative (for concavity): " || second_deriv.toString()
```

## 🔧 **Advanced Usage Patterns**

### **Expression Factories**
```rexx
-- Function to create polynomial expressions
FUNCTION createPolynomial(variable, coefficients) {
    LET result = SY_NUM value=0
    LET n = LENGTH(coefficients)
    
    DO i = 1 TO n
        LET coeff = coefficients[i]
        LET power = n - i
        LET term = SY_NUM(coeff).mul(variable.pow(power))
        result = result.add(term)
    END
    
    RETURN result
}

-- Create x^3 + 2x^2 + 3x + 4
LET x = SY_SYMBOL name="x"
LET poly = createPolynomial(x, "[1, 2, 3, 4]")
SAY "Generated polynomial: " || poly.toString()
```

### **Symbolic Computation Pipelines**
```rexx
-- Multi-step symbolic computation
LET x = SY_SYMBOL name="x"
LET y = SY_SYMBOL name="y"

-- Step 1: Define function
LET f = x.pow(2).mul(y).add(y.pow(2).mul(x))  -- f = x^2*y + y^2*x

-- Step 2: Compute partial derivatives
LET fx = SY_DIFF expr=f sym=x             -- ∂f/∂x
LET fy = SY_DIFF expr=f sym=y             -- ∂f/∂y

-- Step 3: Build gradient vector (conceptually)
SAY "Gradient components:"
SAY "  ∂f/∂x = " || fx.toString()
SAY "  ∂f/∂y = " || fy.toString()

-- Step 4: Compute second derivatives for Hessian
LET fxx = SY_DIFF expr=fx sym=x           -- ∂²f/∂x²
LET fxy = SY_DIFF expr=fx sym=y           -- ∂²f/∂x∂y  
LET fyx = SY_DIFF expr=fy sym=x           -- ∂²f/∂y∂x
LET fyy = SY_DIFF expr=fy sym=y           -- ∂²f/∂y²

SAY "Hessian matrix components:"
SAY "  fxx = " || fxx.toString()
SAY "  fxy = " || fxy.toString()
SAY "  fyy = " || fyy.toString()
```

### **Symbolic Expression Validation**
```rexx
-- Validate that expressions are being built correctly
FUNCTION validateExpression(expr, expected_string) {
    LET actual = expr.toString()
    IF (actual == expected_string) THEN DO
        SAY "✓ Expression valid: " || actual
        RETURN TRUE
    END
    ELSE DO
        SAY "✗ Expression mismatch:"
        SAY "  Expected: " || expected_string
        SAY "  Actual: " || actual
        RETURN FALSE
    END
}

-- Test suite
LET x = SY_SYMBOL name="x"
validateExpression(x.add(1), "(x + 1)")
validateExpression(x.mul(2), "(2 * x)")
validateExpression(x.pow(2), "(x**2)")
```

## ⚡ **Performance and Limitations**

### **Current Capabilities**
✅ **Fully Implemented**
- Basic symbolic variables and numbers
- Arithmetic operations (add, multiply, power)
- Symbolic differentiation with chain rule, product rule
- Expression string representation
- Polynomial differentiation

⚠️ **Current Limitations**
- Power differentiation limited to numeric exponents
- No symbolic integration
- No equation solving
- No expression simplification
- No trigonometric functions

### **Best Practices**
```rexx
-- Keep expressions reasonably sized for performance
LET simple = x.add(y).mul(2)             -- Good: simple expression
LET complex = x.pow(10).mul(y.pow(20))   -- Works but may be slow to differentiate

-- Use meaningful variable names
LET position = SY_SYMBOL name="x"        -- Better than single letters
LET velocity = SY_SYMBOL name="v"
LET time = SY_SYMBOL name="t"

-- Build expressions incrementally for clarity
LET base_expr = x.pow(2)
LET with_linear = base_expr.add(x.mul(3))
LET complete = with_linear.add(7)        -- x^2 + 3x + 7
```

## 🛠️ **Error Handling**

```rexx
-- Handle symbolic computation errors
SIGNAL ON ERROR

LET result = TRY({
    LET x = SY_SYMBOL name="x"
    LET bad_expr = x.pow("not_a_number")  -- Will fail
    SY_DIFF expr=bad_expr sym=x
}, ERROR = {
    SAY "Symbolic computation error: " || CONDITION('D')
    RETURN NULL
})

-- Validate inputs before processing
FUNCTION safeSymbolicDiff(expr, symbol_name) {
    IF (expr == NULL) THEN DO
        SAY "Error: Expression is null"
        RETURN NULL
    END
    
    LET sym = SY_SYMBOL name=symbol_name
    RETURN SY_DIFF expr=expr sym=sym
}

SIGNAL OFF ERROR
```

## 🚀 **Future Development**

The SymPy-inspired module is designed for extensibility. Planned features include:

❌ **Planned Features**
- Expression simplification and factorization
- Trigonometric and transcendental functions
- Symbolic integration
- Equation solving (solve for x)
- Matrix symbolic operations
- Series expansions and limits
- Substitution and evaluation
- LaTeX output formatting

### **Extension Architecture**
The current class-based design allows for easy addition of new symbolic types:

```rexx
-- Future trigonometric functions (conceptual)
-- LET sin_expr = SY_SIN x=x                -- sin(x)  
-- LET cos_expr = SY_COS x=x                -- cos(x)
-- LET d_sin = SY_DIFF expr=sin_expr sym=x  -- cos(x)

-- Future integration (conceptual)
-- LET integral = SY_INTEGRATE expr=x.pow(2) sym=x  -- x^3/3 + C
```

## 🎯 **Integration with Other Modules**

SymPy-inspired functions complement other RexxJS mathematical modules:

```rexx
-- Combined symbolic and numerical workflow
REQUIRE "sympy-inspired"
REQUIRE "numpy-inspired"

-- Define symbolic function
LET x = SY_SYMBOL name="x"
LET f = x.pow(3).add(x.mul(2))           -- f(x) = x^3 + 2x

-- Get symbolic derivative
LET f_prime = SY_DIFF expr=f sym=x       -- f'(x) = 3x^2 + 2

-- Evaluate numerically using NumPy-inspired functions
-- (Future integration - conceptual)
-- LET x_values = LINSPACE start=0 stop=5 num=10
-- LET y_values = EVALUATE expr=f_prime x_values=x_values
```

---

**💡 Need numerical computing?** Check out [numpy-inspired](../numpy-inspired/) for array operations and numerical analysis!  
**💡 Need statistical analysis?** Check out [scipy-inspired](../scipy-inspired/) and [r-inspired](../r-inspired/) for comprehensive statistical functions!