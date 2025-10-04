#!/usr/bin/env node
/**
 * Strip dependencies from bundled RexxJS modules
 * Replaces dependencies: {...} with dependencies: {} in META functions
 */

const fs = require('fs');
const path = require('path');

function stripDependencies(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: dependencies: { "package": "version" } -> dependencies: {}
  const pattern1 = /dependencies:\s*\{\s*"[^"]+"\s*:\s*"[^"]+"\s*\}/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, 'dependencies: {}');
    modified = true;
  }

  // Pattern 2: dependencies: { 'package': 'version' } -> dependencies: {}
  const pattern2 = /dependencies:\s*\{\s*'[^']+'\s*:\s*'[^']+'\s*\}/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, 'dependencies: {}');
    modified = true;
  }

  // Pattern 3: Multiple dependencies on same line
  const pattern3 = /dependencies:\s*\{[^\}]{1,200}\}/g;
  const matches = content.match(pattern3);
  if (matches) {
    matches.forEach(match => {
      // Only replace if it contains package names (has quotes)
      if (match.includes('"') || match.includes("'")) {
        content = content.replace(match, 'dependencies: {}');
        modified = true;
      }
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Process all .bundle.js files in dist
const distDirs = ['../dist/addresses', '../dist/functions'];

let totalProcessed = 0;
let totalModified = 0;

distDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Directory not found: ${fullPath}`);
    return;
  }

  const files = fs.readdirSync(fullPath);
  files.forEach(file => {
    if (file.endsWith('.bundle.js')) {
      const filePath = path.join(fullPath, file);
      totalProcessed++;

      if (stripDependencies(filePath)) {
        console.log(`✓ Stripped dependencies from ${file}`);
        totalModified++;
      } else {
        console.log(`  No dependencies found in ${file}`);
      }
    }
  });
});

console.log(`\n📊 Summary: Modified ${totalModified}/${totalProcessed} bundle files`);
