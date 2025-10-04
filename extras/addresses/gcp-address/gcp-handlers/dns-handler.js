/* DNS Handler - Domain name system management */

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
} catch (e) {
  // Not available - will use simpler variable resolution
}

const { spawn } = require('child_process');

class DNSHandler {
  constructor(parent) {
    this.parent = parent;
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


  async handle(command) {
    const trimmed = command.trim();

    // Apply RexxJS variable interpolation
    const interpolated = this.interpolateVariables(trimmed);
    const upperCommand = interpolated.toUpperCase();

    // Managed zone operations
    if (upperCommand.startsWith('CREATE ZONE ')) {
      return await this.createZone(trimmed.substring(12).trim());
    }
    if (upperCommand.startsWith('DELETE ZONE ')) {
      return await this.deleteZone(trimmed.substring(12).trim());
    }
    if (upperCommand.startsWith('LIST ZONES') || upperCommand === 'LIST') {
      return await this.listZones();
    }

    // Record operations
    if (upperCommand.startsWith('ADD-RECORD ') || upperCommand.startsWith('ADD RECORD ')) {
      return await this.addRecord(trimmed);
    }
    if (upperCommand.startsWith('DELETE-RECORD ') || upperCommand.startsWith('DELETE RECORD ')) {
      return await this.deleteRecord(trimmed);
    }
    if (upperCommand.startsWith('LIST RECORDS ')) {
      return await this.listRecords(trimmed.substring(13).trim());
    }

    throw new Error(`Unknown DNS command: ${trimmed.split(' ')[0]}`);
  }

  async createZone(params) {
    // Parse: name domain=example.com [description="..."]
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const zoneName = parsed.name || parts[0];
    const domain = parsed.domain || parsed.dns;
    const description = parsed.description || `DNS zone for ${domain}`;

    if (!domain) {
      throw new Error('DOMAIN required. Usage: CREATE ZONE name domain=example.com');
    }

    const cmdParts = [
      'gcloud', 'dns', 'managed-zones', 'create', zoneName,
      '--dns-name', domain,
      '--description', description,
      '--format', 'json'
    ];

    // Add DNSSEC if requested
    if (parsed.dnssec === 'true') {
      cmdParts.push('--dnssec-state', 'on');
    }

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      let zoneData = null;
      try {
        zoneData = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        action: 'created',
        zone: zoneName,
        domain: domain,
        data: zoneData,
        note: 'Update your domain registrar with the nameservers shown in the zone data',
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to create DNS zone: ${result.stderr || result.stdout}`);
  }

  async deleteZone(params) {
    const parts = params.split(/\s+/);
    const zoneName = parts[0];

    const result = await this.executeGcloud([
      'gcloud', 'dns', 'managed-zones', 'delete', zoneName,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        zone: zoneName,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete DNS zone: ${result.stderr || result.stdout}`);
  }

  async listZones() {
    const result = await this.executeGcloud([
      'gcloud', 'dns', 'managed-zones', 'list',
      '--format', 'json'
    ]);

    if (result.success) {
      let zones = [];
      try {
        zones = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        zones: zones,
        count: zones.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list DNS zones: ${result.stderr || result.stdout}`);
  }

  async addRecord(command) {
    // Parse: ADD-RECORD zone name=www type=A ttl=300 data=1.2.3.4
    const params = command.substring(command.toUpperCase().indexOf('RECORD') + 6).trim();
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const zoneName = parsed.zone || parts[0];
    const recordName = parsed.name;
    const recordType = parsed.type || 'A';
    const ttl = parsed.ttl || '300';
    const data = parsed.data || parsed.value;

    if (!zoneName || !recordName || !data) {
      throw new Error('ZONE, NAME, and DATA required. Usage: ADD-RECORD zone name=www type=A ttl=300 data=1.2.3.4');
    }

    const cmdParts = [
      'gcloud', 'dns', 'record-sets', 'create', recordName,
      '--zone', zoneName,
      '--type', recordType,
      '--ttl', ttl,
      '--rrdatas', data
    ];

    const result = await this.executeGcloud(cmdParts);

    if (result.success) {
      return {
        success: true,
        action: 'created',
        zone: zoneName,
        record: recordName,
        type: recordType,
        ttl: ttl,
        data: data,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to add DNS record: ${result.stderr || result.stdout}`);
  }

  async deleteRecord(command) {
    // Parse: DELETE-RECORD zone name=www type=A
    const params = command.substring(command.toUpperCase().indexOf('RECORD') + 6).trim();
    const parsed = parseKeyValueParams(params);
    const parts = params.split(/\s+/);
    const zoneName = parsed.zone || parts[0];
    const recordName = parsed.name;
    const recordType = parsed.type || 'A';

    if (!zoneName || !recordName) {
      throw new Error('ZONE and NAME required. Usage: DELETE-RECORD zone name=www type=A');
    }

    const result = await this.executeGcloud([
      'gcloud', 'dns', 'record-sets', 'delete', recordName,
      '--zone', zoneName,
      '--type', recordType,
      '--quiet'
    ]);

    if (result.success) {
      return {
        success: true,
        action: 'deleted',
        zone: zoneName,
        record: recordName,
        type: recordType,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to delete DNS record: ${result.stderr || result.stdout}`);
  }

  async listRecords(params) {
    const parts = params.split(/\s+/);
    const zoneName = parts[0];

    const result = await this.executeGcloud([
      'gcloud', 'dns', 'record-sets', 'list',
      '--zone', zoneName,
      '--format', 'json'
    ]);

    if (result.success) {
      let records = [];
      try {
        records = JSON.parse(result.stdout);
      } catch (e) {
        // JSON parsing failed
      }

      return {
        success: true,
        zone: zoneName,
        records: records,
        count: records.length,
        stdout: result.stdout,
        stderr: result.stderr
      };
    }

    throw new Error(`Failed to list DNS records: ${result.stderr || result.stdout}`);
  }

  async executeGcloud(cmdParts) {
    return new Promise((resolve) => {
      const process = spawn(cmdParts[0], cmdParts.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          code: -1,
          stdout: '',
          stderr: error.message
        });
      });
    });
  }
}

module.exports = DNSHandler;
