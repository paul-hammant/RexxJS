#!/usr/bin/env node

/**
 * Create standalone binary using pkg (simpler than SEA)
 * This creates a x86-64 Linux binary with Node.js embedded
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CORE_DIR = path.join(__dirname, 'core');
const BUILD_DIR = path.join(__dirname, 'pkg-build');

console.log('📦 Creating RexxJS Standalone Binary using PKG...\n');

// Step 1: Install pkg locally if not available
console.log('1️⃣ Setting up pkg...');
try {
    require.resolve('pkg');
    console.log('   ✅ pkg found');
} catch (error) {
    console.log('   📥 Installing pkg locally...');
    try {
        execSync('npm install pkg', { stdio: 'inherit', cwd: __dirname });
        console.log('   ✅ pkg installed locally');
    } catch (installError) {
        console.error('   ❌ Failed to install pkg:', installError.message);
        process.exit(1);
    }
}

// Step 2: Clean and create build directory
console.log('2️⃣ Setting up build directory...');
if (fs.existsSync(BUILD_DIR)) {
    console.log('   🗑️  Removing stale build directory...');
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    console.log('   ✅ Cleaned');
}
fs.mkdirSync(BUILD_DIR, { recursive: true });

// Step 3: Create package.json for pkg
console.log('3️⃣ Creating package configuration...');
const packageJson = {
    name: "rexxjs-standalone",
    version: "1.0.0",
    description: "RexxJS Standalone Executable",
    main: "cli.js",
    bin: {
        "rexx": "./cli.js"
    },
    pkg: {
        targets: ["node18-linux-x64"],
        assets: [
            "src/**/*",
            "../../dist/addresses/*.bundle.js",
            "../extras/addresses/provisioning-and-orchestration/shared-utils.js"
        ],
        scripts: "src/**/*.js"
    }
};

fs.writeFileSync(path.join(BUILD_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));

// Step 4: Copy all source files
console.log('4️⃣ Copying source files...');
const srcDir = path.join(CORE_DIR, 'src');
const buildSrcDir = path.join(BUILD_DIR, 'src');
fs.mkdirSync(buildSrcDir, { recursive: true });

// Recursively copy all files and directories
function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
        } else if (entry.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyRecursive(srcDir, buildSrcDir);
const sourceFiles = fs.readdirSync(srcDir).filter(file => file.endsWith('.js'));
console.log(`   📁 Copied source files recursively...`);

// Create PKG-compatible versions of all files with relative requires
console.log('   📦 Creating PKG-compatible source files...');

function fixRelativeRequires(content) {
    return content.replace(/require\(['"`]\.\/([^'"`]+)['"`]\)/g, (match, modulePath) => {
        return `require(__dirname + '/${modulePath}')`;
    });
}

// Copy CLI without modification - it's now mode-aware and handles pkg vs nodejs deterministically
fs.copyFileSync(path.join(srcDir, 'cli.js'), path.join(BUILD_DIR, 'cli.js'));

// Fix all source files with relative requires - they run from src/ so they need to find other files in same dir
const filesToFix = ['executor.js', 'parser.js', 'interpreter.js'];
filesToFix.forEach(fileName => {
    if (fs.existsSync(path.join(srcDir, fileName))) {
        const content = fs.readFileSync(path.join(srcDir, fileName), 'utf8');
        // For files in src/, they need to look in the same src/ directory 
        const fixed = content.replace(/require\(['"`]\.\/([^'"`]+)['"`]\)/g, (match, modulePath) => {
            return `require(require('path').join(__dirname, '${modulePath}'))`;
        });
        fs.writeFileSync(path.join(buildSrcDir, fileName), fixed);
    }
});

// Copy remaining files without modification
sourceFiles.forEach(file => {
    if (!filesToFix.includes(file) && file !== 'cli.js') {
        fs.copyFileSync(path.join(srcDir, file), path.join(buildSrcDir, file));
    }
});

console.log('   ✅ Source files copied');

// Step 5: Create the binary
console.log('5️⃣ Creating binary with pkg...');
process.chdir(BUILD_DIR);

try {
    console.log('   📦 Creating uncompressed binary...');
    execSync('npx pkg . --target node18-linux-x64 --output rexx-linux-x64', { 
        stdio: 'inherit',
        cwd: BUILD_DIR 
    });
    console.log('   ✅ Uncompressed binary created');
    
    console.log('   🗜️ Creating Brotli compressed binary...');
    execSync('npx pkg . --target node18-linux-x64 --output rexx-linux-x64-compressed --compress Brotli', { 
        stdio: 'inherit',
        cwd: BUILD_DIR 
    });
    console.log('   ✅ Compressed binary created');
} catch (error) {
    console.error('   ❌ pkg build failed:', error.message);
    process.exit(1);
}

// Step 6: Copy binaries to project root and compare sizes
console.log('6️⃣ Finalizing binaries...');
const finalBinary = path.join(__dirname, 'rexx-linux-x64');
const compressedBinary = path.join(__dirname, 'rexx-linux-x64-compressed');

fs.copyFileSync(path.join(BUILD_DIR, 'rexx-linux-x64'), finalBinary);
fs.copyFileSync(path.join(BUILD_DIR, 'rexx-linux-x64-compressed'), compressedBinary);

// Compare file sizes
const stats = fs.statSync(finalBinary);
const compressedStats = fs.statSync(compressedBinary);
const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
const compressedSizeInMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
const savings = (((stats.size - compressedStats.size) / stats.size) * 100).toFixed(1);

console.log(`   ✅ Uncompressed: ${finalBinary} (${sizeInMB} MB)`);
console.log(`   🗜️ Compressed: ${compressedBinary} (${compressedSizeInMB} MB)`);
console.log(`   💾 Space saved: ${savings}% reduction`);

// Step 7: Test the binary
console.log('7️⃣ Testing binary...');
try {
    const testOutput = execSync(`${finalBinary} --help`, { 
        encoding: 'utf8', 
        timeout: 10000 
    });
    console.log('   ✅ Binary test successful');
    console.log('   📋 Help output preview:', testOutput.split('\n')[0]);
} catch (error) {
    console.error('   ⚠️  Binary test failed:', error.message);
    console.log('   💡 Binary may still work, test manually');
}

// Cleanup
console.log('8️⃣ Cleaning up...');
console.log('   🗑️  Removing build directory...');
fs.rmSync(BUILD_DIR, { recursive: true, force: true });
console.log('   ✅ Build artifacts cleaned');
console.log('   💡 To debug: comment out the cleanup step in create-pkg-binary.js');

console.log('\n🎉 PKG Binary Creation Complete!\n');
console.log('📁 Binary location:', finalBinary);
console.log('🚀 Usage:');
console.log('   1. Copy to remote server: scp rexx-linux-x64 user@server:/usr/local/bin/rexx');
console.log('   2. Make executable: chmod +x /usr/local/bin/rexx'); 
console.log('   3. Run REXX scripts: rexx myscript.rexx');
console.log('\n✨ No Node.js installation required on target machine!');