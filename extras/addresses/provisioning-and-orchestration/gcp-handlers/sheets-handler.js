/**
 * Google Sheets Handler - Extracted from address-gcp.js
 * Handles SQL-like operations on Google Sheets
 */

const { google } = require('googleapis');

// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}

// Global stores for variables and aliases
const globalVariableStore = {};
const globalAliasStore = {};

// Parse result chain syntax (command → variable)
const parseResultChain = (command) => {
  const chainMatch = command.match(/^(.+?)\s*→\s*(\w+)\s*$/);
  if (chainMatch) {
    return {
      command: chainMatch[1].trim(),
      resultVar: chainMatch[2].trim()
    };
  }
  return { command: command.trim(), resultVar: null };
};

// Replace @variable references with actual values
const resolveVariableReferences = (command, variableStore) => {
  return command.replace(/@(\w+)/g, (match, varName) => {
    if (variableStore && variableStore[varName]) {
      return JSON.stringify(variableStore[varName]);
    }
    return match;
  });
};

class SheetsHandler {
  constructor(parent, parseKeyValueParams) {
    this.parent = parent;
    this.parseKeyValueParams = parseKeyValueParams;
    this.sheets = null;
    this.auth = null;
    this.currentSpreadsheet = null;
    this.aliases = {}; // Local alias store
  }

  /**
   * Interpolate variables using RexxJS global interpolation pattern
   */
  interpolateVariables(str) {
    if (!interpolationConfig) {
      return str;
    }

    const variablePool = this.parent.variablePool || {};
    const pattern = interpolationConfig.getCurrentPattern();

    if (!pattern.hasDelims(str)) {
      return str;
    }

    return str.replace(pattern.regex, (match) => {
      const varName = pattern.extractVar(match);

      if (varName in variablePool) {
        return variablePool[varName];
      }

      return match; // Variable not found - leave as-is
    });
  }

  async initialize() {
    // Initialize Google Sheets API
    try {
      console.log('[SheetsHandler] Initializing...');
      this.auth = await this.parent.getAuth([
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ]);
      console.log('[SheetsHandler] Auth obtained:', this.auth ? 'SUCCESS' : 'NULL');
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('[SheetsHandler] Sheets API initialized');
    } catch (e) {
      console.error('[SheetsHandler] Initialization error:', e.message);
      // Auth will be set up on first use if not available
    }
  }

  async handle(command) {
    const trimmed = command.trim();

    // Parse result chain if present
    const { command: actualCommand, resultVar } = parseResultChain(trimmed);

    // Apply RexxJS variable interpolation ({{var}} pattern)
    let resolvedCommand = this.interpolateVariables(actualCommand);

    // Also apply legacy @variable resolution for backward compatibility
    resolvedCommand = resolveVariableReferences(resolvedCommand, globalVariableStore);

    // Handle batch operations
    if (resolvedCommand.toUpperCase().startsWith('BATCH ')) {
      const result = await this.handleBatch(resolvedCommand.substring(6));
      if (resultVar) globalVariableStore[resultVar] = result;
      return result;
    }

    // Direct spreadsheet reference: SHEET <id> <command>
    if (resolvedCommand.match(/^[A-Za-z0-9_-]{20,}\s+/)) {
      const spaceIndex = resolvedCommand.indexOf(' ');
      const spreadsheetId = resolvedCommand.substring(0, spaceIndex);
      const subCommand = resolvedCommand.substring(spaceIndex + 1).trim();
      const result = await this.executeOnSheet(spreadsheetId, subCommand);
      if (resultVar) globalVariableStore[resultVar] = result;
      return result;
    }

    // SQL-like commands on current sheet
    const upperCommand = resolvedCommand.toUpperCase();
    let result;

    if (upperCommand.startsWith('ALIAS ')) {
      result = await this.alias(resolvedCommand.substring(6));
    } else if (upperCommand.startsWith('CONNECT ')) {
      result = await this.connect(resolvedCommand.substring(8));
    } else if (upperCommand.startsWith('SELECT ')) {
      result = await this.select(resolvedCommand);
    } else if (upperCommand.startsWith('INSERT ')) {
      result = await this.insert(resolvedCommand);
    } else if (upperCommand.startsWith('UPDATE ')) {
      result = await this.update(resolvedCommand);
    } else if (upperCommand.startsWith('DELETE ')) {
      result = await this.delete(resolvedCommand);
    } else if (upperCommand.startsWith('CREATE ')) {
      result = await this.create(resolvedCommand);
    } else if (upperCommand.startsWith('FORMULA ')) {
      result = await this.formula(resolvedCommand);
    } else if (upperCommand.startsWith('FORMAT ')) {
      result = await this.format(resolvedCommand);
    } else {
      throw new Error(`Unknown SHEETS command: ${resolvedCommand.split(' ')[0]}`);
    }

    // Store result if variable specified
    if (resultVar) {
      globalVariableStore[resultVar] = result;
    }

    return result;
  }

  async executeOnSheet(spreadsheetId, command) {
    const previousSheet = this.currentSpreadsheet;
    this.currentSpreadsheet = spreadsheetId;

    try {
      const result = await this.handle(command);
      result.spreadsheetId = spreadsheetId;
      return result;
    } finally {
      this.currentSpreadsheet = previousSheet;
    }
  }

  async alias(params) {
    // Parse: ALIAS name="spreadsheet_id"
    const parsedParams = this.parseKeyValueParams(params);

    if (!parsedParams.name || !parsedParams.id) {
      // Try legacy format: ALIAS orders="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
      const legacyMatch = params.match(/(\w+)=["']([^"']+)["']/);
      if (legacyMatch) {
        this.aliases[legacyMatch[1]] = legacyMatch[2];
        globalAliasStore[legacyMatch[1]] = legacyMatch[2];
        return {
          success: true,
          alias: legacyMatch[1],
          spreadsheetId: legacyMatch[2]
        };
      }
      // Also try format without quotes: ALIAS testdata=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
      const unquotedMatch = params.match(/(\w+)=([A-Za-z0-9_-]+)/);
      if (unquotedMatch) {
        this.aliases[unquotedMatch[1]] = unquotedMatch[2];
        globalAliasStore[unquotedMatch[1]] = unquotedMatch[2];
        return {
          success: true,
          alias: unquotedMatch[1],
          spreadsheetId: unquotedMatch[2]
        };
      }
      throw new Error('Invalid ALIAS syntax. Use: ALIAS name="alias" id="spreadsheet_id"');
    }

    this.aliases[parsedParams.name] = parsedParams.id;
    globalAliasStore[parsedParams.name] = parsedParams.id;

    return {
      success: true,
      alias: parsedParams.name,
      spreadsheetId: parsedParams.id
    };
  }

  async connect(params) {
    // Parse: CONNECT spreadsheet="<id>" or legacy format
    console.log('[CONNECT] params:', params);
    const parsedParams = this.parseKeyValueParams(params);
    console.log('[CONNECT] parsedParams:', parsedParams);
    let spreadsheetId;

    if (parsedParams.spreadsheet) {
      spreadsheetId = parsedParams.spreadsheet;
    } else {
      // Try legacy format or direct ID
      const match = params.match(/^['"]?([^'"\s]+)['"]?/);
      if (!match) {
        throw new Error('Invalid CONNECT syntax. Use: CONNECT spreadsheet="<id>"');
      }
      spreadsheetId = match[1];
    }

    // Resolve alias if it's an alias reference
    if (this.aliases[spreadsheetId] || globalAliasStore[spreadsheetId]) {
      spreadsheetId = this.aliases[spreadsheetId] || globalAliasStore[spreadsheetId];
    }

    this.currentSpreadsheet = spreadsheetId;
    console.log('[CONNECT] Attempting to connect to:', spreadsheetId);
    console.log('[CONNECT] Auth available:', this.auth ? 'YES' : 'NO');
    console.log('[CONNECT] Sheets client available:', this.sheets ? 'YES' : 'NO');

    // Verify connection
    try {
      const metadata = await this.sheets.spreadsheets.get({
        spreadsheetId: this.currentSpreadsheet
      });

      console.log('[CONNECT] Success! Title:', metadata.data.properties.title);
      return {
        success: true,
        spreadsheetId: this.currentSpreadsheet,
        title: metadata.data.properties.title,
        sheets: metadata.data.sheets.map(s => s.properties.title)
      };
    } catch (e) {
      console.error('[CONNECT] Error:', e.message, 'Code:', e.code);
      throw new Error(`Failed to connect to spreadsheet: ${e.message}`);
    }
  }

  async handleBatch(batchCommand) {
    // Parse: BATCH ["command1", "command2", ...]
    let commands;
    try {
      // Extract array from batch command
      const arrayMatch = batchCommand.match(/\[([^\]]+)\]/);
      if (!arrayMatch) {
        throw new Error('Invalid BATCH syntax. Use: BATCH ["command1", "command2"]');
      }

      // Parse comma-separated quoted commands
      const commandsStr = arrayMatch[1];
      commands = commandsStr.split(/,\s*/).map(cmd => {
        const trimmed = cmd.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed.slice(1, -1);
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      });
    } catch (e) {
      throw new Error(`BATCH parsing failed: ${e.message}`);
    }

    const results = [];
    for (let i = 0; i < commands.length; i++) {
      try {
        const result = await this.handle(commands[i]);
        results.push(result);
      } catch (e) {
        results.push({ error: e.message, command: commands[i] });
      }
    }

    return {
      success: true,
      batch: true,
      results: results,
      count: results.length
    };
  }

  async select(command) {
    // Parse: SELECT columns FROM sheet [WHERE condition]
    // Support alias references: SELECT * FROM orders.'New Orders'
    let match = command.match(/SELECT\s+(.+?)\s+FROM\s+([\w]+)\.['"]?([^'"]+?)['"]?(?:\s+WHERE\s+(.+))?$/i);
    let aliasName, sheetName, spreadsheetId;

    if (match) {
      // Alias.sheet format
      const [_, columns, alias, sheet, whereClause] = match;
      aliasName = alias;
      sheetName = sheet;
      spreadsheetId = this.aliases[aliasName] || globalAliasStore[aliasName];

      if (!spreadsheetId) {
        throw new Error(`Unknown alias: ${aliasName}. Use ALIAS to define it first.`);
      }

      const previousSheet = this.currentSpreadsheet;
      this.currentSpreadsheet = spreadsheetId;

      try {
        return await this.executeSelect(columns, sheetName, whereClause);
      } finally {
        this.currentSpreadsheet = previousSheet;
      }
    }

    // Standard format: SELECT columns FROM sheet
    match = command.match(/SELECT\s+(.+?)\s+FROM\s+['"]?([^'"]+?)['"]?(?:\s+WHERE\s+(.+))?$/i);

    if (!match) {
      throw new Error('Invalid SELECT syntax. Use: SELECT columns FROM sheet [WHERE condition]');
    }

    const [_, columns, sheet, whereClause] = match;
    return await this.executeSelect(columns, sheet, whereClause);
  }

  async executeSelect(columns, sheetName, whereClause) {
    if (!this.currentSpreadsheet) {
      throw new Error('No spreadsheet connected. Use CONNECT first.');
    }

    // Convert column spec to A1 notation
    const range = `${sheetName}!${this.normalizeColumns(columns)}`;

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.currentSpreadsheet,
        range: range
      });

      let rows = response.data.values || [];

      // Apply WHERE clause if present
      if (whereClause) {
        rows = this.filterRowsWithNaturalLanguage(rows, whereClause, columns);
      }

      return {
        success: true,
        rows: rows,
        count: rows.length,
        columns: columns,
        sheet: sheetName
      };
    } catch (e) {
      throw new Error(`SELECT failed: ${e.message}`);
    }
  }

  normalizeColumns(columns) {
    // Handle various column specifications
    // * -> A:ZZ
    // A,B,C -> A:C
    // A:D -> A:D
    if (columns === '*') return 'A:ZZ';
    if (columns.includes(':')) return columns;

    const cols = columns.split(',').map(c => c.trim());
    if (cols.length === 1) return cols[0];

    // Find min and max columns
    const sorted = cols.sort();
    return `${sorted[0]}:${sorted[sorted.length - 1]}`;
  }

  filterRowsWithNaturalLanguage(rows, whereClause, columns) {
    // Enhanced WHERE clause with natural language operators
    // Support: IS, BELOW, ABOVE, CONTAINS, STARTS, ENDS, TODAY(), etc.

    return rows.filter((row, index) => {
      if (index === 0) return true; // Keep header row

      try {
        // Parse natural language conditions
        let condition = whereClause.trim();

        // Replace natural language operators
        condition = condition.replace(/\bIS\s+today\b/gi, '= TODAY()');
        condition = condition.replace(/\bIS\s+/gi, '= ');
        condition = condition.replace(/\bBELOW\s+/gi, '< ');
        condition = condition.replace(/\bABOVE\s+/gi, '> ');
        condition = condition.replace(/\bCONTAINS\s+/gi, 'LIKE ');

        // Handle TODAY() function
        condition = condition.replace(/TODAY\(\)/gi, this.getTodayString());

        // Simple evaluation for basic conditions
        // This is a simplified parser - in production, use a proper expression parser
        const simpleMatch = condition.match(/(\w+)\s*([<>=!]+|LIKE)\s*([^\s]+)/);
        if (simpleMatch) {
          const [_, column, operator, value] = simpleMatch;
          const columnIndex = this.getColumnIndex(column, columns);

          if (columnIndex >= 0 && columnIndex < row.length) {
            const cellValue = row[columnIndex];
            return this.evaluateCondition(cellValue, operator, value);
          }
        }

        return true; // If we can't parse, include the row
      } catch (e) {
        return true; // If evaluation fails, include the row
      }
    });
  }

  getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  getColumnIndex(columnName, columnsSpec) {
    // Simple column name to index mapping
    // In a real implementation, this would map column names to A1 notation indices
    if (columnsSpec === '*') {
      // For now, assume common column names
      const commonColumns = ['date', 'amount', 'status', 'name', 'id'];
      return commonColumns.indexOf(columnName.toLowerCase());
    }
    return 0; // Fallback
  }

  evaluateCondition(cellValue, operator, targetValue) {
    // Remove quotes from target value
    const cleanTarget = targetValue.replace(/["']/g, '');

    switch (operator) {
      case '=':
      case '==':
        return cellValue == cleanTarget;
      case '!=':
        return cellValue != cleanTarget;
      case '>':
        return parseFloat(cellValue) > parseFloat(cleanTarget);
      case '<':
        return parseFloat(cellValue) < parseFloat(cleanTarget);
      case '>=':
        return parseFloat(cellValue) >= parseFloat(cleanTarget);
      case '<=':
        return parseFloat(cellValue) <= parseFloat(cleanTarget);
      case 'LIKE':
        return cellValue && cellValue.toString().toLowerCase().includes(cleanTarget.toLowerCase());
      default:
        return true;
    }
  }

  async insert(command) {
    // Parse standardized syntax: INSERT sheet="name" values="val1,val2,val3" [columns="col1,col2,col3"]
    console.log('[INSERT] command:', command);
    const parsedParams = this.parseKeyValueParams(command);
    console.log('[INSERT] parsedParams:', parsedParams);

    if (parsedParams.sheet && parsedParams.values) {
      // New standardized format
      const sheetName = parsedParams.sheet;
      const valuesStr = parsedParams.values;
      const columns = parsedParams.columns;
      console.log('[INSERT] valuesStr:', valuesStr);

      if (!this.currentSpreadsheet) {
        throw new Error('No spreadsheet connected. Use CONNECT first.');
      }

      const parsedValues = this.parseValues(valuesStr);

      try {
        const response = await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.currentSpreadsheet,
          range: `${sheetName}!A:ZZ`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: [parsedValues]
          }
        });

        return {
          success: true,
          updatedRange: response.data.updates.updatedRange,
          updatedRows: response.data.updates.updatedRows,
          sheet: sheetName
        };
      } catch (e) {
        throw new Error(`INSERT failed: ${e.message}`);
      }
    }

    // Legacy format: INSERT INTO sheet VALUES (...)
    const match = command.match(/INSERT\s+INTO\s+['"]?([^'"]+?)['"]?(?:\s*\(([^)]+)\))?\s+VALUES\s+\((.+)\)/i);

    if (!match) {
      throw new Error('Invalid INSERT syntax. Use: INSERT sheet="name" values="val1,val2" or legacy INSERT INTO sheet VALUES (...)');
    }

    const [_, sheetName, columns, values] = match;

    if (!this.currentSpreadsheet) {
      throw new Error('No spreadsheet connected. Use CONNECT first.');
    }

    const parsedValues = this.parseValues(values);

    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.currentSpreadsheet,
        range: `${sheetName}!A:ZZ`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [parsedValues]
        }
      });

      return {
        success: true,
        updatedRange: response.data.updates.updatedRange,
        updatedRows: response.data.updates.updatedRows,
        sheet: sheetName
      };
    } catch (e) {
      throw new Error(`INSERT failed: ${e.message}`);
    }
  }

  parseValues(valuesStr) {
    // Parse comma-separated values, handling quotes
    const values = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;

    for (let i = 0; i < valuesStr.length; i++) {
      const char = valuesStr[i];

      if ((char === '"' || char === "'") && (i === 0 || valuesStr[i-1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = null;
        } else {
          current += char;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(this.parseValue(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      values.push(this.parseValue(current.trim()));
    }

    return values;
  }

  parseValue(value) {
    // Convert string to appropriate type
    if (value === 'NULL' || value === 'null') return null;
    if (value === 'TRUE' || value === 'true') return true;
    if (value === 'FALSE' || value === 'false') return false;
    if (/^-?\d+$/.test(value)) return parseInt(value);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    return value;
  }

  // Stub methods for other commands (to be implemented if used)
  async update(command) {
    throw new Error('UPDATE not yet implemented in extracted SheetsHandler');
  }

  async delete(command) {
    throw new Error('DELETE not yet implemented in extracted SheetsHandler');
  }

  async create(command) {
    throw new Error('CREATE not yet implemented in extracted SheetsHandler');
  }

  async formula(command) {
    throw new Error('FORMULA not yet implemented in extracted SheetsHandler');
  }

  async format(command) {
    throw new Error('FORMAT not yet implemented in extracted SheetsHandler');
  }
}

module.exports = { SheetsHandler };
