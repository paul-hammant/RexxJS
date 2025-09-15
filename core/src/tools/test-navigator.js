#!/usr/bin/env node
/*!
 * RexxJS Test Navigator TUI v1.0.0
 * Interactive terminal interface for navigating test results
 * Copyright (c) 2025 Paul Hammant | MIT License
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Terminal colors and formatting
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m'
};

class TestNavigator {
  constructor(resultsPath = './test-results.json') {
    this.resultsPath = resultsPath;
    this.results = null;
    this.currentPath = [];
    this.expandedNodes = new Set();
    this.selectedIndex = 0;
    this.viewMode = 'hierarchy'; // hierarchy, details, output
    this.filterMode = 'all'; // all, passed, failed
    
    // Setup readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Setup raw mode for key handling
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }
  
  async init() {
    try {
      if (!fs.existsSync(this.resultsPath)) {
        console.log(`${Colors.red}Error: Test results file not found: ${this.resultsPath}${Colors.reset}`);
        console.log(`${Colors.dim}Run a REXX test script with the test framework first.${Colors.reset}`);
        process.exit(1);
      }
      
      const data = fs.readFileSync(this.resultsPath, 'utf8');
      this.results = JSON.parse(data);
      
      console.log(`${Colors.green}✅ Test results loaded successfully${Colors.reset}`);
      console.log(`${Colors.dim}Results from: ${this.results.startTime}${Colors.reset}`);
      console.log('');
      
      // Show the tree view immediately instead of help
      this.render();
      await this.startInteractive();
      
    } catch (error) {
      console.error(`${Colors.red}Error loading test results: ${error.message}${Colors.reset}`);
      process.exit(1);
    }
  }
  
  showHelp() {
    console.clear();
    console.log(`${Colors.bright}${Colors.blue}📊 RexxJS Test Navigator${Colors.reset}`);
    console.log(`${Colors.dim}Interactive test results browser${Colors.reset}`);
    console.log('');
    console.log(`${Colors.bright}Commands:${Colors.reset}`);
    console.log(`  ${Colors.green}h${Colors.reset}         - Show this help`);
    console.log(`  ${Colors.green}↑/↓${Colors.reset}       - Navigate up/down`);
    console.log(`  ${Colors.green}→/Enter${Colors.reset}   - Expand/enter item`);
    console.log(`  ${Colors.green}←${Colors.reset}         - Collapse/go back`);
    console.log(`  ${Colors.green}space${Colors.reset}     - Toggle expand/collapse`);
    console.log(`  ${Colors.green}v${Colors.reset}         - Change view mode (hierarchy/details/output)`);
    console.log(`  ${Colors.green}f${Colors.reset}         - Filter tests (all/passed/failed)`);
    console.log(`  ${Colors.green}s${Colors.reset}         - Show summary`);
    console.log(`  ${Colors.green}r${Colors.reset}         - Refresh results`);
    console.log(`  ${Colors.green}q${Colors.reset}         - Quit`);
    console.log('');
    console.log(`${Colors.dim}Press any key to continue...${Colors.reset}`);
  }
  
  async startInteractive() {
    return new Promise((resolve) => {
      process.stdin.on('data', (key) => {
        this.handleKey(key.toString(), resolve);
      });
    });
  }
  
  handleKey(key, resolve) {
    switch (key) {
      case 'q':
      case '\u0003': // Ctrl+C
        this.cleanup();
        resolve();
        break;
      case 'h':
        this.showHelp();
        break;
      case 's':
        this.showSummary();
        break;
      case 'r':
        this.refresh();
        break;
      case 'v':
        this.cycleViewMode();
        break;
      case 'f':
        this.cycleFilterMode();
        break;
      case '\u001b[A': // Up arrow
        this.navigateUp();
        break;
      case '\u001b[B': // Down arrow
        this.navigateDown();
        break;
      case '\u001b[C': // Right arrow
      case '\r': // Enter
        this.expandOrEnter();
        break;
      case '\u001b[D': // Left arrow
        this.collapseOrBack();
        break;
      case ' ': // Space
        this.toggleExpand();
        break;
      default:
        // Ignore other keys
        break;
    }
  }
  
  showSummary() {
    console.clear();
    console.log(`${Colors.bright}${Colors.blue}📊 Test Summary${Colors.reset}`);
    console.log('');
    
    const { totalTests, passedTests, failedTests, totalSuites } = this.results;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    console.log(`${Colors.bright}Test Results:${Colors.reset}`);
    console.log(`  Total Suites: ${Colors.cyan}${totalSuites}${Colors.reset}`);
    console.log(`  Total Tests:  ${Colors.cyan}${totalTests}${Colors.reset}`);
    console.log(`  Passed:       ${Colors.green}${passedTests}${Colors.reset}`);
    console.log(`  Failed:       ${Colors.red}${failedTests}${Colors.reset}`);
    console.log(`  Success Rate: ${passRate >= 80 ? Colors.green : passRate >= 50 ? Colors.yellow : Colors.red}${passRate}%${Colors.reset}`);
    console.log('');
    
    const duration = new Date(this.results.endTime) - new Date(this.results.startTime);
    console.log(`${Colors.bright}Execution:${Colors.reset}`);
    console.log(`  Start:    ${Colors.dim}${this.results.startTime}${Colors.reset}`);
    console.log(`  End:      ${Colors.dim}${this.results.endTime}${Colors.reset}`);
    console.log(`  Duration: ${Colors.cyan}${duration}ms${Colors.reset}`);
    console.log('');
    
    if (failedTests > 0) {
      console.log(`${Colors.bright}${Colors.red}Failed Tests:${Colors.reset}`);
      this.showFailedTests(this.results.hierarchy);
    }
    
    console.log('');
    console.log(`${Colors.dim}Press any key to return to navigation...${Colors.reset}`);
  }
  
  showFailedTests(suites, indent = '') {
    for (const suite of suites) {
      const failedInSuite = suite.tests.filter(t => t.status === 'failed');
      if (failedInSuite.length > 0) {
        console.log(`${indent}${Colors.red}📁 ${suite.name}${Colors.reset}`);
        for (const test of failedInSuite) {
          console.log(`${indent}  ${Colors.red}❌ ${test.name}${Colors.reset}`);
          if (test.error) {
            console.log(`${indent}    ${Colors.dim}${test.error}${Colors.reset}`);
          }
        }
      }
      if (suite.subSuites.length > 0) {
        this.showFailedTests(suite.subSuites, indent + '  ');
      }
    }
  }
  
  refresh() {
    try {
      const data = fs.readFileSync(this.resultsPath, 'utf8');
      this.results = JSON.parse(data);
      this.render();
      this.showMessage(`${Colors.green}✅ Results refreshed${Colors.reset}`);
    } catch (error) {
      this.showMessage(`${Colors.red}❌ Error refreshing: ${error.message}${Colors.reset}`);
    }
  }
  
  cycleViewMode() {
    const modes = ['hierarchy', 'details', 'output'];
    const currentIndex = modes.indexOf(this.viewMode);
    this.viewMode = modes[(currentIndex + 1) % modes.length];
    this.render();
    this.showMessage(`${Colors.cyan}View mode: ${this.viewMode}${Colors.reset}`);
  }
  
  cycleFilterMode() {
    const modes = ['all', 'passed', 'failed'];
    const currentIndex = modes.indexOf(this.filterMode);
    this.filterMode = modes[(currentIndex + 1) % modes.length];
    this.selectedIndex = 0;
    this.render();
    this.showMessage(`${Colors.cyan}Filter: ${this.filterMode}${Colors.reset}`);
  }
  
  navigateUp() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.render();
    }
  }
  
  navigateDown() {
    const items = this.getVisibleItems();
    if (this.selectedIndex < items.length - 1) {
      this.selectedIndex++;
      this.render();
    }
  }
  
  expandOrEnter() {
    const items = this.getVisibleItems();
    const item = items[this.selectedIndex];
    if (item) {
      if (item.type === 'file' || item.type === 'suite') {
        this.toggleExpand();
      } else if (item.type === 'test') {
        this.showTestDetails(item);
      }
    }
  }
  
  collapseOrBack() {
    if (this.currentPath.length > 0) {
      this.currentPath.pop();
      this.selectedIndex = 0;
      this.render();
    } else {
      const items = this.getVisibleItems();
      const item = items[this.selectedIndex];
      if (item && (item.type === 'file' || item.type === 'suite')) {
        this.expandedNodes.delete(item.path);
        this.render();
      }
    }
  }
  
  toggleExpand() {
    const items = this.getVisibleItems();
    const item = items[this.selectedIndex];
    if (item && (item.type === 'file' || item.type === 'suite')) {
      if (this.expandedNodes.has(item.path)) {
        this.expandedNodes.delete(item.path);
      } else {
        this.expandedNodes.add(item.path);
      }
      this.render();
    }
  }
  
  showTestDetails(test) {
    console.clear();
    console.log(`${Colors.bright}${Colors.blue}🧪 Test Details${Colors.reset}`);
    console.log('');
    console.log(`${Colors.bright}Test:${Colors.reset} ${test.name}`);
    console.log(`${Colors.bright}Suite:${Colors.reset} ${test.suite || 'Unknown'}`);
    console.log(`${Colors.bright}Status:${Colors.reset} ${test.status === 'passed' ? Colors.green + '✅ PASSED' : Colors.red + '❌ FAILED'}${Colors.reset}`);
    console.log('');
    
    if (test.expectations && test.expectations.length > 0) {
      console.log(`${Colors.bright}Expectations (${test.passed}/${test.expectations} passed):${Colors.reset}`);
      for (let i = 0; i < test.details.length; i++) {
        const expectation = test.details[i];
        const status = expectation.passed ? Colors.green + '✅' : Colors.red + '❌';
        console.log(`  ${status} ${expectation.message}${Colors.reset}`);
      }
      console.log('');
    }
    
    if (test.output && test.output.length > 0) {
      console.log(`${Colors.bright}Output:${Colors.reset}`);
      for (const output of test.output) {
        console.log(`  ${Colors.dim}${output.timestamp}:${Colors.reset} ${output.text}`);
      }
      console.log('');
    }
    
    if (test.error) {
      console.log(`${Colors.bright}${Colors.red}Error:${Colors.reset}`);
      console.log(`  ${Colors.red}${test.error}${Colors.reset}`);
      console.log('');
    }
    
    const duration = test.endTime && test.startTime 
      ? new Date(test.endTime) - new Date(test.startTime) 
      : 'N/A';
    console.log(`${Colors.dim}Duration: ${duration}ms${Colors.reset}`);
    console.log('');
    console.log(`${Colors.dim}Press any key to return...${Colors.reset}`);
  }
  
  getVisibleItems() {
    const items = [];
    
    // Add files as top-level items
    for (const file of this.results.hierarchy) {
      const fileKey = file.name;
      const isExpanded = this.expandedNodes.has(fileKey);
      
      // Calculate file-level stats
      let filePassed = 0;
      let fileFailed = 0;
      let fileTotal = 0;
      
      if (file.children) {
        for (const child of file.children) {
          if (child.type === 'test') {
            if (child.passed) {
              filePassed += 1;
            } else {
              fileFailed += 1;
            }
            fileTotal += 1;
          } else if (child.type === 'suite') {
            filePassed += child.passed || 0;
            fileFailed += child.failed || 0;
            fileTotal += (child.passed || 0) + (child.failed || 0);
          }
        }
      }
      
      // Add file item
      items.push({
        type: 'file',
        name: this.formatFilePath(file.name),
        path: fileKey,
        tags: file.tags,
        passed: filePassed,
        failed: fileFailed,
        total: fileTotal,
        depth: 0,
        expanded: isExpanded
      });
      
      // Add tests or suites if file is expanded
      if (isExpanded && file.children) {
        for (const child of file.children) {
          if (child.type === 'test' && this.shouldShowTest(child)) {
            // Direct test under file
            items.push({
              type: 'test',
              name: child.name,
              passed: child.passed,
              failed: !child.passed,
              output: child.output,
              error: child.error,
              startTime: child.startTime,
              endTime: child.endTime,
              depth: 1
            });
          } else if (child.type === 'suite') {
            // Suite containing tests
            const suiteKey = `${fileKey}:${child.name}`;
            const suiteExpanded = this.expandedNodes.has(suiteKey);
            
            items.push({
              type: 'suite',
              name: child.name,
              path: suiteKey,
              passed: child.passed || 0,
              failed: child.failed || 0,
              total: (child.passed || 0) + (child.failed || 0),
              depth: 1,
              expanded: suiteExpanded
            });
            
            // Add tests if suite is expanded
            if (suiteExpanded && child.children) {
              for (const test of child.children) {
                if (test.type === 'test' && this.shouldShowTest(test)) {
                  items.push({
                    type: 'test',
                    name: test.name,
                    passed: test.passed,
                    failed: !test.passed,
                    output: test.output,
                    error: test.error,
                    startTime: test.startTime,
                    endTime: test.endTime,
                    depth: 2
                  });
                }
              }
            }
          }
        }
      }
    }
    return items;
  }
  
  formatFilePath(filePath) {
    // Handle nested directory structures like tests/a/b/c/file.rexx
    const parts = filePath.split('/');
    if (parts.length > 3) {
      // Show parent dirs + filename for deep nesting
      return `${parts.slice(0, 2).join('/')}/.../.../${parts[parts.length - 1]}`;
    }
    return filePath;
  }
  
  shouldShowSuite(suite) {
    switch (this.filterMode) {
      case 'passed': return suite.failed === 0;
      case 'failed': return suite.failed > 0;
      default: return true;
    }
  }
  
  shouldShowTest(test) {
    switch (this.filterMode) {
      case 'passed': return test.status === 'passed';
      case 'failed': return test.status === 'failed';
      default: return true;
    }
  }
  
  render() {
    console.clear();
    
    // Header
    const { totalTests, passedTests, failedTests } = this.results;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    console.log(`${Colors.bright}${Colors.blue}📊 RexxJS Test Navigator${Colors.reset} ${Colors.dim}(${this.viewMode} view, ${this.filterMode} filter)${Colors.reset}`);
    console.log(`${Colors.green}${passedTests} passed${Colors.reset} | ${Colors.red}${failedTests} failed${Colors.reset} | ${Colors.cyan}${totalTests} total${Colors.reset} (${passRate}%)`);
    console.log('');
    
    // Navigation breadcrumb
    if (this.currentPath.length > 0) {
      console.log(`${Colors.dim}Path: ${this.currentPath.join(' > ')}${Colors.reset}`);
      console.log('');
    }
    
    // Items
    const items = this.getVisibleItems();
    const maxVisible = process.stdout.rows - 10; // Leave room for header and footer
    const startIndex = Math.max(0, this.selectedIndex - Math.floor(maxVisible / 2));
    const endIndex = Math.min(items.length, startIndex + maxVisible);
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = items[i];
      const isSelected = i === this.selectedIndex;
      const indent = '  '.repeat(item.depth);
      
      let line = '';
      let icon = '';
      let status = '';
      
      if (item.type === 'file') {
        icon = item.expanded ? '📂' : '📄';
        const statusColor = item.failed > 0 ? Colors.red : Colors.green;
        status = ` ${Colors.dim}[${item.tags && item.tags.length > 0 ? item.tags.join(', ') : ''}] (${statusColor}${item.passed}${Colors.reset}${Colors.dim}/${item.total})${Colors.reset}`;
      } else if (item.type === 'suite') {
        icon = item.expanded ? '📂' : '📁';
        const statusColor = item.failed > 0 ? Colors.red : Colors.green;
        status = ` ${Colors.dim}(${statusColor}${item.passed}${Colors.reset}${Colors.dim}/${item.total})${Colors.reset}`;
      } else {
        icon = item.passed ? '✅' : '❌';
        status = '';
      }
      
      line = `${indent}${icon} ${item.name}${status}`;
      
      if (isSelected) {
        console.log(`${Colors.bgBlue}${Colors.white}> ${line}${Colors.reset}`);
      } else {
        console.log(`  ${line}`);
      }
    }
    
    // Footer
    console.log('');
    console.log(`${Colors.dim}${items.length} items | Use ↑↓ to navigate, → to expand, ← to collapse, h for help, q to quit${Colors.reset}`);
  }
  
  showMessage(message) {
    // Display message at bottom of screen temporarily
    process.stdout.write(`\r\x1b[K${message}`);
    setTimeout(() => {
      this.render();
    }, 1500);
  }
  
  cleanup() {
    console.clear();
    console.log(`${Colors.green}👋 Thanks for using RexxJS Test Navigator!${Colors.reset}`);
    process.stdin.setRawMode(false);
    this.rl.close();
    process.exit(0);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const resultsPath = args[0] || './test-results.json';
  
  const navigator = new TestNavigator(resultsPath);
  await navigator.init();
}

if (require.main === module) {
  main().catch(error => {
    console.error(`${Colors.red}Fatal error: ${error.message}${Colors.reset}`);
    process.exit(1);
  });
}

module.exports = { TestNavigator };