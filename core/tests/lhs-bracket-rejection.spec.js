const { parse } = require('../src/parser');

describe('LHS Bracket Syntax Rejection', () => {
  it('should reject LHS bracket assignment with helpful error message', () => {
    const script = 'LET arr[1] = "value"';
    expect(() => parse(script)).toThrow(
      "LHS array assignment syntax 'arr[1] = ...' is not supported. Use ARRAY_SET(arr, 1, value) for REXX 1-based indexing instead."
    );
  });

  it('should reject complex LHS bracket assignment', () => {
    const script = 'LET foo.bar[index] = 123';
    expect(() => parse(script)).toThrow(
      "LHS array assignment syntax 'foo.bar[index] = ...' is not supported. Use ARRAY_SET(foo.bar, index, value) for REXX 1-based indexing instead."
    );
  });

  it('should reject LHS bracket with string index', () => {
    const script = 'LET data["key"] = "value"';
    expect(() => parse(script)).toThrow(
      "LHS array assignment syntax 'data[\"key\"] = ...' is not supported. Use ARRAY_SET(data, \"key\", value) for REXX 1-based indexing instead."
    );
  });

  it('should allow normal variable assignments without brackets', () => {
    const script = 'LET normalVar = "value"';
    expect(() => parse(script)).not.toThrow();
  });

  it('should allow ARRAY_SET function calls', () => {
    const script = 'LET result = ARRAY_SET(arr, 1, "value")';
    expect(() => parse(script)).not.toThrow();
  });
});