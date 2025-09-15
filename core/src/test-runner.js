#!/usr/bin/env node
/**
 * REXX Test Runner
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
 * 
 * Discovers and runs REXX test scripts with multiple describe blocks
 * Supports filtering by glob patterns, tags, and specific describe targets
 * 
 * Usage:
 *   node src/test-runner.js [options]
 *   
 * Options:
 *   --pattern <glob>     Test file pattern (default: **\/*-tests.rexx, **\/*-specs.rexx)
 *   --tags <tags>        Filter by tags (comma-separated)
 *   --describe <name>    Run specific describe block only
 *   --verbose, -v        Verbose output
 *   --timeout <ms>       Test timeout (default: 15000)
 *   --help, -h           Show help
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const glob = require('glob');

class RexxTestRunner {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.timeout = options.timeout || 15000;
    this.tags = options.tags || [];
    this.patterns = options.patterns || ['**/*-tests.rexx', '**/*-specs.rexx'];
    this.targetDescribe = options.describe || null;
    this.rootDir = options.rootDir || process.cwd();
  }

  async run() {
    console.log('🧪 REXX Test Runner');
    console.log(`📂 Root directory: ${this.rootDir}`);
    
    if (this.tags.length > 0) {
      console.log(`🏷️  Tag filter: ${this.tags.join(', ')}`);
    }
    if (this.targetDescribe) {
      console.log(`🎯 Target describe: ${this.targetDescribe}`);
    }
    
    // Find test files
    const testFiles = await this.findTestFiles();
    console.log(`📁 Found ${testFiles.length} test files`);
    
    if (testFiles.length === 0) {
      console.log('ℹ️  No test files found. Looking for *-tests.rexx or *-specs.rexx files.');
      return;
    }
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalFiles = 0;
    let skippedFiles = 0;
    
    for (const testFile of testFiles) {
      const metadata = this.parseMetadata(testFile);
      
      // Apply tag filtering
      if (this.tags.length > 0 && !this.matchesTags(metadata.tags)) {
        if (this.verbose) {
          console.log(`⏭️  Skipping ${path.basename(testFile)} (tags: ${metadata.tags.join(', ')})`);
        }
        skippedFiles++;
        continue;
      }
      
      totalFiles++;
      console.log(`\n🚀 ${path.relative(this.rootDir, testFile)}`);
      
      if (metadata.description) {
        console.log(`   ${metadata.description}`);
      }
      if (metadata.tags.length > 0) {
        console.log(`   🏷️  ${metadata.tags.join(', ')}`);
      }
      
      const result = await this.runTestFile(testFile);
      totalPassed += result.passed;
      totalFailed += result.failed;
      
      if (result.code !== 0) {
        console.log(`   ⚠️  Process exited with code ${result.code}`);
      }
    }
    
    // Final summary
    console.log(`\n🏁 Final Results:`);
    console.log(`   📄 ${totalFiles} files executed (${skippedFiles} skipped)`);
    console.log(`   ✅ ${totalPassed} tests passed`);
    console.log(`   ❌ ${totalFailed} tests failed`);
    
    if (totalFailed > 0) {
      console.log(`\n💥 ${totalFailed} test(s) failed!`);
      process.exit(1);
    } else if (totalPassed > 0) {
      console.log(`\n🎉 All tests passed!`);
      process.exit(0);
    } else {
      console.log(`\n🤷 No tests were executed.`);
      process.exit(0);
    }
  }

  async findTestFiles() {
    const files = [];
    
    for (const pattern of this.patterns) {
      try {
        const matches = await new Promise((resolve, reject) => {
          glob(pattern, { 
            cwd: this.rootDir,
            ignore: ['node_modules/**', '.git/**'],
            absolute: true
          }, (error, files) => {
            if (error) reject(error);
            else resolve(files);
          });
        });
        files.push(...matches);
      } catch (error) {
        console.warn(`⚠️  Error with pattern ${pattern}: ${error.message}`);
      }
    }
    
    // Remove duplicates and sort
    return [...new Set(files)].sort();
  }

  parseMetadata(filePath) {
    const metadata = {
      tags: [],
      description: '',
      describes: []
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        // Parse @test-tags metadata
        const tagMatch = line.match(/^\s*\/\*\s*@test-tags\s+(.+?)\s*\*\//);
        if (tagMatch) {
          const tags = tagMatch[1].split(/[,\s]+/).filter(Boolean);
          metadata.tags.push(...tags);
        }
        
        // Parse @description metadata
        const descMatch = line.match(/^\s*\/\*\s*@description\s+(.+?)\s*\*\//);
        if (descMatch) {
          metadata.description = descMatch[1];
        }
        
        // Find describe procedure names (ending with colon)
        const procMatch = line.match(/^(\w+Tests?):\s*$/);
        if (procMatch) {
          metadata.describes.push(procMatch[1]);
        }
      }
      
      // Remove duplicate tags
      metadata.tags = [...new Set(metadata.tags)];
      
    } catch (error) {
      if (this.verbose) {
        console.warn(`⚠️  Could not parse metadata from ${filePath}: ${error.message}`);
      }
    }

    return metadata;
  }

  matchesTags(fileTags) {
    if (this.tags.length === 0) return true;
    return this.tags.some(tag => fileTags.includes(tag));
  }

  async runTestFile(filePath) {
    const rexxPath = path.join(this.rootDir, 'rexx');
    const args = [filePath];
    
    // Add describe target if specified
    if (this.targetDescribe) {
      args.push(this.targetDescribe);
    }

    return new Promise((resolve) => {
      const child = spawn(rexxPath, args, {
        cwd: this.rootDir,
        timeout: this.timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, this.timeout);

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        if (this.verbose) {
          // Indent output for readability
          process.stdout.write(text.split('\n').map(line => line ? `    ${line}` : '').join('\n'));
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (this.verbose) {
          process.stderr.write(`    ${data}`);
        }
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        
        if (timedOut) {
          console.log(`   ⏰ Test timed out after ${this.timeout}ms`);
          resolve({ code: 1, passed: 0, failed: 1, describes: [], timeout: true });
          return;
        }
        
        const results = this.parseResults(stdout);
        
        if (!this.verbose && results.describes.length > 0) {
          // Show summary only in non-verbose mode
          console.log(`   📋 ${results.describes.length} describe blocks`);
          console.log(`   ✅ ${results.passed} passed, ❌ ${results.failed} failed`);
        }
        
        if (stderr && this.verbose) {
          console.log(`   🚨 STDERR: ${stderr.trim()}`);
        }
        
        resolve({
          code,
          passed: results.passed,
          failed: results.failed,
          describes: results.describes,
          timeout: false
        });
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        console.log(`   💥 Process error: ${error.message}`);
        resolve({ code: 1, passed: 0, failed: 1, describes: [], error: error.message });
      });
    });
  }

  parseResults(output) {
    const results = { 
      describes: [], 
      passed: 0, 
      failed: 0,
      tests: []
    };
    
    const lines = output.split('\n');
    let currentDescribe = null;
    
    for (const line of lines) {
      // New describe block
      if (line.includes('📋') && !line.includes('completed')) {
        currentDescribe = line.replace(/.*📋\s*/, '').trim();
        if (currentDescribe) {
          results.describes.push(currentDescribe);
        }
      }
      
      // Test execution
      if (line.includes('🔍')) {
        const testName = line.replace(/.*🔍\s*/, '').trim();
        results.tests.push({ name: testName, describe: currentDescribe, status: 'running' });
      }
      
      // Test results
      if (line.includes('✅ PASSED')) {
        results.passed++;
        if (results.tests.length > 0) {
          results.tests[results.tests.length - 1].status = 'passed';
        }
      }
      
      if (line.includes('❌ FAILED')) {
        results.failed++;
        if (results.tests.length > 0) {
          results.tests[results.tests.length - 1].status = 'failed';
          // Try to extract error message
          const errorMatch = line.match(/❌ FAILED:?\s*(.+)/);
          if (errorMatch) {
            results.tests[results.tests.length - 1].error = errorMatch[1];
          }
        }
      }
    }
    
    return results;
  }

  showHelp() {
    console.log(`
🧪 REXX Test Runner

Usage: node src/test-runner.js [options]

Options:
  --pattern <glob>     Test file pattern (default: **/*-tests.rexx, **/*-specs.rexx)
  --tags <tags>        Filter by tags (comma-separated, e.g. --tags math,integration)
  --describe <name>    Run specific describe block only
  --verbose, -v        Show verbose output including test execution details
  --timeout <ms>       Test timeout in milliseconds (default: 15000)
  --help, -h           Show this help message

Examples:
  node src/test-runner.js
  node src/test-runner.js --tags math,basic --verbose
  node src/test-runner.js --pattern "tests/*-specs.rexx"
  node src/test-runner.js --describe BasicMathTests
  node src/test-runner.js --tags integration --describe DatabaseTests

Test File Requirements:
  - Must end with -tests.rexx or -specs.rexx
  - Use /* @test-tags tag1, tag2 */ for tag metadata
  - Use /* @description Your description */ for descriptions
  - Implement describe blocks as REXX procedures ending with ':'
    `);
  }
}

// CLI Entry Point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Help
  if (args.includes('--help') || args.includes('-h')) {
    new RexxTestRunner().showHelp();
    process.exit(0);
  }
  
  // Parse options
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    timeout: args.includes('--timeout') ? parseInt(args[args.indexOf('--timeout') + 1]) || 15000 : 15000,
    tags: args.includes('--tags') ? args[args.indexOf('--tags') + 1]?.split(',').map(t => t.trim()) || [] : [],
    describe: args.includes('--describe') ? args[args.indexOf('--describe') + 1] : null,
    patterns: args.includes('--pattern') ? [args[args.indexOf('--pattern') + 1]] : undefined
  };
  
  const runner = new RexxTestRunner(options);
  runner.run().catch(error => {
    console.error('💥 Runner error:', error);
    process.exit(1);
  });
}

module.exports = { RexxTestRunner };