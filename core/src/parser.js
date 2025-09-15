/* eslint-env browser */
'use strict';

/**
 * @fileoverview Browser-compatible Rexx parser - no Node.js dependencies
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

// Import function parsing strategies
function callIsFunctionCallExpression(expression) {
  if (typeof require !== 'undefined' && typeof module !== 'undefined') {
    // Node.js environment
    const strategies = require('./function-parsing-strategies');
    return strategies.isFunctionCallExpression(expression);
  } else if (typeof window !== 'undefined' && window.FunctionParsingStrategies) {
    // Browser environment
    return window.FunctionParsingStrategies.isFunctionCallExpression(expression);
  } else {
    // Fallback if function-parsing-strategies not available
    return false;
  }
}

function parse(scriptText) {
  const lines = scriptText.replace(/\r\n/g, '\n').split('\n');
  const tokens = tokenize(lines);
  return parseTokens(tokens);
}

function tokenize(lines) {
  const tokens = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (!line || line.startsWith('--') || line.startsWith('//')) {
      continue;
    }
    
    // Handle block comments /* ... */ (single line initially)
    if (line.includes('/*')) {
      // Remove /* ... */ comments from the line
      line = line.replace(/\/\*.*?\*\//g, '');
      // If line becomes empty after removing comments, skip it
      if (!line.trim()) {
        continue;
      }
      line = line.trim();
    }
    
    // Skip lines that start with /* (standalone block comment lines)
    if (line.startsWith('/*')) {
      continue;
    }
    
    // Check for heredoc start pattern (<<DELIMITER)
    const heredocMatch = line.match(/<<([A-Za-z_][A-Za-z0-9_]*)/);
    if (heredocMatch) {
      const delimiter = heredocMatch[1];
      const beforeHeredoc = line.substring(0, heredocMatch.index).trim();
      const afterHeredoc = line.substring(heredocMatch.index + heredocMatch[0].length).trim();
      
      // Always create a LINE token for the heredoc start, even if there's nothing before it
      if (beforeHeredoc) {
        // Split the line at the heredoc position and process the first part
        const lineBeforeHeredoc = beforeHeredoc + ' <<' + delimiter;
        tokens.push({
          type: 'LINE',
          content: lineBeforeHeredoc,
          lineNumber: i + 1,
          hasHeredoc: true
        });
      } else {
        // Just the HEREDOC start pattern on its own line
        tokens.push({
          type: 'LINE',
          content: '<<' + delimiter,
          lineNumber: i + 1,
          hasHeredoc: true
        });
      }
      
      // Collect heredoc content
      const heredocContent = [];
      let j = i + 1;
      let foundEnd = false;
      
      while (j < lines.length) {
        const heredocLine = lines[j];
        const trimmedHeredocLine = heredocLine.trim();
        
        if (trimmedHeredocLine === delimiter) {
          foundEnd = true;
          break;
        }
        
        heredocContent.push(heredocLine); // Preserve original formatting
        j++;
      }
      
      if (!foundEnd) {
        throw new Error(`Unterminated heredoc: missing closing delimiter '${delimiter}' starting at line ${i + 1}`);
      }
      
      // Create heredoc token
      tokens.push({
        type: 'HEREDOC',
        content: heredocContent.join('\n'),
        delimiter: delimiter,
        lineNumber: i + 1
      });
      
      // Process any content after the heredoc on the same line
      if (afterHeredoc) {
        tokens.push({
          type: 'LINE',
          content: afterHeredoc,
          lineNumber: i + 1
        });
      }
      
      i = j; // Skip to after the heredoc end delimiter
    } else {
      tokens.push({
        type: 'LINE',
        content: line,
        lineNumber: i + 1
      });
    }
  }
  
  return tokens;
}

function parseTokens(tokens) {
  const commands = [];
  let index = 0;
  
  while (index < tokens.length) {
    const result = parseStatement(tokens, index);
    if (result.command) {
      commands.push(result.command);
    }
    index = result.nextIndex;
  }
  
  return commands;
}

// Helper function to add line number and original line to command
function addLineNumber(command, token) {
  if (command && token) {
    if (token.lineNumber) {
      command.lineNumber = token.lineNumber;
    }
    if (token.content) {
      command.originalLine = token.content;
    }
  }
  return command;
}

function parseStatement(tokens, startIndex) {
  const token = tokens[startIndex];
  const line = token.content;
  
  // Label definition (LABELNAME:) - allow optional spaces before colon
  const labelMatch = line.match(/^([A-Z_][A-Z0-9_]*)\s*:(.*)$/i);
  if (labelMatch) {
    const labelName = labelMatch[1].toUpperCase();
    const remainingContent = labelMatch[2].trim();
    
    // If there's code after the label on the same line, parse it
    if (remainingContent) {
      const remainingTokens = [{
        type: 'LINE',
        content: remainingContent,
        lineNumber: token.lineNumber
      }];
      const result = parseStatement(remainingTokens, 0);
      return {
        command: {
          type: 'LABEL',
          name: labelName,
          statement: result.command,
          lineNumber: token.lineNumber
        },
        nextIndex: startIndex + 1
      };
    } else {
      return {
        command: {
          type: 'LABEL',
          name: labelName,
          lineNumber: token.lineNumber
        },
        nextIndex: startIndex + 1
      };
    }
  }
  
  // ADDRESS command with MATCHING parameter
  const addressMatchingMatch = line.match(/^ADDRESS\s+(\w+)\s+MATCHING\((["`'])(.*?)\2\)$/i);
  if (addressMatchingMatch) {
    return {
      command: addLineNumber({ 
        type: 'ADDRESS_WITH_MATCHING', 
        target: addressMatchingMatch[1],
        matchingPattern: addressMatchingMatch[3]
      }, token),
      nextIndex: startIndex + 1
    };
  }
  
  // ADDRESS command with LINES parameter
  const addressLinesMatch = line.match(/^ADDRESS\s+(\w+)\s+LINES\((\d+)\)$/i);
  if (addressLinesMatch) {
    return {
      command: addLineNumber({ 
        type: 'ADDRESS_WITH_LINES', 
        target: addressLinesMatch[1],
        lineCount: parseInt(addressLinesMatch[2], 10)
      }, token),
      nextIndex: startIndex + 1
    };
  }

  // ADDRESS command with quoted string (combined form)
  const addressWithStringMatch = line.match(/^ADDRESS\s+(\w+)\s+(["`'])(.*?)\2$/i);
  if (addressWithStringMatch) {
    return {
      command: addLineNumber({ 
        type: 'ADDRESS_WITH_STRING', 
        target: addressWithStringMatch[1],
        commandString: addressWithStringMatch[3]
      }, token),
      nextIndex: startIndex + 1
    };
  }
  
  // ADDRESS command without target (reset to default)
  const addressResetMatch = line.match(/^ADDRESS\s*$/i);
  if (addressResetMatch) {
    return {
      command: addLineNumber({ type: 'ADDRESS', target: 'default' }, token),
      nextIndex: startIndex + 1
    };
  }
  
  // ADDRESS command (target only)
  const addressMatch = line.match(/^ADDRESS\s+(\w+)/i);
  if (addressMatch) {
    return {
      command: addLineNumber({ type: 'ADDRESS', target: addressMatch[1] }, token),
      nextIndex: startIndex + 1
    };
  }
  
  // NUMERIC statement
  const numericMatch = line.match(/^NUMERIC\s+(DIGITS|FUZZ|FORM)\s+(.*)/i);
  if (numericMatch) {
    return {
      command: { 
        type: 'NUMERIC', 
        setting: numericMatch[1].toUpperCase(),
        value: numericMatch[2].trim()
      },
      nextIndex: startIndex + 1
    };
  }
  
  // ARG statement (standalone)
  const argMatch = line.match(/^ARG\s+(.*)/i);
  if (argMatch) {
    return {
      command: {
        type: 'PARSE',
        source: 'ARG',
        input: '', // No input needed for ARG
        template: argMatch[1].trim()
      },
      nextIndex: startIndex + 1
    };
  }

  // PARSE statement - handle both "PARSE ARG template" and "PARSE SOURCE input WITH template"
  const parseWithMatch = line.match(/^PARSE\s+(ARG|VAR|VALUE)\s+(.*?)\s+WITH\s+(.*)/i);
  if (parseWithMatch) {
    return {
      command: {
        type: 'PARSE',
        source: parseWithMatch[1].toUpperCase(),
        input: parseWithMatch[2].trim(),
        template: parseWithMatch[3].trim()
      },
      nextIndex: startIndex + 1
    };
  }
  
  // PARSE ARG template (simplified form for arguments)
  const parseArgMatch = line.match(/^PARSE\s+ARG\s+(.*)/i);
  if (parseArgMatch) {
    return {
      command: {
        type: 'PARSE',
        source: 'ARG',
        input: '', // Not needed for ARG parsing
        template: parseArgMatch[1].trim()
      },
      nextIndex: startIndex + 1
    };
  }
  
  // PUSH statement
  const pushMatch = line.match(/^PUSH\s+(.*)/i);
  if (pushMatch) {
    return {
      command: {
        type: 'PUSH',
        value: pushMatch[1].trim()
      },
      nextIndex: startIndex + 1
    };
  }
  
  // PULL statement
  const pullMatch = line.match(/^PULL\s+(\w+)/i);
  if (pullMatch) {
    return {
      command: {
        type: 'PULL',
        variable: pullMatch[1]
      },
      nextIndex: startIndex + 1
    };
  }
  
  // QUEUE statement
  const queueMatch = line.match(/^QUEUE\s+(.*)/i);
  if (queueMatch) {
    return {
      command: {
        type: 'QUEUE',
        value: queueMatch[1].trim()
      },
      nextIndex: startIndex + 1
    };
  }
  
  // CALL statement - support both CALL name and CALL (variable) syntax
  const callMatch = line.match(/^CALL\s+(?:\(([^)]+)\)|(\w+))(?:\s+(.*))?/i);
  if (callMatch) {
    const variableName = callMatch[1]; // from (variable) syntax
    const directName = callMatch[2];   // from traditional syntax
    const argsString = callMatch[3] || '';
    
    // Determine if this is a variable reference or direct name
    const isVariableCall = variableName !== undefined;
    const subroutineName = isVariableCall ? variableName : directName.toUpperCase();
    
    // Parse arguments - use comma separation if commas present, otherwise space separation
    const args = [];
    if (argsString.trim()) {
      let current = '';
      let inQuotes = false;
      let quoteChar = '';
      
      // Check if commas are present outside of quotes and parentheses to determine separator
      let hasCommas = false;
      let tempInQuotes = false;
      let tempQuoteChar = '';
      let tempParenLevel = 0;
      for (let j = 0; j < argsString.length; j++) {
        const tempChar = argsString[j];
        if ((tempChar === '"' || tempChar === "'") && !tempInQuotes) {
          tempInQuotes = true;
          tempQuoteChar = tempChar;
        } else if (tempChar === tempQuoteChar && tempInQuotes) {
          tempInQuotes = false;
          tempQuoteChar = '';
        } else if (tempChar === '(' && !tempInQuotes) {
          tempParenLevel++;
        } else if (tempChar === ')' && !tempInQuotes) {
          tempParenLevel--;
        } else if (tempChar === ',' && !tempInQuotes && tempParenLevel === 0) {
          hasCommas = true;
          break;
        }
      }
      
      const separator = hasCommas ? ',' : ' ';
      
      let parenLevel = 0;
      
      for (let i = 0; i < argsString.length; i++) {
        const char = argsString[i];
        
        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
          current += char;
        } else if (char === quoteChar && inQuotes) {
          inQuotes = false;
          current += char;
          quoteChar = '';
        } else if (char === '(' && !inQuotes) {
          parenLevel++;
          current += char;
        } else if (char === ')' && !inQuotes) {
          parenLevel--;
          current += char;
        } else if (char === separator && !inQuotes && parenLevel === 0) {
          if (current.trim()) {
            args.push(current.trim());
            current = '';
          }
        } else {
          current += char;
        }
      }
      
      if (current.trim()) {
        args.push(current.trim());
      }
    }
    
    return {
      command: {
        type: 'CALL',
        subroutine: subroutineName,
        isVariableCall: isVariableCall,
        arguments: args
      },
      nextIndex: startIndex + 1
    };
  }
  
  // RETURN statement
  const returnMatch = line.match(/^RETURN(?:\s+(.*))?/i);
  if (returnMatch) {
    let returnValue = '';
    if (returnMatch[1]) {
      const expression = returnMatch[1].trim();
      // Handle concatenation expressions specially
      if (expression.includes('||')) {
        returnValue = {
          type: 'CONCATENATION',
          value: expression
        };
      } else {
        returnValue = parseExpression(expression) || expression;
      }
    }
    return {
      command: {
        type: 'RETURN',
        value: returnValue
      },
      nextIndex: startIndex + 1
    };
  }
  
  // TRACE statement
  const traceMatch = line.match(/^TRACE\s+([ARIO]|OFF|NORMAL)$/i);
  if (traceMatch) {
    return {
      command: {
        type: 'TRACE',
        mode: traceMatch[1].toUpperCase()
      },
      nextIndex: startIndex + 1
    };
  }
  
  // RETRY_ON_STALE block
  const retryMatch = line.match(/^RETRY_ON_STALE\s+timeout=(\d+)(?:\s+PRESERVE\s+([\w,]+))?$/i);
  if (retryMatch) {
    // Find the END_RETRY marker
    let endIndex = startIndex + 1;
    let nestLevel = 1;
    
    while (endIndex < tokens.length && nestLevel > 0) {
      const endLine = tokens[endIndex].content;
      if (endLine.match(/^RETRY_ON_STALE\s+/i)) {
        nestLevel++;
      } else if (endLine.match(/^END_RETRY$/i)) {
        nestLevel--;
      }
      if (nestLevel > 0) {
        endIndex++;
      }
    }
    
    if (nestLevel > 0) {
      throw new Error(`Missing END_RETRY for RETRY_ON_STALE at line ${token.lineNumber}`);
    }
    
    // Parse the block body
    const bodyTokens = tokens.slice(startIndex + 1, endIndex);
    const bodyCommands = [];
    let bodyIndex = 0;
    
    while (bodyIndex < bodyTokens.length) {
      const result = parseStatement(bodyTokens, bodyIndex);
      if (result.command) {
        bodyCommands.push(result.command);
      }
      bodyIndex = result.nextIndex;
    }
    
    return {
      command: {
        type: 'RETRY_ON_STALE',
        timeout: parseInt(retryMatch[1]),
        preserveVars: retryMatch[2] ? retryMatch[2].split(',').map(v => v.trim()) : [],
        body: bodyCommands
      },
      nextIndex: endIndex + 1
    };
  }
  
  // SIGNAL statement
  const signalJumpMatch = line.match(/^SIGNAL\s+([A-Z_][A-Z0-9_]*)$/i);
  if (signalJumpMatch) {
    return {
      command: {
        type: 'SIGNAL',
        label: signalJumpMatch[1].toUpperCase()
      },
      nextIndex: startIndex + 1
    };
  }
  
  // LET assignment
  const letMatch = line.match(/^LET\s+([a-zA-Z0-9_{}.]+)\s*=\s*(.*)/i);
  
  // Check for malformed LET statements
  if (line.match(/^LET\s*=/i)) {
    throw new Error('Invalid LET statement: missing variable name');
  }
  if (line.match(/^LET\s+\w+\s*$/i)) {
    throw new Error('Invalid LET statement: missing assignment');
  }
  
  if (letMatch) {
    const variableName = letMatch[1];
    const expression = letMatch[2];
    
    // Check if it's a heredoc pattern (<<DELIMITER)
    const heredocMatch = expression.match(/^<<([A-Za-z_][A-Za-z0-9_]*)$/);
    if (heredocMatch) {
      const delimiter = heredocMatch[1];
      
      // Look ahead for the corresponding HEREDOC token
      let heredocToken = null;
      let nextIndex = startIndex + 1;
      
      if (nextIndex < tokens.length && tokens[nextIndex].type === 'HEREDOC' && tokens[nextIndex].delimiter === delimiter) {
        heredocToken = tokens[nextIndex];
        nextIndex = startIndex + 2; // Skip both the LINE and HEREDOC tokens
      } else {
        throw new Error(`Missing heredoc content for delimiter '${delimiter}' at line ${token.lineNumber}`);
      }
      
      return {
        command: addLineNumber({
          type: 'ASSIGNMENT',
          variable: variableName,
          expression: {
            type: 'HEREDOC_STRING',
            content: heredocToken.content,
            delimiter: delimiter
          }
        }, token),
        nextIndex: nextIndex
      };
    }
    
    // Check if it's a CALL command assignment: LET var = CALL ...
    const callMatch = expression.match(/^CALL\s+(?:\(([^)]+)\)|(\w+|\S+))(?:\s+(.*))?/i);
    if (callMatch) {
      const variableName_call = callMatch[1]; // from (variable) syntax
      const directName = callMatch[2];   // from traditional syntax
      const argsString = callMatch[3] || '';
      
      // Determine if this is a variable reference or direct name
      const isVariableCall = variableName_call !== undefined;
      const subroutineName = isVariableCall ? variableName_call : directName;
      
      // Parse arguments - split by comma but respect quotes
      const args = [];
      if (argsString.trim()) {
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < argsString.length; i++) {
          const char = argsString[i];
          
          if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            current += char;
          } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
            current += char;
          } else if (char === ' ' && !inQuotes) {
            if (current.trim()) {
              args.push(current.trim());
              current = '';
            }
          } else {
            current += char;
          }
        }
        
        if (current.trim()) {
          args.push(current.trim());
        }
      }
      
      return {
        command: addLineNumber({
          type: 'ASSIGNMENT',
          variable: variableName,
          command: {
            type: 'CALL',
            subroutine: subroutineName,
            arguments: args,
            isVariableCall: isVariableCall
          }
        }, token),
        nextIndex: startIndex + 1
      };
    }

    // Check if it's a concatenation expression with || FIRST
    if (expression.includes('||')) {
      return {
        command: addLineNumber({
          type: 'ASSIGNMENT',
          variable: variableName,
          expression: {
            type: 'CONCATENATION',
            value: expression
          }
        }, token),
        nextIndex: startIndex + 1
      };
    }
    
    // Check if it's a quoted string that might need interpolation
    if ((expression.startsWith('"') && expression.endsWith('"')) || (expression.startsWith("'") && expression.endsWith("'"))) {
      const rawString = expression.substring(1, expression.length - 1);
      
      // Check for interpolation markers {variableName} or empty {} - must match variable pattern or be empty
      if (rawString.match(/\{[a-zA-Z_][a-zA-Z0-9_.]*\}/) || rawString.includes('{}')) {
        return {
          command: addLineNumber({
            type: 'ASSIGNMENT',
            variable: variableName,
            expression: {
              type: 'INTERPOLATED_STRING',
              template: rawString
            }
          }, token),
          nextIndex: startIndex + 1
        };
      } else {
        // Simple quoted string
        return {
          command: addLineNumber({
            type: 'ASSIGNMENT',
            variable: variableName,
            value: rawString,
            isQuotedString: true
          }, token),
          nextIndex: startIndex + 1
        };
      }
    }
    
    // Check if it's a JSON-like object literal FIRST (before function call detection)
    if (expression.trim().startsWith('{') && expression.trim().endsWith('}')) {
      try {
        // Try to parse as JSON to validate syntax
        JSON.parse(expression.trim());
        return {
          command: addLineNumber({
            type: 'ASSIGNMENT',
            variable: variableName,
            value: expression.trim()
          }, token),
          nextIndex: startIndex + 1
        };
      } catch (e) {
        // Not valid JSON, continue with other parsing strategies
      }
    }
    
    // Try parsing as mathematical expression FIRST (if it has operators, numbers, or variables)
    // This takes precedence over function calls to handle expressions like "LENGTH(x) + 3"
    const expr = parseExpression(expression);
    
    if (expr !== null) {
      return {
        command: addLineNumber({
          type: 'ASSIGNMENT',
          variable: variableName,
          expression: expr
        }, token),
        nextIndex: startIndex + 1
      };
    }
    
    // Check if it looks like a function call using strategy-based detection
    if (callIsFunctionCallExpression(expression)) {
      // Try parsing as a function call for function-like names
      const funcCall = parseFunctionCall(expression);
      if (funcCall) {
        // Function calls with parameters use 'command' field, without parameters use 'expression' field
        const hasParameters = Object.keys(funcCall.params || {}).length > 0;
        return {
          command: addLineNumber({
            type: 'ASSIGNMENT',
            variable: variableName,
            ...(hasParameters ? { command: funcCall } : { expression: funcCall })
          }, token),
          nextIndex: startIndex + 1
        };
      }
    }
    
    // If expression parsing failed and we haven't tried function call yet, try it now
    if (!callIsFunctionCallExpression(expression)) {
      const funcCall = parseFunctionCall(expression);
      if (funcCall) {
        // Function calls with parameters use 'command' field, without parameters use 'expression' field
        const hasParameters = Object.keys(funcCall.params || {}).length > 0;
        return {
          command: addLineNumber({
            type: 'ASSIGNMENT',
            variable: variableName,
            ...(hasParameters ? { command: funcCall } : { expression: funcCall })
          }, token),
          nextIndex: startIndex + 1
        };
      }
    }
    
    // Finally, treat as simple string literal if no other parsing worked
    return {
      command: addLineNumber({
        type: 'ASSIGNMENT',
        variable: variableName,
        value: expression
      }, token),
      nextIndex: startIndex + 1
    };
  }
  
  // IF statement - match both IF...THEN and IF...THEN DO patterns
  const ifMatch = line.match(/^IF\s+(.+?)\s+THEN(?:\s+DO)?\s*$/i);
  if (ifMatch) {
    return parseIfStatement(tokens, startIndex);
  }
  
  // DO statement
  const doMatch = line.match(/^DO\s+(.*)$/i);
  if (doMatch) {
    return parseDoStatement(tokens, startIndex);
  }
  
  // SELECT statement
  const selectMatch = line.match(/^SELECT\s*$/i);
  if (selectMatch) {
    return parseSelectStatement(tokens, startIndex);
  }
  
  // SIGNAL statement
  const signalMatch = line.match(/^SIGNAL\s+(ON|OFF)\s+ERROR(?:\s+NAME\s+(\w+))?/i);
  if (signalMatch) {
    const action = signalMatch[1].toUpperCase();
    const labelName = signalMatch[2] || 'ERROR';
    return {
      command: { 
        type: 'SIGNAL', 
        action: action, 
        condition: 'ERROR',
        label: labelName 
      },
      nextIndex: startIndex + 1
    };
  }


  // INTERPRET ... WITH ISOLATED (sandboxed mode) - Check this FIRST
  const interpretIsolatedMatch = line.match(/^INTERPRET\s+(.*?)\s+WITH\s+ISOLATED(?:\s*\(\s*([^)]+)\s*\))?(?:\s+EXPORT\s*\(\s*([^)]+)\s*\))?/i);
  if (interpretIsolatedMatch) {
    const importVars = interpretIsolatedMatch[2] ? 
      interpretIsolatedMatch[2].trim().split(/\s+/).filter(v => v.length > 0) : 
      null;
    const exportVars = interpretIsolatedMatch[3] ? 
      interpretIsolatedMatch[3].trim().split(/\s+/).filter(v => v.length > 0) : 
      null;
      
    return {
      command: {
        type: 'INTERPRET_STATEMENT',
        mode: 'isolated',
        expression: interpretIsolatedMatch[1].trim(),
        importVars: importVars,
        exportVars: exportVars
      },
      nextIndex: startIndex + 1
    };
  }

  // INTERPRET statement (classic mode)
  const interpretMatch = line.match(/^INTERPRET\s+(.*)/i);
  if (interpretMatch) {
    return {
      command: {
        type: 'INTERPRET_STATEMENT',
        mode: 'classic',
        expression: interpretMatch[1]
      },
      nextIndex: startIndex + 1
    };
  }

  // NO-INTERPRET or NO_INTERPRET (disable INTERPRET for script block)
  const noInterpretMatch = line.match(/^NO[-_]INTERPRET\s*$/i);
  if (noInterpretMatch) {
    return {
      command: {
        type: 'NO_INTERPRET'
      },
      nextIndex: startIndex + 1
    };
  }


  // EXIT statement
  const exitMatch = line.match(/^EXIT(?:\s+(.+))?/i);
  if (exitMatch) {
    return {
      command: {
        type: 'EXIT',
        code: exitMatch[1] ? parseExpression(exitMatch[1]) || exitMatch[1] : 0
      },
      nextIndex: startIndex + 1
    };
  }

  // SAY statement
  const sayMatch = line.match(/^SAY\s+(.*)/i);
  if (sayMatch) {
    return {
      command: addLineNumber({
        type: 'SAY',
        expression: sayMatch[1]
      }, token),
      nextIndex: startIndex + 1
    };
  }
  
  // Bare HEREDOC (potential ADDRESS command) - <<DELIMITER
  const bareHeredocMatch = line.match(/^<<([A-Za-z_][A-Za-z0-9_]*)$/);
  if (bareHeredocMatch) {
    const delimiter = bareHeredocMatch[1];
    
    // Look ahead for the corresponding HEREDOC token
    let heredocToken = null;
    let nextIndex = startIndex + 1;
    
    if (nextIndex < tokens.length && tokens[nextIndex].type === 'HEREDOC' && tokens[nextIndex].delimiter === delimiter) {
      heredocToken = tokens[nextIndex];
      nextIndex = startIndex + 2; // Skip both the LINE and HEREDOC tokens
    } else {
      throw new Error(`Missing heredoc content for delimiter '${delimiter}' at line ${token.lineNumber}`);
    }
    
    return {
      command: {
        type: 'HEREDOC_STRING',
        value: heredocToken.content,
        delimiter: delimiter
      },
      nextIndex: nextIndex
    };
  }

  // Bare quoted string (potential ADDRESS command) - supports double-quotes, single-quotes, and back-ticks
  const quotedStringMatch = line.match(/^(["`'])(.*?)\1$/);
  if (quotedStringMatch) {
    return {
      command: {
        type: 'QUOTED_STRING',
        value: quotedStringMatch[2]  // String content without quotes
      },
      nextIndex: startIndex + 1
    };
  }
  
  // Simple assignment without LET (e.g., variableName = value)
  const simpleAssignMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/);
  if (simpleAssignMatch) {
    const variableName = simpleAssignMatch[1];
    const expression = simpleAssignMatch[2];
    
    // Check if it's a quoted string
    if (expression.match(/^(['"`]).*\1$/)) {
      const rawString = expression.substring(1, expression.length - 1);
      return {
        command: addLineNumber({
          type: 'ASSIGNMENT',
          variable: variableName,
          value: rawString,
          isQuotedString: true
        }, token),
        nextIndex: startIndex + 1
      };
    } else {
      // Try parsing as an expression first
      const expr = parseExpression(expression);
      
      if (expr !== null) {
        return {
          command: addLineNumber({
            type: 'ASSIGNMENT',
            variable: variableName,
            expression: expr
          }, token),
          nextIndex: startIndex + 1
        };
      } else {
        // Treat as a simple value
        return {
          command: addLineNumber({
            type: 'ASSIGNMENT',
            variable: variableName,
            value: expression
          }, token),
          nextIndex: startIndex + 1
        };
      }
    }
  }
  
  // Regular function call
  const funcCall = parseFunctionCall(line);
  if (funcCall) {
    return {
      command: addLineNumber(funcCall, token),
      nextIndex: startIndex + 1
    };
  }
  
  // Skip unrecognized lines
  return { command: null, nextIndex: startIndex + 1 };
}

function parseIfStatement(tokens, startIndex) {
  const ifLine = tokens[startIndex].content;
  
  // Check for IF...THEN DO pattern first
  const ifThenDoMatch = ifLine.match(/^IF\s+(.+?)\s+THEN\s+DO\s*$/i);
  if (ifThenDoMatch) {
    // IF condition THEN DO...END pattern
    const condition = parseCondition(ifThenDoMatch[1]);
    const thenCommands = [];
    let currentIndex = startIndex + 1;
    let nestedDoCount = 0;
    
    // Find matching END - let parseStatement handle nested DO/END pairs
    while (currentIndex < tokens.length) {
      const line = tokens[currentIndex].content;
      
      if (line.match(/^END\s*$/i)) {
        // Found the matching END for this IF THEN DO
        break;
      }
      
      // Parse nested statement (parseStatement will handle DO/END pairs internally)
      const result = parseStatement(tokens, currentIndex);
      if (result.command) {
        thenCommands.push(result.command);
      }
      currentIndex = result.nextIndex;
    }
    
    if (currentIndex >= tokens.length) {
      throw new Error(`Missing END for IF THEN DO statement at line ${tokens[startIndex].lineNumber}`);
    }
    
    // Check for ELSE DO after the END
    let elseCommands = [];
    let nextIndex = currentIndex + 1;  // Skip past END
    
    if (nextIndex < tokens.length && tokens[nextIndex].content.match(/^ELSE\s+DO\s*$/i)) {
      // Found ELSE DO, parse the else block
      nextIndex++; // Skip past ELSE DO
      let nestedDoCount = 0;
      
      while (nextIndex < tokens.length) {
        const line = tokens[nextIndex].content;
        
        if (line.match(/^END\s*$/i)) {
          // Found the matching END for ELSE DO
          nextIndex++; // Skip past END
          break;
        }
        
        // Parse nested statement (parseStatement will handle DO/END pairs internally)
        const result = parseStatement(tokens, nextIndex);
        if (result.command) {
          elseCommands.push(result.command);
        }
        nextIndex = result.nextIndex;
      }
    }
    
    return {
      command: addLineNumber({
        type: 'IF',
        condition: condition,
        thenCommands: thenCommands,
        elseCommands: elseCommands
      }, tokens[startIndex]),
      nextIndex: nextIndex
    };
  }
  
  // Regular IF...THEN...ENDIF pattern
  const conditionMatch = ifLine.match(/^IF\s+(.+?)\s+THEN\s*$/i);
  if (!conditionMatch) {
    throw new Error(`Invalid IF statement at line ${tokens[startIndex].lineNumber}`);
  }
  
  const condition = parseCondition(conditionMatch[1]);
  const thenCommands = [];
  const elseCommands = [];
  let currentIndex = startIndex + 1;
  let inElseBranch = false;
  
  // Find matching ENDIF and collect commands
  while (currentIndex < tokens.length) {
    const line = tokens[currentIndex].content;
    
    if (line.match(/^ENDIF\s*$/i)) {
      // Found the end
      break;
    }
    
    if (line.match(/^ELSE\s*$/i)) {
      inElseBranch = true;
      currentIndex++;
      continue;
    }
    
    // Parse nested statement
    const result = parseStatement(tokens, currentIndex);
    if (result.command) {
      if (inElseBranch) {
        elseCommands.push(result.command);
      } else {
        thenCommands.push(result.command);
      }
    }
    currentIndex = result.nextIndex;
  }
  
  if (currentIndex >= tokens.length) {
    throw new Error(`Missing ENDIF for IF statement at line ${tokens[startIndex].lineNumber}`);
  }
  
  return {
    command: addLineNumber({
      type: 'IF',
      condition: condition,
      thenCommands: thenCommands,
      elseCommands: elseCommands
    }, tokens[startIndex]),
    nextIndex: currentIndex + 1  // Skip past ENDIF
  };
}

function parseDoStatement(tokens, startIndex) {
  const doLine = tokens[startIndex].content;
  const doMatch = doLine.match(/^DO\s+(.*)$/i);
  
  if (!doMatch) {
    throw new Error(`Invalid DO statement at line ${tokens[startIndex].lineNumber}`);
  }
  
  const loopSpec = parseLoopSpecification(doMatch[1]);
  const bodyCommands = [];
  let currentIndex = startIndex + 1;
  
  // Find matching END and collect commands - let recursive parsing handle nested blocks
  while (currentIndex < tokens.length) {
    const line = tokens[currentIndex].content;
    
    if (line.match(/^END\s*$/i)) {
      // Found the end
      break;
    }
    
    // Parse nested statement
    const result = parseStatement(tokens, currentIndex);
    if (result.command) {
      bodyCommands.push(result.command);
    }
    currentIndex = result.nextIndex;
  }
  
  if (currentIndex >= tokens.length) {
    throw new Error(`Missing END for DO statement at line ${tokens[startIndex].lineNumber}`);
  }
  
  return {
    command: {
      type: 'DO',
      loopSpec: loopSpec,
      bodyCommands: bodyCommands
    },
    nextIndex: currentIndex + 1  // Skip past END
  };
}

function parseLoopSpecification(specStr) {
  const spec = specStr.trim();
  
  // DO i = 1 TO 5 BY 2
  const rangeWithStepMatch = spec.match(/^(\w+)\s*=\s*(.+?)\s+TO\s+(.+?)\s+BY\s+(.+)$/i);
  if (rangeWithStepMatch) {
    const startStr = rangeWithStepMatch[2].trim();
    const endStr = rangeWithStepMatch[3].trim();
    const stepStr = rangeWithStepMatch[4].trim();
    
    // Try to parse start, end, and step as expressions
    const startExpr = parseExpression(startStr);
    const endExpr = parseExpression(endStr);
    const stepExpr = parseExpression(stepStr);
    
    return {
      type: 'RANGE_WITH_STEP',
      variable: rangeWithStepMatch[1],
      start: startExpr !== null ? startExpr : startStr,
      end: endExpr !== null ? endExpr : endStr,
      step: stepExpr !== null ? stepExpr : stepStr
    };
  }
  
  // DO i = 1 TO 5
  const rangeMatch = spec.match(/^(\w+)\s*=\s*(.+?)\s+TO\s+(.+)$/i);
  if (rangeMatch) {
    const startStr = rangeMatch[2].trim();
    const endStr = rangeMatch[3].trim();
    
    // Try to parse start and end as expressions
    const startExpr = parseExpression(startStr);
    const endExpr = parseExpression(endStr);
    
    return {
      type: 'RANGE',
      variable: rangeMatch[1],
      start: startExpr !== null ? startExpr : startStr,
      end: endExpr !== null ? endExpr : endStr
    };
  }
  
  // DO variable OVER array
  const overMatch = spec.match(/^(\w+)\s+OVER\s+(.+)$/i);
  if (overMatch) {
    const arrayExpr = parseExpression(overMatch[2].trim());
    return {
      type: 'OVER',
      variable: overMatch[1],
      array: arrayExpr !== null ? arrayExpr : overMatch[2].trim()
    };
  }
  
  // DO WHILE condition
  const whileMatch = spec.match(/^WHILE\s+(.+)$/i);
  if (whileMatch) {
    return {
      type: 'WHILE',
      condition: parseCondition(whileMatch[1])
    };
  }
  
  // DO 5 (simple repeat)
  const repeatMatch = spec.match(/^(\d+)$/);
  if (repeatMatch) {
    return {
      type: 'REPEAT',
      count: parseInt(repeatMatch[1])
    };
  }
  
  // DO (infinite loop - not recommended but valid)
  if (spec === '') {
    return {
      type: 'INFINITE'
    };
  }
  
  throw new Error(`Invalid DO loop specification: ${spec}`);
}

function parseCondition(conditionStr) {
  // Simple condition parsing - supports all comparison operators: =, !=, \=, ¬=, <>, ><, >, <, >=, <=
  const comparisonMatch = conditionStr.match(/^(.+?)\s*([><=¬!\\]+|><)\s*(.+)$/);
  
  if (comparisonMatch) {
    return {
      type: 'COMPARISON',
      left: comparisonMatch[1].trim(),
      operator: comparisonMatch[2].trim(),
      right: comparisonMatch[3].trim()
    };
  }
  
  // Simple boolean condition (just a variable or expression)
  return {
    type: 'BOOLEAN',
    expression: conditionStr.trim()
  };
}

function parseFunctionCall(line) {
  // Don't treat dotted identifiers (like ARG.1) as function calls - they should be variable references
  if (line.match(/^[a-zA-Z_]\w*\.\w+$/)) {
    return null;
  }
  
  const parts = line.match(/([a-zA-Z_]\w*)\s*(.*)/);
  if (!parts) return null;

  const command = parts[1];
  const argsStr = parts[2];
  const params = {};

  if (argsStr && argsStr.trim().length > 0) {
    // Handle parentheses syntax: FUNC(param=value) or FUNC param=value
    let remaining = argsStr.trim();
    
    // Strip outer parentheses if present
    if (remaining.startsWith('(') && remaining.endsWith(')')) {
      remaining = remaining.substring(1, remaining.length - 1).trim();
    }
    
    // Parse arguments manually to handle complex expressions properly
    const args = [];
    
    while (remaining.length > 0) {
      // Match parameter name
      const nameMatch = remaining.match(/^(\w+)=/);
      if (!nameMatch) {
        // No named parameter found - parse comma-separated positional arguments
        while (remaining.length > 0) {
          let argValue = '';
          let i = 0;
          let parenCount = 0;
          let inQuotes = false;
          let quoteChar = '';
          
          // Parse a single argument, handling quotes and parentheses
          while (i < remaining.length) {
            const char = remaining[i];
            
            if (!inQuotes && (char === '"' || char === "'")) {
              inQuotes = true;
              quoteChar = char;
              argValue += char;
            } else if (inQuotes && char === quoteChar) {
              inQuotes = false;
              quoteChar = '';
              argValue += char;
            } else if (!inQuotes && char === '(') {
              parenCount++;
              argValue += char;
            } else if (!inQuotes && char === ')') {
              parenCount--;
              argValue += char;
            } else if (!inQuotes && parenCount === 0 && char === ',') {
              // End of this argument
              break;
            } else if (!inQuotes && parenCount === 0 && char === ' ') {
              // End of this argument (space separator)
              break;
            } else {
              argValue += char;
            }
            
            i++;
          }
          
          if (argValue.trim()) {
            const paramName = Object.keys(params).length === 0 ? 'value' : `arg${Object.keys(params).length + 1}`;
            params[paramName] = argValue.trim();
          }
          
          remaining = remaining.substring(i).trim();
          
          // Skip comma if present
          if (remaining.startsWith(',')) {
            remaining = remaining.substring(1).trim();
          } else {
            break;
          }
        }
        break;
      }
      
      const paramName = nameMatch[1];
      remaining = remaining.substring(nameMatch[0].length);
      
      // Parse parameter value (handle quotes, parentheses, and expressions)
      let value = '';
      let i = 0;
      let parenCount = 0;
      let inQuotes = false;
      let quoteChar = '';
      
      while (i < remaining.length) {
        const char = remaining[i];
        
        if (!inQuotes && (char === '"' || char === "'")) {
          inQuotes = true;
          quoteChar = char;
        } else if (inQuotes && char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        } else if (!inQuotes && char === '(') {
          parenCount++;
        } else if (!inQuotes && char === ')') {
          parenCount--;
        } else if (!inQuotes && parenCount === 0 && char === ' ') {
          // End of this parameter value
          break;
        }
        
        value += char;
        i++;
      }
      
      args.push({ name: paramName, value: value.trim() });
      remaining = remaining.substring(i).trim();
    }
    
    // Process each argument
    for (const arg of args) {
      let value = arg.value;
      
      // Handle quoted strings
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        const rawString = value.substring(1, value.length - 1);
        
        // Check for interpolation markers {variableName}
        if (rawString.includes('{') && rawString.includes('}')) {
          value = {
            type: 'INTERPOLATED_STRING',
            template: rawString
          };
        } else {
          value = rawString;
        }
      } 
      // Handle simple numeric values first
      else if (!isNaN(parseFloat(value)) && isFinite(value) && !value.includes('-') && !value.includes('+')) {
        value = parseFloat(value);
      }
      // Handle expressions (parentheses or operators), but only if it looks like a mathematical expression
      // Be very restrictive: only parse as expression if it has parentheses OR has clear math patterns
      else if (value.includes('(') && value.includes(')')) {
        // Has parentheses - definitely an expression
        const expr = parseExpression(value);
        value = expr !== null ? expr : value;
      } else if (value.match(/\b\d+\s*[+\-*/%]\s*\d+\b/) || value.match(/\b\d+\s*\*\*\s*\d+\b/) || value.match(/^[a-zA-Z_]\w*(\.\w+)*\s*[+*/%]\s*\d+$/) || value.match(/^[a-zA-Z_]\w*(\.\w+)*\s*\*\*\s*\d+$/) || value.match(/^[a-zA-Z_]\w*(\.\w+)*\s*[\-]\s*\d+$/) || value.match(/^[a-zA-Z_]\w*\s+[+\-]\s+\d+$/)) {
        // Has clear mathematical pattern: 
        // - "5 + 3" (number op number)
        // - "variable*5", "variable/10", "variable+1" (variable op number - no spaces needed for * / +)
        // - "variable.prop-5", "variable.prop+5" (dotted variable op number - no spaces needed to avoid ambiguity)
        // - "variable - 5" or "variable + 5" (simple variable plus/minus number - SPACES REQUIRED to distinguish from identifiers like "meal-1")
        const expr = parseExpression(value);
        value = expr !== null ? expr : value;
      }
      
      params[arg.name] = value;
    }
  }

  return {
    type: 'FUNCTION_CALL',
    command: command,
    params: params
  };
}

function parseSelectStatement(tokens, startIndex) {
  const selectLine = tokens[startIndex].content;
  
  if (!selectLine.match(/^SELECT\s*$/i)) {
    throw new Error(`Invalid SELECT statement at line ${tokens[startIndex].lineNumber}`);
  }
  
  const whenClauses = [];
  let otherwiseCommands = [];
  let currentIndex = startIndex + 1;
  
  // Find matching END and collect WHEN clauses and OTHERWISE
  while (currentIndex < tokens.length) {
    const line = tokens[currentIndex].content;
    
    if (line.match(/^END\s*$/i)) {
      // Found the end
      break;
    }
    
    // Parse WHEN clause
    const whenMatch = line.match(/^WHEN\s+(.+?)\s+THEN\s*$/i);
    if (whenMatch) {
      const condition = parseCondition(whenMatch[1]);
      const whenCommands = [];
      currentIndex++;
      
      // Collect commands for this WHEN clause until next WHEN, OTHERWISE, or END
      while (currentIndex < tokens.length) {
        const nextLine = tokens[currentIndex].content;
        
        if (nextLine.match(/^(WHEN|OTHERWISE)\s/i) || nextLine.match(/^(OTHERWISE|END)\s*$/i)) {
          break;
        }
        
        const result = parseStatement(tokens, currentIndex);
        if (result.command) {
          whenCommands.push(result.command);
        }
        currentIndex = result.nextIndex;
      }
      
      whenClauses.push({
        condition: condition,
        commands: whenCommands
      });
      continue;
    }
    
    // Parse OTHERWISE clause
    const otherwiseMatch = line.match(/^OTHERWISE\s*$/i);
    if (otherwiseMatch) {
      currentIndex++;
      
      // Collect commands for OTHERWISE clause until END
      while (currentIndex < tokens.length) {
        const nextLine = tokens[currentIndex].content;
        
        if (nextLine.match(/^END\s*$/i)) {
          break;
        }
        
        const result = parseStatement(tokens, currentIndex);
        if (result.command) {
          otherwiseCommands.push(result.command);
        }
        currentIndex = result.nextIndex;
      }
      continue;
    }
    
    // If we get here, it's an unexpected line in SELECT
    throw new Error(`Unexpected line in SELECT statement at line ${tokens[currentIndex].lineNumber}: ${line}`);
  }
  
  if (currentIndex >= tokens.length) {
    throw new Error(`Missing END for SELECT statement at line ${tokens[startIndex].lineNumber}`);
  }
  
  return {
    command: {
      type: 'SELECT',
      whenClauses: whenClauses,
      otherwiseCommands: otherwiseCommands
    },
    nextIndex: currentIndex + 1  // Skip past END
  };
}

function parseExpression(exprStr) {
  const expr = exprStr.trim();
  
  // Handle array access first, e.g., "myArray[5]" or "myArray[other_var]"
  const arrayAccessMatch = expr.match(/^([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\[(.+?)\]$/);
  if (arrayAccessMatch) {
    const variableName = arrayAccessMatch[1];
    const indexStr = arrayAccessMatch[2];

    // Recursively parse the index as an expression
    const indexExpr = parseExpression(indexStr);

    return {
      type: 'ARRAY_ACCESS',
      variable: variableName,
      index: indexExpr !== null ? indexExpr : indexStr
    };
  }

  // Handle array literals, e.g., ["apple", "banana", "cherry"] or [1, 2, 3]
  if (expr.startsWith('[') && expr.endsWith(']')) {
    try {
      // Try to parse as JSON array literal
      const arrayValue = JSON.parse(expr);
      if (Array.isArray(arrayValue)) {
        return {
          type: 'ARRAY_LITERAL',
          value: arrayValue
        };
      }
    } catch (e) {
      // If JSON parsing fails, fall through to other parsing
    }
  }

  // First check if this looks like a mathematical expression (contains operators or parentheses)
  if (expr.match(/[+\-*/%()]|\*\*|\|\|/)) {
    // Parse as mathematical expression (which can contain function calls and concatenation)
    return parseArithmeticExpression(expr);
  }
  
  // For expressions, only handle function calls without parameters or with parentheses syntax
  // Function calls with named parameters (e.g., "funcName param=value") should be handled by assignment parsing
  const funcMatch = expr.match(/^([A-Z_]\w*)\s*\(/i);
  if (funcMatch) {
    // Try to parse as a function call with parentheses
    const funcCall = parseFunctionCall(expr);
    if (funcCall) {
      return funcCall;
    }
  }
  
  // Check other expression types
  if (true) {
    // Not an expression, check if it's a simple numeric literal
    if (!isNaN(parseFloat(expr)) && isFinite(expr)) {
      return {
        type: 'LITERAL',
        value: parseFloat(expr)
      };
    }
    
    // Check if it's a boolean literal
    if (expr === 'true' || expr === 'false') {
      return {
        type: 'LITERAL',
        value: expr === 'true'
      };
    }
    
    // Check if it's a no-parameter function call first (just an identifier that might be a built-in function)
    if (expr.match(/^[a-zA-Z_]\w*$/)) {
      // Only try parsing as function call for likely built-in function names
      // This includes uppercase names, DOM functions, and common function patterns
      // But exclude common RPC method patterns that should be handled as RPC calls
      if (expr.match(/^(DOM_|[A-Z][A-Z_]*|UPPER|LOWER|LENGTH|MAX|MIN|ABS|SQRT|RANDOM|UUID|NOW|DATE|TIME|PARSE|FORMAT|ENCODE|DECODE|TRIM|NORMALIZE|CONVERT)$/) && 
          !expr.match(/^(get\w+|check\w+|create\w+|prepare\w+|make\w+|set\w+|handle\w+|execute\w+|process\w+|update\w+|delete\w+|add\w+|remove\w+|list\w+|find\w+|search\w+|preheat\w+|turnOn\w+)/i)) {
        const funcCall = parseFunctionCall(expr);
        if (funcCall) {
          return funcCall;
        }
      }
    }
    
    // Check if it's a variable reference (with or without property access)
    if (expr.match(/^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*$/)) {
      return {
        type: 'VARIABLE',
        name: expr
      };
    }
  }
  
  // Not a recognized expression
  return null;
}

function parseArithmeticExpression(expr) {
  try {
    const result = parseAddition(expr.replace(/\s+/g, ''));
    
    if (result && result.remaining && result.remaining.length > 0) {
      // Unexpected remaining characters
      return null;
    }
    
    // Now the result should always have an expr property
    return result ? result.expr : null;
  } catch (e) {
    // If parsing fails, return null to fall back to original value
    return null;
  }
}

// Recursive descent parser for mathematical expressions
// Handles operator precedence: () > * / > + -

function parseAddition(expr) {
  let result = parseMultiplication(expr);
  let remaining = result.remaining;
  
  while (remaining.length > 0 && (remaining[0] === '+' || remaining[0] === '-')) {
    const operator = remaining[0];
    const rightResult = parseMultiplication(remaining.substring(1));
    
    result = {
      expr: {
        type: 'BINARY_OP',
        operator: operator,
        left: result.expr,
        right: rightResult.expr
      },
      remaining: rightResult.remaining
    };
    remaining = rightResult.remaining;
  }
  
  return result;
}

function parseMultiplication(expr) {
  let result = parseFactor(expr);
  let remaining = result.remaining;
  
  while (remaining.length > 0 && (remaining[0] === '*' || remaining[0] === '/' || remaining[0] === '%' || remaining.substring(0, 2) === '//' || remaining.substring(0, 2) === '**')) {
    let operator;
    let skipLength;
    
    if (remaining.substring(0, 2) === '//') {
      operator = '//';
      skipLength = 2;
    } else if (remaining.substring(0, 2) === '**') {
      operator = '**';
      skipLength = 2;
    } else {
      operator = remaining[0];
      skipLength = 1;
    }
    
    const rightResult = parseFactor(remaining.substring(skipLength));
    
    result = {
      expr: {
        type: 'BINARY_OP',
        operator: operator,
        left: result.expr,
        right: rightResult.expr
      },
      remaining: rightResult.remaining
    };
    remaining = rightResult.remaining;
  }
  
  return result;
}

function parseFactor(expr) {
  // Handle parentheses
  if (expr[0] === '(') {
    let parenCount = 1;
    let endIndex = 1;
    
    while (endIndex < expr.length && parenCount > 0) {
      if (expr[endIndex] === '(') parenCount++;
      if (expr[endIndex] === ')') parenCount--;
      endIndex++;
    }
    
    if (parenCount !== 0) {
      throw new Error('Mismatched parentheses');
    }
    
    const innerExpr = expr.substring(1, endIndex - 1);
    const innerResult = parseAddition(innerExpr);
    
    // Now innerResult should always have an expr property
    const innerExpression = innerResult.expr;
    
    return {
      expr: innerExpression,
      remaining: expr.substring(endIndex)
    };
  }
  
  // Check if this might be a function call (identifier followed by parentheses)
  const funcMatch = expr.match(/^([A-Z_]\w*)\s*\(/i);
  if (funcMatch) {
    // Find the matching closing parenthesis
    let parenCount = 0;
    let endIndex = 0;
    let inParens = false;
    
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === '(') {
        parenCount++;
        inParens = true;
      } else if (expr[i] === ')') {
        parenCount--;
        if (parenCount === 0 && inParens) {
          endIndex = i + 1;
          break;
        }
      }
    }
    
    if (parenCount === 0 && endIndex > 0) {
      // Extract and parse the function call
      const funcCallStr = expr.substring(0, endIndex);
      const funcCall = parseFunctionCall(funcCallStr);
      
      if (funcCall) {
        return {
          expr: funcCall,
          remaining: expr.substring(endIndex)
        };
      }
    }
  }
  
  // Handle numbers and variables
  let endIndex = 0;
  while (endIndex < expr.length && 
         (expr[endIndex].match(/[a-zA-Z0-9_.]/) || 
          (endIndex === 0 && expr[endIndex] === '-'))) {
    endIndex++;
  }
  
  if (endIndex === 0) {
    throw new Error(`Unexpected character: ${expr[0]}`);
  }
  
  const token = expr.substring(0, endIndex);
  
  // Check if it's a number
  if (!isNaN(parseFloat(token)) && isFinite(token)) {
    return {
      expr: {
        type: 'LITERAL',
        value: parseFloat(token)
      },
      remaining: expr.substring(endIndex)
    };
  }
  
  // Check if it's a boolean literal
  if (token === 'true' || token === 'false') {
    return {
      expr: {
        type: 'LITERAL',
        value: token === 'true'
      },
      remaining: expr.substring(endIndex)
    };
  }
  
  // It's a variable reference
  return {
    expr: {
      type: 'VARIABLE',
      name: token
    },
    remaining: expr.substring(endIndex)
  };
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parse, parseFunctionCall, parseExpression };
} else {
  // Browser environment - attach to window
  window.parse = parse;
  window.parseFunctionCall = parseFunctionCall;
  window.parseExpression = parseExpression;
}