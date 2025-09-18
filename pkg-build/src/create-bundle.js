#!/usr/bin/env node

/**
 * RexxJS Bundle Creator
 * Creates a single-file deployment bundle with embedded CLI
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

function createBundle() {
    const srcDir = path.join(__dirname);
    const outputFile = path.join(srcDir, 'rexxjs-cli.js');
    
    console.log('Creating RexxJS bundle...');
    
    // Read main CLI
    const cliPath = path.join(srcDir, 'cli.js');
    const interpreterPath = path.join(srcDir, 'interpreter.js');
    const parserPath = path.join(srcDir, 'parser.js');
    const executorPath = path.join(srcDir, 'executor.js');
    
    if (!fs.existsSync(cliPath)) {
        console.error('Error: cli.js not found');
        process.exit(1);
    }
    
    try {
        // Read CLI content and remove its shebang
        let cliContent = fs.readFileSync(cliPath, 'utf8');
        // Remove the first line if it's a shebang
        if (cliContent.startsWith('#!')) {
            cliContent = cliContent.split('\n').slice(1).join('\n');
        }
        
        // Create bundle with single shebang
        let bundle = `#!/usr/bin/env node
/**
 * RexxJS Bundled CLI
 * Generated bundle containing RexxJS interpreter and dependencies
 * Generated: ${new Date().toISOString()}
 */

${cliContent}`;

        bundle = bundle;
        
        console.log('✓ Added CLI');
        
        // Write bundle
        fs.writeFileSync(outputFile, bundle);
        fs.chmodSync(outputFile, 0o755); // Make executable
        
        console.log(`✓ Bundle created: ${outputFile}`);
        console.log(`✓ Size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
        
    } catch (error) {
        console.error('Error creating bundle:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    createBundle();
}

module.exports = { createBundle };