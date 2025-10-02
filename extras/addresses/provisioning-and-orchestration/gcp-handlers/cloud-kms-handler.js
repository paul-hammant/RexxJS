// ============================================
// Cloud KMS Handler
// ============================================

const { parseKeyValueParams } = require('../../shared-utils/gcp-utils.js');
// Try to import interpolation config from RexxJS core
let interpolationConfig = null;
try {
  interpolationConfig = require('../../../../core/src/interpolation-config.js');
} catch (e) {
  // Not available - will use simpler variable resolution
}


class CloudKMSHandler {
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


  async initialize() {
    // KMS operations work via gcloud CLI
  }

  async handle(command) {
    const trimmed = command.trim();

    // Apply RexxJS variable interpolation
    const interpolated = this.interpolateVariables(trimmed);
    const upperCommand = interpolated.toUpperCase();

    // CREATE KEYRING name=... location=...
    if (upperCommand.startsWith('CREATE KEYRING ')) {
      return await this.createKeyRing(trimmed.substring(15));
    }

    // CREATE KEY keyring=... name=... purpose=...
    if (upperCommand.startsWith('CREATE KEY ')) {
      return await this.createKey(trimmed.substring(11));
    }

    // LIST KEYRINGS [location=...]
    if (upperCommand.startsWith('LIST KEYRINGS')) {
      return await this.listKeyRings(trimmed.substring(13).trim());
    }

    // LIST KEYS keyring=... [location=...]
    if (upperCommand.startsWith('LIST KEYS ')) {
      return await this.listKeys(trimmed.substring(10));
    }

    // ENCRYPT keyring=... key=... plaintext=... [location=...]
    if (upperCommand.startsWith('ENCRYPT ')) {
      return await this.encrypt(trimmed.substring(8));
    }

    // DECRYPT keyring=... key=... ciphertext=... [location=...]
    if (upperCommand.startsWith('DECRYPT ')) {
      return await this.decrypt(trimmed.substring(8));
    }

    // ROTATE KEY keyring=... key=... [location=...]
    if (upperCommand.startsWith('ROTATE KEY ')) {
      return await this.rotateKey(trimmed.substring(11));
    }

    // DESCRIBE KEY keyring=... key=... [location=...]
    if (upperCommand.startsWith('DESCRIBE KEY ')) {
      return await this.describeKey(trimmed.substring(13));
    }

    // INFO
    if (upperCommand === 'INFO') {
      return this.getInfo();
    }

    throw new Error(`Unknown KMS command: ${trimmed.split(' ')[0]}`);
  }

  async createKeyRing(command) {
    const params = parseKeyValueParams(command);
    const name = params.name;
    const location = params.location || 'us-central1';

    if (!name) {
      throw new Error('Key ring name is required: CREATE KEYRING name=... location=...');
    }

    const result = await this.executeGcloud([
      'kms', 'keyrings', 'create', name,
      '--location', location,
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'create_keyring',
      keyring: name,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async createKey(command) {
    const params = parseKeyValueParams(command);
    const keyring = params.keyring;
    const name = params.name;
    const location = params.location || 'us-central1';
    const purpose = params.purpose || 'encryption'; // encryption, asymmetric-signing, asymmetric-encryption

    if (!keyring || !name) {
      throw new Error('Keyring and key name required: CREATE KEY keyring=... name=... purpose=...');
    }

    const result = await this.executeGcloud([
      'kms', 'keys', 'create', name,
      '--keyring', keyring,
      '--location', location,
      '--purpose', purpose,
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'create_key',
      key: name,
      keyring: keyring,
      location: location,
      purpose: purpose,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listKeyRings(command) {
    const params = parseKeyValueParams(command);
    const location = params.location || 'us-central1';

    const result = await this.executeGcloud([
      'kms', 'keyrings', 'list',
      '--location', location,
      '--format', 'json'
    ]);

    let keyrings = [];
    if (result.success && result.stdout) {
      try {
        keyrings = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output if not JSON
      }
    }

    return {
      success: result.success,
      action: 'list_keyrings',
      location: location,
      keyrings: keyrings,
      count: keyrings.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async listKeys(command) {
    const params = parseKeyValueParams(command);
    const keyring = params.keyring;
    const location = params.location || 'us-central1';

    if (!keyring) {
      throw new Error('Keyring required: LIST KEYS keyring=... location=...');
    }

    const result = await this.executeGcloud([
      'kms', 'keys', 'list',
      '--keyring', keyring,
      '--location', location,
      '--format', 'json'
    ]);

    let keys = [];
    if (result.success && result.stdout) {
      try {
        keys = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'list_keys',
      keyring: keyring,
      location: location,
      keys: keys,
      count: keys.length || 0,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async encrypt(command) {
    const params = parseKeyValueParams(command);
    const keyring = params.keyring;
    const key = params.key;
    const plaintext = params.plaintext;
    const location = params.location || 'us-central1';

    if (!keyring || !key || !plaintext) {
      throw new Error('Keyring, key, and plaintext required: ENCRYPT keyring=... key=... plaintext=...');
    }

    // Create temp file for plaintext
    const fs = this.parent.fs;
    const path = this.parent.path;
    const tmpDir = require('os').tmpdir();
    const plaintextFile = path.join(tmpDir, `kms-plaintext-${Date.now()}.txt`);
    const ciphertextFile = path.join(tmpDir, `kms-ciphertext-${Date.now()}.enc`);

    try {
      // Write plaintext to temp file
      fs.writeFileSync(plaintextFile, plaintext);

      const result = await this.executeGcloud([
        'kms', 'encrypt',
        '--keyring', keyring,
        '--key', key,
        '--location', location,
        '--plaintext-file', plaintextFile,
        '--ciphertext-file', ciphertextFile
      ]);

      let ciphertext = null;
      if (result.success && fs.existsSync(ciphertextFile)) {
        // Read ciphertext and convert to base64
        const buffer = fs.readFileSync(ciphertextFile);
        ciphertext = buffer.toString('base64');
      }

      // Cleanup
      if (fs.existsSync(plaintextFile)) fs.unlinkSync(plaintextFile);
      if (fs.existsSync(ciphertextFile)) fs.unlinkSync(ciphertextFile);

      return {
        success: result.success,
        action: 'encrypt',
        keyring: keyring,
        key: key,
        location: location,
        ciphertext: ciphertext,
        stdout: result.stdout,
        stderr: result.stderr
      };
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(plaintextFile)) fs.unlinkSync(plaintextFile);
      if (fs.existsSync(ciphertextFile)) fs.unlinkSync(ciphertextFile);
      throw error;
    }
  }

  async decrypt(command) {
    const params = parseKeyValueParams(command);
    const keyring = params.keyring;
    const key = params.key;
    const ciphertext = params.ciphertext; // Base64 encoded
    const location = params.location || 'us-central1';

    if (!keyring || !key || !ciphertext) {
      throw new Error('Keyring, key, and ciphertext required: DECRYPT keyring=... key=... ciphertext=...');
    }

    const fs = this.parent.fs;
    const path = this.parent.path;
    const tmpDir = require('os').tmpdir();
    const ciphertextFile = path.join(tmpDir, `kms-ciphertext-${Date.now()}.enc`);
    const plaintextFile = path.join(tmpDir, `kms-plaintext-${Date.now()}.txt`);

    try {
      // Write ciphertext to temp file (decode from base64)
      const buffer = Buffer.from(ciphertext, 'base64');
      fs.writeFileSync(ciphertextFile, buffer);

      const result = await this.executeGcloud([
        'kms', 'decrypt',
        '--keyring', keyring,
        '--key', key,
        '--location', location,
        '--ciphertext-file', ciphertextFile,
        '--plaintext-file', plaintextFile
      ]);

      let plaintext = null;
      if (result.success && fs.existsSync(plaintextFile)) {
        plaintext = fs.readFileSync(plaintextFile, 'utf8');
      }

      // Cleanup
      if (fs.existsSync(ciphertextFile)) fs.unlinkSync(ciphertextFile);
      if (fs.existsSync(plaintextFile)) fs.unlinkSync(plaintextFile);

      return {
        success: result.success,
        action: 'decrypt',
        keyring: keyring,
        key: key,
        location: location,
        plaintext: plaintext,
        stdout: result.stdout,
        stderr: result.stderr
      };
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(ciphertextFile)) fs.unlinkSync(ciphertextFile);
      if (fs.existsSync(plaintextFile)) fs.unlinkSync(plaintextFile);
      throw error;
    }
  }

  async rotateKey(command) {
    const params = parseKeyValueParams(command);
    const keyring = params.keyring;
    const key = params.key;
    const location = params.location || 'us-central1';

    if (!keyring || !key) {
      throw new Error('Keyring and key required: ROTATE KEY keyring=... key=...');
    }

    const result = await this.executeGcloud([
      'kms', 'keys', 'versions', 'create',
      '--key', key,
      '--keyring', keyring,
      '--location', location,
      '--primary',
      '--format', 'json'
    ]);

    return {
      success: result.success,
      action: 'rotate_key',
      key: key,
      keyring: keyring,
      location: location,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  async describeKey(command) {
    const params = parseKeyValueParams(command);
    const keyring = params.keyring;
    const key = params.key;
    const location = params.location || 'us-central1';

    if (!keyring || !key) {
      throw new Error('Keyring and key required: DESCRIBE KEY keyring=... key=...');
    }

    const result = await this.executeGcloud([
      'kms', 'keys', 'describe', key,
      '--keyring', keyring,
      '--location', location,
      '--format', 'json'
    ]);

    let keyData = null;
    if (result.success && result.stdout) {
      try {
        keyData = JSON.parse(result.stdout);
      } catch (e) {
        // Return raw output
      }
    }

    return {
      success: result.success,
      action: 'describe_key',
      key: key,
      keyring: keyring,
      location: location,
      data: keyData,
      stdout: result.stdout,
      stderr: result.stderr
    };
  }

  getInfo() {
    return {
      success: true,
      service: 'Cloud KMS (Key Management Service)',
      description: 'Manage encryption keys and perform cryptographic operations',
      capabilities: [
        'CREATE KEYRING - Create a key ring',
        'CREATE KEY - Create a cryptographic key',
        'LIST KEYRINGS - List key rings in a location',
        'LIST KEYS - List keys in a key ring',
        'ENCRYPT - Encrypt data with a key',
        'DECRYPT - Decrypt data with a key',
        'ROTATE KEY - Create a new primary key version',
        'DESCRIBE KEY - Get key details'
      ],
      examples: {
        'Create key ring': 'KMS CREATE KEYRING name=my-keyring location=us-central1',
        'Create key': 'KMS CREATE KEY keyring=my-keyring name=my-key purpose=encryption',
        'Encrypt data': 'KMS ENCRYPT keyring=my-keyring key=my-key plaintext="secret data"',
        'Decrypt data': 'KMS DECRYPT keyring=my-keyring key=my-key ciphertext=<base64>',
        'Rotate key': 'KMS ROTATE KEY keyring=my-keyring key=my-key'
      }
    };
  }

  async executeGcloud(args) {
    return await this.parent.execCommand('gcloud', args);
  }
}

module.exports = CloudKMSHandler;
