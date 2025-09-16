#!/bin/bash

# RexxJS Binary Builder
# Creates standalone executable using pkg
# Usage: ./make-binary.sh [target]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Default target
TARGET=${1:-linux-x64}

print_info "Building RexxJS standalone binary for $TARGET..."

# Check if pkg-build directory exists
if [ ! -d "pkg-build" ]; then
    print_error "pkg-build directory not found"
    exit 1
fi

cd pkg-build

# Check if pkg is installed locally
if [ ! -f "package.json" ]; then
    print_error "pkg-build/package.json not found"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
fi

# Run pkg to create binary
print_info "Running pkg to create binary..."
OUTPUT_NAME="rexx-${TARGET}"

# Check if pkg is installed globally or locally
if command -v pkg >/dev/null 2>&1; then
    pkg . --targets "node18-${TARGET}" --output "../${OUTPUT_NAME}"
elif [ -f "node_modules/.bin/pkg" ]; then
    ./node_modules/.bin/pkg . --targets "node18-${TARGET}" --output "../${OUTPUT_NAME}"
else
    print_error "pkg not found. Install with: npm install -g pkg"
    exit 1
fi

cd ..

if [ -f "${OUTPUT_NAME}" ]; then
    SIZE=$(du -h "${OUTPUT_NAME}" | cut -f1)
    print_success "Binary created: ${OUTPUT_NAME} (${SIZE})"
    
    # Make executable
    chmod +x "${OUTPUT_NAME}"
    
    # Test the binary
    print_info "Testing binary..."
    if ./"${OUTPUT_NAME}" --help >/dev/null 2>&1; then
        print_success "Binary test passed"
    else
        print_warning "Binary test failed, but binary was created"
    fi
    
    # Optional: Create compressed version
    if command -v upx >/dev/null 2>&1; then
        print_info "Creating compressed version with UPX..."
        upx -9 "${OUTPUT_NAME}" -o "${OUTPUT_NAME}-compressed" 2>/dev/null || true
        if [ -f "${OUTPUT_NAME}-compressed" ]; then
            COMP_SIZE=$(du -h "${OUTPUT_NAME}-compressed" | cut -f1)
            print_success "Compressed binary created: ${OUTPUT_NAME}-compressed (${COMP_SIZE})"
        fi
    fi
    
else
    print_error "Binary creation failed"
    exit 1
fi

print_success "Build complete!"
echo
echo "Usage:"
echo "  ./${OUTPUT_NAME} script.rexx"
echo "  ./${OUTPUT_NAME} --help"