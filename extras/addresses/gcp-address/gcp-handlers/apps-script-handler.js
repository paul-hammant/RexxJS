/**
 * Google Apps Script Handler - Extracted from address-gcp.js
 * Handles Apps Script API operations including OAuth2 flow
 */

const { google } = require('googleapis');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
} catch (e) {
  // Not available - will use simpler variable resolution
}


class AppsScriptHandler {
  constructor(parent, parseKeyValueParams) {
    this.parent = parent;
    this.parseKeyValueParams = parseKeyValueParams;
    this.script = null;
    this.auth = null;
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
    console.log('[AppsScriptHandler] Initializing...');

    // Try OAuth2 token first (required for Apps Script API)
    const fs = require('fs');
    const path = require('path');
    const tokenPath = path.join(process.cwd(), 'apps-script-token.json');
    const credsPath = path.join(process.cwd(), 'oauth2-client-credentials.json');

    if (fs.existsSync(tokenPath) && fs.existsSync(credsPath)) {
      try {
        console.log('[AppsScriptHandler] Using OAuth2 token...');
        const credentials = JSON.parse(fs.readFileSync(credsPath));
        const token = JSON.parse(fs.readFileSync(tokenPath));

        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : 'http://localhost:3000/oauth2callback');
        oAuth2Client.setCredentials(token);

        this.auth = oAuth2Client;
        this.script = google.script({ version: 'v1', auth: this.auth });
        console.log('[AppsScriptHandler] OAuth2 auth successful');
        return;
      } catch (e) {
        console.log('[AppsScriptHandler] OAuth2 auth failed:', e.message);
      }
    }

    // Fallback to service account (won't work but try anyway)
    console.log('[AppsScriptHandler] OAuth2 not available, trying service account...');
    this.auth = await this.parent.getAuth(['https://www.googleapis.com/auth/script.projects']);

    if (this.auth) {
      console.log('[AppsScriptHandler] Service account auth obtained (may not work for Apps Script)');
      this.script = google.script({ version: 'v1', auth: this.auth });
    } else {
      console.log('[AppsScriptHandler] No auth available');
    }
  }

  async execute(command) {
    const trimmed = command.trim();

    // Apply RexxJS variable interpolation
    const interpolated = this.interpolateVariables(trimmed);
    const upperCommand = interpolated.toUpperCase();

    // INFO command - returns handler status
    if (upperCommand === 'INFO') {
      const fs = require('fs');
      const tokenExists = fs.existsSync('apps-script-token.json');
      const credsExist = fs.existsSync('oauth2-client-credentials.json');

      return {
        success: true,
        service: 'Apps Script',
        version: '1.0.0',
        status: 'initialized',
        capabilities: ['INFO', 'AUTHORIZE', 'CREATE', 'DEPLOY'],
        oauth2: {
          tokenExists: tokenExists,
          credentialsExist: credsExist,
          ready: tokenExists && credsExist
        }
      };
    }

    // AUTHORIZE command - runs OAuth2 flow to get token
    if (upperCommand === 'AUTHORIZE') {
      return await this.authorize();
    }

    // BIND command - creates container-bound script in a spreadsheet
    if (upperCommand.startsWith('BIND ')) {
      return await this.bind(trimmed.substring(5));
    }

    // CREATE command - creates standalone Apps Script project with JavaScript code
    if (upperCommand.startsWith('CREATE ')) {
      return await this.create(trimmed.substring(7));
    }

    // DEPLOY command - deploys code to existing Apps Script project
    if (upperCommand.startsWith('DEPLOY ')) {
      return await this.deploy(trimmed.substring(7));
    }

    throw new Error(`Unknown APPS_SCRIPT command: ${trimmed.split(' ')[0]}. Available: INFO, AUTHORIZE, BIND, CREATE, DEPLOY`);
  }

  async authorize() {
    const fs = require('fs');
    const http = require('http');

    const SCOPES = ['https://www.googleapis.com/auth/script.projects'];
    const TOKEN_PATH = './apps-script-token.json';
    const CREDENTIALS_PATH = './oauth2-client-credentials.json';

    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      return {
        success: false,
        error: 'OAuth2 credentials file not found',
        instructions: [
          'Visit: https://console.cloud.google.com/apis/credentials?project=tribal-quasar-473615-a4',
          'Create Credentials → OAuth client ID → Desktop app',
          'Download JSON and save as: oauth2-client-credentials.json'
        ]
      };
    }

    // Check if token already exists
    if (fs.existsSync(TOKEN_PATH)) {
      return {
        success: true,
        message: 'Token already exists',
        tokenPath: TOKEN_PATH,
        note: 'Delete the token file if you want to re-authorize'
      };
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris ? redirect_uris[0] : 'http://localhost:3000/oauth2callback'
    );

    // Generate auth URL
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    return new Promise((resolve) => {
      console.log('');
      console.log('🔐 Opening browser for OAuth2 authorization...');
      console.log('');
      console.log('If browser does not open, visit this URL:');
      console.log(authUrl);
      console.log('');

      // Start local server to receive callback
      const server = http.createServer(async (req, res) => {
        if (req.url.indexOf('/oauth2callback') > -1) {
          const qs = new URL(req.url, 'http://localhost:3000').searchParams;
          const code = qs.get('code');

          res.end('✓ Authorization successful! You can close this window and return to RexxJS.');
          server.close();

          try {
            const { tokens } = await oAuth2Client.getToken(code);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

            resolve({
              success: true,
              message: 'OAuth2 authorization complete',
              tokenPath: TOKEN_PATH,
              note: 'Token saved. You can now use Apps Script API.'
            });
          } catch (err) {
            resolve({
              success: false,
              error: `Failed to get token: ${err.message}`
            });
          }
        }
      });

      server.listen(3000, () => {
        // Try to open browser
        try {
          const { spawn } = require('child_process');
          const platform = process.platform;

          if (platform === 'darwin') {
            spawn('open', [authUrl]);
          } else if (platform === 'win32') {
            spawn('cmd', ['/c', 'start', authUrl]);
          } else {
            spawn('xdg-open', [authUrl]);
          }
        } catch (e) {
          console.log('[AppsScriptHandler] Could not auto-open browser:', e.message);
        }
      });
    });
  }

  async bind(params) {
    // Parse: BIND spreadsheet={spreadsheetId} code={jsCode} [cell={cellRef}] [sheet={sheetName}] [name={functionName}]
    const parsedParams = this.parseKeyValueParams(params);

    if (!parsedParams.spreadsheet) {
      throw new Error('BIND requires spreadsheet parameter. Use: APPS_SCRIPT BIND spreadsheet={spreadsheetId} code={jsCode} [cell={cellRef}] [name={functionName}]');
    }

    if (!parsedParams.code) {
      throw new Error('BIND requires code parameter. Use: APPS_SCRIPT BIND spreadsheet={spreadsheetId} code={jsCode} [cell={cellRef}] [name={functionName}]');
    }

    const auth = await this.parent.getAuth([
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]);

    if (!auth) {
      throw new Error('Authentication not available');
    }

    const sheets = google.sheets({ version: 'v4', auth: auth });
    const scriptsSheet = parsedParams.sheet || 'RexxJS_Scripts';

    try {
      // First, try to create the scripts sheet for storing code
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: parsedParams.spreadsheet,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: scriptsSheet
                }
              }
            }]
          }
        });
      } catch (e) {
        // Sheet might already exist, that's okay
        if (!e.message.includes('already exists')) {
          console.log('[BIND] Warning creating sheet:', e.message);
        }
      }

      // Determine function name - extract from code or use provided name
      let functionName = parsedParams.name;
      if (!functionName) {
        const match = parsedParams.code.match(/function\s+([A-Za-z_][A-Za-z0-9_]*)/);
        if (match) {
          functionName = match[1];
        } else {
          functionName = 'CUSTOM_FUNC_' + Date.now();
        }
      }

      // If cell is specified, we create a custom function and write formula to that cell
      if (parsedParams.cell) {
        // Write the code to scripts sheet with instructions
        const timestamp = new Date().toISOString();
        await sheets.spreadsheets.values.append({
          spreadsheetId: parsedParams.spreadsheet,
          range: `${scriptsSheet}!A:C`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [
              ['Function Name', 'Cell Reference', 'Created At'],
              [functionName, parsedParams.cell, timestamp],
              [''],
              ['=== START CODE ==='],
              [parsedParams.code],
              ['=== END CODE ==='],
              [''],
              ['Instructions:'],
              ['1. Copy the code above between START and END markers'],
              ['2. Go to: Extensions → Apps Script'],
              ['3. Paste the code into Code.gs (append or replace)'],
              ['4. Click: Save (disk icon)'],
              [`5. The formula =${functionName}() is already in cell ${parsedParams.cell}`],
              ['']
            ]
          }
        });

        // Write the formula to the specified cell
        const formulaRange = parsedParams.cell.includes('!') ? parsedParams.cell : `Sheet1!${parsedParams.cell}`;
        await sheets.spreadsheets.values.update({
          spreadsheetId: parsedParams.spreadsheet,
          range: formulaRange,
          valueInputOption: 'USER_ENTERED', // This interprets formulas
          requestBody: {
            values: [[`=${functionName}()`]]
          }
        });

        return {
          success: true,
          message: 'Apps Script function bound to cell',
          script: {
            spreadsheetId: parsedParams.spreadsheet,
            sheetName: scriptsSheet,
            functionName: functionName,
            cell: parsedParams.cell,
            codeLength: parsedParams.code.length,
            url: `https://docs.google.com/spreadsheets/d/${parsedParams.spreadsheet}/edit#gid=0`,
            instructions: [
              `1. Open: https://docs.google.com/spreadsheets/d/${parsedParams.spreadsheet}`,
              `2. Go to the "${scriptsSheet}" tab`,
              '3. Copy the code between START and END markers',
              '4. Click: Extensions → Apps Script',
              '5. Paste the code into Code.gs',
              '6. Click: Save (disk icon)',
              `7. Cell ${parsedParams.cell} will execute the function!`
            ],
            note: `Formula =${functionName}() written to ${parsedParams.cell}. Service accounts cannot create Apps Script projects (Google Issue #404568019). Manual setup required.`
          }
        };
      } else {
        // No cell specified - just write code to scripts sheet (old behavior)
        const timestamp = new Date().toISOString();
        await sheets.spreadsheets.values.update({
          spreadsheetId: parsedParams.spreadsheet,
          range: `${scriptsSheet}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [
              ['RexxJS Apps Script Code', 'Created At', 'Status'],
              ['Instructions: Copy the code below, then go to Extensions → Apps Script, paste it, and save.', timestamp, 'Ready'],
              [''],
              ['=== START CODE ==='],
              [parsedParams.code],
              ['=== END CODE ===']
            ]
          }
        });

        return {
          success: true,
          message: 'Apps Script code written to spreadsheet',
          script: {
            spreadsheetId: parsedParams.spreadsheet,
            sheetName: scriptsSheet,
            codeLength: parsedParams.code.length,
            url: `https://docs.google.com/spreadsheets/d/${parsedParams.spreadsheet}/edit#gid=0`,
            instructions: [
              `1. Open: https://docs.google.com/spreadsheets/d/${parsedParams.spreadsheet}`,
              `2. Go to the "${scriptsSheet}" tab`,
              '3. Copy the code between START and END markers',
              '4. Click: Extensions → Apps Script',
              '5. Paste the code into Code.gs',
              '6. Click: Save (disk icon)',
              '7. Your custom function is now available in the spreadsheet!'
            ],
            note: 'Service accounts cannot create Apps Script projects (Google Issue #404568019). Manual setup required.'
          }
        };
      }
    } catch (e) {
      throw new Error(`Failed to bind script to spreadsheet: ${e.message}`);
    }
  }

  async create(params) {
    // Parse: CREATE title={title} code={jsCode}
    const parsedParams = this.parseKeyValueParams(params);

    if (!parsedParams.title) {
      throw new Error('CREATE requires title parameter. Use: APPS_SCRIPT CREATE title={title} code={jsCode}');
    }

    if (!parsedParams.code) {
      throw new Error('CREATE requires code parameter. Use: APPS_SCRIPT CREATE title={title} code={jsCode}');
    }

    if (!this.script) {
      throw new Error('Apps Script API not initialized. Check authentication.');
    }

    try {
      // Create Apps Script project with the provided JavaScript code
      const response = await this.script.projects.create({
        requestBody: {
          title: parsedParams.title,
          parentId: 'root'
        }
      });

      const projectId = response.data.scriptId;

      // Update the project with the code
      await this.script.projects.updateContent({
        scriptId: projectId,
        requestBody: {
          files: [
            {
              name: 'Code',
              type: 'SERVER_JS',
              source: parsedParams.code
            }
          ]
        }
      });

      return {
        success: true,
        message: 'Apps Script project created successfully',
        project: {
          scriptId: projectId,
          title: parsedParams.title,
          codeLength: parsedParams.code.length,
          url: `https://script.google.com/d/${projectId}/edit`
        }
      };
    } catch (e) {
      throw new Error(`Failed to create Apps Script project: ${e.message}`);
    }
  }

  async deploy(params) {
    // Parse: DEPLOY project={projectId} code={jsCode}
    const parsedParams = this.parseKeyValueParams(params);

    if (!parsedParams.project) {
      throw new Error('DEPLOY requires project parameter. Use: APPS_SCRIPT DEPLOY project={projectId} code={jsCode}');
    }

    if (!parsedParams.code) {
      throw new Error('DEPLOY requires code parameter. Use: APPS_SCRIPT DEPLOY project={projectId} code={jsCode}');
    }

    // For now, return what would be deployed (actual API call needs OAuth2)
    return {
      success: true,
      message: 'Apps Script deployment prepared (API deployment requires OAuth2 setup)',
      deployment: {
        projectId: parsedParams.project,
        codeLength: parsedParams.code.length,
        codePreview: parsedParams.code.substring(0, 100) + (parsedParams.code.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = { AppsScriptHandler };
