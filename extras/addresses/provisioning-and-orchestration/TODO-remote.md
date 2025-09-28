# TODO: Missing Features from Legacy ssh-remote-handler.js

The legacy `system/ssh-remote-handler.js` had several multi-host management features that are **not yet implemented** in the current `address-ssh.js`. These features should be considered for future enhancement:
See 9ca0a566a98208fd7dcaf46b7ac38ce67663f978 for that code

## 🔄 Multi-Host Operations
- **Multiple host targeting**: `hosts="server1,server2,server3"` parameter support
- **Parallel execution**: `parallel=true` flag for concurrent operations across hosts
- **Host list parsing**: Automatic splitting and processing of comma-separated host lists

## 📁 File Transfer Operations  
- **Multi-host file upload**: `put hosts="web01,web02" local="/path/to/config" remote="/etc/nginx/nginx.conf" mode="644"`
- **File permission setting**: `mode` parameter for setting file permissions after upload
- **Batch file deployment**: Single command to deploy files to multiple hosts simultaneously

## 🚀 RexxJS Binary Deployment
- **Multi-host RexxJS deployment**: `deploy_rexx hosts="server1,server2" rexx_binary="/path/to/rexx-linux-x64" target_path="/usr/local/bin/rexx"`
- **Binary distribution**: Automated copying and installation of RexxJS binaries to remote hosts
- **Executable permission setting**: Automatic chmod +x after binary deployment

## 🛡️ Enhanced Security Features
- **Trusted hosts validation**: `trustedHosts` set for strict security mode
- **Command allowlist**: `allowedCommands` set for restricting executable commands  
- **Security mode configuration**: 'strict' vs 'moderate' security levels
- **Host validation**: Pattern-based hostname validation

## ⚡ EFS2-Style Management
- **Infrastructure as Code patterns**: Designed for post-provision management workflows
- **Bulk operations**: Optimized for managing multiple servers simultaneously  
- **Progress reporting**: EFS2-inspired logging and status reporting
- **Resource management**: Active connection tracking and cleanup

## 🏗️ Implementation Notes

The current `address-ssh.js` focuses on **individual session management** and **RexxJS integration patterns**, while the legacy version was designed for **infrastructure management** and **bulk operations**.

To implement these features in the current architecture, consider:

1. **Session pooling**: Extend the current session management to handle multiple hosts
2. **Parallel execution framework**: Add Promise.all() patterns for concurrent operations  
3. **Security policy integration**: Add the security validation patterns from the legacy version
4. **Command multiplexing**: Extend the current command parser to handle multi-host syntax

## ⚠️ Migration Status

**COMPLETED**: Basic SSH transport layer, individual session management, RexxJS variable integration
**TODO**: Multi-host capabilities, file transfer operations, bulk deployment features

---
*Legacy file `system/ssh-remote-handler.js` analyzed and archived on 2025-09-26*