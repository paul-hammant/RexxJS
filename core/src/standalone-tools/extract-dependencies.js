#!/usr/bin/env node

/**
 * RexxJS Dependency Extraction Tool
 * 
 * This tool helps security scanning tools (like Sonatype, OWASP Dependency-Check, Snyk)
 * extract dependency information from RexxJS libraries that use inline dependency declarations.
 * 
 * Usage:
 *   node extract-dependencies.js <file.js>
 *   node extract-dependencies.js <directory>
 *   node extract-dependencies.js <github-url>
 * 
 * Output formats:
 *   --format json    (default)
 *   --format csv
 *   --format sbom    (SPDX SBOM format)
 *   --format package (package.json style)
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

const fs = require('fs');
const path = require('path');
const https = require('https');

class RexxJSDependencyExtractor {
  constructor() {
    this.dependencies = new Map();
  }

  // Extract dependencies from JavaScript file content
  extractFromContent(content, filePath = 'unknown') {
    const result = {
      file: filePath,
      dependencies: [],
      devDependencies: [],
      peerDependencies: [],
      optionalDependencies: [],
      errors: []
    };

    try {
      // 1. Extract from preserved comment format (minification-safe, jQuery-style)
      const preservedDeps = this.extractPreservedCommentDependencies(content);
      if (preservedDeps) {
        result.dependencies = preservedDeps.dependencies || [];
        result.devDependencies = preservedDeps.devDependencies || [];
        result.peerDependencies = preservedDeps.peerDependencies || [];
        result.optionalDependencies = preservedDeps.optionalDependencies || [];
      }

      // 2. Fallback: Extract from standardized JSON format
      if (result.dependencies.length === 0) {
        const jsonDeps = this.extractJsonDependencies(content);
        if (jsonDeps) {
          result.dependencies = jsonDeps.dependencies || [];
          result.devDependencies = jsonDeps.devDependencies || [];
          result.peerDependencies = jsonDeps.peerDependencies || [];
          result.optionalDependencies = jsonDeps.optionalDependencies || [];
        }
      }

      // 3. Final fallback: Legacy comment format
      if (result.dependencies.length === 0) {
        result.dependencies = this.extractLegacyDependencies(content);
      }

      // 3. Extract from runtime metadata (if detection function is present)
      const runtimeDeps = this.extractRuntimeDependencies(content);
      if (runtimeDeps.length > 0) {
        // Merge with existing dependencies
        result.dependencies = [...new Set([...result.dependencies, ...runtimeDeps])];
      }

    } catch (error) {
      result.errors.push(error.message);
    }

    return result;
  }

  extractPreservedCommentDependencies(content) {
    // jQuery-style preserved comments: /*! ... @rexxjs-meta {...} ... */
    const preservedCommentPattern = /\/\*!\s*[\s\S]*?@rexxjs-meta\s+(\{[\s\S]*?\})/i;
    const match = preservedCommentPattern.exec(content);
    
    if (match) {
      try {
        const depData = JSON.parse(match[1]);
        return {
          dependencies: Object.keys(depData.dependencies || {}),
          devDependencies: Object.keys(depData.devDependencies || {}),
          peerDependencies: Object.keys(depData.peerDependencies || {}),
          optionalDependencies: Object.keys(depData.optionalDependencies || {})
        };
      } catch (error) {
        throw new Error(`Failed to parse preserved comment dependencies: ${error.message}`);
      }
    }
    
    return null;
  }

  extractJsonDependencies(content) {
    const jsonDepPattern = /@rexxjs-meta-start\s*\*\s*([\s\S]*?)\s*\*\s*@rexxjs-meta-end/i;
    const match = jsonDepPattern.exec(content);
    
    if (match) {
      try {
        const jsonStr = match[1].replace(/\*\s*/g, '').trim();
        const depData = JSON.parse(jsonStr);
        
        return {
          dependencies: Object.keys(depData.dependencies || {}),
          devDependencies: Object.keys(depData.devDependencies || {}),
          peerDependencies: Object.keys(depData.peerDependencies || {}),
          optionalDependencies: Object.keys(depData.optionalDependencies || {})
        };
      } catch (error) {
        throw new Error(`Failed to parse JSON dependencies: ${error.message}`);
      }
    }
    
    return null;
  }

  extractLegacyDependencies(content) {
    const dependencies = [];
    
    // @dependencies pattern
    const depPattern = /\/\*\s*@dependencies?\s+(.*?)\s*\*\//gi;
    let match;
    while ((match = depPattern.exec(content)) !== null) {
      const deps = match[1].split(/[\s,]+/).filter(dep => dep.trim());
      dependencies.push(...deps);
    }
    
    // @require pattern
    const requirePattern = /\/\*\s*@require\s+(.*?)\s*\*\//gi;
    while ((match = requirePattern.exec(content)) !== null) {
      const deps = match[1].split(/[\s,]+/).filter(dep => dep.trim());
      dependencies.push(...deps);
    }
    
    return [...new Set(dependencies)];
  }

  extractRuntimeDependencies(content) {
    // Look for dependencies in detection function return value
    const functionPattern = /['"](\w+)_MAIN['"]:\s*\(\)\s*=>\s*\{[\s\S]*?dependencies:\s*\[([\s\S]*?)\]/i;
    const match = functionPattern.exec(content);
    
    if (match) {
      try {
        const depsStr = match[2];
        // Extract quoted strings
        const depPattern = /['"`](.*?)['"`]/g;
        const dependencies = [];
        let depMatch;
        
        while ((depMatch = depPattern.exec(depsStr)) !== null) {
          dependencies.push(depMatch[1]);
        }
        
        return dependencies;
      } catch (error) {
        // Ignore runtime extraction errors
      }
    }
    
    return [];
  }

  // Extract from file
  async extractFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return this.extractFromContent(content, filePath);
  }

  // Extract from directory (recursively)
  async extractFromDirectory(dirPath) {
    const results = [];
    
    const processDirectory = (dir) => {
      const entries = fs.readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else if (entry.endsWith('.js')) {
          try {
            const result = this.extractFromFile(fullPath);
            if (result.dependencies.length > 0 || result.errors.length > 0) {
              results.push(result);
            }
          } catch (error) {
            results.push({
              file: fullPath,
              dependencies: [],
              errors: [error.message]
            });
          }
        }
      }
    };

    processDirectory(dirPath);
    return results;
  }

  // Extract from GitHub URL
  async extractFromUrl(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = this.extractFromContent(data, url);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  // Output formatting
  formatAsJson(results) {
    return JSON.stringify(Array.isArray(results) ? results : [results], null, 2);
  }

  formatAsCsv(results) {
    const rows = ['File,Dependency,Type,Version'];
    const resultArray = Array.isArray(results) ? results : [results];
    
    for (const result of resultArray) {
      // Regular dependencies
      for (const dep of result.dependencies) {
        const [name, version] = dep.includes('@') ? dep.split('@') : [dep, 'latest'];
        rows.push(`"${result.file}","${name}","dependency","${version}"`);
      }
      
      // Dev dependencies
      for (const dep of result.devDependencies || []) {
        const [name, version] = dep.includes('@') ? dep.split('@') : [dep, 'latest'];
        rows.push(`"${result.file}","${name}","devDependency","${version}"`);
      }
    }
    
    return rows.join('\n');
  }

  formatAsPackageJson(results) {
    const resultArray = Array.isArray(results) ? results : [results];
    const allDeps = {};
    const allDevDeps = {};
    
    for (const result of resultArray) {
      for (const dep of result.dependencies) {
        const [name, version] = dep.includes('@') ? dep.split('@') : [dep, 'latest'];
        allDeps[name] = version;
      }
      
      for (const dep of result.devDependencies || []) {
        const [name, version] = dep.includes('@') ? dep.split('@') : [dep, 'latest'];
        allDevDeps[name] = version;
      }
    }
    
    return JSON.stringify({
      name: 'extracted-dependencies',
      version: '1.0.0',
      dependencies: allDeps,
      devDependencies: allDevDeps
    }, null, 2);
  }

  formatAsSbom(results) {
    // SPDX SBOM format (simplified)
    const resultArray = Array.isArray(results) ? results : [results];
    const packages = [];
    
    for (const result of resultArray) {
      for (const dep of result.dependencies) {
        const [name, version] = dep.includes('@') ? dep.split('@') : [dep, 'latest'];
        packages.push({
          SPDXID: `SPDXRef-Package-${name.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: name,
          downloadLocation: `https://raw.githubusercontent.com/${name}/main/dist/${name.split('/').pop()}.js`,
          filesAnalyzed: false,
          versionInfo: version
        });
      }
    }
    
    return JSON.stringify({
      spdxVersion: 'SPDX-2.2',
      dataLicense: 'CC0-1.0',
      SPDXID: 'SPDXRef-DOCUMENT',
      name: 'RexxJS Dependencies SBOM',
      documentNamespace: `https://sbom.example/rexxjs-deps-${Date.now()}`,
      creationInfo: {
        created: new Date().toISOString(),
        creators: ['Tool: rexxjs-dependency-extractor']
      },
      packages: packages
    }, null, 2);
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node extract-dependencies.js <file|directory|url> [--format json|csv|sbom|package]');
    process.exit(1);
  }

  const target = args[0];
  const formatArg = args.find(arg => arg.startsWith('--format='));
  const format = formatArg ? formatArg.split('=')[1] : 'json';

  const extractor = new RexxJSDependencyExtractor();
  
  try {
    let results;
    
    if (target.startsWith('http')) {
      results = await extractor.extractFromUrl(target);
    } else if (fs.existsSync(target)) {
      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        results = await extractor.extractFromDirectory(target);
      } else {
        results = await extractor.extractFromFile(target);
      }
    } else {
      throw new Error(`Target not found: ${target}`);
    }

    // Output in requested format
    switch (format) {
      case 'csv':
        console.log(extractor.formatAsCsv(results));
        break;
      case 'sbom':
        console.log(extractor.formatAsSbom(results));
        break;
      case 'package':
        console.log(extractor.formatAsPackageJson(results));
        break;
      case 'json':
      default:
        console.log(extractor.formatAsJson(results));
        break;
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
if (require.main === module) {
  main();
} else {
  module.exports = { RexxJSDependencyExtractor };
}

/*
USAGE EXAMPLES:

# Extract from single file
node extract-dependencies.js my-library.js

# Extract from directory
node extract-dependencies.js ./src --format=csv

# Extract from GitHub URL
node extract-dependencies.js https://raw.githubusercontent.com/alice/data-analysis/main/dist/data-analysis.js --format=sbom

# Generate package.json style output
node extract-dependencies.js ./libs --format=package

INTEGRATION WITH SECURITY TOOLS:

1. Sonatype Nexus IQ:
   - Use this tool to generate SBOM format
   - Import SBOM into Nexus for vulnerability scanning

2. OWASP Dependency-Check:
   - Generate CSV format for batch processing
   - Custom analyzer plugin can use this tool

3. Snyk:
   - Generate package.json format
   - Use Snyk CLI with generated package.json

4. CI/CD Integration:
   - Add to GitHub Actions, GitLab CI, etc.
   - Fail builds if high-risk dependencies found
*/