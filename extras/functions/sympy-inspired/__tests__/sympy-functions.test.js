const { sympyFunctions } = require('../src/sympy-functions');

const { SY_SYMBOL, SY_NUM, SY_DIFF } = sympyFunctions;
const { Expr, Symbol, Num, Add, Mul, Pow } = sympyFunctions.__internal__;

describe('sympy-inspired functions', () => {
  describe('Object Creation and toString()', () => {
    it('should create a Symbol', () => {
      const x = SY_SYMBOL('x');
      expect(x).toBeInstanceOf(Symbol);
      expect(x.toString()).toBe('x');
    });

    it('should create a Num', () => {
      const n = SY_NUM(5);
      expect(n).toBeInstanceOf(Num);
      expect(n.toString()).toBe('5');
    });

    it('should create complex expressions and represent them as strings', () => {
      const x = SY_SYMBOL('x');
      const y = SY_SYMBOL('y');

      const expr1 = x.add(y); // x + y
      expect(expr1).toBeInstanceOf(Add);
      expect(expr1.toString()).toBe('(x + y)');

      const expr2 = x.mul(5); // x * 5
      expect(expr2).toBeInstanceOf(Mul);
      expect(expr2.toString()).toBe('(x * 5)');

      const expr3 = y.pow(x); // y**x
      expect(expr3).toBeInstanceOf(Pow);
      expect(expr3.toString()).toBe('(y**x)');

      const expr4 = x.add(y.mul(2)).pow(3); // (x + (y * 2))**3
      expect(expr4.toString()).toBe('((x + (y * 2))**3)');
    });
  });

  describe('Differentiation (SY_DIFF)', () => {
    const x = SY_SYMBOL('x');
    const y = SY_SYMBOL('y');

    it('should differentiate a constant to 0', () => {
      const expr = SY_NUM(5);
      const result = SY_DIFF(expr, x);
      expect(result.toString()).toBe('0');
    });

    it('should differentiate x with respect to x to 1', () => {
      const result = SY_DIFF(x, x);
      expect(result.toString()).toBe('1');
    });

    it('should differentiate y with respect to x to 0', () => {
      const result = SY_DIFF(y, x);
      expect(result.toString()).toBe('0');
    });

    it('should differentiate a sum', () => {
      // d/dx (x + 5) = 1 + 0 = 1
      const expr = x.add(5);
      const result = SY_DIFF(expr, x);
      expect(result.toString()).toBe('(1 + 0)'); // Note: simplification is not implemented yet
    });

    it('should differentiate using the product rule', () => {
      // d/dx (x * 5) = (1 * 5) + (x * 0) = 5
      const expr = x.mul(5);
      const result = SY_DIFF(expr, x);
      expect(result.toString()).toBe('((1 * 5) + (x * 0))');
    });

    it('should differentiate a more complex product', () => {
        // d/dx (x * y) = (1 * y) + (x * 0) = y
        const expr = x.mul(y);
        const result = SY_DIFF(expr, x);
        expect(result.toString()).toBe('((1 * y) + (x * 0))');
    });

    it('should differentiate using the power rule', () => {
      // d/dx (x**2) = 2 * x**1 * 1 = 2x
      const expr = x.pow(2);
      const result = SY_DIFF(expr, x);
      expect(result.toString()).toBe('((2 * (x**1)) * 1)');
    });

    it('should differentiate a more complex expression', () => {
      // d/dx (3*x**2 + 2*x + 1)
      const term1 = SY_NUM(3).mul(x.pow(2));
      const term2 = SY_NUM(2).mul(x);
      const term3 = SY_NUM(1);
      const expr = term1.add(term2).add(term3);
      const result = SY_DIFF(expr, x);
      // The unsimplified result is quite complex:
      // diff( ( (3*(x**2)) + (2*x) ) + 1 )
      // diff( (3*(x**2)) + (2*x) ) + diff(1)
      // ( diff(3*(x**2)) + diff(2*x) ) + 0
      // diff(3*(x**2)) -> (diff(3)*x**2 + 3*diff(x**2)) -> ((0*x**2) + 3*(2*x**1*1))
      // diff(2*x) -> (diff(2)*x + 2*diff(x)) -> ((0*x) + 2*1)
      // So the result is ( ( (0*(x**2)) + (3*((2*(x**1))*1)) ) + ( (0*x) + (2*1) ) ) + 0
      const expectedString = '((((0 * (x**2)) + (3 * ((2 * (x**1)) * 1))) + ((0 * x) + (2 * 1))) + 0)';
      expect(result.toString()).toBe(expectedString);
    });

    it('should throw an error for symbolic exponents in diff', () => {
        const expr = x.pow(y);
        expect(() => SY_DIFF(expr, x)).toThrow('Differentiation of symbolic exponents is not supported yet.');
    });
  });
});
