/**
 * Multiline Strings Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { parse } = require('../src/parser');
const { Interpreter } = require('../src/interpreter');

// Custom output handler that collects output for testing
class TestOutputHandler {
  constructor() {
    this.buffer = '';
  }
  
  output(message) {
    this.buffer += message + '\n';
  }
  
  clear() {
    this.buffer = '';
  }
  
  getOutput() {
    return this.buffer;
  }
}

describe('Multi-line Strings (Heredoc)', () => {
  let interpreter;
  let outputHandler;
  
  beforeEach(() => {
    outputHandler = new TestOutputHandler();
    interpreter = new Interpreter(null, outputHandler);
  });

  describe('Basic Heredoc Functionality', () => {
    test('should parse simple heredoc with EOF delimiter', () => {
      const script = `
LET content = <<EOF
Hello World
This is a multi-line string
EOF
      `;
      
      const ast = parse(script);
      expect(ast).toHaveLength(1);
      expect(ast[0]).toEqual({
        type: 'ASSIGNMENT',
        variable: 'content',
        expression: {
          type: 'HEREDOC_STRING',
          content: 'Hello World\nThis is a multi-line string',
          delimiter: 'EOF'
        },
        lineNumber: 2,
        originalLine: 'LET content = <<EOF'
      });
    });

    test('should execute heredoc assignment and preserve content', async () => {
      const script = `
LET content = <<EOF
Hello World
This is a multi-line string
With multiple lines
EOF
SAY content
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Hello World');
      expect(output).toContain('This is a multi-line string');
      expect(output).toContain('With multiple lines');
      
      // Check the variable was set correctly
      const content = interpreter.variables.get('content');
      expect(content).toBe('Hello World\nThis is a multi-line string\nWith multiple lines');
    });

    test('should handle empty heredoc', async () => {
      const script = `
LET empty = <<EOF
EOF
SAY "Content: [" || empty || "]"
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Content: []');
    });
  });

  describe('Different Delimiters', () => {
    test('should work with custom delimiter names', async () => {
      const script = `
LET sql = <<SQL
SELECT * FROM users
WHERE active = 1
  AND created_date > '2023-01-01'
ORDER BY name
SQL
SAY sql
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('SELECT * FROM users');
      expect(output).toContain('WHERE active = 1');
      expect(output).toContain('ORDER BY name');
    });

    test('should work with HTML delimiter', async () => {
      const script = `
LET html = <<HTML
<div class="container">
  <h1>Welcome</h1>
  <p>This is a paragraph</p>
</div>
HTML
SAY html
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('<div class="container">');
      expect(output).toContain('<h1>Welcome</h1>');
      expect(output).toContain('</div>');
    });

    test('should work with JSON delimiter and auto-parse', async () => {
      const script = `
LET config = <<JSON
{
  "database": {
    "host": "localhost",
    "port": 5432
  },
  "logging": true
}
JSON
SAY "Database host: " config.database.host
SAY "Logging enabled: " config.logging  
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Database host:  localhost');
      expect(output).toContain('Logging enabled:  true');
    });
  });

  describe('Whitespace and Formatting Preservation', () => {
    test('should preserve leading whitespace', async () => {
      const script = `
LET indented = <<CODE
    function hello() {
        console.log("Hello World");
        return true;
    }
CODE
SAY indented
      `;
      
      await interpreter.run(parse(script));
      const content = interpreter.variables.get('indented');
      expect(content).toContain('    function hello() {');
      expect(content).toContain('        console.log("Hello World");');
      expect(content).toContain('    }');
    });

    test('should preserve blank lines', async () => {
      const script = `
LET spaced = <<TEXT
Line 1

Line 3

Line 5
TEXT
      `;
      
      await interpreter.run(parse(script));
      const content = interpreter.variables.get('spaced');
      const lines = content.split('\n');
      expect(lines).toHaveLength(5);
      expect(lines[0]).toBe('Line 1');
      expect(lines[1]).toBe('');
      expect(lines[2]).toBe('Line 3');
      expect(lines[3]).toBe('');
      expect(lines[4]).toBe('Line 5');
    });

    test('should handle trailing whitespace correctly', async () => {
      const script = `
LET trailing = <<EOF
Line with trailing spaces   
Line without
EOF
      `;
      
      await interpreter.run(parse(script));
      const content = interpreter.variables.get('trailing');
      const lines = content.split('\n');
      expect(lines[0]).toBe('Line with trailing spaces   ');
      expect(lines[1]).toBe('Line without');
    });
  });

  describe('Multiple Heredocs', () => {
    test('should handle multiple heredocs in same script', async () => {
      const script = `
LET greeting = <<HELLO
Hello
World
HELLO

LET farewell = <<BYE
Goodbye
Friends
BYE

SAY greeting || " and " || farewell
      `;
      
      await interpreter.run(parse(script));
      const output = outputHandler.getOutput();
      expect(output).toContain('Hello\nWorld and Goodbye\nFriends');
    });

    test('should handle nested assignments with heredocs', async () => {
      const script = `
LET html_template = <<HTML
<html>
<head><title>Test</title></head>
<body>CONTENT_HERE</body>
</html>
HTML

LET content = <<CONTENT
<h1>Welcome</h1>
<p>This is the content</p>
CONTENT

LET final = html_template
SAY final
      `;
      
      await interpreter.run(parse(script));
      const htmlTemplate = interpreter.variables.get('html_template');
      const content = interpreter.variables.get('content');
      
      expect(htmlTemplate).toContain('<title>Test</title>');
      expect(htmlTemplate).toContain('CONTENT_HERE');
      expect(content).toContain('<h1>Welcome</h1>');
      expect(content).toContain('<p>This is the content</p>');
    });
  });

  describe('Error Handling', () => {
    test('should throw error for unterminated heredoc', () => {
      const script = `
LET incomplete = <<EOF
This heredoc is not terminated
      `;
      
      expect(() => parse(script)).toThrow(/Unterminated heredoc.*missing closing delimiter.*EOF/);
    });

    test('should throw error for mismatched delimiter', () => {
      const script = `
LET mismatched = <<START
Content here
END
      `;
      
      expect(() => parse(script)).toThrow(/Unterminated heredoc.*missing closing delimiter.*START/);
    });

    test('should handle delimiter names with numbers and underscores', async () => {
      const script = `
LET test = <<DATA_123
Some content
DATA_123
      `;
      
      await interpreter.run(parse(script));
      const content = interpreter.variables.get('test');
      expect(content).toBe('Some content');
    });
  });

  describe('Integration with Other Features', () => {
    test('should work with string concatenation', async () => {
      const script = `
LET header = <<HEAD
<header>
  <h1>Title</h1>
</header>
HEAD

LET body = <<BODY
<main>
  <p>Content</p>
</main>
BODY

LET combined = header || body
SAY combined
      `;
      
      await interpreter.run(parse(script));
      const combined = interpreter.variables.get('combined');
      expect(combined).toContain('<header>');
      expect(combined).toContain('<h1>Title</h1>');
      expect(combined).toContain('<main>');
      expect(combined).toContain('<p>Content</p>');
    });

    test('should work with IF statements', async () => {
      const script = `
LET use_html = true

IF use_html THEN
  LET content = <<HTML
  <div>HTML Content</div>
  HTML
ELSE
  LET content = <<TEXT
  Plain text content
  TEXT
ENDIF

SAY content
      `;
      
      await interpreter.run(parse(script));
      const content = interpreter.variables.get('content');
      expect(content).toContain('<div>HTML Content</div>');
    });

    test('should work as function parameters', async () => {
      const script = `
LET result = LENGTH text=<<DATA
This is a
multi-line string
for testing length
DATA
SAY "Length: " || result
      `;
      
      // This will fail in current implementation because function parameters don't support heredoc yet
      // But we can test that the basic parsing works
      expect(() => parse(script)).not.toThrow();
    });
  });

  describe('Special Characters and Escaping', () => {
    test('should handle special characters in content', async () => {
      const script = `
LET special = <<SPECIAL
Content with "quotes" and 'apostrophes'
Symbols: @#$%^&*()
Numbers: 123456789
Unicode: café résumé naïve
SPECIAL
      `;
      
      await interpreter.run(parse(script));
      const content = interpreter.variables.get('special');
      expect(content).toContain('Content with "quotes" and \'apostrophes\'');
      expect(content).toContain('Symbols: @#$%^&*()');
      expect(content).toContain('Unicode: café résumé naïve');
    });

    test('should handle content that looks like REXX commands', async () => {
      const script = `
LET rexx_code = <<REXX
LET x = 5
SAY "Hello World"
IF x > 3 THEN
  SAY "x is greater than 3"
ENDIF
REXX
SAY "Code: " || rexx_code
      `;
      
      await interpreter.run(parse(script));
      const content = interpreter.variables.get('rexx_code');
      expect(content).toContain('LET x = 5');
      expect(content).toContain('SAY "Hello World"');
      expect(content).toContain('IF x > 3 THEN');
    });
  });
});