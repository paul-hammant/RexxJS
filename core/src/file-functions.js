/**
 * File system functions for REXX interpreter
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

// Helper function for HTTP-based file reading
const readFileViaHttp = async (filename, encoding = 'utf8') => {
  try {
    if (typeof fetch === 'undefined') {
      throw new Error('HTTP file access requires fetch API (available in browsers and modern Node.js)');
    }

    // Convert relative paths to absolute URLs if needed
    const url = filename.startsWith('http') ? filename : filename;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText} for ${filename}`
      };
    }

    const content = await response.text();
    
    return {
      success: true,
      content: content,
      size: content.length,
      timestamp: new Date().toISOString(),
      url: response.url,
      contentType: response.headers.get('content-type') || 'text/plain'
    };
  } catch (e) {
    return { 
      success: false, 
      error: `Failed to fetch ${filename}: ${e.message}` 
    };
  }
};

// Helper function for localStorage-based file reading  
const readFileViaLocalStorage = (filename, encoding = 'utf8') => {
  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage not available in this environment');
    }

    const key = `rexx_file_${filename}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return { success: false, error: 'File not found in localStorage' };
    }
    
    const data = JSON.parse(stored);
    return {
      success: true,
      content: data.content,
      size: data.size,
      timestamp: data.timestamp
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Helper function for HTTP-based file existence check
const checkFileExistsViaHttp = async (filename) => {
  try {
    if (typeof fetch === 'undefined') {
      return false; // Can't check without fetch API
    }

    const url = filename.startsWith('http') ? filename : filename;
    
    // Use HEAD request for efficiency (no body download)
    const response = await fetch(url, { method: 'HEAD' });
    
    return response.ok;
  } catch (e) {
    return false; // Assume file doesn't exist if we can't check
  }
};

// Helper function for localStorage-based file existence check
const checkFileExistsViaLocalStorage = (filename) => {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    const key = `rexx_file_${filename}`;
    return localStorage.getItem(key) !== null;
  } catch (e) {
    return false;
  }
};

const fileFunctions = {
  'FILE_WRITE': (filename, content, encoding = 'utf8') => {
    try {
      // If in Node.js, use filesystem for path-based filenames
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        const path = require('path');

        // Check if this is a filesystem path
        // Only treat as filesystem if it's an explicit relative path (./  ../)
        // or an absolute path that exists on the filesystem
        const isFilesystemPath = filename.startsWith('./') ||
                                 filename.startsWith('../') ||
                                 (path.isAbsolute(filename) && fs.existsSync(path.dirname(filename)));

        if (isFilesystemPath) {
          // Node.js filesystem write
          fs.writeFileSync(filename, String(content), encoding);
          const stats = fs.statSync(filename);
          return {
            success: true,
            bytes: stats.size,
            path: filename,
            timestamp: new Date().toISOString()
          };
        }
      }

      // Check if this is an HTTP path - these can't be written to
      // In browser contexts, paths starting with / are also HTTP resources
      const isHttpPath = filename.startsWith('http://') ||
                        filename.startsWith('https://') ||
                        filename.startsWith('/');

      if (isHttpPath) {
        return {
          success: false,
          error: 'FILE_WRITE not supported for HTTP resources.'
        };
      }

      // localStorage-based file writing (browser or non-path filenames)
      const key = `rexx_file_${filename}`;
      const data = {
        content: String(content),
        encoding: encoding,
        timestamp: new Date().toISOString(),
        size: String(content).length
      };

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
        return { success: true, bytes: data.size };
      } else {
        throw new Error('File operations not supported in this environment');
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  'FILE_READ': async (filename, encoding = 'utf8') => {
    try {
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        if (fs.existsSync(filename)) {
          const content = fs.readFileSync(filename, encoding);
          return {
            success: true,
            content: content,
            size: content.length,
            timestamp: new Date().toISOString()
          };
        }
      }
      // Determine storage type based on filename pattern
      const isHttpPath = filename.startsWith('/') || 
                        filename.startsWith('./') || 
                        filename.startsWith('../') ||
                        filename.startsWith('http://') ||
                        filename.startsWith('https://');
      
      if (isHttpPath) {
        // HTTP-based file access for sibling resources
        return await readFileViaHttp(filename, encoding);
      } else {
        // localStorage-based file access for local data
        return readFileViaLocalStorage(filename, encoding);
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  'FILE_EXISTS': async (filename) => {
    try {
      // Determine storage type based on filename pattern
      const isHttpPath = filename.startsWith('/') || 
                        filename.startsWith('./') || 
                        filename.startsWith('../') ||
                        filename.startsWith('http://') ||
                        filename.startsWith('https://');
      
      if (isHttpPath) {
        // HTTP-based file existence check via HEAD request
        return await checkFileExistsViaHttp(filename);
      } else {
        // localStorage-based file existence check
        return checkFileExistsViaLocalStorage(filename);
      }
    } catch (e) {
      return false;
    }
  },

  'FILE_DELETE': (filename) => {
    try {
      const key = `rexx_file_${filename}`;
      
      if (typeof localStorage !== 'undefined') {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          return { success: true };
        } else {
          return { success: false, error: 'File not found' };
        }
      } else {
        throw new Error('File operations not supported in this environment');
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  'FILE_LIST': (pattern = '*') => {
    try {
      if (typeof localStorage !== 'undefined') {
        const files = [];
        const prefix = 'rexx_file_';
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            const filename = key.substring(prefix.length);
            
            // Simple pattern matching (* means all files)
            if (pattern === '*' || filename.includes(pattern) || filename.match(new RegExp(pattern.replace(/\*/g, '.*')))) {
              try {
                const data = JSON.parse(localStorage.getItem(key));
                files.push({
                  name: filename,
                  size: data.size,
                  timestamp: data.timestamp,
                  encoding: data.encoding
                });
              } catch (e) {
                // Skip corrupted entries
              }
            }
          }
        }
        
        return files.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  },

  'FILE_SIZE': (filename) => {
    try {
      const key = `rexx_file_${filename}`;
      
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(key);
        if (!stored) {
          return -1; // File not found
        }
        
        const data = JSON.parse(stored);
        return data.size || 0;
      } else {
        return -1;
      }
    } catch (e) {
      return -1;
    }
  },

  'FILE_APPEND': async (filename, content) => {
    try {
      const readResult = await fileFunctions['FILE_READ'](filename);
      
      if (readResult.success) {
        // File exists, append to it
        const newContent = readResult.content + String(content);
        return fileFunctions['FILE_WRITE'](filename, newContent);
      } else {
        // File doesn't exist, create it with the content
        return fileFunctions['FILE_WRITE'](filename, String(content));
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  'FILE_COPY': async (source, destination) => {
    try {
      const readResult = await fileFunctions['FILE_READ'](source);
      
      if (readResult.success) {
        return fileFunctions['FILE_WRITE'](destination, readResult.content);
      } else {
        return { success: false, error: `Source file not found: ${source}` };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  'FILE_MOVE': async (source, destination) => {
    try {
      const copyResult = await fileFunctions['FILE_COPY'](source, destination);
      
      if (copyResult.success) {
        const deleteResult = fileFunctions['FILE_DELETE'](source);
        if (deleteResult.success) {
          return { success: true };
        } else {
          // Copy succeeded but delete failed - file was copied but not moved
          return { success: false, error: 'File copied but could not delete source' };
        }
      } else {
        return copyResult;
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  'FILE_BACKUP': async (filename, suffix = '.bak') => {
    try {
      const backupName = filename + suffix;
      return await fileFunctions['FILE_COPY'](filename, backupName);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  //TODO insert more file functions here

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fileFunctions };
} else if (typeof window !== 'undefined') {
  window.fileFunctions = fileFunctions;
}