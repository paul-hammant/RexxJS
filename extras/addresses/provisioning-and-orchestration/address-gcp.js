const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { parseCommand } = require('../shared-utils');

// Enhanced parameter parsing for consistent key="value" syntax
const parseKeyValueParams = (paramString) => {
  const params = {};
  const regex = /(\w+)=["']([^"']*)["']/g;
  let match;
  
  while ((match = regex.exec(paramString)) !== null) {
    params[match[1]] = match[2];
  }
  
  return params;
};

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

// Parse HEREDOC with @SECTION markers
const parseHeredocSections = (heredocContent) => {
  const sections = {};
  const lines = heredocContent.split('\n');
  let currentSection = 'main';
  let currentCommands = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('@SECTION ')) {
      // Save previous section
      if (currentCommands.length > 0) {
        sections[currentSection] = currentCommands.join('\n');
      }
      
      // Start new section
      currentSection = trimmed.substring(9).trim();
      currentCommands = [];
    } else if (trimmed && !trimmed.startsWith('#')) {
      // Add command to current section
      currentCommands.push(trimmed);
    }
  }
  
  // Save final section
  if (currentCommands.length > 0) {
    sections[currentSection] = currentCommands.join('\n');
  }
  
  return sections;
};

// Execute sectioned HEREDOC workflow
const executeSectionedWorkflow = async (sections, gcpHandler) => {
  const results = {};
  
  for (const [sectionName, commands] of Object.entries(sections)) {
    try {
      // Split commands by line and execute each
      const commandLines = commands.split('\n').filter(line => line.trim());
      const sectionResults = [];
      
      for (const command of commandLines) {
        const result = await gcpHandler.execute(command.trim());
        sectionResults.push(result);
      }
      
      results[sectionName] = {
        success: true,
        commands: commandLines,
        results: sectionResults,
        stdout: sectionResults.map(r => r.stdout || '').join('\n'),
        stderr: sectionResults.map(r => r.stderr || '').join('\n')
      };
    } catch (error) {
      results[sectionName] = {
        success: false,
        error: error.message,
        commands: commands.split('\n').filter(line => line.trim())
      };
    }
  }
  
  return results;
};

const GCP_ADDRESS_META = {
  name: 'GCP',
  description: 'Google Cloud Platform unified orchestration interface with enhanced grammar',
  version: '2.0.0',
  services: ['SHEETS', 'BIGQUERY', 'FIRESTORE', 'STORAGE', 'PUBSUB', 'FUNCTIONS', 'RUN', 'COMPUTE'],
  grammar: {
    features: ['aliases', 'result-chains', 'natural-language', 'batch-operations', 'sections'],
    examples: {
      'alias-usage': 'SHEETS ALIAS orders="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"',
      'result-chains': 'SHEETS SELECT * FROM orders.\'Sales\' → sales_data',
      'natural-language': 'SHEETS SELECT * FROM \'Orders\' WHERE amount ABOVE 1000',
      'batch-operations': 'SHEETS BATCH ["SELECT * FROM \'Q1\'", "SELECT * FROM \'Q2\'"]',
      'standardized-params': 'STORAGE UPLOAD file="report.pdf" bucket="company-docs" as="reports/monthly.pdf"',
      'sectioned-workflow': `@SECTION data-extraction
SHEETS SELECT * FROM orders WHERE date IS today → daily_orders

@SECTION analytics  
BIGQUERY INSERT INTO staging SELECT * FROM @daily_orders

@SECTION notifications
PUBSUB PUBLISH topic="alerts" message="Daily report ready"`
    }
  }
};

// Global instance for handler reuse
let gcpHandler = null;

// Service-specific handlers
let serviceHandlers = null;

// Global variable store for result chains
let globalVariableStore = {};

// Global alias store for sheet references
let globalAliasStore = {};

// Initialize handlers on first use
const initGcpHandler = async () => {
  if (!gcpHandler) {
    gcpHandler = new UnifiedGcpHandler();
    await gcpHandler.initialize();
  }
  return gcpHandler;
};

// ADDRESS target handler function
async function ADDRESS_GCP_HANDLER(commandOrMethod, params) {
  const handler = await initGcpHandler();

  // Handle command-string style (primary usage)
  if (typeof commandOrMethod === 'string' && !params) {
    // Check if this is a HEREDOC with @SECTION markers
    if (commandOrMethod.includes('@SECTION ')) {
      const sections = parseHeredocSections(commandOrMethod);
      return await executeSectionedWorkflow(sections, handler);
    }
    
    return await handler.execute(commandOrMethod);
  }

  // Handle method-call style (backward compatibility)
  return await handler.handle(commandOrMethod, params);
}

// ============================================
// Service-Specific Command Languages
// ============================================

class SheetsHandler {
  constructor(parent) {
    this.parent = parent;
    this.sheets = null;
    this.auth = null;
    this.currentSpreadsheet = null;
    this.aliases = {}; // Local alias store
  }

  async initialize() {
    // Initialize Google Sheets API
    try {
      this.auth = await this.parent.getAuth('sheets');
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (e) {
      // Auth will be set up on first use if not available
    }
  }

  async handle(command) {
    const trimmed = command.trim();

    // Parse result chain if present
    const { command: actualCommand, resultVar } = parseResultChain(trimmed);
    const resolvedCommand = resolveVariableReferences(actualCommand, globalVariableStore);

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
    const parsedParams = parseKeyValueParams(params);
    
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
    const parsedParams = parseKeyValueParams(params);
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

    // Verify connection
    try {
      const metadata = await this.sheets.spreadsheets.get({
        spreadsheetId: this.currentSpreadsheet
      });

      return {
        success: true,
        spreadsheetId: this.currentSpreadsheet,
        title: metadata.data.properties.title,
        sheets: metadata.data.sheets.map(s => s.properties.title)
      };
    } catch (e) {
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
    const parsedParams = parseKeyValueParams(command);
    
    if (parsedParams.sheet && parsedParams.values) {
      // New standardized format
      const sheetName = parsedParams.sheet;
      const valuesStr = parsedParams.values;
      const columns = parsedParams.columns;
      
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
}

class BigQueryHandler {
  constructor(parent) {
    this.parent = parent;
    this.bigquery = null;
    this.currentDataset = null;
  }

  async initialize() {
    // Initialize BigQuery client
    try {
      const { BigQuery } = require('@google-cloud/bigquery');
      this.bigquery = new BigQuery({
        projectId: this.parent.project
      });
    } catch (e) {
      // BigQuery SDK not available, will use gcloud fallback
    }
  }

  async handle(command) {
    const trimmed = command.trim();
    
    // Parse result chain if present
    const { command: actualCommand, resultVar } = parseResultChain(trimmed);
    const resolvedCommand = resolveVariableReferences(actualCommand, globalVariableStore);

    // Handle batch operations
    if (resolvedCommand.toUpperCase().startsWith('BATCH ')) {
      const result = await this.handleBatch(resolvedCommand.substring(6));
      if (resultVar) globalVariableStore[resultVar] = result;
      return result;
    }
    
    // Handle transaction operations  
    if (resolvedCommand.toUpperCase().startsWith('TRANSACTION ')) {
      const result = await this.handleTransaction(resolvedCommand.substring(12));
      if (resultVar) globalVariableStore[resultVar] = result;
      return result;
    }

    const upperCommand = resolvedCommand.toUpperCase();
    let result;

    if (upperCommand.startsWith('USE ')) {
      result = await this.useDataset(resolvedCommand.substring(4));
    } else if (upperCommand.startsWith('SELECT ') || upperCommand.startsWith('WITH ')) {
      result = await this.query(resolvedCommand);
    } else if (upperCommand.startsWith('INSERT ')) {
      result = await this.insert(resolvedCommand);
    } else if (upperCommand.startsWith('CREATE ')) {
      result = await this.create(resolvedCommand);
    } else if (upperCommand.startsWith('DROP ')) {
      result = await this.drop(resolvedCommand);
    } else if (upperCommand.includes('ML.')) {
      // ML operations
      result = await this.mlQuery(resolvedCommand);
    } else {
      throw new Error(`Unknown BIGQUERY command: ${resolvedCommand.split(' ')[0]}`);
    }

    // Store result if variable specified
    if (resultVar) {
      globalVariableStore[resultVar] = result;
    }

    return result;
  }
  
  async handleBatch(batchCommand) {
    // Similar to SheetsHandler batch implementation
    let queries;
    try {
      const arrayMatch = batchCommand.match(/\[([^\]]+)\]/);
      if (!arrayMatch) {
        throw new Error('Invalid BATCH syntax. Use: BATCH ["query1", "query2"]');
      }
      
      const queriesStr = arrayMatch[1];
      queries = queriesStr.split(/,\s*/).map(cmd => {
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
    for (let i = 0; i < queries.length; i++) {
      try {
        const result = await this.query(queries[i]);
        results.push(result);
      } catch (e) {
        results.push({ error: e.message, query: queries[i] });
      }
    }

    return {
      success: true,
      batch: true,
      results: results,
      count: results.length
    };
  }
  
  async handleTransaction(transactionCommand) {
    // Parse transaction: TRANSACTION ["statement1", "statement2"]
    let statements;
    try {
      const arrayMatch = transactionCommand.match(/\[([^\]]+)\]/);
      if (!arrayMatch) {
        throw new Error('Invalid TRANSACTION syntax. Use: TRANSACTION ["statement1", "statement2"]');
      }
      
      const statementsStr = arrayMatch[1];
      statements = statementsStr.split(/,\s*/).map(cmd => {
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
      throw new Error(`TRANSACTION parsing failed: ${e.message}`);
    }

    // Execute all statements in sequence
    const results = [];
    let allSucceeded = true;
    
    for (let i = 0; i < statements.length; i++) {
      try {
        const result = await this.query(statements[i]);
        results.push(result);
        if (!result.success) allSucceeded = false;
      } catch (e) {
        results.push({ error: e.message, statement: statements[i] });
        allSucceeded = false;
        break; // Stop on first error in transaction
      }
    }

    return {
      success: allSucceeded,
      transaction: true,
      results: results,
      count: results.length
    };
  }

  async query(sql) {
    if (this.bigquery) {
      // Use native SDK
      const options = {
        query: sql,
        location: this.parent.region
      };

      const [job] = await this.bigquery.createQueryJob(options);
      const [rows] = await job.getQueryResults();

      return {
        success: true,
        rows: rows,
        count: rows.length,
        jobId: job.id
      };
    } else {
      // Fallback to gcloud
      const result = await this.parent.execCommand('bq', [
        'query',
        '--format=json',
        '--use_legacy_sql=false',
        sql
      ]);

      if (result.success) {
        const rows = JSON.parse(result.stdout || '[]');
        return {
          success: true,
          rows: rows,
          count: rows.length
        };
      }

      throw new Error(`Query failed: ${result.stderr}`);
    }
  }
}

class FirestoreHandler {
  constructor(parent) {
    this.parent = parent;
    this.firestore = null;
    this.currentDatabase = null;
  }

  async initialize() {
    try {
      const { Firestore } = require('@google-cloud/firestore');
      this.firestore = new Firestore({
        projectId: this.parent.project
      });
    } catch (e) {
      // Firestore SDK not available
    }
  }

  async handle(command) {
    const trimmed = command.trim();

    // Path-based operations
    if (trimmed.startsWith('GET ')) {
      return await this.get(trimmed.substring(4));
    }
    if (trimmed.startsWith('SET ')) {
      return await this.set(trimmed.substring(4));
    }
    if (trimmed.startsWith('DELETE ')) {
      return await this.delete(trimmed.substring(7));
    }
    if (trimmed.startsWith('QUERY ')) {
      return await this.query(trimmed.substring(6));
    }
    if (trimmed.startsWith('WATCH ')) {
      return await this.watch(trimmed.substring(6));
    }

    throw new Error(`Unknown FIRESTORE command: ${trimmed.split(' ')[0]}`);
  }

  async get(path) {
    if (this.firestore) {
      const doc = await this.firestore.doc(path).get();
      return {
        success: true,
        exists: doc.exists,
        data: doc.exists ? doc.data() : null,
        id: doc.id,
        path: path
      };
    }

    // Fallback to REST API
    // TODO: Implement REST fallback
    throw new Error('Firestore SDK not available');
  }
}

class StorageHandler {
  constructor(parent) {
    this.parent = parent;
    this.storage = null;
  }

  async initialize() {
    try {
      const { Storage } = require('@google-cloud/storage');
      this.storage = new Storage({
        projectId: this.parent.project
      });
    } catch (e) {
      // Storage SDK not available, will use gsutil
    }
  }

  async handle(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    if (upperCommand.startsWith('UPLOAD ')) {
      return await this.upload(trimmed.substring(7));
    }
    if (upperCommand.startsWith('DOWNLOAD ')) {
      return await this.download(trimmed.substring(9));
    }
    if (upperCommand.startsWith('LIST ')) {
      return await this.list(trimmed.substring(5));
    }
    if (upperCommand.startsWith('DELETE ')) {
      return await this.delete(trimmed.substring(7));
    }
    if (upperCommand.startsWith('CREATE BUCKET ')) {
      return await this.createBucket(trimmed.substring(14));
    }

    throw new Error(`Unknown STORAGE command: ${trimmed.split(' ')[0]}`);
  }

  async upload(params) {
    // Parse standardized syntax: UPLOAD file="path" bucket="name" [as="remote-path"]
    const parsedParams = parseKeyValueParams(params);
    
    if (parsedParams.file && parsedParams.bucket) {
      // New standardized format
      const localFile = parsedParams.file;
      const bucket = parsedParams.bucket;
      const destination = parsedParams.as || path.basename(localFile);
      
      return await this.executeUpload(localFile, bucket, destination);
    }
    
    // Legacy format: FILE 'path' TO bucket='name' [AS 'remote-path']
    const match = params.match(/FILE\s+['"]([^'"]+)['"]\s+TO\s+bucket=['"]([^'"]+)['"](?:\s+AS\s+['"]([^'"]+)['"])?/i);

    if (!match) {
      throw new Error('Invalid UPLOAD syntax. Use: UPLOAD file="path" bucket="name" [as="remote-path"] or legacy FILE "path" TO bucket="name"');
    }

    const [_, localFile, bucket, remotePath] = match;
    const destination = remotePath || path.basename(localFile);
    
    return await this.executeUpload(localFile, bucket, destination);
  }
  
  async executeUpload(localFile, bucket, destination) {
    if (this.storage) {
      await this.storage.bucket(bucket).upload(localFile, {
        destination: destination
      });

      return {
        success: true,
        bucket: bucket,
        file: destination,
        size: fs.statSync(localFile).size
      };
    } else {
      // Fallback to gsutil
      const result = await this.parent.execCommand('gsutil', [
        'cp', localFile, `gs://${bucket}/${destination}`
      ]);

      return {
        success: result.success,
        bucket: bucket,
        file: destination
      };
    }
  }
}

class PubSubHandler {
  constructor(parent) {
    this.parent = parent;
    this.pubsub = null;
  }

  async initialize() {
    try {
      const { PubSub } = require('@google-cloud/pubsub');
      this.pubsub = new PubSub({
        projectId: this.parent.project
      });
    } catch (e) {
      // PubSub SDK not available
    }
  }

  async handle(command) {
    const trimmed = command.trim();
    const upperCommand = trimmed.toUpperCase();

    if (upperCommand.startsWith('CREATE TOPIC ')) {
      return await this.createTopic(trimmed.substring(13));
    }
    if (upperCommand.startsWith('PUBLISH ')) {
      return await this.publish(trimmed.substring(8));
    }
    if (upperCommand.startsWith('SUBSCRIBE ')) {
      return await this.subscribe(trimmed.substring(10));
    }
    if (upperCommand.startsWith('PULL ')) {
      return await this.pull(trimmed.substring(5));
    }

    throw new Error(`Unknown PUBSUB command: ${trimmed.split(' ')[0]}`);
  }

  async publish(params) {
    // Parse standardized syntax: PUBLISH topic="name" message="data"
    const parsedParams = parseKeyValueParams(params);
    
    if (parsedParams.topic && parsedParams.message) {
      // New standardized format
      return await this.executePublish(parsedParams.topic, parsedParams.message);
    }
    
    // Legacy format: topic MESSAGE 'data'
    const match = params.match(/([\w-]+)\s+MESSAGE\s+['"](.+)['"]$/i);

    if (!match) {
      throw new Error('Invalid PUBLISH syntax. Use: PUBLISH topic="name" message="data" or legacy topic MESSAGE "data"');
    }

    const [_, topic, message] = match;
    return await this.executePublish(topic, message);
  }
  
  async executePublish(topic, message) {
    if (this.pubsub) {
      const messageId = await this.pubsub.topic(topic).publish(Buffer.from(message));
      return {
        success: true,
        messageId: messageId,
        topic: topic
      };
    } else {
      // Fallback to gcloud
      const result = await this.parent.execCommand('gcloud', [
        'pubsub', 'topics', 'publish', topic,
        '--message', message
      ]);

      return {
        success: result.success,
        topic: topic
      };
    }
  }
}

// Legacy cloud functions and cloud run handlers remain
class FunctionsHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async handle(command) {
    const trimmed = command.trim();
    const parts = trimmed.split(/\s+/);
    const action = parts[0].toUpperCase();

    switch (action) {
      case 'DEPLOY':
        return await this.deploy(parts.slice(1));
      case 'DELETE':
        return await this.delete(parts[1]);
      case 'INVOKE':
        return await this.invoke(parts.slice(1));
      case 'LIST':
        return await this.list();
      default:
        throw new Error(`Unknown FUNCTIONS command: ${action}`);
    }
  }

  async deploy(params) {
    // Deploy a cloud function
    // DEPLOY name SOURCE 'path' TRIGGER 'http' RUNTIME 'python39'
    const name = params[0];
    const sourceIndex = params.findIndex(p => p.toUpperCase() === 'SOURCE');
    const triggerIndex = params.findIndex(p => p.toUpperCase() === 'TRIGGER');
    const runtimeIndex = params.findIndex(p => p.toUpperCase() === 'RUNTIME');

    const source = sourceIndex >= 0 ? params[sourceIndex + 1].replace(/['"]\./g, '') : '.';
    const trigger = triggerIndex >= 0 ? params[triggerIndex + 1].replace(/['"]/g, '') : 'http';
    const runtime = runtimeIndex >= 0 ? params[runtimeIndex + 1].replace(/['"]/g, '') : 'python311';

    const args = ['functions', 'deploy', name];
    args.push('--runtime', runtime);
    args.push('--source', source);

    if (trigger === 'http') {
      args.push('--trigger-http', '--allow-unauthenticated');
    } else if (trigger.includes(':')) {
      const [type, resource] = trigger.split(':');
      args.push(`--trigger-${type}`, resource);
    }

    if (this.parent.project) args.push('--project', this.parent.project);

    const result = await this.parent.execCommand('gcloud', args);

    return {
      success: result.success,
      name: name,
      trigger: trigger,
      runtime: runtime,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }
}

class CloudRunHandler {
  constructor(parent) {
    this.parent = parent;
  }

  async handle(command) {
    const trimmed = command.trim();
    const parts = trimmed.split(/\s+/);
    const action = parts[0].toUpperCase();

    switch (action) {
      case 'DEPLOY':
        return await this.deploy(parts.slice(1));
      case 'DELETE':
        return await this.delete(parts[1]);
      case 'UPDATE':
        return await this.update(parts.slice(1));
      case 'LIST':
        return await this.list();
      default:
        throw new Error(`Unknown RUN command: ${action}`);
    }
  }

  async deploy(params) {
    // DEPLOY name IMAGE 'image' REGION 'region'
    const name = params[0];
    const imageIndex = params.findIndex(p => p.toUpperCase() === 'IMAGE');
    const regionIndex = params.findIndex(p => p.toUpperCase() === 'REGION');

    if (imageIndex < 0) {
      throw new Error('IMAGE is required for Cloud Run deployment');
    }

    const image = params[imageIndex + 1].replace(/['"]/g, '');
    const region = regionIndex >= 0 ? params[regionIndex + 1].replace(/['"]/g, '') : 'us-central1';

    const args = ['run', 'deploy', name];
    args.push('--image', image);
    args.push('--region', region);
    args.push('--platform', 'managed');
    args.push('--allow-unauthenticated');

    if (this.parent.project) args.push('--project', this.parent.project);

    const result = await this.parent.execCommand('gcloud', args);

    return {
      success: result.success,
      name: name,
      image: image,
      region: region,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }
}

// ============================================
// Unified GCP Handler
// ============================================

class UnifiedGcpHandler {
  constructor() {
    this.runtime = 'gcp';
    this.project = null; // Will be set from gcloud config or params
    this.region = 'us-central1';

    // Service handlers
    this.services = {
      sheets: new SheetsHandler(this),
      bigquery: new BigQueryHandler(this),
      firestore: new FirestoreHandler(this),
      storage: new StorageHandler(this),
      pubsub: new PubSubHandler(this),
      functions: new FunctionsHandler(this),
      run: new CloudRunHandler(this),
      // Legacy handlers for backward compatibility
      activeFunctions: new Map(),
      activeServices: new Map()
    };

    // Legacy settings for backward compatibility
    this.functionDefaults = {
      runtime: 'python311',
      memory: '256MB',
      timeout: '60s',
      maxInstances: 100,
      minInstances: 0,
      trigger: 'http'
    };

    this.cloudRunDefaults = {
      platform: 'managed',
      memory: '512Mi',
      cpu: '1',
      maxInstances: 100,
      minInstances: 0,
      port: 8080
    };

    this.auditLog = [];

    // Child process reference
    this.spawn = spawn;
    this.fs = fs;
    this.path = path;
  }

  async initialize(config = {}) {
    // Merge configuration
    Object.assign(this, config);

    // Auto-detect project if not set
    if (!this.project) {
      try {
        const result = await this.execCommand('gcloud', ['config', 'get-value', 'project']);
        if (result.stdout && result.stdout.trim()) {
          this.project = result.stdout.trim();
        }
      } catch (e) {
        // Project will need to be set explicitly
      }
    }

    // Initialize service handlers
    for (const service of Object.values(this.services)) {
      if (typeof service.initialize === 'function') {
        await service.initialize();
      }
    }

    return this;
  }

  async getAuth(scope) {
    // Get Google auth for APIs
    // TODO: Implement OAuth2 flow
    return null;
  }

  // New unified execute method for string commands
  async execute(command) {
    const trimmed = command.trim();

    if (!trimmed) {
      throw new Error('Empty command');
    }

    // Extract service identifier
    const firstWord = trimmed.split(/\s+/)[0].toUpperCase();

    // Route to appropriate service handler (no shorthand codes)
    switch (firstWord) {
      case 'SHEET':
      case 'SHEETS':
        return await this.services.sheets.handle(trimmed.substring(firstWord.length).trim());

      case 'BIGQUERY':
        return await this.services.bigquery.handle(trimmed.substring(firstWord.length).trim());

      case 'FIRESTORE':
        return await this.services.firestore.handle(trimmed.substring(firstWord.length).trim());

      case 'STORAGE':
        return await this.services.storage.handle(trimmed.substring(firstWord.length).trim());

      case 'PUBSUB':
        return await this.services.pubsub.handle(trimmed.substring(firstWord.length).trim());

      case 'FUNCTIONS':
      case 'FUNCTION':
        return await this.services.functions.handle(trimmed.substring(firstWord.length).trim());

      case 'RUN':
        return await this.services.run.handle(trimmed.substring(firstWord.length).trim());

      // Legacy gcloud-like syntax for backward compatibility
      case 'DEPLOY':
      case 'LIST':
      case 'DELETE':
      case 'CREATE':
        return await this.handleLegacyCommand(trimmed);

      default:
        throw new Error(`Unknown GCP service: ${firstWord}. Available services: SHEETS, BIGQUERY, FIRESTORE, STORAGE, PUBSUB, FUNCTIONS, RUN`);
    }
  }

  async handleLegacyCommand(command) {
    // Handle legacy gcloud-like commands for backward compatibility
    const parts = command.split(/\s+/);
    const action = parts[0].toLowerCase();
    const resource = parts[1] ? parts[1].toLowerCase() : '';

    // Parse remaining arguments
    const params = {};
    let currentArg = null;

    for (let i = 2; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith('--')) {
        currentArg = part.substring(2);
        params[currentArg] = true;
      } else if (currentArg) {
        params[currentArg] = part;
      } else {
        if (!params.name) {
          params.name = part;
        }
      }
    }

    // Map to legacy methods
    const method = `${action}_${resource}`;
    return await this.handle(method, params);
  }

  // Core execution method
  async execCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const proc = this.spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
        } else {
          resolve({
            success: false,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code
          });
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  // Cloud Functions operations
  async deployFunction(params, context) {
    const functionName = params.name || `rexx-function-${Date.now()}`;
    const source = params.source || '.';
    const runtime = params.runtime || this.functionDefaults.runtime;
    const entryPoint = params.entry_point || 'main';
    const trigger = params.trigger || this.functionDefaults.trigger;

    // Validate runtime - allow common runtimes
    const allowedRuntimes = new Set([
      'python311', 'python39', 'python38', 'python37',
      'nodejs18', 'nodejs16', 'nodejs14', 'nodejs12',
      'go119', 'go116', 'go113',
      'java17', 'java11',
      'dotnet6', 'dotnet3',
      'ruby30', 'ruby27'
    ]);
    
    if (!allowedRuntimes.has(runtime)) {
      throw new Error(`Unsupported runtime: ${runtime}. Allowed: ${Array.from(allowedRuntimes).join(', ')}`);
    }

    // Build deployment command
    const args = ['functions', 'deploy', functionName];

    args.push('--runtime', runtime);
    args.push('--entry-point', entryPoint);
    args.push('--source', source);

    // Add trigger
    if (trigger === 'http') {
      args.push('--trigger-http');
      args.push('--allow-unauthenticated');
    } else if (trigger.startsWith('topic:')) {
      args.push('--trigger-topic', trigger.substring(6));
    } else if (trigger.startsWith('bucket:')) {
      args.push('--trigger-bucket', trigger.substring(7));
    }

    // Add optional parameters
    if (params.region) args.push('--region', params.region);
    if (params.memory) args.push('--memory', params.memory);
    if (params.timeout) args.push('--timeout', params.timeout);
    if (params.max_instances) args.push('--max-instances', params.max_instances);
    if (params.min_instances) args.push('--min-instances', params.min_instances);
    if (params.env_vars) {
      const envVars = Object.entries(params.env_vars)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      args.push('--set-env-vars', envVars);
    }

    if (this.project) args.push('--project', this.project);

    const result = await this.execCommand('gcloud', args);

    if (result.success) {
      this.activeFunctions.set(functionName, {
        name: functionName,
        runtime,
        trigger,
        deployedAt: new Date().toISOString()
      });

      // Get function URL if HTTP triggered
      if (trigger === 'http') {
        const describeResult = await this.execCommand('gcloud', [
          'functions', 'describe', functionName,
          '--format', 'value(httpsTrigger.url)',
          '--project', this.project
        ]);

        if (describeResult.success && describeResult.stdout) {
          result.url = describeResult.stdout.trim();
        }
      }
    }

    return result;
  }

  async invokeFunction(name, data = null) {
    const args = ['functions', 'call', name];

    if (data !== null) {
      args.push('--data', JSON.stringify(data));
    }

    if (this.project) args.push('--project', this.project);

    return await this.execCommand('gcloud', args);
  }

  async deleteFunction(name) {
    const args = ['functions', 'delete', name, '--quiet'];

    if (this.project) args.push('--project', this.project);

    const result = await this.execCommand('gcloud', args);

    if (result.success) {
      this.activeFunctions.delete(name);
    }

    return result;
  }

  async listFunctions() {
    const args = ['functions', 'list', '--format', 'json'];

    if (this.project) args.push('--project', this.project);

    const result = await this.execCommand('gcloud', args);

    if (result.success) {
      try {
        result.functions = JSON.parse(result.stdout);
      } catch (e) {
        result.functions = [];
      }
    }

    return result;
  }

  // Cloud Run operations
  async deployService(params, context) {
    const serviceName = params.name || `rexx-service-${Date.now()}`;
    const image = params.image;

    if (!image) {
      throw new Error('Image is required for Cloud Run deployment');
    }

    const args = ['run', 'deploy', serviceName];

    args.push('--image', image);
    args.push('--platform', params.platform || this.cloudRunDefaults.platform);

    // Add configuration
    if (params.region) args.push('--region', params.region);
    if (params.memory) args.push('--memory', params.memory);
    if (params.cpu) args.push('--cpu', params.cpu);
    if (params.port) args.push('--port', params.port);
    if (params.max_instances) args.push('--max-instances', params.max_instances);
    if (params.min_instances) args.push('--min-instances', params.min_instances);

    // Allow unauthenticated by default for demo
    if (params.allow_unauthenticated !== false) {
      args.push('--allow-unauthenticated');
    }

    if (params.env_vars) {
      const envVars = Object.entries(params.env_vars)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      args.push('--set-env-vars', envVars);
    }

    if (this.project) args.push('--project', this.project);

    const result = await this.execCommand('gcloud', args);

    if (result.success) {
      this.activeServices.set(serviceName, {
        name: serviceName,
        image,
        deployedAt: new Date().toISOString()
      });

      // Get service URL
      const describeResult = await this.execCommand('gcloud', [
        'run', 'services', 'describe', serviceName,
        '--platform', params.platform || this.cloudRunDefaults.platform,
        '--region', params.region || this.region,
        '--format', 'value(status.url)',
        '--project', this.project
      ]);

      if (describeResult.success && describeResult.stdout) {
        result.url = describeResult.stdout.trim();
      }
    }

    return result;
  }

  async deleteService(name, region = null) {
    const args = ['run', 'services', 'delete', name, '--quiet'];

    args.push('--platform', 'managed');
    if (region) args.push('--region', region);
    if (this.project) args.push('--project', this.project);

    const result = await this.execCommand('gcloud', args);

    if (result.success) {
      this.activeServices.delete(name);
    }

    return result;
  }

  async listServices(region = null) {
    const args = ['run', 'services', 'list', '--platform', 'managed', '--format', 'json'];

    if (region) args.push('--region', region);
    if (this.project) args.push('--project', this.project);

    const result = await this.execCommand('gcloud', args);

    if (result.success) {
      try {
        result.services = JSON.parse(result.stdout);
      } catch (e) {
        result.services = [];
      }
    }

    return result;
  }

  // Storage operations
  async createBucket(name, location = 'us-central1') {
    const args = ['storage', 'buckets', 'create', `gs://${name}`];

    args.push('--location', location);
    if (this.project) args.push('--project', this.project);

    return await this.execCommand('gcloud', args);
  }

  async uploadToBucket(bucketName, localFile, remotePath = null) {
    const destination = remotePath
      ? `gs://${bucketName}/${remotePath}`
      : `gs://${bucketName}/${path.basename(localFile)}`;

    const args = ['storage', 'cp', localFile, destination];

    if (this.project) args.push('--project', this.project);

    return await this.execCommand('gcloud', args);
  }

  async listBuckets() {
    const args = ['storage', 'buckets', 'list', '--format', 'json'];

    if (this.project) args.push('--project', this.project);

    const result = await this.execCommand('gcloud', args);

    if (result.success) {
      try {
        result.buckets = JSON.parse(result.stdout);
      } catch (e) {
        result.buckets = [];
      }
    }

    return result;
  }

  // Pub/Sub operations
  async createTopic(name) {
    const args = ['pubsub', 'topics', 'create', name];

    if (this.project) args.push('--project', this.project);

    return await this.execCommand('gcloud', args);
  }

  async publishMessage(topic, message) {
    const args = ['pubsub', 'topics', 'publish', topic];

    args.push('--message', JSON.stringify(message));
    if (this.project) args.push('--project', this.project);

    return await this.execCommand('gcloud', args);
  }

  // Deployment helper for RexxJS scripts
  async deployRexxFunction(scriptPath, functionName = null) {
    const script = this.fs.readFileSync(scriptPath, 'utf8');
    const name = functionName || `rexx-${path.basename(scriptPath, '.rexx')}-${Date.now()}`;

    // Create temporary directory for function
    const tempDir = `/tmp/gcp-function-${name}`;
    if (this.fs.existsSync(tempDir)) {
      this.fs.rmSync(tempDir, { recursive: true });
    }
    this.fs.mkdirSync(tempDir, { recursive: true });

    // Create Python wrapper for RexxJS
    const pythonWrapper = `
import json
import subprocess
import tempfile
import os

def main(request):
    """HTTP Cloud Function that executes RexxJS script."""

    # Get request data
    request_json = request.get_json(silent=True)
    request_args = request.args

    # Create temp file with RexxJS script
    with tempfile.NamedTemporaryFile(mode='w', suffix='.rexx', delete=False) as f:
        f.write('''${script}''')
        script_path = f.name

    try:
        # Execute RexxJS script
        result = subprocess.run(
            ['rexx', script_path],
            capture_output=True,
            text=True,
            timeout=30,
            env={**os.environ, 'GCP_REQUEST': json.dumps(request_json or {})}
        )

        # Parse output
        output = result.stdout.strip()

        # Try to parse as JSON, otherwise return as text
        try:
            response = json.loads(output)
            return response
        except:
            return {'output': output, 'exitCode': result.returncode}

    except subprocess.TimeoutExpired:
        return {'error': 'Script execution timeout'}, 500
    except Exception as e:
        return {'error': str(e)}, 500
    finally:
        # Clean up temp file
        if os.path.exists(script_path):
            os.unlink(script_path)
`;

    // Write wrapper to temp directory
    this.fs.writeFileSync(`${tempDir}/main.py`, pythonWrapper);

    // Create requirements.txt if needed
    const requirements = '';
    this.fs.writeFileSync(`${tempDir}/requirements.txt`, requirements);

    // Deploy function
    const result = await this.deployFunction({
      name,
      source: tempDir,
      runtime: 'python311',
      entry_point: 'main',
      trigger: 'http'
    });

    // Clean up temp directory
    if (this.fs.existsSync(tempDir)) {
      this.fs.rmSync(tempDir, { recursive: true });
    }

    return result;
  }

  // Main handler method
  async handle(method, params = {}, context = {}) {
    // Audit logging
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      method,
      params: { ...params, project: this.project }
    });

    switch (method.toLowerCase()) {
      // Cloud Functions
      case 'deploy_function':
        return await this.deployFunction(params, context);
      case 'invoke_function':
        return await this.invokeFunction(params.name || params.function, params.data);
      case 'delete_function':
        return await this.deleteFunction(params.name || params.function);
      case 'list_functions':
        return await this.listFunctions();

      // Cloud Run
      case 'deploy_service':
        return await this.deployService(params, context);
      case 'delete_service':
        return await this.deleteService(params.name || params.service, params.region);
      case 'list_services':
        return await this.listServices(params.region);

      // Storage
      case 'create_bucket':
        return await this.createBucket(params.name || params.bucket, params.location);
      case 'upload':
        return await this.uploadToBucket(params.bucket, params.file, params.path);
      case 'list_buckets':
        return await this.listBuckets();

      // Pub/Sub
      case 'create_topic':
        return await this.createTopic(params.name || params.topic);
      case 'publish':
        return await this.publishMessage(params.topic, params.message);

      // RexxJS deployment
      case 'deploy_rexx':
        return await this.deployRexxFunction(params.script, params.name);

      // Info
      case 'info':
        return {
          handler: 'GCP',
          version: '1.0.0',
          project: this.project,
          region: this.region,
          activeFunctions: Array.from(this.activeFunctions.keys()),
          activeServices: Array.from(this.activeServices.keys())
        };

      default:
        throw new Error(`Unknown GCP method: ${method}`);
    }
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    UnifiedGcpHandler,
    AddressGcpHandler: UnifiedGcpHandler, // Alias for backward compatibility
    GCP_ADDRESS_META,
    ADDRESS_GCP_HANDLER
  };
}

// Register as global for RexxJS
if (typeof global !== 'undefined') {
  global.UnifiedGcpHandler = UnifiedGcpHandler;
  global.AddressGcpHandler = UnifiedGcpHandler; // Alias for backward compatibility
  global.GCP_ADDRESS_META = GCP_ADDRESS_META;
  global.ADDRESS_GCP_HANDLER = ADDRESS_GCP_HANDLER;

  // Use shared handler instance for first-class method access

  // First-class method exports
  global.GCP_DEPLOY_SERVICE = async (params) => {
    const handler = await initGcpHandler();
    return await handler.deployService(params);
  };

  global.GCP_DELETE_SERVICE = async (name, region) => {
    const handler = await initGcpHandler();
    return await handler.deleteService(name, region);
  };

  global.GCP_LIST_SERVICES = async (region) => {
    const handler = await initGcpHandler();
    return await handler.listServices(region);
  };

  global.GCP_DEPLOY_FUNCTION = async (params) => {
    const handler = await initGcpHandler();
    return await handler.deployFunction(params);
  };

  global.GCP_LIST_FUNCTIONS = async () => {
    const handler = await initGcpHandler();
    return await handler.listFunctions();
  };

  global.GCP_INFO = async () => {
    const handler = await initGcpHandler();
    return await handler.handle('info');
  };
}