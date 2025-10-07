/**
 * Shell-Inspired Functions
 *
 * Modern file system operations inspired by Deno and Rust
 * - Rich native APIs (no shelling out)
 * - Named parameters for ergonomics
 * - Pipeline operator compatible
 * - Cross-platform using Node.js fs APIs
 *
 * Node.js only - requires file system access
 */

// Check if we're in Node.js environment
const isNodeJS = typeof require !== 'undefined' &&
                 typeof process !== 'undefined' &&
                 process.versions &&
                 process.versions.node;

// Only load Node.js dependencies if we're in Node.js
// This prevents webpack from trying to bundle them for the browser
let fs, path;

if (isNodeJS) {
  fs = require('fs');
  path = require('path');
}

/**
 * Helper to coerce boolean parameters that might be passed as strings or objects
 */
function toBool(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'object' && value.value !== undefined) {
    return toBool(value.value);
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
}

/**
 * Helper to coerce string parameters that might be passed as objects
 */
function toStr(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.value !== undefined) return String(value.value);
  return String(value);
}

/**
 * Check if pattern uses advanced glob features
 * @param {string} pattern - Pattern to check
 * @returns {boolean} True if pattern uses advanced features
 */
function hasAdvancedGlobFeatures(pattern) {
  // Check for character classes, brace expansion, extended globs, negation
  return /[\[\]\{\}\(\)\!]/.test(pattern);
}

/**
 * Simple wildcard pattern matching
 * Supports * (match any) and ? (match one character)
 * For advanced glob patterns, use extras/functions/minimatch module
 *
 * @param {string} str - String to test
 * @param {string} pattern - Pattern with * and ? wildcards
 * @returns {boolean} True if matches
 */
function matchWildcard(str, pattern) {
  // Check for advanced glob features and provide helpful error
  if (hasAdvancedGlobFeatures(pattern)) {
    throw new Error(
      `Pattern '${pattern}' uses advanced glob features (character classes, brace expansion, etc.).\n` +
      `Core shell functions only support simple wildcards: * and ?\n` +
      `For advanced patterns, use: REQUIRE "extras/functions/minimatch/minimatch-functions"`
    );
  }

  // Escape special regex characters except * and ?
  let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Handle ** (recursive wildcard) before single *
  // Use placeholder to avoid affecting it with later replacements
  escaped = escaped.replace(/\*\*\//g, '__RECURSIVE__');

  // Handle remaining wildcards
  escaped = escaped
    .replace(/\*/g, '[^/]*')  // * matches anything except /
    .replace(/\?/g, '[^/]');  // ? matches any single char except /

  // Replace placeholder with the actual regex pattern
  escaped = escaped.replace(/__RECURSIVE__/g, '(?:.*?/)?');

  const regex = new RegExp('^' + escaped + '$');
  return regex.test(str);
}

/**
 * Walk directory recursively and return all files
 * No dependencies - pure fs operations
 *
 * @param {string} dirPath - Directory to walk
 * @param {string} pattern - Optional wildcard pattern to filter files
 * @returns {Array} Array of file paths
 */
function walkDirectory(dirPath, pattern = null) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const results = [];

  function scan(dir) {
    try {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);

        try {
          const stats = fs.statSync(fullPath);

          if (stats.isFile()) {
            // Apply pattern filter if provided
            if (!pattern || matchWildcard(entry, pattern)) {
              results.push(fullPath);
            }
          } else if (stats.isDirectory()) {
            // Recurse into subdirectories
            scan(fullPath);
          }
        } catch (e) {
          // Skip files/directories we can't access
          continue;
        }
      }
    } catch (e) {
      // Skip directories we can't read
      return;
    }
  }

  const stats = fs.statSync(dirPath);
  if (stats.isDirectory()) {
    scan(dirPath);
  } else if (stats.isFile()) {
    // If given a file path, just return it
    results.push(dirPath);
  }

  return results;
}

/**
 * LS_Browser - Browser-mode directory listing using HTTP methods
 * Supports WebDAV PROPFIND, JSON APIs, and HTML parsing
 *
 * @param {string} pathArg - URL path (relative to document.location or absolute)
 * @param {boolean} recursive - List recursively
 * @param {string} pattern - Glob pattern filter
 * @param {string} type - Filter by type: "file" or "directory"
 * @returns {Promise<Array>} Array of file/directory objects
 */
async function LS_Browser(pathArg, recursive = false, pattern = null, type = null) {
  // Resolve URL - absolute or relative to document.location
  let url;
  if (pathArg.startsWith('http://') || pathArg.startsWith('https://')) {
    url = pathArg;
  } else if (pathArg === '.') {
    // Current directory = directory of current page
    url = new URL('.', document.location.href).href;
  } else {
    // Relative path
    url = new URL(pathArg, document.location.href).href;
  }

  // Ensure URL ends with / for directory requests
  if (!url.endsWith('/')) {
    url += '/';
  }

  const results = [];

  // Try PROPFIND for WebDAV servers
  try {
    const propfindResponse = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Depth': recursive ? 'infinity' : '1',
        'Content-Type': 'application/xml'
      }
    });

    if (propfindResponse.ok) {
      const xml = await propfindResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');

      // Parse WebDAV multistatus response
      const responses = doc.querySelectorAll('response');

      for (const response of responses) {
        const href = response.querySelector('href')?.textContent;
        if (!href) continue;

        // Skip the parent directory itself in depth=1
        const fullUrl = new URL(href, url).href;
        if (fullUrl === url) continue;

        const propstat = response.querySelector('propstat');
        const prop = propstat?.querySelector('prop');

        const displayName = prop?.querySelector('displayname')?.textContent || href.split('/').filter(Boolean).pop();
        const contentLength = parseInt(prop?.querySelector('getcontentlength')?.textContent || '0');
        const lastModified = prop?.querySelector('getlastmodified')?.textContent;
        const isCollection = prop?.querySelector('resourcetype collection') !== null;

        const fileInfo = {
          name: displayName,
          path: fullUrl,
          relativePath: fullUrl.replace(url, ''),
          size: contentLength,
          isFile: !isCollection,
          isDirectory: isCollection,
          created: lastModified || new Date().toISOString(),
          modified: lastModified || new Date().toISOString(),
          accessed: lastModified || new Date().toISOString()
        };

        // Apply type filter
        if (type === 'file' && !fileInfo.isFile) continue;
        if (type === 'directory' && !fileInfo.isDirectory) continue;

        // Apply pattern filter
        if (pattern && !matchWildcard(fileInfo.name, pattern)) continue;

        results.push(fileInfo);
      }

      return results;
    }
  } catch (propfindError) {
    // PROPFIND failed, try other methods
  }

  // Fallback: Try to fetch as JSON (common REST API pattern)
  try {
    const jsonResponse = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (jsonResponse.ok && jsonResponse.headers.get('content-type')?.includes('application/json')) {
      const data = await jsonResponse.json();

      // Support common JSON directory listing formats
      const items = Array.isArray(data) ? data : (data.files || data.items || data.entries || []);

      for (const item of items) {
        const fileInfo = {
          name: item.name || item.filename || item.path,
          path: new URL(item.name || item.filename || item.path, url).href,
          relativePath: item.name || item.filename || item.path,
          size: item.size || item.length || 0,
          isFile: item.type === 'file' || !item.isDirectory,
          isDirectory: item.type === 'directory' || item.isDirectory,
          created: item.created || item.createdAt || new Date().toISOString(),
          modified: item.modified || item.modifiedAt || item.mtime || new Date().toISOString(),
          accessed: item.accessed || item.atime || new Date().toISOString()
        };

        // Apply filters
        if (type === 'file' && !fileInfo.isFile) continue;
        if (type === 'directory' && !fileInfo.isDirectory) continue;
        if (pattern && !matchWildcard(fileInfo.name, pattern)) continue;

        results.push(fileInfo);
      }

      return results;
    }
  } catch (jsonError) {
    // JSON failed, continue to HTML parsing
  }

  // Fallback: Parse HTML directory listing (Apache, nginx, etc.)
  try {
    const htmlResponse = await fetch(url);
    if (htmlResponse.ok) {
      const html = await htmlResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Look for links in common directory listing formats
      const links = doc.querySelectorAll('a[href]');

      for (const link of links) {
        const href = link.getAttribute('href');
        if (!href || href === '../' || href === '.' || href === '/') continue;

        const name = link.textContent.trim() || href;
        const isDirectory = href.endsWith('/');

        const fileInfo = {
          name: isDirectory ? name.slice(0, -1) : name,
          path: new URL(href, url).href,
          relativePath: href,
          size: 0,  // Not available from HTML
          isFile: !isDirectory,
          isDirectory: isDirectory,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          accessed: new Date().toISOString()
        };

        // Apply filters
        if (type === 'file' && !fileInfo.isFile) continue;
        if (type === 'directory' && !fileInfo.isDirectory) continue;
        if (pattern && !matchWildcard(fileInfo.name, pattern)) continue;

        results.push(fileInfo);
      }

      return results;
    }
  } catch (htmlError) {
    throw new Error(`Failed to list directory at ${url}: ${htmlError.message}`);
  }

  return results;
}

/**
 * LS - List directory contents
 *
 * @param {string} path - Directory path
 * @param {boolean} recursive - List recursively
 * @param {string} pattern - Glob pattern filter (e.g., "*.txt")
 * @param {string} type - Filter by type: "file" or "directory"
 * @returns {Array} Array of file/directory objects with metadata
 */
function LS(pathArg, recursive = false, pattern = null, type = null) {
  const dirPath = pathArg || '.';
  recursive = toBool(recursive);

  // Browser mode: use HTTP methods
  if (!isNodeJS) {
    return LS_Browser(dirPath, recursive, pattern, type);
  }

  if (!fs.existsSync(dirPath)) {
    throw new Error(`Path does not exist: ${dirPath}`);
  }

  const results = [];

  function scan(dir, isRoot = true) {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);

      const fileInfo = {
        name: entry,
        path: fullPath,
        relativePath: path.relative(dirPath, fullPath),
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        accessed: stats.atime.toISOString(),
      };

      // Check if should recurse into directories
      const shouldRecurse = fileInfo.isDirectory && recursive;

      // Apply type filter
      if (type === 'file' && !fileInfo.isFile) {
        if (shouldRecurse) scan(fullPath, false);
        continue;
      }
      if (type === 'directory' && !fileInfo.isDirectory) {
        continue;
      }

      // Apply pattern filter
      if (pattern) {
        if (!matchWildcard(fileInfo.name, pattern)) {
          // For recursive, check if we should continue into directories
          if (shouldRecurse) {
            scan(fullPath, false);
          }
          continue;
        }
      }

      results.push(fileInfo);

      // Recurse into directories
      if (shouldRecurse) {
        scan(fullPath, false);
      }
    }
  }

  scan(dirPath);
  return results;
}

/**
 * CAT - Read file contents
 *
 * @param {string} path - File path
 * @param {string} encoding - File encoding (default: utf8)
 * @returns {string} File contents
 */
function CAT(pathArg, encoding = 'utf8') {
  if (!fs.existsSync(pathArg)) {
    throw new Error(`File does not exist: ${pathArg}`);
  }

  return fs.readFileSync(pathArg, encoding);
}

/**
 * GREP - Search for pattern in files
 *
 * @param {string} pattern - Regex pattern to search for
 * @param {string} path - File path or glob pattern
 * @param {boolean} recursive - Search recursively
 * @param {boolean} ignoreCase - Case-insensitive search
 * @returns {Array} Array of match objects with file, line, lineNumber
 */
function GREP(pattern, pathArg, recursive = false, ignoreCase = false) {
  recursive = toBool(recursive);
  ignoreCase = toBool(ignoreCase);
  const results = [];

  // Process escape sequences in the pattern
  // Convert REXX-style escaped strings to JavaScript regex patterns
  // E.g., "\\b" should become "\b" for word boundary
  let processedPattern = pattern;
  if (typeof pattern === 'string') {
    // Replace double backslashes with single for common regex escape sequences
    processedPattern = pattern
      .replace(/\\\\b/g, '\\b')     // Word boundary
      .replace(/\\\\B/g, '\\B')     // Non-word boundary
      .replace(/\\\\d/g, '\\d')     // Digit
      .replace(/\\\\D/g, '\\D')     // Non-digit
      .replace(/\\\\s/g, '\\s')     // Whitespace
      .replace(/\\\\S/g, '\\S')     // Non-whitespace
      .replace(/\\\\w/g, '\\w')     // Word character
      .replace(/\\\\W/g, '\\W')     // Non-word character
      .replace(/\\\\t/g, '\\t')     // Tab
      .replace(/\\\\n/g, '\\n')     // Newline
      .replace(/\\\\r/g, '\\r');    // Carriage return
  }

  // Determine files to search
  let files = [];
  if (pathArg.includes('*') || pathArg.includes('?')) {
    // It's a wildcard pattern - extract base directory before any wildcards
    // Handle patterns like "dir/**/*.txt" or "dir/*.txt"
    const firstWildcard = Math.min(
      pathArg.indexOf('*') === -1 ? Infinity : pathArg.indexOf('*'),
      pathArg.indexOf('?') === -1 ? Infinity : pathArg.indexOf('?')
    );
    const pathBeforeWildcard = pathArg.substring(0, firstWildcard);
    const lastSlash = pathBeforeWildcard.lastIndexOf(path.sep);

    const dirPath = lastSlash > 0 ? pathBeforeWildcard.substring(0, lastSlash) : '.';
    const filePattern = pathArg.substring(lastSlash + 1);

    if (fs.existsSync(dirPath)) {
      // Walk directory and filter by pattern manually
      const allFiles = walkDirectory(dirPath);
      // For patterns with path separators (like **/*.txt), match against relative path
      files = allFiles.filter(f => {
        const relativePath = path.relative(dirPath, f);
        return matchWildcard(relativePath, filePattern);
      });
    } else {
      throw new Error(`Path does not exist: ${dirPath}`);
    }
  } else if (fs.existsSync(pathArg)) {
    const stats = fs.statSync(pathArg);
    if (stats.isFile()) {
      files = [pathArg];
    } else if (stats.isDirectory() && recursive) {
      // Search all files in directory recursively
      files = walkDirectory(pathArg);
    } else if (stats.isDirectory()) {
      // Search files in directory (non-recursive)
      const entries = fs.readdirSync(pathArg);
      files = entries
        .map(e => path.join(pathArg, e))
        .filter(f => {
          try {
            return fs.statSync(f).isFile();
          } catch (e) {
            return false;
          }
        });
    }
  } else {
    throw new Error(`Path does not exist: ${pathArg}`);
  }

  // Create regex
  const flags = ignoreCase ? 'gi' : 'g';
  const regex = new RegExp(processedPattern, flags);

  // Search each file
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          results.push({
            file,
            line,
            lineNumber: index + 1,
            match: pattern,
          });
        }
        // Reset regex lastIndex for global flag
        regex.lastIndex = 0;
      });
    } catch (err) {
      // Skip files that can't be read (binary, permissions, etc.)
      continue;
    }
  }

  return results;
}

/**
 * FIND - Find files matching criteria
 *
 * @param {string} path - Starting directory
 * @param {string} type - Filter by type: "file" or "directory"
 * @param {string} name - Glob pattern for name
 * @param {number} modifiedWithin - Files modified within N days
 * @param {number} minSize - Minimum file size in bytes
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Array} Array of file objects
 */
function FIND(pathArg = '.', type = null, name = null, modifiedWithin = null, minSize = null, maxSize = null) {
  if (!fs.existsSync(pathArg)) {
    throw new Error(`Path does not exist: ${pathArg}`);
  }

  const results = [];
  const now = Date.now();
  const modifiedCutoff = modifiedWithin ? now - (modifiedWithin * 24 * 60 * 60 * 1000) : null;

  function scan(dir) {
    const entries = fs.readdirSync(dir);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);

      const fileInfo = {
        name: entry,
        path: fullPath,
        relativePath: path.relative(pathArg, fullPath),
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        accessed: stats.atime.toISOString(),
        modifiedTime: stats.mtime.getTime(),
      };

      // Apply filters
      if (type === 'file' && !fileInfo.isFile) {
        if (fileInfo.isDirectory) scan(fullPath);
        continue;
      }
      if (type === 'directory' && !fileInfo.isDirectory) continue;

      // Name pattern filter
      if (name) {
        if (!matchWildcard(fileInfo.name, name)) {
          if (fileInfo.isDirectory) scan(fullPath);
          continue;
        }
      }

      // Modified time filter
      if (modifiedCutoff && fileInfo.modifiedTime < modifiedCutoff) {
        if (fileInfo.isDirectory) scan(fullPath);
        continue;
      }

      // Size filters
      if (minSize !== null && fileInfo.size < minSize) continue;
      if (maxSize !== null && fileInfo.size > maxSize) continue;

      results.push(fileInfo);

      // Recurse into directories
      if (fileInfo.isDirectory) {
        scan(fullPath);
      }
    }
  }

  scan(pathArg);
  return results;
}

/**
 * MKDIR - Create directory
 *
 * @param {string} path - Directory path to create
 * @param {boolean} recursive - Create parent directories if needed
 */
function MKDIR(pathArg, recursive = false) {
  recursive = toBool(recursive);
  if (fs.existsSync(pathArg)) {
    // Already exists, that's okay
    return;
  }

  fs.mkdirSync(pathArg, { recursive });
}

/**
 * CP - Copy file or directory
 *
 * @param {string} source - Source path
 * @param {string} dest - Destination path
 * @param {boolean} recursive - Copy directories recursively
 */
function CP(source, dest, recursive = false) {
  recursive = toBool(recursive);
  if (!fs.existsSync(source)) {
    throw new Error(`Source does not exist: ${source}`);
  }

  const stats = fs.statSync(source);

  if (stats.isFile()) {
    fs.copyFileSync(source, dest);
  } else if (stats.isDirectory()) {
    if (!recursive) {
      throw new Error(`Cannot copy directory without recursive flag: ${source}`);
    }

    // Create destination directory
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // Copy all contents
    const entries = fs.readdirSync(source);
    for (const entry of entries) {
      const srcPath = path.join(source, entry);
      const destPath = path.join(dest, entry);
      CP(srcPath, destPath, true);
    }
  }
}

/**
 * MV - Move/rename file or directory
 *
 * @param {string} source - Source path
 * @param {string} dest - Destination path
 */
function MV(source, dest) {
  if (!fs.existsSync(source)) {
    throw new Error(`Source does not exist: ${source}`);
  }

  fs.renameSync(source, dest);
}

/**
 * RM - Remove file or directory
 *
 * @param {string} path - Path to remove
 * @param {boolean} recursive - Remove directories recursively
 * @param {boolean} force - Don't throw error if path doesn't exist
 */
function RM(pathArg, recursive = false, force = false) {
  recursive = toBool(recursive);
  force = toBool(force);
  if (!fs.existsSync(pathArg)) {
    if (force) return;
    throw new Error(`Path does not exist: ${pathArg}`);
  }

  const stats = fs.statSync(pathArg);

  if (stats.isFile()) {
    fs.unlinkSync(pathArg);
  } else if (stats.isDirectory()) {
    if (!recursive) {
      // Check if directory is empty
      const entries = fs.readdirSync(pathArg);
      if (entries.length > 0) {
        throw new Error(`Directory not empty (use recursive=true): ${pathArg}`);
      }
    }
    fs.rmSync(pathArg, { recursive, force });
  }
}

/**
 * STAT - Get file/directory metadata
 *
 * @param {string} path - File or directory path
 * @returns {Object} File statistics
 */
function STAT(pathArg) {
  if (!fs.existsSync(pathArg)) {
    throw new Error(`Path does not exist: ${pathArg}`);
  }

  const stats = fs.statSync(pathArg);

  return {
    path: pathArg,
    size: stats.size,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    isSymbolicLink: stats.isSymbolicLink(),
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    accessed: stats.atime.toISOString(),
    mode: stats.mode,
    uid: stats.uid,
    gid: stats.gid,
  };
}

/**
 * BASENAME - Get base name of path
 *
 * @param {string} path - File path
 * @param {string} ext - Optional extension to remove
 * @returns {string} Base name
 */
function BASENAME(pathArg, ext = '') {
  return path.basename(pathArg, ext);
}

/**
 * DIRNAME - Get directory name of path
 *
 * @param {string} path - File path
 * @returns {string} Directory name
 */
function DIRNAME(pathArg) {
  return path.dirname(pathArg);
}

/**
 * PATH_JOIN - Join path components
 *
 * @param {Array|string} parts - Path parts to join (array or first part)
 * @param {...string} moreParts - Additional path parts (if using variadic style)
 * @returns {string} Joined path
 */
function PATH_JOIN(parts, ...moreParts) {
  // Support both array style: PATH_JOIN(parts=["a", "b"])
  // and variadic style: PATH_JOIN("a", "b", "c")
  if (Array.isArray(parts)) {
    return path.join(...parts);
  } else if (typeof parts === 'string' && parts.startsWith('[')) {
    // Handle stringified array (parameter conversion issue)
    try {
      const parsedParts = JSON.parse(parts);
      if (Array.isArray(parsedParts)) {
        return path.join(...parsedParts);
      }
    } catch (e) {
      // Not a valid JSON array, fall through
    }
  }

  if (moreParts.length > 0) {
    return path.join(parts, ...moreParts);
  } else if (typeof parts === 'string') {
    return parts;
  } else {
    throw new Error(`PATH_JOIN requires an array of path parts or multiple string arguments (received: ${typeof parts}, value: ${parts})`);
  }
}

/**
 * PATH_RESOLVE - Resolve to absolute path
 *
 * @param {string} pathArg - Path to resolve
 * @returns {string} Absolute path
 */
function PATH_RESOLVE(pathArg) {
  return path.resolve(pathArg);
}

/**
 * PATH_EXTNAME - Get file extension
 *
 * @param {string} pathArg - File path
 * @returns {string} File extension (including dot)
 */
function PATH_EXTNAME(pathArg) {
  return path.extname(pathArg);
}

/**
 * HEAD - Get first N lines from text or file
 *
 * @param {string|Array} input - Text string, array of lines, or file path
 * @param {number} lines - Number of lines to return (default: 10)
 * @returns {string|Array} First N lines (returns same type as input)
 */
function HEAD(input, lines = 10) {
  const n = parseInt(lines) || 10;

  // Handle array input (pipeline-friendly)
  if (Array.isArray(input)) {
    return input.slice(0, n);
  }

  // Handle string input
  if (typeof input === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(input)) {
      const content = fs.readFileSync(input, 'utf8');
      const allLines = content.split('\n');
      return allLines.slice(0, n).join('\n');
    } else {
      // It's text content
      const allLines = input.split('\n');
      return allLines.slice(0, n).join('\n');
    }
  }

  throw new Error('HEAD requires a string or array as input');
}

/**
 * TAIL - Get last N lines from text or file
 *
 * @param {string|Array} input - Text string, array of lines, or file path
 * @param {number} lines - Number of lines to return (default: 10)
 * @returns {string|Array} Last N lines (returns same type as input)
 */
function TAIL(input, lines = 10) {
  const n = parseInt(lines) || 10;

  // Handle array input (pipeline-friendly)
  if (Array.isArray(input)) {
    return input.slice(-n);
  }

  // Handle string input
  if (typeof input === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(input)) {
      const content = fs.readFileSync(input, 'utf8');
      const allLines = content.split('\n');
      return allLines.slice(-n).join('\n');
    } else {
      // It's text content
      const allLines = input.split('\n');
      return allLines.slice(-n).join('\n');
    }
  }

  throw new Error('TAIL requires a string or array as input');
}

/**
 * Word, line, and character count (like Unix wc)
 * @param {string|Array} input - Input text or array of lines
 * @param {string} [type] - Type of count: "lines", "words", "chars", or undefined for object with all counts
 * @returns {number|Object} Count of specified type or object with all counts
 */
function WC(input, type) {
  let text;

  // Convert input to text string
  if (Array.isArray(input)) {
    text = input.join('\n');
  } else if (typeof input === 'string') {
    text = input;
  } else {
    throw new Error('WC input must be a string or array of strings');
  }

  // Calculate counts
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  const words = text ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  // Return specific count or full object
  switch (type) {
    case 'lines':
      return lines;
    case 'words':
      return words;
    case 'chars':
      return chars;
    default:
      return { lines, words, chars };
  }
}

/**
 * SORT - Sort lines
 *
 * @param {string|Array} input - Text string, array, or file path
 * @param {boolean} reverse - Reverse sort order (default: false)
 * @param {boolean} numeric - Numeric sort (default: false)
 * @param {boolean} unique - Remove duplicates (default: false)
 * @returns {string|Array} Sorted lines (returns same type as input)
 */
function SORT(input, reverse = false, numeric = false, unique = false) {
  // Normalize boolean parameters - handle strings "true"/"false"
  reverse = toBool(reverse);
  numeric = toBool(numeric);
  unique = toBool(unique);

  let lines = [];
  const isArray = Array.isArray(input);

  if (isArray) {
    lines = [...input];
  } else if (typeof input === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(input)) {
      const content = fs.readFileSync(input, 'utf8');
      lines = content.split('\n');
    } else {
      lines = input.split('\n');
    }
  } else {
    throw new Error('SORT requires a string or array as input');
  }

  // Sort
  if (numeric) {
    lines.sort((a, b) => {
      const numA = parseFloat(String(a)) || 0;
      const numB = parseFloat(String(b)) || 0;
      return numA - numB;
    });
  } else {
    lines.sort();
  }

  if (reverse) {
    lines.reverse();
  }

  if (unique) {
    lines = [...new Set(lines)];
  }

  return isArray ? lines : lines.join('\n');
}

/**
 * UNIQ - Remove duplicate adjacent lines
 *
 * @param {string|Array} input - Text string, array, or file path
 * @param {boolean} count - Show count of occurrences (default: false)
 * @returns {string|Array} Unique lines (returns same type as input)
 */
function UNIQ(input, count = false) {
  count = toBool(count);

  let lines = [];
  const isArray = Array.isArray(input);

  if (isArray) {
    lines = [...input];
  } else if (typeof input === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(input)) {
      const content = fs.readFileSync(input, 'utf8');
      lines = content.split('\n');
    } else {
      lines = input.split('\n');
    }
  } else {
    throw new Error('UNIQ requires a string or array as input');
  }

  const result = [];
  let prevLine = null;
  let lineCount = 0;

  for (const line of lines) {
    if (line === prevLine) {
      lineCount++;
    } else {
      if (prevLine !== null) {
        result.push(count ? `${lineCount} ${prevLine}` : prevLine);
      }
      prevLine = line;
      lineCount = 1;
    }
  }

  // Don't forget the last line
  if (prevLine !== null) {
    result.push(count ? `${lineCount} ${prevLine}` : prevLine);
  }

  return isArray ? result : result.join('\n');
}

/**
 * SEQ - Generate sequence of numbers
 *
 * @param {number} start - Start value (or end if only one arg)
 * @param {number} end - End value
 * @param {number} step - Step increment (default: 1)
 * @returns {Array} Array of numbers
 */
function SEQ(start, end = null, step = 1) {
  let begin, finish;

  if (end === null) {
    // Called with single argument: SEQ(5) => 1..5
    begin = 1;
    finish = parseInt(start);
  } else {
    begin = parseInt(start);
    finish = parseInt(end);
  }

  step = parseInt(step);
  if (isNaN(step)) step = 1;

  const result = [];

  if (step === 0) {
    throw new Error('SEQ step cannot be zero');
  }

  if (step > 0) {
    for (let i = begin; i <= finish; i += step) {
      result.push(i);
    }
  } else {
    // step < 0
    for (let i = begin; i >= finish; i += step) {
      result.push(i);
    }
  }

  return result;
}

/**
 * SHUF - Shuffle lines randomly
 *
 * @param {string|Array} input - Text string, array, or file path
 * @returns {string|Array} Shuffled lines (returns same type as input)
 */
function SHUF(input) {
  let lines = [];
  const isArray = Array.isArray(input);

  if (isArray) {
    lines = [...input];
  } else if (typeof input === 'string') {
    // Check if it's a file path
    if (isNodeJS && fs.existsSync(input)) {
      const content = fs.readFileSync(input, 'utf8');
      lines = content.split('\n');
    } else {
      lines = input.split('\n');
    }
  } else {
    throw new Error('SHUF requires a string or array as input');
  }

  // Fisher-Yates shuffle
  for (let i = lines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lines[i], lines[j]] = [lines[j], lines[i]];
  }

  return isArray ? lines : lines.join('\n');
}

/**
 * Extract fields from text lines (like Unix cut)
 * @param {string|Array} input - Input text or array of lines
 * @param {string} [fields] - Field numbers to extract (e.g., "2" or "1,3")
 * @param {string} [delimiter] - Field delimiter (default: tab)
 * @returns {Array} Array of extracted field values
 */
function CUT(input, fields = "1", delimiter = "\t") {
  let lines;

  // Convert input to array of lines
  if (Array.isArray(input)) {
    lines = input;
  } else if (typeof input === 'string') {
    lines = input.split('\n');
  } else {
    throw new Error('CUT input must be a string or array of strings');
  }

  // Parse field numbers (supports ranges like "2-3" and lists like "1,3")
  const fieldNums = [];
  const fieldSpecs = fields.split(',');

  for (const spec of fieldSpecs) {
    const trimmed = spec.trim();
    if (trimmed.includes('-')) {
      // Range like "2-3"
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      for (let i = start; i <= end; i++) {
        fieldNums.push(i - 1); // Convert to 0-based
      }
    } else {
      // Single field
      fieldNums.push(parseInt(trimmed) - 1); // Convert to 0-based
    }
  }

  const result = [];
  for (const line of lines) {
    const parts = line.split(delimiter);
    const extracted = fieldNums.map(fieldNum => parts[fieldNum] || '');

    if (fieldNums.length === 1) {
      // Single field - return just the value
      result.push(extracted[0] || '');
    } else {
      // Multiple fields - join with delimiter
      result.push(extracted.join(delimiter));
    }
  }

  return result;
}

/**
 * Combine arrays side by side (like Unix paste)
 * @param {Array} inputs - Array of arrays to combine
 * @param {string} [delimiter] - Delimiter between fields (default: tab)
 * @returns {Array} Array of combined lines
 */
function PASTE(inputs, delimiter = "\t") {
  if (!Array.isArray(inputs)) {
    throw new Error('PASTE inputs must be an array of arrays');
  }

  // Find the maximum length
  const maxLength = Math.max(...inputs.map(arr => Array.isArray(arr) ? arr.length : 0));

  const result = [];
  for (let i = 0; i < maxLength; i++) {
    const line = inputs.map(arr => {
      if (Array.isArray(arr) && i < arr.length) {
        return arr[i];
      }
      return '';
    }).join(delimiter);
    result.push(line);
  }

  return result;
}

/**
 * TEE - Write to file and pass through to output
 *
 * @param {string|Array} input - Data to write
 * @param {string} file - File path to write to
 * @param {boolean} append - Append to file instead of overwrite (default: false)
 * @returns {string|Array} Input data (passed through)
 */
function TEE(input, file, append = false) {
  if (!file) {
    throw new Error('TEE requires a file path');
  }

  append = toBool(append);

  let content;
  if (Array.isArray(input)) {
    content = input.join('\n');
  } else if (typeof input === 'string') {
    content = input;
  } else {
    throw new Error('TEE requires a string or array as input');
  }

  if (isNodeJS) {
    if (append) {
      fs.appendFileSync(file, content + '\n');
    } else {
      fs.writeFileSync(file, content + '\n');
    }
  }

  return input; // Pass through
}

/**
 * XARGS - Build and execute commands from input
 *
 * @param {string|Array} input - Input lines to process
 * @param {string} command - Command template with {} placeholder
 * @param {number} maxArgs - Max arguments per command invocation (default: unlimited)
 * @returns {Array} Results from each command execution
 */
function XARGS(input, command, maxArgs = null) {
  // Normalize parameters
  command = toStr(command);

  if (!command) {
    throw new Error('XARGS requires a command parameter');
  }

  let lines = [];

  if (Array.isArray(input)) {
    lines = input.map(String);
  } else if (typeof input === 'string') {
    // Handle both actual newlines and escaped newlines
    const normalized = input.replace(/\\n/g, '\n');
    lines = normalized.split('\n').filter(line => line.trim().length > 0);
  } else {
    throw new Error('XARGS requires a string or array as input');
  }

  const results = [];
  const maxPerCall = maxArgs ? parseInt(maxArgs) : lines.length;

  // Process in batches
  for (let i = 0; i < lines.length; i += maxPerCall) {
    const batch = lines.slice(i, i + maxPerCall);

    // Replace {} with arguments, or append if no placeholder
    let finalCommand;
    if (command.includes('{}')) {
      finalCommand = command.replace('{}', batch.join(' '));
    } else {
      finalCommand = `${command} ${batch.join(' ')}`;
    }

    // Execute command (simplified - in real use, would need proper command parsing)
    // For now, just return the command that would be executed
    results.push(finalCommand);
  }

  return results;
}

// Export functions only in Node.js environment
// In browser mode, export empty object (these functions won't be used)
if (isNodeJS) {
  module.exports = {
    LS,
    CAT,
    GREP,
    FIND,
    MKDIR,
    CP,
    MV,
    RM,
    STAT,
    BASENAME,
    DIRNAME,
    PATH_JOIN,
    PATH_RESOLVE,
    PATH_EXTNAME,
    HEAD,
    TAIL,
    WC,
    SORT,
    UNIQ,
    CUT,
    PASTE,
    SEQ,
    SHUF,
    TEE,
    XARGS,
  };
} else if (typeof module !== 'undefined' && module.exports) {
  // Browser mode with module system (webpack) - export empty object
  module.exports = {};
} else {
  // Other environments - do nothing
}
