#!/bin/bash

# Build all RexxJS modules using simple webpack bundling without minification
# Usage: ./build-all-modules.sh [clean] [version-tag]
# Examples:
#   ./build-all-modules.sh clean latest
#   ./build-all-modules.sh clean v1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Determine version/tag (default to 'latest')
VERSION_TAG=${2:-latest}

# Clean dist content directories if requested (preserve .git/ and registry.txt)
if [ "$1" = "clean" ]; then
    print_info "Cleaning dist content directories (preserving .git/ and registry.txt)..."
    rm -rf ../dist/addresses/
    rm -rf ../dist/functions/
fi

# Create dist directories for current branch/tag (outside this repo)
# No subdirectories - the branch name handles versioning
mkdir -p ../dist/{addresses,functions}
print_info "Building for tag: $VERSION_TAG"

print_info "Discovering and bundling ALL RexxJS modules..."

# Counter for built modules
ADDRESS_COUNT=0
FUNCTION_COUNT=0

# Process all address handlers
print_info "Processing address handlers..."
find extras/addresses -name "*-address.js" -not -path "*/node_modules/*" -not -path "*/__tests__/*" -not -path "*/spec*" | while read address_file; do
    if [ -f "$address_file" ]; then
        dir=$(dirname "$address_file")
        filename=$(basename "$address_file")
        module_name=$(basename "$filename" .js)
        
        print_info "Building address handler: $module_name"
        
        # Create simple webpack config (no polyfills - let them break if needed)
        # Use absolute path for dist directory
        ABSOLUTE_DIST_PATH=$(realpath ../dist)
        cat > "$dir/webpack.bundle.config.js" << EOF
const path = require('path');

module.exports = {
  mode: 'development', // No minification
  entry: './$filename',
  output: {
    filename: '$module_name.bundle.js',
    path: '$ABSOLUTE_DIST_PATH/addresses',
    library: '$module_name',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.js']
  },
  target: 'web'
};
EOF
        
        cd "$dir"
        
        # Install webpack if not present (minimal)
        if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/webpack" ]; then
            print_info "Installing webpack for $module_name..."
            npm init -y --silent 2>/dev/null || true
            npm install --silent webpack webpack-cli 2>/dev/null || true
        fi
        
        # Bundle the module
        if npx webpack --config webpack.bundle.config.js --silent 2>/dev/null; then
            print_success "Bundled $module_name successfully"
            ADDRESS_COUNT=$((ADDRESS_COUNT + 1))
        else
            print_warning "Failed to bundle $module_name (may need polyfills)"
        fi
        
        cd - >/dev/null
    fi
done

# Process all function libraries
print_info "Processing function libraries..."
find extras/functions -name "*-functions.js" -not -path "*/node_modules/*" -not -path "*/__tests__/*" -not -path "*/spec*" | while read function_file; do
    if [ -f "$function_file" ]; then
        dir=$(dirname "$function_file")
        filename=$(basename "$function_file")
        module_name=$(basename "$filename" .js)
        
        print_info "Building function library: $module_name"
        
        # Create simple webpack config (no polyfills - let them break if needed)
        # Use absolute path for dist directory
        ABSOLUTE_DIST_PATH=$(realpath ../dist)
        cat > "$dir/webpack.bundle.config.js" << EOF
const path = require('path');

module.exports = {
  mode: 'development', // No minification
  entry: './$filename',
  output: {
    filename: '$module_name.bundle.js',
    path: '$ABSOLUTE_DIST_PATH/functions',
    library: '$module_name',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.js']
  },
  target: 'web'
};
EOF
        
        cd "$dir"
        
        # Install webpack if not present (minimal)
        if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/webpack" ]; then
            print_info "Installing webpack for $module_name..."
            npm init -y --silent 2>/dev/null || true
            npm install --silent webpack webpack-cli 2>/dev/null || true
        fi
        
        # Bundle the module
        if npx webpack --config webpack.bundle.config.js --silent 2>/dev/null; then
            print_success "Bundled $module_name successfully"
            FUNCTION_COUNT=$((FUNCTION_COUNT + 1))
        else
            print_warning "Failed to bundle $module_name (may need polyfills)"
        fi
        
        cd - >/dev/null
    fi
done

# Show results
print_info "Build Summary:"
echo ""

# Module counts for summary

echo "=== Built Modules ==="

echo "ADDRESS handlers:"
if [ -d "../dist/addresses" ]; then
    ls -lh "../dist/addresses/" 2>/dev/null | grep -v "^total" | awk '{print "  " $5 " " $9}' || echo "  (none)"
else
    echo "  (none)"
fi

echo "Function libraries:"
if [ -d "../dist/functions" ]; then
    ls -lh "../dist/functions/" 2>/dev/null | grep -v "^total" | awk '{print "  " $5 " " $9}' || echo "  (none)"
else
    echo "  (none)"
fi
echo ""

print_success "Build complete!"
print_info "Built modules copied to ../dist/"
print_info "Registry.txt is hand-maintained - update manually as needed" 
print_info "GitHub URLs will be:"
print_info "  https://github.com/RexxJS/dist/blob/latest/addresses/sqlite3-address.bundle.js"
print_info "  https://raw.githubusercontent.com/RexxJS/dist/latest/addresses/sqlite3-address.bundle.js"