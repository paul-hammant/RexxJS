# Building & Deployment Guide

This guide covers building, bundling, and deploying the RexxJS interpreter for production use.

## 🔧 Development Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Verify installation
node --version  # v14+ recommended
npm --version   # v6+ recommended
```

### Development Server

```bash
# Start local development server
npx http-server -p 8082 -c-1

# Or use any static file server
python3 -m http.server 8082

# View demos
open http://localhost:8082/tests/test-harness-dom.html
```

## 📦 Production Build with Webpack

### Quick Start

```bash
# Build the library for production
npm run build

# Output: dist/rexx.js (102KB minified)
```

### Build Scripts

```bash
# Build for production (minified)
npm run build

# Build for development (source maps, unminified)
npm run build:dev

# Watch mode for development
npm run build:watch

# Run all Jest tests (unit and integration)
npm test

# Run only Jest tests (excludes Playwright DOM tests)
npm test

# Run only Playwright tests (DOM and cross-iframe tests)
npx playwright test --project=chromium
```

### Webpack Configuration

The project includes a pre-configured `webpack.config.js`:

```javascript
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'rexx.js',
    library: 'rexxjs',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  mode: 'production',
  resolve: {
    fallback: {
      // Disable Node.js polyfills - crypto handled manually in code
      "crypto": false,
      "buffer": false,
      "stream": false,
      "util": false,
      "path": false,
      "fs": false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
```

### Cross-Platform Crypto Support

The interpreter automatically detects the environment and uses:
- **Browser**: Web Crypto API (`crypto.subtle`) for SHA256, SHA1, HMAC
- **Node.js**: Node.js crypto module (dynamic import to avoid webpack bundling)  
- **Fallback**: Throws descriptive errors when crypto is unavailable

## 🚀 Deployment Options

### 1. Static Hosting (Netlify, Vercel, GitHub Pages)

```bash
# Build assets
npm run build

# Deploy files:
# - Copy tests/ directory (HTML test harnesses)
# - Copy dist/ directory (bundled library)
# - Ensure MIME types are configured for .js files
# - Update HTML files to reference bundled assets if needed
```

**Example deployment structure**:
```
your-site.com/
├── tests/
│   ├── test-harness-dom.html
│   ├── test-harness-cross-iframe.html
│   └── test-harness-cross-iframe2.html
└── dist/
    └── rexx.js
```

### 2. CDN Distribution

```html
<!-- Include bundled interpreter -->
<script src="https://your-cdn.com/rexx.js"></script>
<script>
  // Use bundled RexxJS
  const { Interpreter, parse, executeScript } = RexxJS;
  const interpreter = new Interpreter();
  
  // Run Rexx scripts
  interpreter.run('SAY "Hello from CDN-hosted Rexx!"');
</script>
```

### 3. NPM Package

```bash
# Publish to NPM registry
npm publish

# Install in other projects
npm install rexxjs

# Use in Node.js
const { Interpreter, parse } = require('rexxjs');

# Use in ES modules
import { Interpreter, parse } from 'rexx';
```

### 4. Docker Deployment

**Dockerfile**:
```dockerfile
FROM nginx:alpine

# Copy built assets
COPY dist/ /usr/share/nginx/html/dist/
COPY tests/ /usr/share/nginx/html/tests/

# Configure NGINX for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build and deploy**:
```bash
# Build the image
docker build -t rexxjs .

# Run locally
docker run -p 8080:80 rexxjs

# Deploy to registry
docker tag rexxjs your-registry/rexxjs:latest
docker push your-registry/rexxjs:latest
```

## 🔍 Production Optimizations

### Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev webpack-bundle-analyzer

# Analyze bundle size
npx webpack-bundle-analyzer dist/rexxjs.js

# View the analysis at http://localhost:8888
```

### Performance Tips

**Server Configuration**:
- Enable gzip compression on server
- Set proper caching headers for static assets
- Use HTTP/2 for better multiplexing
- Consider CDN for global distribution

**Build Optimizations**:
```bash
# Advanced webpack build with optimizations
npx webpack --mode production --optimize-minimize

# Tree shaking (already enabled in config)
# Code splitting for large applications
# Source maps for debugging (dev builds only)
```

**Loading Optimizations**:
- Minify HTML test harness files
- Optimize iframe loading with `loading="lazy"`
- Use resource hints: `<link rel="preload">`

### Environment Variables

**Production configuration**:
```bash
# Set production environment
export NODE_ENV=production

# Build with production optimizations
npm run build
```

**Development configuration**:
```bash
# Set development environment
export NODE_ENV=development

# Build with source maps and debugging
npm run build:dev
```

## 🧪 Testing the Build

### Local Testing

```bash
# Build and test locally
npm run build

# Test Node.js compatibility
node -e "
const { Interpreter } = require('./dist/rexxjs.js');
const interpreter = new Interpreter();
interpreter.run('SAY \"Build test successful\"').then(() => console.log('✅ Works'));
"

# Test browser compatibility
npx http-server -p 8082 -c-1
# Open: http://localhost:8082/tests/test-harness-dom.html
```

### Test Suite Architecture

The project uses a two-tier testing approach:
- **Jest**: Unit and integration tests for the interpreter core
- **Playwright**: Browser-based DOM automation and cross-iframe testing

```bash
# Run all Jest tests (parser, interpreter, built-in functions)
npm test

# Run specific Jest test patterns
npx jest --testPathPattern=interpreter.spec.js
npx jest --testNamePattern="should evaluate.*expressions"

# Run all Playwright tests (DOM automation, cross-iframe scripting)
npx playwright test --project=chromium

# Run specific Playwright test files
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/cross-iframe-scripting.spec.js --project=chromium
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/dom-stale-rexxjs.spec.js --project=chromium

# Install Playwright browsers (if needed)
npx playwright install
```

### Integration Testing

```bash
# Run full test suite (Jest only - Playwright excluded via jest.config.js)
npm test

# Run Playwright tests separately
npx playwright test --project=chromium

# Run both test types in sequence
npm test && npx playwright test --project=chromium
```

## 🔧 Troubleshooting

### Common Build Issues

**1. Module not found: 'crypto'**
```bash
# Fixed in current config - crypto is handled manually
# Ensure webpack.config.js has crypto: false in fallbacks
```

**2. Buffer is not defined**
```bash
# Fixed in current config - Buffer usage is environment-detected
# No polyfills needed
```

**3. Build size too large**
```bash
# Analyze bundle
npx webpack-bundle-analyzer dist/rexxjs.js

# Consider code splitting if needed
```

### Browser Compatibility

**Supported browsers**:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

**Required APIs**:
- Web Crypto API (for crypto functions)
- Promise support
- postMessage API (for application addressing)
- ES6 features (transpiled by Babel)

### Node.js Compatibility

**Supported versions**:
- Node.js 14+
- NPM 6+

**Required modules**:
- crypto (built-in)
- Buffer (built-in)

## 📊 Bundle Information

**Current bundle stats**:
- **Size**: ~102KB minified
- **Gzipped**: ~35KB (estimated)
- **Exports**: `Interpreter`, `parse`, `executeScript`
- **Format**: UMD (works in browser globals, AMD, CommonJS, ES modules)

**What's included**:
- Complete Rexx parser (~23KB)
- Full interpreter with 259+ built-in functions (~199KB source)
- Execution environment (~5KB)
- Cross-platform crypto handling
- DOM automation capabilities
- Error handling with stack traces

## 🔧 Standalone Binary Distribution

### Creating Standalone Executables

RexxJS can be packaged as standalone executables that include the Node.js runtime, allowing deployment to systems without Node.js installed.

#### Quick Binary Creation

```bash
# Create Linux x64 binaries
node create-pkg-binary.js

# Output files:
# - rexx-linux-x64          (uncompressed, ~49MB)  
# - rexx-linux-x64-compressed (Brotli compressed, ~46MB)
```

#### Binary Features

**What's included**:
- Complete RexxJS interpreter with all built-in functions
- Node.js runtime (v18) embedded
- System address handler for OS integration
- All core language features and extensions

**Binary specifications**:
- **Target**: Linux x64 (Node.js 18)
- **Size**: 49MB uncompressed, 46MB compressed (8% reduction)
- **Dependencies**: None - completely standalone
- **Startup time**: ~2-3 seconds (cold start)

#### Deployment

```bash
# 1. Copy to target server
scp rexx-linux-x64 user@server:/usr/local/bin/rexx

# 2. Make executable  
chmod +x /usr/local/bin/rexx

# 3. Run REXX scripts
rexx myscript.rexx

# 4. Test installation
rexx --help
```

#### Binary Architecture

The `create-pkg-binary.js` script performs these steps:

1. **Setup**: Installs PKG locally if needed
2. **Configuration**: Creates PKG-compatible package.json with Node.js 18 target
3. **Source preparation**: Copies and modifies source files to fix relative requires
4. **Compilation**: Uses PKG to create both compressed and uncompressed binaries
5. **Verification**: Tests the binary with `--help` command
6. **Finalization**: Copies binaries to project root

#### Advanced Binary Options

**Custom targets** (modify `create-pkg-binary.js`):
```javascript
pkg: {
  targets: [
    "node18-linux-x64",     // Linux 64-bit
    "node18-macos-x64",     // macOS Intel
    "node18-macos-arm64",   // macOS Apple Silicon  
    "node18-win-x64"        // Windows 64-bit
  ]
}
```

**Compression options**:
- Uncompressed: Faster startup, larger file
- Brotli compressed: Smaller file, slightly slower startup
- Choose based on deployment constraints

#### Binary Limitations

- **Platform-specific**: Linux x64 only (by default)
- **Size**: Larger than interpreted JavaScript due to embedded runtime
- **Startup overhead**: 2-3 second initialization vs instant JavaScript
- **Node.js version**: Fixed to embedded version (Node.js 18)

#### Use Cases for Binaries

**Ideal for**:
- Production servers without Node.js
- System administration scripts
- Automated deployment workflows
- Distribution to non-technical users
- Containers with minimal base images

**Not recommended for**:
- Development and testing (use `node src/cli.js`)
- Frequent updates (rebuild required for changes)
- Multi-platform deployment (create separate binaries)
- Performance-critical applications (startup overhead)

## 🚀 Continuous Integration

### GitHub Actions Example

**.github/workflows/build.yml**:
```yaml
name: Build and Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build for production
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/
```

This guide provides everything needed to build, test, and deploy the RexxJS interpreter for production use across different platforms and environments.