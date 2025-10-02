/* Declarative Block Parser
 *
 * Parses pseudo-declarative DSL syntax inspired by Ruby/Groovy blocks.
 * Converts nested block syntax into structured JSON that can be transformed
 * to YAML/JSON for GCP command-line tools.
 *
 * Respects RexxJS global interpolation configuration from interpolation-config.js
 *
 * Example Input:
 *   backend_service "web-backend" {
 *     protocol HTTP
 *     health_check {
 *       port 80
 *     }
 *   }
 *
 * Example Output:
 *   {
 *     backend_service: {
 *       name: "web-backend",
 *       protocol: "HTTP",
 *       health_check: {
 *         port: 80
 *       }
 *     }
 *   }
 */

// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}

class DeclarativeParser {
  constructor(variableStore = null) {
    this.pos = 0;
    this.input = '';
    this.length = 0;
    this.variableStore = variableStore || {}; // Store for variable values
  }

  /**
   * Parse a declarative block into structured object
   */
  parse(input) {
    // Apply variable interpolation using RexxJS global config
    this.input = this.interpolateVariables(input).trim();
    this.length = this.input.length;
    this.pos = 0;

    const result = {};

    while (this.pos < this.length) {
      this.skipWhitespace();
      if (this.pos >= this.length) break;

      const statement = this.parseStatement();
      if (statement) {
        // Merge statement into result
        Object.assign(result, statement);
      }
    }

    return result;
  }

  /**
   * Interpolate variables using RexxJS global interpolation pattern
   */
  interpolateVariables(str) {
    if (!interpolationConfig) {
      // No interpolation config available - return as-is
      return str;
    }

    const pattern = interpolationConfig.getCurrentPattern();

    // Check if string has any delimiters to interpolate
    if (!pattern.hasDelims(str)) {
      return str;
    }

    // Replace all occurrences using the pattern's regex
    return str.replace(pattern.regex, (match) => {
      const varName = pattern.extractVar(match);

      // Look up variable in store
      if (this.variableStore && varName in this.variableStore) {
        return this.variableStore[varName];
      }

      // Variable not found - return the match as-is (could also error here)
      return match;
    });
  }

  /**
   * Parse a single statement (key-value or block)
   */
  parseStatement() {
    this.skipWhitespace();

    // Check for closing brace (end of block)
    if (this.peek() === '}') {
      return null;
    }

    // Parse identifier (e.g., "backend_service", "protocol")
    const identifier = this.parseIdentifier();
    if (!identifier) return null;

    this.skipWhitespace();

    // Check if there's a string value (e.g., backend_service "name")
    let name = null;
    if (this.peek() === '"' || this.peek() === "'") {
      name = this.parseString();
      this.skipWhitespace();
    }

    // Check for block start
    if (this.peek() === '{') {
      this.consume(); // consume '{'
      const blockContent = this.parseBlock();

      if (name) {
        // e.g., backend_service "web-backend" { ... }
        return {
          [identifier]: {
            name: name,
            ...blockContent
          }
        };
      } else {
        // e.g., health_check { ... }
        return {
          [identifier]: blockContent
        };
      }
    } else {
      // Simple key-value (e.g., protocol HTTP)
      this.skipWhitespace();
      const value = this.parseValue();
      return { [identifier]: value };
    }
  }

  /**
   * Parse a block (everything inside { })
   */
  parseBlock() {
    const result = {};

    while (this.pos < this.length) {
      this.skipWhitespace();

      if (this.peek() === '}') {
        this.consume(); // consume '}'
        break;
      }

      const statement = this.parseStatement();
      if (statement) {
        // Handle arrays (multiple entries with same key)
        const key = Object.keys(statement)[0];
        if (result[key] !== undefined) {
          // Convert to array or append to existing array
          if (!Array.isArray(result[key])) {
            result[key] = [result[key]];
          }
          result[key].push(statement[key]);
        } else {
          Object.assign(result, statement);
        }
      }
    }

    return result;
  }

  /**
   * Parse an identifier (alphanumeric + underscore)
   */
  parseIdentifier() {
    this.skipWhitespace();
    let identifier = '';

    while (this.pos < this.length) {
      const ch = this.peek();
      if (/[a-zA-Z0-9_]/.test(ch)) {
        identifier += ch;
        this.consume();
      } else {
        break;
      }
    }

    return identifier;
  }

  /**
   * Parse a quoted string
   */
  parseString() {
    const quote = this.consume(); // ' or "
    let str = '';

    while (this.pos < this.length) {
      const ch = this.peek();

      if (ch === quote) {
        this.consume(); // consume closing quote
        break;
      } else if (ch === '\\') {
        this.consume();
        str += this.consume(); // escaped character
      } else {
        str += this.consume();
      }
    }

    return str;
  }

  /**
   * Parse an array literal [item1, item2, ...]
   */
  parseArray() {
    this.consume(); // consume '['
    const items = [];

    while (this.pos < this.length) {
      this.skipWhitespace();

      if (this.peek() === ']') {
        this.consume(); // consume ']'
        break;
      }

      // Parse array item
      if (this.peek() === '"' || this.peek() === "'") {
        items.push(this.parseString());
      } else {
        items.push(this.parseSimpleValue());
      }

      this.skipWhitespace();

      // Check for comma
      if (this.peek() === ',') {
        this.consume();
      }
    }

    return items;
  }

  /**
   * Parse a value (string, number, boolean, or array)
   */
  parseValue() {
    this.skipWhitespace();

    if (this.peek() === '"' || this.peek() === "'") {
      return this.parseString();
    } else if (this.peek() === '[') {
      return this.parseArray();
    } else {
      return this.parseSimpleValue();
    }
  }

  /**
   * Parse a simple unquoted value (number, boolean, identifier)
   */
  parseSimpleValue() {
    let value = '';

    while (this.pos < this.length) {
      const ch = this.peek();

      if (/[\s\n,\]\}]/.test(ch)) {
        break;
      }

      value += this.consume();
    }

    value = value.trim();

    // Try to convert to number
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // Convert booleans
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Return as string
    return value;
  }

  /**
   * Skip whitespace and comments
   */
  skipWhitespace() {
    while (this.pos < this.length) {
      const ch = this.peek();

      if (/\s/.test(ch)) {
        this.consume();
      } else if (ch === '#' || (ch === '/' && this.peekNext() === '/')) {
        // Skip comment until end of line
        while (this.pos < this.length && this.peek() !== '\n') {
          this.consume();
        }
      } else {
        break;
      }
    }
  }

  /**
   * Peek at current character
   */
  peek() {
    return this.input[this.pos];
  }

  /**
   * Peek at next character
   */
  peekNext() {
    return this.input[this.pos + 1];
  }

  /**
   * Consume and return current character
   */
  consume() {
    return this.input[this.pos++];
  }
}

/**
 * Convert parsed structure to GCP YAML format
 */
function toGcpYaml(parsed, indent = 0) {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  for (const [key, value] of Object.entries(parsed)) {
    if (value === null || value === undefined) {
      continue;
    }

    const yamlKey = key.replace(/_/g, '-'); // Convert snake_case to kebab-case

    if (Array.isArray(value)) {
      yaml += `${spaces}${yamlKey}:\n`;
      for (const item of value) {
        if (typeof item === 'object') {
          yaml += `${spaces}- \n${toGcpYaml(item, indent + 1)}`;
        } else {
          yaml += `${spaces}- ${item}\n`;
        }
      }
    } else if (typeof value === 'object') {
      yaml += `${spaces}${yamlKey}:\n`;
      yaml += toGcpYaml(value, indent + 1);
    } else {
      yaml += `${spaces}${yamlKey}: ${value}\n`;
    }
  }

  return yaml;
}

module.exports = {
  DeclarativeParser,
  toGcpYaml,

  /**
   * Convenience function to parse and convert to YAML in one step
   */
  parseToYaml(input) {
    const parser = new DeclarativeParser();
    const parsed = parser.parse(input);
    return toGcpYaml(parsed);
  }
};
