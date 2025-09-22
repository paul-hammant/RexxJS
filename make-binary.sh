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

# Dependencies are now in core/src/ and automatically included

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
    
    # Create bin directory if it doesn't exist
    mkdir -p bin
    
    # Generate timestamp for binary name (ccyy-mm-dd-hh-mm-ss format)
    TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
    TIMESTAMPED_NAME="rexx-$TARGET-$TIMESTAMP"
    
    # Move binary to bin/ with timestamp suffix
    mv "${OUTPUT_NAME}" "bin/$TIMESTAMPED_NAME"
    print_success "Binary moved to: bin/$TIMESTAMPED_NAME"
    
    # Create symlink to most recent binary for this target
    cd bin
    ln -sf "$TIMESTAMPED_NAME" "rexx-$TARGET-bin"
    print_success "Symlink created: bin/rexx-$TARGET-bin -> $TIMESTAMPED_NAME"
    
    # Create generic bin/rexx symlink only if system architecture matches
    SYSTEM_ARCH=$(uname -m)
    case "$SYSTEM_ARCH" in
        x86_64)
            SYSTEM_TARGET="linux-x64"
            ;;
        aarch64|arm64)
            SYSTEM_TARGET="linux-arm64"
            ;;
        *)
            SYSTEM_TARGET="unknown"
            ;;
    esac
    
    if [ "$TARGET" = "$SYSTEM_TARGET" ]; then
        ln -sf "$TIMESTAMPED_NAME" "rexx"
        print_success "Generic symlink created: bin/rexx -> $TIMESTAMPED_NAME (matches system $SYSTEM_ARCH)"
    else
        print_info "Skipping generic bin/rexx symlink (target $TARGET doesn't match system $SYSTEM_ARCH)"
    fi
    
    cd ..
    
    # Keep only the last 10 binaries for this target
    print_info "Cleaning up old binaries for $TARGET..."
    cd bin
    ls -1t rexx-$TARGET-20* 2>/dev/null | tail -n +11 | xargs -r rm -f
    REMAINING=$(ls -1 rexx-$TARGET-20* 2>/dev/null | wc -l)
    print_success "Kept $REMAINING most recent $TARGET binaries"
    cd ..
    
    # Optional: Create compressed version
    if command -v upx >/dev/null 2>&1; then
        print_info "Creating compressed version with UPX..."
        upx -9 "bin/$TIMESTAMPED_NAME" -o "bin/${TIMESTAMPED_NAME}-compressed" 2>/dev/null || true
        if [ -f "bin/${TIMESTAMPED_NAME}-compressed" ]; then
            COMP_SIZE=$(du -h "bin/${TIMESTAMPED_NAME}-compressed" | cut -f1)
            print_success "Compressed binary created: bin/${TIMESTAMPED_NAME}-compressed (${COMP_SIZE})"
        fi
    fi
    
else
    print_error "Binary creation failed"
    exit 1
fi

print_success "Build complete!"
echo
echo "Usage:"
echo "  ./bin/rexx-$TARGET-bin script.rexx"
echo "  ./bin/rexx-$TARGET-bin --help"
echo "  ./bin/$TIMESTAMPED_NAME script.rexx  (direct access to this version)"
if [ "$TARGET" = "$SYSTEM_TARGET" ]; then
echo "  ./bin/rexx script.rexx  (generic symlink for current system)"
fi