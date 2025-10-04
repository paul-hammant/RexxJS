# ADDRESS VIRTUALBOX - Virtual Machine Management

RexxJS integration for Oracle VirtualBox virtual machine operations.

## Key Features

✅ **Direct command execution** - Execute commands in VMs without SSH (like `docker exec`)
✅ **RexxJS integration** - Run RexxJS scripts directly in VMs with progress monitoring
✅ **Complete VM lifecycle** - Create, start, stop, snapshot, restore VMs
✅ **Guest Additions support** - Automated installation and configuration
✅ **ISO management** - Download, attach, and manage OS installation media
✅ **Network configuration** - NAT, bridged, host-only, internal networks
✅ **Security policies** - Memory/CPU limits, command filtering, audit logging
✅ **Production-ready** - Host verification, permissions setup, monitoring

## Quick Comparison: VirtualBox vs Docker/Podman

| Feature | VirtualBox | Docker/Podman |
|---------|------------|---------------|
| **VM/Container Type** | Full VMs | Lightweight containers |
| **OS Independence** | ✅ Any OS | ⚠️ Linux-focused |
| **Exec without SSH** | ✅ Yes (Guest Additions) | ✅ Yes (native) |
| **RexxJS Integration** | ✅ Built-in | ✅ Built-in |
| **Network Isolation** | ✅ Full isolation | ⚠️ Shared kernel |
| **Resource Usage** | 🐢 Heavy | 🚀 Light |
| **Startup Time** | 🐢 Slower (minutes) | 🚀 Fast (seconds) |
| **Best For** | Full OS testing, Windows/macOS VMs | Microservices, CI/CD |

## Basic Usage

```rexx
REQUIRE "rexxjs/address-virtualbox" AS VBOX
ADDRESS VIRTUALBOX

/* Verify host setup first */
"verify_host"

/* Create a VM */
"create template=Ubuntu name=dev-vm memory=2048 cpus=2"

/* Check status */
"status"

/* List VMs */
"list"

/* Start/stop VMs */
"start name=dev-vm"
"stop name=dev-vm"

/* Remove VM */
"remove name=dev-vm"
```

## VM Lifecycle Management

VirtualBox ADDRESS provides comprehensive VM lifecycle commands including idempotent operations for automation.

### Basic Lifecycle

```rexx
ADDRESS VIRTUALBOX

/* Standard start/stop (fail if already in target state) */
"start name=my-vm"      /* Fails if already running */
"stop name=my-vm"       /* Fails if not running */
```

### Idempotent Lifecycle (Recommended for Automation)

```rexx
ADDRESS VIRTUALBOX

/* Idempotent start - only starts if not running */
"start_if_stopped name=my-vm"   /* Safe to call multiple times */

/* Idempotent stop - only stops if running */
"stop_if_running name=my-vm"    /* Safe to call multiple times */

/* Perfect for automation scripts */
"start_if_stopped name=my-vm"
"execute vm=my-vm command=\"./run-tests.sh\""
"stop_if_running name=my-vm"
```

### Advanced Lifecycle

```rexx
ADDRESS VIRTUALBOX

/* Restart VM (stop then start) */
"restart name=my-vm"

/* Pause and resume (faster than stop/start) */
"pause name=my-vm"              /* Suspend execution */
"resume name=my-vm"             /* Continue execution */

/* Save and restore state */
"save_state name=my-vm"         /* Save RAM + state to disk, then stop */
"restore_state name=my-vm"      /* Restore saved state and start */
```

### Lifecycle Command Comparison

| Command | Effect | Idempotent | Use Case |
|---------|--------|------------|----------|
| `start` | Start VM | ❌ No | Manual control |
| `stop` | Stop VM | ❌ No | Manual control |
| `start_if_stopped` | Start if not running | ✅ Yes | Automation scripts |
| `stop_if_running` | Stop if running | ✅ Yes | Automation scripts |
| `restart` | Stop then start | ⚠️ Partial | Apply configuration changes |
| `pause` | Suspend execution | ❌ No | Temporary freeze |
| `resume` | Continue execution | ❌ No | Resume from pause |
| `save_state` | Save & stop | ❌ No | Quick suspend/resume |
| `restore_state` | Restore & start | ❌ No | Resume from saved state |

### Automation Example

```rexx
ADDRESS VIRTUALBOX

/* Idempotent test execution */
"start_if_stopped name=test-vm"
"execute vm=test-vm command=\"cd /app && npm test\""
result = VIRTUALBOX_EXIT_CODE

IF result = 0 THEN
  SAY "Tests passed!"
ELSE
  SAY "Tests failed with exit code" result

"stop_if_running name=test-vm"
```

## VM Creation Options

```rexx
ADDRESS VIRTUALBOX

/* Basic VM */
"create template=Debian name=test-vm"

/* VM with custom resources */
"create template=Ubuntu name=build-vm memory=4096 cpus=4"

/* VM with custom OS type */
"create template=Ubuntu name=server-vm ostype=Ubuntu_64 memory=2048 cpus=2"
```

## RexxJS Integration

```rexx
ADDRESS VIRTUALBOX

/* Create and start VM */
"create template=Debian name=rexx-vm memory=2048"
"start name=rexx-vm"

/* Deploy RexxJS binary */
"deploy_rexx vm=rexx-vm rexx_binary=/usr/local/bin/rexx target=/usr/local/bin/rexx"

/* Execute RexxJS script */
"execute_rexx vm=rexx-vm script=\"SAY 'Hello from VirtualBox VM!'\""

/* Execute script from file */
"execute_rexx vm=rexx-vm script_file=/host/scripts/test.rexx"
```

## Command Execution

VirtualBox ADDRESS provides **three ways** to execute commands in VMs:

### Option 1: Built-in Execute (Recommended)

Direct command execution via **VirtualBox Guest Additions** - no SSH needed!

```rexx
ADDRESS VIRTUALBOX

/* Execute shell commands directly (like docker exec) */
"execute vm=dev-vm command=\"ls -la\""

/* Execute with working directory */
"execute vm=dev-vm command=\"pwd\" working_dir=/tmp"

/* Execute with custom timeout (milliseconds) */
"execute vm=dev-vm command=\"sudo apt update\" timeout=300000"

/* Complex commands */
"execute vm=dev-vm command=\"ps aux | grep nginx\""
"execute vm=dev-vm command=\"df -h && free -m\""
```

**Requirements:**
- VM must be running
- Guest Additions must be installed (use `install_guest_additions`)
- Guest credentials configured (default: root with empty password)

**How it works:**
Uses `VBoxManage guestcontrol` to execute commands directly in the VM, similar to `docker exec` or `podman exec`.

### Option 2: Execute RexxJS Scripts

Execute RexxJS scripts directly in VMs with progress monitoring:

```rexx
ADDRESS VIRTUALBOX

/* Execute inline RexxJS script */
"execute_rexx vm=dev-vm script=\"SAY 'Hello from VM!'\""

/* Execute script from file */
"execute_rexx vm=dev-vm script_file=/host/scripts/myapp.rexx"

/* Execute with progress monitoring */
"execute_rexx vm=dev-vm script=\"SAY 'Processing...'; DO i=1 TO 10; SAY i; END\" progress_callback=true"

/* Execute with custom timeout */
"execute_rexx vm=dev-vm script_file=/host/batch.rexx timeout=600000"
```

**Requirements:**
- VM must be running
- Guest Additions installed
- RexxJS binary deployed (use `deploy_rexx`)

### Option 3: SSH Integration (Alternative)

If you prefer traditional SSH access, use the ADDRESS SSH handler:

```rexx
/* Get VM IP address first */
ADDRESS VIRTUALBOX
"execute vm=dev-vm command=\"hostname -I\""
/* Assume output is "192.168.1.100" */

/* Switch to SSH */
ADDRESS SSH
"connect host=192.168.1.100 user=myuser password=mypass"
"execute command=\"ls -la\""
"execute command=\"sudo systemctl status nginx\""
"disconnect"
```

**Requirements:**
- SSH server installed in VM
- Network configured (bridged or port forwarding)
- User credentials

## Comparison: Execute Methods

| Feature | Built-in Execute | Execute RexxJS | SSH |
|---------|------------------|----------------|-----|
| **No SSH setup** | ✅ Yes | ✅ Yes | ❌ No |
| **Guest Additions** | ✅ Required | ✅ Required | ❌ Not needed |
| **Network config** | ❌ Not needed | ❌ Not needed | ✅ Required |
| **RexxJS support** | ⚠️ Manual | ✅ Built-in | ⚠️ Manual |
| **Progress tracking** | ❌ No | ✅ Yes | ❌ No |
| **Speed** | 🚀 Fast | 🚀 Fast | 🐢 Slower |
| **Best for** | Shell commands | RexxJS scripts | Legacy systems |

## Complete Execution Setup Example

```rexx
ADDRESS VIRTUALBOX

/* 1. Create and start VM */
"create template=Ubuntu name=exec-demo memory=2048 cpus=2"
"start name=exec-demo"

/* 2. Install Guest Additions for direct exec */
"install_guest_additions name=exec-demo"

/* 3. Now you can execute commands directly (no SSH needed!) */
"execute vm=exec-demo command=\"whoami\""
"execute vm=exec-demo command=\"sudo apt update && sudo apt install -y htop nginx\""

/* 4. Check service status */
"execute vm=exec-demo command=\"sudo systemctl status nginx\""

/* 5. Deploy RexxJS for script execution */
"deploy_rexx vm=exec-demo rexx_binary=/usr/local/bin/rexx"

/* 6. Execute RexxJS scripts */
"execute_rexx vm=exec-demo script=\"SAY 'VM is ready!'; SAY 'No SSH required!'\""

/* 7. Run application script */
"execute_rexx vm=exec-demo script_file=/host/app/startup.rexx progress_callback=true"
```

## File Operations

```rexx
ADDRESS VIRTUALBOX

/* Copy files to VM */
"copy_to vm=dev-vm local=/host/file.txt remote=/home/user/file.txt"

/* Copy files from VM */
"copy_from vm=dev-vm remote=/home/user/result.txt local=/host/result.txt"
```

## Snapshot Management

```rexx
ADDRESS VIRTUALBOX

/* Create snapshot */
"snapshot name=dev-vm snapshot_name=before-update"

/* Restore from snapshot */
"restore name=dev-vm snapshot_name=before-update"
```

## Monitoring & Health

```rexx
ADDRESS VIRTUALBOX

/* Start process monitoring */
"start_monitoring"

/* Get process statistics */
"process_stats"

/* Configure health checks */
"configure_health_check vm=dev-vm enabled=true interval=60000"

/* Stop monitoring */
"stop_monitoring"
```

## Host System Setup

```rexx
ADDRESS VIRTUALBOX

/* Verify VirtualBox host setup */
"verify_host"

/* Setup permissions for current user */
"setup_permissions username=myuser"

/* List available OS types */
"list_ostypes"
```

## ISO and Template Management

```rexx
ADDRESS VIRTUALBOX

/* Download Ubuntu ISO */
"download_iso url=https://releases.ubuntu.com/22.04/ubuntu-22.04.3-desktop-amd64.iso destination=/tmp/ubuntu.iso os_type=Ubuntu"

/* Attach ISO to VM */
"attach_iso name=my-vm iso_path=/tmp/ubuntu.iso"

/* Install Guest Additions */
"install_guest_additions name=my-vm"

/* Detach ISO when done */
"detach_iso name=my-vm"
```

## Network Configuration

```rexx
ADDRESS VIRTUALBOX

/* Configure NAT network (default) */
"configure_network name=my-vm adapter=1 type=nat"

/* Configure bridged network */
"configure_network name=my-vm adapter=1 type=bridged network_name=eth0"

/* Configure host-only network */
"configure_network name=my-vm adapter=1 type=hostonly network_name=vboxnet0"

/* Configure internal network */
"configure_network name=my-vm adapter=1 type=intnet network_name=intnet1"
```

## Cleanup

```rexx
ADDRESS VIRTUALBOX

/* Cleanup stopped VMs */
"cleanup"

/* Cleanup all VMs */
"cleanup all=true"
```

## Security & Audit

```rexx
ADDRESS VIRTUALBOX

/* Get security audit log */
"security_audit"

/* Get checkpoint monitoring status */
"checkpoint_status"
```

## Available Commands

### Basic VM Operations
| Command | Description | Parameters |
|---------|-------------|------------|
| `status` | Get handler status | none |
| `list` | List virtual machines | none |
| `create` | Create new VM | `template`, `name`, `memory`, `cpus`, `ostype` |
| `start` | Start VM | `name` |
| `stop` | Stop VM | `name` |
| `start_if_stopped` | Start VM only if not running (idempotent) | `name` |
| `stop_if_running` | Stop VM only if running (idempotent) | `name` |
| `restart` | Restart VM (stop then start) | `name` |
| `pause` | Pause running VM | `name` |
| `resume` | Resume paused VM | `name` |
| `save_state` | Save VM state and stop | `name` |
| `restore_state` | Restore VM from saved state | `name` |
| `remove` | Remove VM | `name` |

### Host System Setup
| Command | Description | Parameters |
|---------|-------------|------------|
| `verify_host` | Verify VirtualBox host setup | none |
| `setup_permissions` | Setup VirtualBox permissions | `username` |
| `list_ostypes` | List available OS types | none |

### ISO and Template Management
| Command | Description | Parameters |
|---------|-------------|------------|
| `download_iso` | Download OS ISO | `url`, `destination`, `os_type` |
| `attach_iso` | Attach ISO to VM | `name`, `iso_path`, `port`, `device` |
| `detach_iso` | Detach ISO from VM | `name`, `port`, `device` |
| `install_guest_additions` | Install Guest Additions | `name`, `iso_path` |

### Network Configuration
| Command | Description | Parameters |
|---------|-------------|------------|
| `configure_network` | Configure VM network | `name`, `adapter`, `type`, `network_name` |

### RexxJS Integration
| Command | Description | Parameters |
|---------|-------------|------------|
| `deploy_rexx` | Deploy RexxJS binary | `vm`, `rexx_binary`, `target` |
| `execute` | Execute command in VM | `vm`, `command`, `timeout`, `working_dir` |
| `execute_rexx` | Execute RexxJS script | `vm`, `script` or `script_file`, `timeout`, `progress_callback` |

### File Operations
| Command | Description | Parameters |
|---------|-------------|------------|
| `copy_to` | Copy file to VM | `vm`, `local`, `remote` |
| `copy_from` | Copy file from VM | `vm`, `remote`, `local` |
| `logs` | Get VM console logs | `vm`, `lines` |

### VM Management
| Command | Description | Parameters |
|---------|-------------|------------|
| `snapshot` | Create VM snapshot | `name`, `snapshot_name` |
| `restore` | Restore from snapshot | `name`, `snapshot_name` |
| `cleanup` | Cleanup VMs | `all` |

### Monitoring & Security
| Command | Description | Parameters |
|---------|-------------|------------|
| `security_audit` | Get audit log | none |
| `process_stats` | Get process statistics | none |
| `configure_health_check` | Configure health monitoring | `vm`, `enabled`, `interval`, `command`, `retries` |
| `start_monitoring` | Start process monitoring | none |
| `stop_monitoring` | Stop process monitoring | none |
| `checkpoint_status` | Get checkpoint status | none |

## REXX Variables

After each operation, these variables are set:

- `VIRTUALBOX_OPERATION` - The operation performed
- `VIRTUALBOX_VM` - VM name
- `VIRTUALBOX_STATUS` - VM status
- `VIRTUALBOX_EXIT_CODE` - Command exit code
- `VIRTUALBOX_STDOUT` - Command output
- `VIRTUALBOX_STDERR` - Command error output
- `VIRTUALBOX_ERROR` - Error message (if failed)
- `VIRTUALBOX_SNAPSHOT` - Snapshot name (for snapshot operations)

## Requirements

- Oracle VirtualBox installed (`VBoxManage` command available)
- VirtualBox Guest Additions for guest control operations
- Appropriate permissions for VM management
- Base VM templates or OS installation media

## VirtualBox-Specific Features

### Guest Control
The handler uses VirtualBox Guest Additions for:
- Command execution in VMs (`VBoxManage guestcontrol run`)
- File transfer operations (`VBoxManage guestcontrol copyto/copyfrom`)
- Process monitoring and control

### VM Configuration
VirtualBox VMs are configured with:
- Memory and CPU settings
- Network adapter (NAT by default)
- IOAPIC enabled for multi-core support
- Boot order: DVD, disk, none, none
- VNC display for headless operation

### OS Type Support
Common OS types supported:
- `Ubuntu_64` - Ubuntu 64-bit
- `Debian_64` - Debian 64-bit
- `Other_64` - Generic 64-bit
- `Windows10_64` - Windows 10 64-bit

## Security

The handler enforces security policies:
- Memory and CPU limits (default: 8GB RAM, 8 CPUs)
- Template validation in strict mode
- Command filtering (blocks dangerous commands)
- Binary path validation
- Audit logging
- Maximum VM limits

Configure security mode and limits during initialization:

```rexx
/* Strict security mode */
handler.initialize({
  securityMode: 'strict',
  maxVMs: 5,
  allowedTemplates: ['Ubuntu', 'Debian']
})
```

## Guest Additions Setup

**VirtualBox Guest Additions are essential** for command execution, file operations, and RexxJS integration. They enable the `execute`, `copy_to`, `copy_from`, and `execute_rexx` commands to work without SSH.

### Automatic Installation (Recommended)

```rexx
ADDRESS VIRTUALBOX

"create template=Ubuntu name=my-vm"
"start name=my-vm"

/* Automatic Guest Additions installation */
"install_guest_additions name=my-vm"
```

### Manual Installation

If automatic installation fails, install manually in the VM:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install virtualbox-guest-utils virtualbox-guest-additions-iso

# Start guest services
sudo systemctl enable vboxadd
sudo systemctl start vboxadd

# Verify installation
VBoxControl --version
```

### What Guest Additions Enable

✅ **Direct command execution** (`execute` command - no SSH needed!)
✅ **File transfer** (`copy_to`, `copy_from` commands)
✅ **RexxJS script execution** (`execute_rexx` command)
✅ **Better display resolution**
✅ **Shared clipboard**
✅ **Mouse pointer integration**

**Without Guest Additions:** You'll need to use SSH (ADDRESS SSH) for remote command execution.

## Troubleshooting

### Command Execution Issues

**Problem:** `execute` command fails with "Guest control not available"

**Solutions:**
1. Check Guest Additions are installed and running:
   ```rexx
   "execute vm=my-vm command=\"VBoxControl --version\""
   ```
2. Restart vboxadd service:
   ```rexx
   "execute vm=my-vm command=\"sudo systemctl restart vboxadd\""
   ```
3. Reinstall Guest Additions:
   ```rexx
   "install_guest_additions name=my-vm"
   ```

**Problem:** `execute` command times out

**Solutions:**
1. Increase timeout:
   ```rexx
   "execute vm=my-vm command=\"long-running-command\" timeout=600000"
   ```
2. Check VM is responsive:
   ```rexx
   "execute vm=my-vm command=\"echo test\""
   ```

### Other Common Issues

1. **Permission denied errors**:
   - Run `setup_permissions username=youruser`
   - Add user to vboxusers group manually: `sudo usermod -a -G vboxusers youruser`
   - Log out and back in after group changes

2. **VM creation fails**:
   - Run `verify_host` to check system setup
   - Verify OS type with `list_ostypes`
   - Check available system resources (RAM, CPU)

3. **File copy fails**:
   - Ensure VM is running: `"status"`
   - Verify Guest Additions: `"execute vm=my-vm command=\"VBoxControl --version\""`
   - Check file paths are accessible

4. **Network connectivity issues**:
   - For NAT networking, VMs can access host but not vice versa
   - Use bridged networking for bi-directional access: `"configure_network name=my-vm type=bridged network_name=eth0"`
   - Use port forwarding with NAT if needed

## Examples

### Complete Production VM Workflow
```rexx
ADDRESS VIRTUALBOX

/* 1. Verify and setup host system */
"verify_host"
"setup_permissions username=myuser"

/* 2. Download and prepare OS template */
"download_iso url=https://releases.ubuntu.com/22.04/ubuntu-22.04.3-server-amd64.iso destination=/tmp/ubuntu-server.iso os_type=Ubuntu"

/* 3. Create and configure VM */
"create template=Ubuntu name=web-server memory=2048 cpus=2 ostype=Ubuntu_64"
"configure_network name=web-server adapter=1 type=bridged network_name=eth0"
"attach_iso name=web-server iso_path=/tmp/ubuntu-server.iso"

/* 4. Start VM and install OS (manual step) */
"start name=web-server"
/* Manual: Complete OS installation via VirtualBox GUI or VNC */

/* 5. Install Guest Additions for better integration */
"install_guest_additions name=web-server"

/* 6. Setup and configure the VM */
"execute vm=web-server command=\"sudo apt update && sudo apt install -y nginx openssh-server\""
"execute vm=web-server command=\"sudo systemctl enable nginx ssh\""

/* 7. Create snapshot after base setup */
"snapshot name=web-server snapshot_name=base-configured"

/* 8. Deploy and run RexxJS application */
"deploy_rexx vm=web-server rexx_binary=/usr/local/bin/rexx"
"execute_rexx vm=web-server script=\"SAY 'Web server is ready!'\""

/* 9. Copy application files */
"copy_to vm=web-server local=/host/app/index.html remote=/var/www/html/index.html"

/* 10. Create production snapshot */
"snapshot name=web-server snapshot_name=production-ready"

/* 11. Start monitoring */
"start_monitoring"
"configure_health_check vm=web-server enabled=true interval=60000"

/* When maintenance needed, restore from snapshot */
/* "restore name=web-server snapshot_name=base-configured" */
```

### Quick Development Setup
```rexx
ADDRESS VIRTUALBOX

/* Quick setup for development */
"create template=Ubuntu name=dev-vm memory=4096 cpus=4"
"start name=dev-vm"
"install_guest_additions name=dev-vm"
"deploy_rexx vm=dev-vm rexx_binary=/usr/local/bin/rexx"
"execute_rexx vm=dev-vm script=\"SAY 'Development environment ready!'\""
```