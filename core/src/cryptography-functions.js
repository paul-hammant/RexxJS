/**
 * Cryptography and security functions for REXX interpreter
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

const cryptoFunctions = {
  'HASH_SHA256': async (text) => {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Browser environment with Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(String(text));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (typeof require !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js environment
      try {
        const crypto = eval('require')('crypto');
        return crypto.createHash('sha256').update(String(text)).digest('hex');
      } catch (e) {
        throw new Error('SHA256 hashing not available - Node.js crypto module not found');
      }
    } else {
      throw new Error('SHA256 hashing not available in this environment');
    }
  },

  'HASH_SHA1': async (text) => {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(String(text));
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (typeof require !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const crypto = eval('require')('crypto');
        return crypto.createHash('sha1').update(String(text)).digest('hex');
      } catch (e) {
        throw new Error('SHA1 hashing not available - Node.js crypto module not found');
      }
    } else {
      throw new Error('SHA1 hashing not available in this environment');
    }
  },

  'HASH_MD5': (text) => {
    // MD5 is not available in Web Crypto API (deprecated for security)
    // Requires external library like crypto-js
    if (typeof CryptoJS !== 'undefined' && CryptoJS.MD5) {
      return CryptoJS.MD5(String(text)).toString();
    } else if (typeof require !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const crypto = eval('require')('crypto');
        return crypto.createHash('md5').update(String(text)).digest('hex');
      } catch (e) {
        throw new Error('MD5 hashing not available - Node.js crypto module not found');
      }
    } else {
      throw new Error('MD5 hashing not available - requires CryptoJS library or Node.js');
    }
  },

  'BASE64_ENCODE': (text) => {
    if (typeof btoa !== 'undefined') {
      // Browser environment
      return btoa(String(text));
    } else if (typeof Buffer !== 'undefined') {
      // Node.js environment
      return Buffer.from(String(text)).toString('base64');
    } else {
      throw new Error('Base64 encoding not available in this environment');
    }
  },

  'BASE64_DECODE': (encoded) => {
    try {
      if (typeof atob !== 'undefined') {
        // Browser environment
        return atob(String(encoded));
      } else if (typeof Buffer !== 'undefined') {
        // Node.js environment
        return Buffer.from(String(encoded), 'base64').toString();
      } else {
        throw new Error('Base64 decoding not available in this environment');
      }
    } catch (e) {
      throw new Error(`Invalid base64 input: ${e.message}`);
    }
  },

  'URL_SAFE_BASE64': (text) => {
    const base64 = cryptoFunctions['BASE64_ENCODE'](text);
    // Make URL-safe by replacing + with -, / with _, and removing =
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  },

  'RANDOM_STRING': (length = 16, charset = 'alphanumeric') => {
    try {
      let chars = '';
      switch (charset.toLowerCase()) {
        case 'alpha':
          chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
          break;
        case 'numeric':
          chars = '0123456789';
          break;
        case 'alphanumeric':
          chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          break;
        case 'hex':
          chars = '0123456789abcdef';
          break;
        case 'base64':
          chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
          break;
        default:
          chars = String(charset); // Use custom charset
      }

      let result = '';
      const len = parseInt(length) || 16;

      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        // Use crypto API for secure random
        const array = new Uint32Array(len);
        crypto.getRandomValues(array);
        for (let i = 0; i < len; i++) {
          result += chars.charAt(array[i] % chars.length);
        }
      } else {
        // Fallback to Math.random
        for (let i = 0; i < len; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }
      
      return result;
    } catch (e) {
      return 'ERROR';
    }
  },

  'HMAC_SHA256': async (text, secret) => {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Browser Web Crypto API
      const encoder = new TextEncoder();
      const keyData = encoder.encode(String(secret));
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(String(text))
      );
      
      const hashArray = Array.from(new Uint8Array(signature));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (typeof require !== 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js
      try {
        const crypto = eval('require')('crypto');
        return crypto.createHmac('sha256', String(secret))
          .update(String(text))
          .digest('hex');
      } catch (e) {
        throw new Error('HMAC-SHA256 not available - Node.js crypto module not found');
      }
    } else {
      throw new Error('HMAC-SHA256 not available in this environment');
    }
  },

  'JWT_DECODE': (token) => {
    try {
      const parts = String(token).split('.');
      if (parts.length !== 3) {
        return { error: 'Invalid JWT format' };
      }

      const decoder = cryptoFunctions['BASE64_DECODE'];
      
      // Decode header and payload
      const header = JSON.parse(decoder(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(decoder(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      return {
        header,
        payload,
        signature: parts[2]
      };
    } catch (e) {
      return { error: 'JWT decode failed' };
    }
  },

  'PASSWORD_HASH': async (password, algorithm = 'SHA256') => {
    // Add a salt for better security
    const salt = cryptoFunctions['RANDOM_STRING'](16, 'hex');
    const hasher = cryptoFunctions[`HASH_${algorithm.toUpperCase()}`];
    
    if (!hasher) {
      throw new Error(`Algorithm ${algorithm} not supported`);
    }
    
    const hash = await hasher(password + salt);
    return `${algorithm.toLowerCase()}$${salt}$${hash}`;
  },

  'PASSWORD_VERIFY': async (password, hash) => {
    try {
      const parts = String(hash).split('$');
      if (parts.length !== 3) {
        return false;
      }
      
      const [algorithm, salt, storedHash] = parts;
      const hasher = cryptoFunctions[`HASH_${algorithm.toUpperCase()}`];
      
      if (!hasher) {
        return false;
      }
      
      const computedHash = await hasher(password + salt);
      return computedHash === storedHash;
    } catch (e) {
      return false;
    }
  }

  //TODO insert more crypto functions here

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cryptoFunctions };
} else if (typeof window !== 'undefined') {
  window.cryptoFunctions = cryptoFunctions;
}