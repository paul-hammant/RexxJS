# Container and VM Orchestration ADDRESS Module

This module provides ADDRESS PODMAN support for container management operations in RexxJS. It offers comprehensive container lifecycle management with security controls and RexxJS integration.

## Build

This package self-bundles to a single UMD file for consumption by the RexxJS standalone binary (pkg-build).

- Entry: `bundle-entry.js` (loads individual handlers and central shared-utils)
- Output: `bundled-container-handlers.bundle.js`
- Shared utilities: `../shared-utils/index.js` (centralized; no local duplicates)

Commands:
- From this directory: `npm ci && npm run build`

Notes:
- The bundle is consumed by `RexxJS/pkg-build` via its `pkg.assets/scripts` configuration.
- Do not hand-edit generated `.bundle.js` files; make changes in sources and rebuild.

## Features

### Container Operations
- **Container Lifecycle**: Create, start, stop, remove containers
- **Image Management**: Support for approved container images with security validation
- **File Operations**: Copy files to/from containers with validation
- **Log Management**: Retrieve container logs with line count controls
- **Bulk Operations**: Cleanup operations for container maintenance

### RexxJS Integration  
- **Binary Deployment**: `deploy_rexx` with security validation and path checking
- **Script Execution**: `execute_rexx` with CHECKPOINT support for progress monitoring
- **Error Handling**: Comprehensive error reporting with container state validation

### Security Features
- **Security Modes**: 
  - `strict`: Only explicitly trusted binaries and images allowed
  - `moderate`: Current directory binaries and common safe images allowed  
  - `permissive`: All operations allowed (development only)
- **Trusted Binaries**: Configurable allowlist for RexxJS binary deployment
- **Image Validation**: Configurable allowlist for container images
- **Path Validation**: Security checks for binary and file paths

## Usage

### Basic Container Operations

```rexx
-- Initialize with configuration
ADDRESS podman
initialize securityMode=moderate maxContainers=10

-- Container lifecycle
create image=debian:stable name=my-container
start name=my-container
list
stop name=my-container
remove name=my-container
```

### File Operations

```rexx
-- Copy files to/from containers
copy_to container=my-container local=/host/path/file.txt remote=/container/path/file.txt
copy_from container=my-container remote=/container/path/output.txt local=/host/path/output.txt
```

### RexxJS Integration

```rexx
-- Deploy RexxJS binary (enhanced with security validation)
deploy_rexx container=my-container rexx_binary=/path/to/rexx-linux-x64 target=/usr/local/bin/rexx

-- Execute RexxJS scripts with progress monitoring
execute_rexx container=my-container script="SAY 'Hello from container!'" progress_callback=true
```

### Log Management

```rexx
-- Get container logs
logs container=my-container
logs container=my-container lines=100
```

### Cleanup Operations

```rexx
-- Clean up stopped containers
cleanup

-- Clean up all containers (including running)
cleanup all=true
```

## Configuration

### Security Configuration

```javascript
const config = {
  securityMode: 'moderate', // strict, moderate, permissive
  allowedImages: ['debian:stable', 'ubuntu:latest', 'alpine:latest'],
  trustedBinaries: ['/opt/rexx/rexx-linux-x64', '/usr/local/bin/rexx'],
  maxContainers: 20,
  defaultTimeout: 60000
};
```

### Security Modes Explained

#### Strict Mode
- Only explicitly trusted binaries in `trustedBinaries` set
- Only explicitly allowed images in `allowedImages` set
- Highest security, minimal flexibility

#### Moderate Mode (Recommended)
- Allows current working directory binaries
- Allows binaries with 'rexx-linux' in path name
- Allows trusted binaries from configuration
- Good balance of security and usability

#### Permissive Mode
- Allows any binary path (development only)
- Allows any container image
- Minimal security controls

## Testing

### Mock Mode
Set `useMockMode=true` for testing without actual podman:

```rexx
ADDRESS podman
initialize useMockMode=true securityMode=moderate
```

### Test Coverage
- ✅ All container lifecycle operations
- ✅ File copy operations (to/from containers)  
- ✅ Log retrieval with line count controls
- ✅ Cleanup operations (selective and all)
- ✅ Security validation for deploy_rexx
- ✅ Error handling for all edge cases

## Implementation Status

### Completed Features ✅
1. **File Operations**: `copy_to`, `copy_from` with comprehensive validation
2. **Log Management**: `logs` with line count controls and error handling
3. **Cleanup Operations**: `cleanup` with selective and bulk modes
4. **Module Consolidation**: Unified address-podman.js implementation
5. **Enhanced Security**: `deploy_rexx` with binary path validation and trusted binary support
6. **Enhanced RexxJS Execution**: `execute_rexx` with CHECKPOINT progress monitoring and error handling
7. **Interactive Containers**: Real-time interactive container sessions with TTY support
8. **Resource Limits**: Memory/CPU constraint configuration (memory=512m, cpus=1.5)
9. **Volume Mounting**: Host directory mounting support (volumes="host:container,host2:container2")
10. **Environment Variables**: Container environment injection (environment="KEY=value,KEY2=value2")
11. **Advanced Security**: Command validation, audit logging, and comprehensive security policies
12. **Process Management**: Health monitoring, auto-recovery, and process statistics tracking
13. **Bidirectional CHECKPOINT**: Real-time progress streaming with structured data support

### Implementation Complete 🎉
**All planned features have been successfully implemented!**

The container-and-vm-orchestration module now provides enterprise-grade container management with:
- **Complete lifecycle management** with security controls
- **Real-time monitoring** and health checking
- **Bidirectional progress communication** via CHECKPOINT
- **Comprehensive audit logging** for compliance
- **Advanced security policies** with command validation
- **Resource management** with limits and monitoring
- **Production-ready examples** including GitLab CE provisioning

## Security Best Practices

1. **Use Moderate or Strict Mode**: Avoid permissive mode in production
2. **Configure Trusted Binaries**: Explicitly list allowed RexxJS binary paths
3. **Limit Container Images**: Use minimal, well-maintained base images
4. **Set Container Limits**: Prevent resource exhaustion with maxContainers
5. **Validate File Paths**: Use absolute paths for file operations
6. **Monitor Operations**: Enable logging for security auditing

## Error Handling

All operations return structured results with error information:

```javascript
{
  success: false,
  error: "Container not found: my-container",
  operation: "start",
  // Additional context
}
```

Common error scenarios:
- Container not found or wrong state
- Security policy violations  
- Missing required parameters
- File operation failures
- Resource limit exceeded

## Development Guidelines

- **Baby Commits**: One feature enhancement per commit
- **Comprehensive Testing**: Both mock and real mode tests required
- **Security First**: All binary/file operations must validate paths
- **Error Context**: Provide detailed error messages with operation context
- **Logging**: Log all operations for debugging and auditing
