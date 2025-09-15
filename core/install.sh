#!/bin/bash

# RexxJS Installation Script
# Installs RexxJS system-wide or locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    echo "RexxJS Installation Script"
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --system          Install system-wide (requires sudo)"
    echo "  --user            Install for current user only"
    echo "  --prefix PATH     Install to custom prefix"
    echo "  --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --system      # Install to /usr/local/bin"
    echo "  $0 --user        # Install to ~/.local/bin"
    echo "  $0 --prefix /opt/rexxjs"
    echo ""
}

install_rexxjs() {
    local install_dir="$1"
    local bin_dir="$2"
    
    print_info "Installing RexxJS to $install_dir"
    
    # Create directories
    mkdir -p "$install_dir"
    mkdir -p "$bin_dir"
    
    # Build bundle if not exists
    if [ ! -f "src/rexxjs-cli.js" ]; then
        print_info "Building RexxJS bundle..."
        npm run bundle
    fi
    
    # Copy files
    cp src/rexxjs-cli.js "$install_dir/"
    cp src/rexx "$bin_dir/"
    
    # Make executable
    chmod +x "$bin_dir/rexx"
    chmod +x "$install_dir/rexxjs-cli.js"
    
    print_success "RexxJS installed successfully!"
    print_info "CLI available as: $bin_dir/rexx"
    print_info "Test with: $bin_dir/rexx --help"
}

# Parse arguments
INSTALL_MODE=""
PREFIX=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --system)
            INSTALL_MODE="system"
            shift
            ;;
        --user)
            INSTALL_MODE="user"
            shift
            ;;
        --prefix)
            PREFIX="$2"
            shift 2
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if we're in the right directory
if [ ! -f "src/cli.js" ] || [ ! -f "package.json" ]; then
    print_error "This script must be run from the RexxJS repository root"
    exit 1
fi

# Determine install paths
if [ -n "$PREFIX" ]; then
    INSTALL_DIR="$PREFIX/lib/rexxjs"
    BIN_DIR="$PREFIX/bin"
elif [ "$INSTALL_MODE" = "system" ]; then
    INSTALL_DIR="/usr/local/lib/rexxjs"
    BIN_DIR="/usr/local/bin"
    if [ "$EUID" -ne 0 ]; then
        print_error "System installation requires sudo"
        echo "Try: sudo $0 --system"
        exit 1
    fi
elif [ "$INSTALL_MODE" = "user" ]; then
    INSTALL_DIR="$HOME/.local/lib/rexxjs"
    BIN_DIR="$HOME/.local/bin"
else
    print_error "Please specify installation mode: --system, --user, or --prefix"
    show_help
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi

# Install
install_rexxjs "$INSTALL_DIR" "$BIN_DIR"

# Add to PATH suggestion
if [ "$INSTALL_MODE" = "user" ]; then
    if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
        echo ""
        print_info "To use 'rexx' from anywhere, add this to your shell profile:"
        echo "  export PATH=\"$BIN_DIR:\$PATH\""
    fi
fi

echo ""
print_success "Installation complete!"
echo "Try: rexx --help"