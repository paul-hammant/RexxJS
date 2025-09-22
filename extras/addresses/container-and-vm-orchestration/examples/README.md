# ADDRESS PODMAN Examples

This directory contains example RexxJS scripts demonstrating the ADDRESS PODMAN container management functionality.

## Files

### `test-address-podman.rexx`
Basic integration test showing:
- Loading the ADDRESS PODMAN handler
- Switching to ADDRESS PODMAN 
- Basic container operations (status, create, list)
- REXX variable integration (RC, RESULT, PODMAN_*)

### `address-podman-demo.rexx`
Comprehensive demonstration of all ADDRESS PODMAN features:
- Complete container lifecycle (create, start, stop, remove)
- Status checking and container listing
- Auto-naming functionality
- Error handling examples
- REXX variable integration

## Running the Examples

From the RexxJS root directory:
```bash
# Run basic test
./rexx-linux-x64 extras/addresses/container-and-vm-orchestration/examples/test-address-podman.rexx

# Run full demo
./rexx-linux-x64 extras/addresses/container-and-vm-orchestration/examples/address-podman-demo.rexx
```

From within the examples directory:
```bash
# Run basic test
../../../../rexx-linux-x64 test-address-podman.rexx

# Run full demo
../../../../rexx-linux-x64 address-podman-demo.rexx
```

## Expected Output

Both examples should run successfully, showing:
- ✅ ADDRESS target registration and loading
- ✅ Container operations with RC=0 (success)
- ✅ Proper REXX variable values
- ✅ Mock container management working end-to-end

## Note

These examples use a mock container runtime for testing purposes. They simulate container operations without requiring actual Podman installation.