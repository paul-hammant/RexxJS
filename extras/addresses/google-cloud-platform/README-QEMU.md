# ADDRESS QEMU - Virtual Machine Management

RexxJS integration for QEMU/KVM virtual machine operations.

## Key Features

✅ **Three execution methods** - QEMU Guest Agent (no SSH!), SSH fallback, or serial console
✅ **Real command execution** - Execute commands in VMs via qemu-guest-agent or SSH
✅ **RexxJS integration** - Run RexxJS scripts directly in VMs with progress monitoring
✅ **Complete VM lifecycle** - Create, start, stop, snapshot, restore VMs
✅ **Guest Agent support** - Automated installation and configuration
✅ **ISO management** - Download, attach, and manage OS installation media
✅ **Network configuration** - User, bridge, TAP networking support
✅ **Security policies** - Memory/CPU limits, command filtering, audit logging
✅ **Production-ready** - Host verification, permissions setup, monitoring

## Quick Comparison: QEMU vs VirtualBox

| Feature | QEMU/KVM | VirtualBox |
|---------|----------|------------|
| **Hypervisor Type** | Type-1 (bare metal KVM) | Type-2 (hosted) |
| **Performance** | 🚀 Faster (KVM acceleration) | 🐢 Slower (emulation overhead) |
| **Exec without SSH** | ✅ Yes (qemu-guest-agent) | ✅ Yes (Guest Additions) |
| **RexxJS Integration** | ✅ Built-in | ✅ Built-in |
| **Linux Support** | ✅ Excellent | ✅ Good |
| **Resource Usage** | 🚀 Light | 🐢 Heavier |
| **Enterprise Use** | ✅ Production standard | ⚠️ Development/testing |
| **Best For** | Production servers, cloud | Desktop VMs, development |

## Basic Usage

```rexx
REQUIRE "rexxjs/address-qemu" AS QEMU
ADDRESS QEMU

/* Create a VM */
"create image=ubuntu.qcow2 name=dev-vm memory=2G cpus=2"

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

QEMU ADDRESS provides comprehensive VM lifecycle commands including idempotent operations for automation.

### Basic Lifecycle

```rexx
ADDRESS QEMU

/* Standard start/stop (fail if already in target state) */
"start name=my-vm"      /* Fails if already running */
"stop name=my-vm"       /* Fails if not running */
```

### Idempotent Lifecycle (Recommended for Automation)

```rexx
ADDRESS QEMU

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
ADDRESS QEMU

/* Restart VM (stop then start) */
"restart name=my-vm"

/* Pause and resume (via virsh) */
"pause name=my-vm"              /* Suspend execution (virsh suspend) */
"resume name=my-vm"             /* Continue execution (virsh resume) */

/* Save and restore state (via virsh) */
"save_state name=my-vm"         /* Save RAM + state (virsh managedsave) */
"restore_state name=my-vm"      /* Restore saved state (virsh start) */
```

### Lifecycle Command Comparison

| Command | Effect | Idempotent | Backend | Use Case |
|---------|--------|------------|---------|----------|
| `start` | Start VM | ❌ No | qemu-system | Manual control |
| `stop` | Stop VM | ❌ No | kill | Manual control |
| `start_if_stopped` | Start if not running | ✅ Yes | qemu-system | Automation scripts |
| `stop_if_running` | Stop if running | ✅ Yes | kill | Automation scripts |
| `restart` | Stop then start | ⚠️ Partial | qemu-system | Apply changes |
| `pause` | Suspend execution | ❌ No | virsh suspend | Temporary freeze |
| `resume` | Continue execution | ❌ No | virsh resume | Resume from pause |
| `save_state` | Save & stop | ❌ No | virsh managedsave | Quick suspend |
| `restore_state` | Restore & start | ❌ No | virsh start | Resume from saved |

**Note:** Pause/resume and save/restore state require libvirt (virsh) to be installed. If libvirt is not available, these commands will fail.

### Automation Example

```rexx
ADDRESS QEMU

/* Idempotent CI/CD test execution */
"start_if_stopped name=ci-vm"
"execute vm=ci-vm command=\"cd /workspace && make test\""
exitCode = QEMU_EXIT_CODE

IF exitCode = 0 THEN DO
  SAY "Build succeeded!"
  "execute vm=ci-vm command=\"make deploy\""
END
ELSE DO
  SAY "Build failed with exit code" exitCode
  "execute vm=ci-vm command=\"cat /workspace/test.log\""
END

"stop_if_running name=ci-vm"
```

### State Preservation Comparison

| Method | Speed | Memory Preserved | Disk I/O | Best For |
|--------|-------|------------------|----------|----------|
| **stop/start** | 🐢 Slow | ❌ No | Low | Clean restart |
| **pause/resume** | 🚀 Instant | ✅ Yes | None | Temporary pause |
| **save/restore** | ⚡ Fast | ✅ Yes | High | Long-term suspend |

## VM Creation Options

```rexx
ADDRESS QEMU

/* Basic VM */
"create image=debian.qcow2 name=test-vm"

/* VM with custom resources */
"create image=ubuntu.qcow2 name=build-vm memory=4G cpus=4"

/* VM with custom disk and network */
"create image=alpine.qcow2 name=web-vm disk=/tmp/custom.qcow2 network=bridge"
```

## RexxJS Integration

```rexx
ADDRESS QEMU

/* Create and start VM */
"create image=debian.qcow2 name=rexx-vm memory=2G"

/* Deploy RexxJS binary */
"deploy_rexx vm=rexx-vm rexx_binary=/host/rexx target=/usr/local/bin/rexx"

/* Execute RexxJS script */
"execute_rexx vm=rexx-vm script=\"SAY 'Hello from VM!'\""

/* Execute script from file */
"execute_rexx vm=rexx-vm script_file=/host/scripts/test.rexx"
```

## Command Execution

QEMU ADDRESS provides **three execution methods** - choose the best one for your setup:

### Method 1: QEMU Guest Agent (Recommended)

Execute commands via **qemu-guest-agent** (qemu-ga) - works without network configuration!

```rexx
ADDRESS QEMU

/* Direct execution via QEMU Guest Agent (no SSH needed!) */
"execute vm=dev-vm command=\"ls -la\""

/* Execute with working directory */
"execute vm=dev-vm command=\"pwd\" working_dir=/tmp"

/* Execute with custom timeout (milliseconds) */
"execute vm=dev-vm command=\"sudo apt update\" timeout=300000"

/* Complex commands */
"execute vm=dev-vm command=\"ps aux | grep qemu\""
"execute vm=dev-vm command=\"df -h && free -m\""
```

**Requirements:**
- VM must be running
- qemu-guest-agent installed in VM (use `install_guest_agent`)
- libvirt or QMP socket access

**How it works:**
Uses `virsh qemu-agent-command` or direct QMP socket to execute commands, similar to VirtualBox guestcontrol or docker exec.

### Method 2: SSH Execution (Fallback)

Traditional SSH access when Guest Agent isn't available:

```rexx
ADDRESS QEMU

/* Configure SSH access for VM */
"configure_ssh name=dev-vm host=192.168.122.100 user=root key_file=/home/user/.ssh/id_rsa"

/* Now execute commands via SSH */
"execute vm=dev-vm command=\"ls -la\""

/* Guest Agent automatically falls back to SSH if unavailable */
"execute vm=dev-vm command=\"systemctl status sshd\""
```

**Requirements:**
- SSH server running in VM
- Network configured (bridge, NAT with port forwarding, or user networking)
- SSH credentials configured

### Method 3: Serial Console (Expert Mode)

Low-level execution via VM serial console (not yet fully implemented):

```rexx
ADDRESS QEMU

/* Execute via serial console */
"execute vm=dev-vm command=\"uname -a\" method=serial"
```

**Requirements:**
- Serial console configured on VM
- Terminal automation support
- Expert knowledge of serial protocols

## Execution Method Comparison

| Feature | Guest Agent | SSH | Serial |
|---------|-------------|-----|--------|
| **No network setup** | ✅ Yes | ❌ No | ✅ Yes |
| **Guest agent required** | ✅ Required | ❌ Not needed | ❌ Not needed |
| **Network config** | ❌ Not needed | ✅ Required | ❌ Not needed |
| **RexxJS support** | ⚠️ Via deploy | ⚠️ Via deploy | ⚠️ Manual |
| **Progress tracking** | ❌ No | ❌ No | ❌ No |
| **Speed** | 🚀 Fast | 🐢 Slower | 🐌 Slowest |
| **Reliability** | ✅ High | ✅ High | ⚠️ Medium |
| **Best for** | Production | Legacy systems | Emergency access |
| **Auto-fallback** | → SSH | - | - |

## Complete Execution Setup

```rexx
ADDRESS QEMU

/* 1. Create and start VM */
"create image=debian.qcow2 name=exec-demo memory=2G cpus=2"
"start name=exec-demo"

/* 2. Option A: Install Guest Agent (recommended) */
"configure_ssh name=exec-demo host=192.168.122.50 user=root"  /* Temporary SSH for install */
"install_guest_agent name=exec-demo"  /* Installs qemu-guest-agent */

/* 3. Now execute commands directly (no SSH needed anymore!) */
"execute vm=exec-demo command=\"whoami\""
"execute vm=exec-demo command=\"sudo apt update && sudo apt install -y nginx\""

/* 4. Check service status */
"execute vm=exec-demo command=\"sudo systemctl status nginx\""

/* 5. Deploy RexxJS for script execution */
"deploy_rexx vm=exec-demo rexx_binary=/usr/local/bin/rexx"

/* 6. Execute RexxJS scripts */
"execute_rexx vm=exec-demo script=\"SAY 'QEMU VM is ready!'; SAY 'Guest Agent working!'\""

/* 7. Run application script */
"execute_rexx vm=exec-demo script_file=/host/app/startup.rexx progress_callback=true"
```

## QEMU Guest Agent Setup

**QEMU Guest Agent is essential** for executing commands, copying files, and running RexxJS scripts in VMs without SSH or network configuration.

### What Guest Agent Enables

With qemu-guest-agent installed in your VM:
- ✅ Execute commands directly via QMP/virsh (no SSH needed)
- ✅ Copy files to/from VM without network setup
- ✅ Deploy and run RexxJS scripts seamlessly
- ✅ Works immediately after VM boot (no network delays)
- ✅ More secure than SSH (no exposed ports)
- ✅ Automatic fallback to SSH if needed

### Automatic Installation (Recommended)

```rexx
ADDRESS QEMU

/* Create and start VM */
"create image=debian.qcow2 name=my-vm memory=2G"
"start name=my-vm"

/* Configure temporary SSH access for installation */
"configure_ssh name=my-vm host=192.168.122.50 user=root"

/* Install Guest Agent (auto-detects OS and package manager) */
"install_guest_agent name=my-vm"

/* Guest Agent is now active - SSH no longer needed! */
"execute vm=my-vm command=\"systemctl status qemu-guest-agent\""
"execute vm=my-vm command=\"echo 'No SSH required!'\""
```

**How it works:**
1. Uses temporary SSH connection to access VM
2. Detects OS type (Debian/Ubuntu, RHEL/CentOS, Fedora, Arch)
3. Installs appropriate package (`qemu-guest-agent`)
4. Starts and enables the service
5. Verifies Guest Agent is responding
6. SSH no longer required for subsequent operations

### Manual Installation

If you prefer to install Guest Agent manually during VM setup:

**Debian/Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install -y qemu-guest-agent
sudo systemctl start qemu-guest-agent
sudo systemctl enable qemu-guest-agent
```

**RHEL/CentOS/Rocky/Alma:**
```bash
sudo yum install -y qemu-guest-agent
sudo systemctl start qemu-guest-agent
sudo systemctl enable qemu-guest-agent
```

**Fedora:**
```bash
sudo dnf install -y qemu-guest-agent
sudo systemctl start qemu-guest-agent
sudo systemctl enable qemu-guest-agent
```

**Arch Linux:**
```bash
sudo pacman -S qemu-guest-agent
sudo systemctl start qemu-guest-agent
sudo systemctl enable qemu-guest-agent
```

### Cloud Images (Pre-installed)

Most cloud images come with qemu-guest-agent pre-installed:
- Ubuntu Cloud Images
- Debian Cloud Images
- CentOS Cloud Images
- Fedora Cloud Images

Just start the VM and Guest Agent works immediately!

### Verifying Guest Agent

```rexx
ADDRESS QEMU

/* Check if Guest Agent is responding */
"execute vm=my-vm command=\"echo 'Guest Agent test'\""

/* If this succeeds, Guest Agent is working */
/* If it fails, check the troubleshooting section below */
```

Or manually via virsh:
```bash
virsh qemu-agent-command my-vm '{"execute":"guest-ping"}'
```

### When to Use SSH vs Guest Agent

**Use Guest Agent when:**
- ✅ You want fastest execution (no network overhead)
- ✅ VM doesn't have network configured yet
- ✅ You need secure execution without exposed SSH ports
- ✅ Working with cloud images (usually pre-installed)

**Use SSH when:**
- ⚠️ Guest Agent isn't installed (legacy VMs)
- ⚠️ You're working with non-QEMU/KVM VMs
- ⚠️ You need interactive sessions (not just command execution)

**The handler automatically falls back from Guest Agent → SSH if Guest Agent isn't available.**

## File Operations

```rexx
ADDRESS QEMU

/* Copy files to VM (uses Guest Agent if available, else SSH) */
"copy_to vm=dev-vm local=/host/file.txt remote=/vm/file.txt"

/* Copy files from VM */
"copy_from vm=dev-vm remote=/vm/result.txt local=/host/result.txt"
```

## Snapshot Management

```rexx
ADDRESS QEMU

/* Create snapshot */
"snapshot name=dev-vm snapshot_name=before-update"

/* Restore from snapshot */
"restore name=dev-vm snapshot_name=before-update"
```

## Monitoring & Health

```rexx
ADDRESS QEMU

/* Start process monitoring */
"start_monitoring"

/* Get process statistics */
"process_stats"

/* Configure health checks */
"configure_health_check vm=dev-vm enabled=true interval=30000"

/* Stop monitoring */
"stop_monitoring"
```

## Host System Setup

```rexx
ADDRESS QEMU

/* Verify QEMU/KVM host setup */
"verify_host"

/* Setup permissions for current user */
"setup_permissions username=myuser"

/* List available OS types */
"list_ostypes"
```

## ISO and Template Management

```rexx
ADDRESS QEMU

/* Download Ubuntu ISO */
"download_iso url=https://releases.ubuntu.com/22.04/ubuntu-22.04.3-server-amd64.iso destination=/tmp/ubuntu.iso os_type=ubuntu22.04"

/* Attach ISO to VM */
"attach_iso name=my-vm iso_path=/tmp/ubuntu.iso"

/* Install Guest Agent (requires SSH initially) */
"configure_ssh name=my-vm host=192.168.122.50 user=root"
"install_guest_agent name=my-vm"

/* Detach ISO when done */
"detach_iso name=my-vm"
```

## Network Configuration

```rexx
ADDRESS QEMU

/* Configure user networking (default, NAT-like) */
"configure_network name=my-vm type=user"

/* Configure bridged network */
"configure_network name=my-vm type=bridge bridge_name=br0"

/* Configure TAP network */
"configure_network name=my-vm type=tap tap_name=tap0"
```

## SSH Configuration

```rexx
ADDRESS QEMU

/* Configure SSH for VM execution */
"configure_ssh name=my-vm host=192.168.122.100 port=22 user=root"

/* With key file */
"configure_ssh name=my-vm host=192.168.122.100 user=ubuntu key_file=/home/user/.ssh/vm_key"

/* Now commands use SSH */
"execute vm=my-vm command=\"ls -la\""
```

## Cleanup

```rexx
ADDRESS QEMU

/* Cleanup stopped VMs */
"cleanup"

/* Cleanup all VMs */
"cleanup all=true"
```

## Security & Audit

```rexx
ADDRESS QEMU

/* Get security audit log */
"security_audit"

/* Get checkpoint monitoring status */
"checkpoint_status"
```

## Troubleshooting

### Guest Agent Not Responding

**Problem**: `execute` commands fail with "Guest Agent not responding"

**Solutions:**
```bash
# 1. Check if qemu-guest-agent is installed in VM
virsh qemu-agent-command my-vm '{"execute":"guest-ping"}'

# 2. Verify virtio-serial is enabled (required for Guest Agent)
virsh dumpxml my-vm | grep "channel type='unix'"

# 3. Check Guest Agent service status in VM (via SSH or console)
systemctl status qemu-guest-agent

# 4. Restart Guest Agent service
systemctl restart qemu-guest-agent

# 5. Verify VM has virtio-serial device
virsh qemu-agent-command my-vm '{"execute":"guest-info"}'
```

**From RexxJS:**
```rexx
ADDRESS QEMU

/* Force SSH execution instead */
"configure_ssh name=my-vm host=192.168.122.50 user=root"
"execute vm=my-vm command=\"systemctl restart qemu-guest-agent\" method=ssh"

/* Then try Guest Agent again */
"execute vm=my-vm command=\"echo test\""
```

### VM Won't Start

**Problem**: `start` command fails

**Solutions:**
```bash
# 1. Check if KVM module is loaded
lsmod | grep kvm

# 2. Load KVM module if needed
sudo modprobe kvm
sudo modprobe kvm_intel  # or kvm_amd for AMD CPUs

# 3. Verify user permissions
groups $USER | grep -E 'kvm|libvirt'

# 4. Check if /dev/kvm exists and is accessible
ls -l /dev/kvm

# 5. Verify qemu binary exists
which qemu-system-x86_64
```

**From RexxJS:**
```rexx
ADDRESS QEMU

/* Verify host setup */
"verify_host"

/* Setup permissions if needed */
"setup_permissions username=myuser"
```

### SSH Connection Fails

**Problem**: Cannot configure SSH or SSH execution fails

**Solutions:**
```bash
# 1. Verify VM has network and SSH server running
ping 192.168.122.50
ssh root@192.168.122.50 "echo test"

# 2. Check VM network configuration
virsh net-list
virsh net-dhcp-leases default

# 3. Check firewall rules
sudo iptables -L -n | grep 22

# 4. Verify SSH key permissions
chmod 600 ~/.ssh/id_rsa
ls -l ~/.ssh/id_rsa
```

**From RexxJS:**
```rexx
ADDRESS QEMU

/* Test with password authentication first */
"configure_ssh name=my-vm host=192.168.122.50 user=root"

/* Then try key-based auth */
"configure_ssh name=my-vm host=192.168.122.50 user=root key_file=/home/user/.ssh/id_rsa"
```

### Command Execution Timeout

**Problem**: Commands timeout before completing

**Solution:**
```rexx
ADDRESS QEMU

/* Increase timeout (default is 120000ms = 2 minutes) */
"execute vm=my-vm command=\"apt update\" timeout=600000"  /* 10 minutes */

/* For very long operations, use background execution */
"execute vm=my-vm command=\"apt upgrade -y\" timeout=1800000"  /* 30 minutes */
```

### Permission Denied Errors

**Problem**: Cannot access /dev/kvm or libvirt

**Solutions:**
```bash
# 1. Add user to required groups
sudo usermod -a -G kvm,libvirt $USER

# 2. Logout and login again for group changes to take effect
# Or use newgrp
newgrp kvm

# 3. Verify /dev/kvm permissions
sudo chmod 666 /dev/kvm  # Not recommended for production!
# Better: ensure kvm group owns it
sudo chown root:kvm /dev/kvm
sudo chmod 660 /dev/kvm

# 4. Check libvirt socket permissions
ls -l /var/run/libvirt/libvirt-sock
```

**From RexxJS:**
```rexx
ADDRESS QEMU

/* Automated setup (requires sudo) */
"setup_permissions username=myuser"

/* Then verify */
"verify_host"
```

### File Copy Fails

**Problem**: `copy_to` or `copy_from` fails

**Solutions:**
```rexx
ADDRESS QEMU

/* 1. Ensure VM is running */
"list"

/* 2. Check Guest Agent is responding */
"execute vm=my-vm command=\"echo test\""

/* 3. Verify paths exist */
"execute vm=my-vm command=\"ls -la /target/directory\""
"execute vm=my-vm command=\"df -h\""  /* Check disk space */

/* 4. Try with explicit method */
"copy_to vm=my-vm local=/tmp/file.txt remote=/tmp/file.txt method=ssh"
```

### RexxJS Deployment Issues

**Problem**: `deploy_rexx` or `execute_rexx` fails

**Solutions:**
```rexx
ADDRESS QEMU

/* 1. Verify RexxJS binary path on host */
"execute vm=my-vm command=\"which rexx\""

/* 2. Check if binary is executable */
"execute vm=my-vm command=\"ls -l /usr/local/bin/rexx\""
"execute vm=my-vm command=\"file /usr/local/bin/rexx\""

/* 3. Test binary works */
"execute vm=my-vm command=\"/usr/local/bin/rexx --version\""

/* 4. Redeploy with explicit paths */
"deploy_rexx vm=my-vm rexx_binary=/host/path/to/rexx target=/usr/local/bin/rexx"

/* 5. Try executing with full path */
"execute_rexx vm=my-vm script=\"SAY 'test'\" rexx_path=/usr/local/bin/rexx"
```

### VM Disk Space Full

**Problem**: VM runs out of disk space

**Solutions:**
```bash
# 1. Check current disk usage in VM
virsh qemu-agent-command my-vm '{"execute":"guest-exec", "arguments":{"path":"/bin/df", "arg":["-h"], "capture-output":true}}'

# 2. Resize qcow2 image (VM must be stopped)
qemu-img resize /path/to/vm.qcow2 +10G

# 3. Resize partition in VM (after VM start)
# This depends on OS and partition layout
```

**From RexxJS:**
```rexx
ADDRESS QEMU

/* Check disk usage */
"execute vm=my-vm command=\"df -h\""
"execute vm=my-vm command=\"du -sh /* 2>/dev/null | sort -h | tail -10\""

/* Clean up space */
"execute vm=my-vm command=\"apt clean\""  /* Debian/Ubuntu */
"execute vm=my-vm command=\"yum clean all\""  /* RHEL/CentOS */
```

### Debugging Tips

```rexx
ADDRESS QEMU

/* Enable verbose logging (if supported) */
"status"  /* Shows handler status and active VMs */

/* Check REXX variables after failed command */
SAY "Error:" QEMU_ERROR
SAY "Exit code:" QEMU_EXIT_CODE
SAY "STDERR:" QEMU_STDERR

/* Test Guest Agent manually */
"execute vm=my-vm command=\"guest-ping\" method=guest-agent"

/* Get detailed VM info */
"execute vm=my-vm command=\"systemctl --version\""  /* Check systemd */
"execute vm=my-vm command=\"uname -a\""  /* Check kernel */
"execute vm=my-vm command=\"ps aux | grep qemu-ga\""  /* Check Guest Agent process */
```

## Available Commands

### Basic VM Operations
| Command | Description | Parameters |
|---------|-------------|------------|
| `status` | Get handler status | none |
| `list` | List virtual machines | none |
| `create` | Create new VM | `image`, `name`, `memory`, `cpus`, `disk`, `network` |
| `start` | Start VM | `name` |
| `stop` | Stop VM | `name` |
| `start_if_stopped` | Start VM only if not running (idempotent) | `name` |
| `stop_if_running` | Stop VM only if running (idempotent) | `name` |
| `restart` | Restart VM (stop then start) | `name` |
| `pause` | Pause running VM (via virsh) | `name` |
| `resume` | Resume paused VM (via virsh) | `name` |
| `save_state` | Save VM state and stop (via virsh) | `name` |
| `restore_state` | Restore VM from saved state (via virsh) | `name` |
| `remove` | Remove VM | `name` |

### Host System Setup
| Command | Description | Parameters |
|---------|-------------|------------|
| `verify_host` | Verify QEMU/KVM host setup | none |
| `setup_permissions` | Setup QEMU/KVM permissions | `username` |
| `list_ostypes` | List available OS types | none |

### ISO and Template Management
| Command | Description | Parameters |
|---------|-------------|------------|
| `download_iso` | Download OS ISO | `url`, `destination`, `os_type` |
| `attach_iso` | Attach ISO to VM | `name`, `iso_path` |
| `detach_iso` | Detach ISO from VM | `name` |
| `install_guest_agent` | Install QEMU Guest Agent | `name` |

### Network & SSH Configuration
| Command | Description | Parameters |
|---------|-------------|------------|
| `configure_network` | Configure VM network | `name`, `type`, `bridge_name`, `tap_name` |
| `configure_ssh` | Configure SSH access | `name`, `host`, `port`, `user`, `key_file` |

### Command Execution (Three Methods!)
| Command | Description | Parameters |
|---------|-------------|------------|
| `execute` | Execute command in VM | `vm`, `command`, `timeout`, `working_dir`, `method` |
| `deploy_rexx` | Deploy RexxJS binary | `vm`, `rexx_binary`, `target` |
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

- `QEMU_OPERATION` - The operation performed
- `QEMU_VM` - VM name
- `QEMU_STATUS` - VM status
- `QEMU_EXIT_CODE` - Command exit code
- `QEMU_STDOUT` - Command output
- `QEMU_STDERR` - Command error output
- `QEMU_ERROR` - Error message (if failed)

## Requirements

### Host System Requirements

**Essential packages:**
- `qemu-system-x86_64` - QEMU emulator binary
- `qemu-utils` - Utilities including qemu-img
- `libvirt-daemon-system` - Virtualization management daemon (recommended)
- `libvirt-clients` - Client tools including virsh (recommended)

**Installation commands:**

**Debian/Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install -y qemu-system-x86_64 qemu-utils libvirt-daemon-system libvirt-clients
```

**RHEL/CentOS/Rocky/Alma:**
```bash
sudo yum install -y qemu-kvm qemu-img libvirt libvirt-client virt-install
```

**Fedora:**
```bash
sudo dnf install -y @virtualization
```

**Arch Linux:**
```bash
sudo pacman -S qemu libvirt virt-manager
```

### Permissions

User must be member of:
- `kvm` group - Access to /dev/kvm
- `libvirt` group - Access to libvirt socket (if using libvirt/virsh)

```bash
sudo usermod -a -G kvm,libvirt $USER
# Logout and login again for changes to take effect
```

Or use the automated setup:
```rexx
ADDRESS QEMU
"setup_permissions username=myuser"
```

### VM Requirements

**For Guest Agent execution (recommended):**
- VM must have `qemu-guest-agent` installed
- VM must have virtio-serial device (automatically added by handler)
- Use `install_guest_agent` command for automatic installation

**For SSH execution (fallback):**
- VM must have SSH server installed and running
- VM must have network configured
- Host must have SSH client installed

**Disk images:**
- qcow2 format recommended (supports snapshots, compression)
- raw format also supported
- Pre-built cloud images available from most Linux distributions

### Verification

Run host verification to check all requirements:
```rexx
ADDRESS QEMU
"verify_host"
```

This checks:
- QEMU/KVM installation
- /dev/kvm accessibility
- Hardware virtualization support (Intel VT-x / AMD-V)
- libvirt installation (if available)
- User permissions

## Security

The handler enforces security policies:
- Memory and CPU limits
- Disk path validation
- Command filtering
- Binary path validation
- Audit logging

Configure security mode and limits during initialization.