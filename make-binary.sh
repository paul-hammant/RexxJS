#!/bin/bash

# RexxJS Binary Builder
# Creates standalone executable using pkg with deterministic mode-aware cli.js
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

# Directories
CORE_DIR="./core"
BUILD_DIR="./pkg-build"

# Step 1: Clean and create build directory
print_info "Setting up build directory..."
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
fi
mkdir -p "$BUILD_DIR"

# Step 2: Create package.json for pkg
print_info "Creating package configuration..."
cat > "$BUILD_DIR/package.json" <<'EOF'
{
  "name": "rexxjs-standalone",
  "version": "1.0.0",
  "description": "RexxJS Standalone Executable",
  "main": "cli.js",
  "bin": {
    "rexx": "./cli.js"
  },
  "pkg": {
    "targets": ["node18-linux-x64"],
    "assets": [
      "src/**/*",
      "../../dist/addresses/system-address.bundle.js"
    ],
    "scripts": "src/**/*.js"
  }
}
EOF

# Step 3: Copy source files
print_info "Copying source files..."
mkdir -p "$BUILD_DIR/src"

# Copy all source files recursively
cp -r "$CORE_DIR/src/"* "$BUILD_DIR/src/"

# Copy CLI without modification - it's mode-aware and handles pkg vs nodejs deterministically
cp "$CORE_DIR/src/cli.js" "$BUILD_DIR/cli.js"

# Fix source files with relative requires for pkg snapshot
print_info "Making source files PKG-compatible..."
for file in "$BUILD_DIR/src/executor.js" "$BUILD_DIR/src/parser.js" "$BUILD_DIR/src/interpreter.js"; do
    if [ -f "$file" ]; then
        # Replace require('./foo') with require(path.join(__dirname, 'foo'))
        sed -i "s|require(['\"]\\./\\([^'\"]*\\)['\"])|require(require('path').join(__dirname, '\\1'))|g" "$file"
    fi
done

print_success "Source files prepared"

# Step 4: Install pkg if needed
print_info "Ensuring pkg is available..."
if ! command -v npx >/dev/null 2>&1; then
    print_error "npx not found. Please install Node.js"
    exit 1
fi

# Step 5: Run pkg to create binary
print_info "Running pkg to create binary..."
OUTPUT_NAME="rexx-${TARGET}"

cd "$BUILD_DIR"
npx pkg . --target "node18-${TARGET}" --output "../${OUTPUT_NAME}" 2>&1 | grep -v "Warning Cannot resolve"
cd ..

if [ ! -f "${OUTPUT_NAME}" ]; then
    print_error "Binary creation failed"
    exit 1
fi

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

# Create rexxt wrapper symlink for test runner mode
print_info "Creating rexxt test runner wrapper..."
cat > rexxt <<'EOF'
#!/bin/bash
#
# rexxt - RexxJS Test Runner Wrapper
# Sets REXXJS_TEST_RUNNER=true and delegates to the main rexx binary
#

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set test runner mode
export REXXJS_TEST_RUNNER=true

# Delegate to the main rexx binary in the same directory
exec "$SCRIPT_DIR/rexx" "$@"
EOF
chmod +x rexxt
print_success "Created bin/rexxt test runner wrapper"

cd ..

# Keep only the last 10 binaries for this target
print_info "Cleaning up old binaries for $TARGET..."
cd bin
ls -1t rexx-$TARGET-20* 2>/dev/null | tail -n +11 | xargs -r rm -f
REMAINING=$(ls -1 rexx-$TARGET-20* 2>/dev/null | wc -l)
print_success "Kept $REMAINING most recent $TARGET binaries"
cd ..

# Cleanup build directory
print_info "Removing build directory..."
rm -rf "$BUILD_DIR"
print_success "Build artifacts cleaned"

print_success "Build complete!"
echo
echo "Usage:"
echo "  ./bin/rexx-$TARGET-bin script.rexx"
echo "  ./bin/rexx-$TARGET-bin --help"
echo "  ./bin/$TIMESTAMPED_NAME script.rexx  (direct access to this version)"
if [ "$TARGET" = "$SYSTEM_TARGET" ]; then
echo "  ./bin/rexx script.rexx  (generic symlink for current system)"
echo "  ./bin/rexxt test.rexx   (test runner wrapper - sets REXXJS_TEST_RUNNER=true)"
fi