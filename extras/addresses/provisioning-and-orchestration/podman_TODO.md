# PODMAN Feature Parity TODO

## Missing Features from extras/addresses/system/podman-handler.js

### Core Operations
1. **`copy_to`** - Copy files from host to container
2. **`copy_from`** - Copy files from container to host  
3. **`logs`** - Get container logs
4. **`cleanup`** - Bulk container cleanup operations

### RexxJS Integration  
5. **`deploy_rexx`** - Deploy RexxJS binary to container (enhance existing stub)
6. **`execute_rexx`** - Execute RexxJS scripts in container with CHECKPOINT (enhance existing stub)

### Advanced Container Features
7. **Interactive container support** - Real interactive container sessions
8. **Resource limits** - Memory/CPU constraints
9. **Volume mounting** - Host directory mounting
10. **Environment variables** - Container env var injection

### Security & Validation
11. **Security validation** - Image and binary path validation
12. **Container process management** - Better lifecycle handling

### Progress Monitoring
13. **Progress monitoring** - Real CHECKPOINT bidirectional communication

### Architecture Consolidation
14. **Consolidate dual files** - Merge address-podman.js and address-podman-rexx.js into single file like original system

## Implementation Rules
- ✅ Both mock and real podman implementations required
- ✅ Jest tests with embedded Rexx fragments for each feature
- ✅ Baby commits - one feature at a time
- ✅ ALL tests in extras/addresses/provisioning-and-orchestration/ must pass
- ✅ No podman code or tests in core/

## Status
- [x] 1. copy_to ✅ **COMPLETED** - Both mock and real modes, with comprehensive tests
- [x] 2. copy_from ✅ **COMPLETED** - Both mock and real modes, with comprehensive tests
- [x] 3. logs ✅ **COMPLETED** - Both mock and real modes, with comprehensive tests
- [x] 4. cleanup ✅ **COMPLETED** - Both mock and real modes, with comprehensive tests
- [x] 5. Consolidate address-podman.js and address-podman-rexx.js as extras/addresses/system/ did not have it that way ✅ **COMPLETED**
- [x] 6. deploy_rexx (enhanced) ✅ **COMPLETED** - Added security validation with trusted binaries and path validation
- [x] 7. execute_rexx (enhanced) ✅ **COMPLETED** - Enhanced CHECKPOINT support, progress monitoring, and comprehensive error handling
- [x] 8. Interactive container support ✅ **COMPLETED** - Added interactive=true parameter with TTY support
- [x] 9. Resource limits ✅ **COMPLETED** - Added memory and CPU constraints (memory=512m, cpus=1.5)
- [x] 10. Volume mounting ✅ **COMPLETED** - Added volumes parameter for host:container mounting
- [x] 11. Environment variables ✅ **COMPLETED** - Added environment parameter for KEY=value injection
- [x] 12. Security validation ✅ **COMPLETED** - Enhanced security with command validation, audit logging, and policy enforcement
- [x] 13. Container process management ✅ **COMPLETED** - Added health monitoring, process statistics, and auto-recovery
- [x] 14. Progress monitoring / CHECKPOINT ✅ **COMPLETED** - Bidirectional CHECKPOINT with real-time progress streaming