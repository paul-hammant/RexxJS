/**
 * SymPy-inspired Symbolic Math Functions
 * for RexxJS.
 */

// Base class for all symbolic expressions
class Expr {
  constructor() {
    if (this.constructor === Expr) {
      throw new Error("Abstract class Expr cannot be instantiated directly.");
    }
  }

  // These methods allow for building expressions like: x.add(y).mul(2)
  add(other) {
    return new Add(this, _to_expr(other));
  }

  mul(other) {
    return new Mul(this, _to_expr(other));
  }

  pow(other) {
    return new Pow(this, _to_expr(other));
  }

  // A generic differentiation method
  diff(s) {
    throw new Error(`diff() not implemented for ${this.constructor.name}`);
  }
}

// Represents a symbolic variable
class Symbol extends Expr {
  constructor(name) {
    super();
    this.name = name;
  }

  toString() {
    return this.name;
  }

  diff(s) {
    return this.name === s.name ? new Num(1) : new Num(0);
  }
}

// Represents a numeric literal
class Num extends Expr {
  constructor(value) {
    super();
    if (typeof value !== 'number') {
      throw new Error("Num value must be a number.");
    }
    this.value = value;
  }

  toString() {
    return this.value.toString();
  }

  diff(s) {
    return new Num(0);
  }
}

// Helper to convert numbers to Num objects
const _to_expr = (val) => {
  if (val instanceof Expr) {
    return val;
  } else if (typeof val === 'number') {
    return new Num(val);
  } else {
    throw new Error(`Cannot convert ${val} to an expression.`);
  }
}

// Represents addition
class Add extends Expr {
  constructor(a, b) {
    super();
    this.a = _to_expr(a);
    this.b = _to_expr(b);
  }

  toString() {
    return `(${this.a.toString()} + ${this.b.toString()})`;
  }

  diff(s) {
    return this.a.diff(s).add(this.b.diff(s));
  }
}

// Represents multiplication
class Mul extends Expr {
  constructor(a, b) {
    super();
    this.a = _to_expr(a);
    this.b = _to_expr(b);
  }

  toString() {
    return `(${this.a.toString()} * ${this.b.toString()})`;
  }

  diff(s) {
    const f = this.a;
    const g = this.b;
    const df = f.diff(s);
    const dg = g.diff(s);
    return df.mul(g).add(f.mul(dg));
  }
}

// Represents a power
class Pow extends Expr {
  constructor(base, exp) {
    super();
    this.base = _to_expr(base);
    this.exp = _to_expr(exp);
  }

  toString() {
    return `(${this.base.toString()}**${this.exp.toString()})`;
  }

  diff(s) {
    const base = this.base;
    const exp = this.exp;

    if (exp instanceof Num) {
      const n = exp.value;
      const u = base;
      const du_dx = u.diff(s);
      // n * u**(n-1) * du_dx
      return _to_expr(n).mul(u.pow(n - 1)).mul(du_dx);
    } else {
      throw new Error("Differentiation of symbolic exponents is not supported yet.");
    }
  }
}

const sympyFunctions = {
  // Factory function for creating symbols
  'SY_SYMBOL': (name) => {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error("Symbol name must be a non-empty string.");
    }
    return new Symbol(name);
  },

  // Factory function for creating numbers, useful for explicit construction
  'SY_NUM': (value) => {
    if (typeof value !== 'number') {
      throw new Error("Numeric value must be a number.");
    }
    return new Num(value);
  },

  'SY_DIFF': (expr, sym) => {
    if (!(expr instanceof Expr)) {
      expr = _to_expr(expr);
    }
    if (!(sym instanceof Symbol)) {
      throw new Error("The variable to differentiate with respect to must be a symbol.");
    }
    return expr.diff(sym);
  },

  // Expose classes for type checking if needed later
  __internal__: {
    Expr,
    Symbol,
    Num,
    Add,
    Mul,
    Pow,
    _to_expr
  }
};

// Detection function for REQUIRE system
sympyFunctions.SYMPY_FUNCTIONS_MAIN = () => ({
    type: 'library_info',
    name: 'SymPy Functions',
    version: '1.0.0',
    loaded: true
});

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    sympyFunctions: {
      ...sympyFunctions,
      __internal__: { Expr, Symbol, Num, Add, Mul, Pow }
    },
    ...sympyFunctions,
    SYMPY_FUNCTIONS_MAIN: sympyFunctions.SYMPY_FUNCTIONS_MAIN
  };
} else if (typeof window !== 'undefined') {
  Object.assign(window, sympyFunctions);
  window.SYMPY_FUNCTIONS_MAIN = sympyFunctions.SYMPY_FUNCTIONS_MAIN;
}
