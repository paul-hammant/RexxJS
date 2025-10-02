/**
 * Google BigQuery Handler - Extracted from address-gcp.js
 * Handles BigQuery SQL operations including batch and transactions
 */

// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}

// Global stores for variables
const globalVariableStore = {};

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

class BigQueryHandler {
  constructor(parent, parseKeyValueParams) {
    this.parent = parent;
    this.parseKeyValueParams = parseKeyValueParams;
    this.bigquery = null;
    this.currentDataset = null;
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
    let resolvedCommand = this.interpolateVariables(actualCommand);

    // Also apply legacy @variable resolution for backward compatibility
    resolvedCommand = resolveVariableReferences(resolvedCommand, globalVariableStore);

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

  // Stub methods for other commands (to be implemented if used)
  async useDataset(params) {
    throw new Error('USE DATASET not yet implemented in extracted BigQueryHandler');
  }

  async insert(command) {
    throw new Error('INSERT not yet implemented in extracted BigQueryHandler');
  }

  async create(command) {
    throw new Error('CREATE not yet implemented in extracted BigQueryHandler');
  }

  async drop(command) {
    throw new Error('DROP not yet implemented in extracted BigQueryHandler');
  }

  async mlQuery(command) {
    throw new Error('ML operations not yet implemented in extracted BigQueryHandler');
  }
}

module.exports = { BigQueryHandler };
