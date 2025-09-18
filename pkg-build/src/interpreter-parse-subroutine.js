(function() {
'use strict';

/**
 * PARSE and Subroutine management for REXX interpreter
 * Handles PARSE statement execution, template parsing, subroutine discovery and CALL execution
 * 
 * This module provides browser/Node.js compatible parsing and subroutine functions
 * that work with the interpreter's variable and execution management.
 */

/**
 * Execute PARSE statement - parse input according to template
 * @param {Object} command - PARSE command object with source, input, template
 * @param {Map} variables - Variables map
 * @param {Function} evaluateExpressionFn - Function to evaluate expressions
 * @param {Function} parseTemplateFn - Function to parse templates
 * @returns {void}
 */
async function executeParse(command, variables, evaluateExpressionFn, parseTemplateFn) {
  const { source, input, template } = command;
  
  // Get the input string based on source type
  let inputString = '';
  switch (source) {
    case 'VAR':
      inputString = variables.get(input) || '';
      break;
    case 'VALUE':
      // Evaluate the expression to get the value
      if (typeof input === 'string') {
        inputString = variables.get(input) || input;
      } else {
        inputString = evaluateExpressionFn(input) || '';
      }
      break;
    case 'ARG':
      // ARG statement: parse arguments from ARG.1, ARG.2, etc.
      // For ARG, bypass parseTemplate and assign directly to template variables
      const argCount = variables.get('ARG.0') || 0;
      
      // Parse template to get variable names (split by spaces or comma and trim)
      const varNames = template.split(/[,\s]+/).map(name => name.trim()).filter(name => name);
      
      // Assign each ARG.n to corresponding template variable
      for (let i = 0; i < varNames.length; i++) {
        const varName = varNames[i];
        const argValue = variables.get(`ARG.${i + 1}`) || '';
        variables.set(varName, argValue);
      }
      return; // Skip normal parseTemplate processing
  }
  
  // Parse the template to extract variable names and delimiters
  const parseResults = parseTemplateFn(String(inputString), template);
  
  // Set the parsed variables
  for (const [varName, value] of Object.entries(parseResults)) {
    variables.set(varName, value);
  }
}

/**
 * Parse template with support for various parsing patterns
 * @param {string} inputString - Input string to parse
 * @param {string} template - Template with variables and delimiters
 * @returns {Object} Object with variable names as keys and parsed values
 */
function parseTemplate(inputString, template) {
  const results = {};
  
  // Split template into tokens, preserving quoted strings
  const templateTokens = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < template.length; i++) {
    const char = template[i];
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      current = '';
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      templateTokens.push({ type: 'delimiter', value: current });
      current = '';
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        templateTokens.push({ type: 'variable', value: current.trim() });
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current.trim()) {
    templateTokens.push({ type: inQuotes ? 'delimiter' : 'variable', value: current.trim() });
  }
  
  // Process tokens to extract values
  let currentPos = 0;
  
  for (let i = 0; i < templateTokens.length; i++) {
    const token = templateTokens[i];
    
    if (token.type === 'variable') {
      let value = '';
      
      // Look ahead for next delimiter
      const nextToken = i + 1 < templateTokens.length ? templateTokens[i + 1] : null;
      
      if (nextToken && nextToken.type === 'delimiter') {
        // Find the delimiter in the input string
        const delimiterPos = inputString.indexOf(nextToken.value, currentPos);
        if (delimiterPos >= 0) {
          value = inputString.substring(currentPos, delimiterPos);
          currentPos = delimiterPos + nextToken.value.length;
          i++; // Skip the delimiter in next iteration
        } else {
          // Delimiter not found - take rest of string
          value = inputString.substring(currentPos);
          currentPos = inputString.length;
        }
      } else if (nextToken && nextToken.type === 'variable') {
        // Next token is another variable - take one word by space
        const nextSpacePos = inputString.indexOf(' ', currentPos);
        if (nextSpacePos >= 0 && i < templateTokens.length - 1) {
          value = inputString.substring(currentPos, nextSpacePos);
          currentPos = nextSpacePos + 1;
          // Skip whitespace
          while (currentPos < inputString.length && inputString[currentPos] === ' ') {
            currentPos++;
          }
        } else {
          // Last variable or no space - take rest
          value = inputString.substring(currentPos);
          currentPos = inputString.length;
        }
      } else {
        // Last variable - take everything remaining
        value = inputString.substring(currentPos);
        currentPos = inputString.length;
      }
      
      results[token.value] = value;
    }
  }
  
  return results;
}

/**
 * Discover subroutines in the command list
 * @param {Array} commands - Commands to scan for subroutines
 * @param {Map} subroutines - Subroutines map to populate (name -> {commands})
 */
function discoverSubroutines(commands, subroutines) {
  let i = 0;
  while (i < commands.length) {
    const command = commands[i];
    
    // Look for labels that could be subroutines
    if (command.type === 'LABEL') {
      const subroutineName = command.name;
      const subroutineCommands = [];
      
      // Collect commands until next label, end of script, or RETURN
      i++; // Skip the label itself
      while (i < commands.length) {
        const cmd = commands[i];
        
        // Stop at next label or RETURN
        if (cmd.type === 'LABEL' || cmd.type === 'RETURN') {
          if (cmd.type === 'RETURN') {
            subroutineCommands.push(cmd);
            i++;
          }
          break;
        }
        
        subroutineCommands.push(cmd);
        i++;
      }
      
      // Register the subroutine
      subroutines.set(subroutineName, {
        commands: subroutineCommands
      });
      
      // Continue from current position (don't increment i again)
      continue;
    }
    
    i++;
  }
}

/**
 * Execute CALL statement - call subroutine with arguments
 * @param {Object} command - CALL command with subroutine, arguments, isVariableCall
 * @param {Map} variables - Variables map
 * @param {Map} subroutines - Subroutines map
 * @param {Array} callStack - Call stack for tracking
 * @param {Function} evaluateExpressionFn - Function to evaluate expressions
 * @param {Function} pushExecutionContextFn - Function to push execution context
 * @param {Function} popExecutionContextFn - Function to pop execution context
 * @param {Function} getCurrentExecutionContextFn - Function to get current context
 * @param {Function} executeCommandsFn - Function to execute command lists
 * @param {Function} isExternalScriptCallFn - Function to check external scripts
 * @param {Function} executeExternalScriptFn - Function to execute external scripts
 * @param {string} sourceFilename - Current source filename
 * @param {*} currentReturnValue - Current return value from interpreter
 * @returns {Object} Execution result with terminated flag and returnValue
 */
async function executeCall(command, variables, subroutines, callStack, evaluateExpressionFn, 
                          pushExecutionContextFn, popExecutionContextFn, getCurrentExecutionContextFn,
                          executeCommandsFn, isExternalScriptCallFn, executeExternalScriptFn, sourceFilename, currentReturnValue) {
  const { subroutine, arguments: args, isVariableCall } = command;
  
  // Push subroutine call context onto execution stack immediately
  const currentCtx = getCurrentExecutionContextFn();
  pushExecutionContextFn(
    'subroutine',
    command.lineNumber || (currentCtx ? currentCtx.lineNumber : null),
    `CALL ${subroutine}`,
    currentCtx ? currentCtx.sourceFilename : sourceFilename || '',
    { subroutine, args }
  );
  
  // Resolve subroutine name if it's a variable call
  let actualSubroutineName = subroutine;
  if (isVariableCall) {
      const resolvedName = variables.get(subroutine);
      if (!resolvedName) {
          throw new Error(`Variable '${subroutine}' used in CALL (${subroutine}) is not defined`);
      }
      actualSubroutineName = resolvedName.toString().toUpperCase();
  }
    
    // Check if this is an external script call (contains .rexx or path separators)
    if (isExternalScriptCallFn(actualSubroutineName)) {
      const result = await executeExternalScriptFn(actualSubroutineName, args);
      popExecutionContextFn();
      return result;
    }
    
    // Check if subroutine exists
    if (!subroutines.has(actualSubroutineName)) {
      throw new Error(`Subroutine '${actualSubroutineName}' not found`);
    }
    
    // Set up arguments as ARG.1, ARG.2, etc. and individual variables
    for (let i = 0; i < args.length; i++) {
      let argValue;
    
    // Evaluate argument value
    if (typeof args[i] === 'string') {
      if ((args[i].startsWith('"') && args[i].endsWith('"')) ||
          (args[i].startsWith("'") && args[i].endsWith("'"))) {
        argValue = args[i].slice(1, -1); // Remove quotes
      } else {
        argValue = variables.get(args[i]) || args[i];
      }
    } else {
      argValue = evaluateExpressionFn(args[i]);
    }
    
    // Set ARG.n variables (1-based indexing) - preserve type
    variables.set(`ARG.${i + 1}`, argValue);
  }
  
  // Set ARG.0 to argument count
  variables.set('ARG.0', args.length);
  
  // Push call context for tracking (variables are shared in REXX)
  callStack.push({
    subroutine: actualSubroutineName
  });
  
  
  try {
    const subroutineData = subroutines.get(actualSubroutineName);
    
    // Check if this is a built-in function
    if (subroutineData.isBuiltIn && subroutineData.func) {
      // Call the built-in function directly with evaluated arguments
      const evaluatedArgs = [];
      for (let i = 0; i < args.length; i++) {
        let argValue;
        if (typeof args[i] === 'string') {
          if ((args[i].startsWith('"') && args[i].endsWith('"')) ||
              (args[i].startsWith("'") && args[i].endsWith("'"))) {
            argValue = args[i].slice(1, -1); // Remove quotes
          } else {
            argValue = variables.get(args[i]) || args[i];
          }
        } else {
          argValue = evaluateExpressionFn(args[i]);
        }
        evaluatedArgs.push(argValue);
      }
      
      // Call the built-in function
      const result = await subroutineData.func.apply(this, evaluatedArgs);
      
      // Pop execution and call contexts
      popExecutionContextFn();
      callStack.pop();
      
      return { terminated: false, returnValue: result };
    } else {
      // Execute subroutine commands (use body if commands not available)
      const commandsToExecute = subroutineData.commands || subroutineData.body;
      if (!commandsToExecute) {
        throw new Error(`Subroutine '${actualSubroutineName}' exists but has no commands or body array. Structure: ${JSON.stringify(Object.keys(subroutineData))}`);
      }
      
      const result = await executeCommandsFn(commandsToExecute);
      
      // Handle subroutine return
      if (result && result.type === 'RETURN') {
        // Pop execution and call contexts
        popExecutionContextFn();
        callStack.pop();
        
        // Variables are shared between main and subroutines in REXX
        // So no variable restoration needed - changes persist
        return { terminated: false, returnValue: result.value };
      }
      
      // Pop execution and call contexts
      popExecutionContextFn();
      callStack.pop();
      
      // Get return value from interpreter state (will be injected as parameter)
      return { terminated: false, returnValue: currentReturnValue };
    }
    
  } catch (error) {
    // Don't pop execution context here - let the error bubble up with full context
    // Only pop the call stack (which is separate from execution stack)
    callStack.pop();
    throw error;
  }
}

/**
 * Check if subroutine name refers to an external script
 * @param {string} subroutineName - Subroutine name to check
 * @returns {boolean} True if this looks like an external script call
 */
function isExternalScriptCall(subroutineName) {
  // Check if the name looks like a file path
  return subroutineName.includes('.rexx') || 
         subroutineName.includes('/') || 
         subroutineName.includes('\\') ||
         subroutineName.includes('.') && !subroutineName.includes(' ');
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { 
        executeParse,
        parseTemplate,
        discoverSubroutines,
        executeCall,
        isExternalScriptCall
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('parseSubroutine')) {
        window.rexxModuleRegistry.set('parseSubroutine', {
            executeParse,
            parseTemplate,
            discoverSubroutines,
            executeCall,
            isExternalScriptCall
        });
    }
}

})(); // End IIFE