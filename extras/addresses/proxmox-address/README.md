# ADDRESS PROXMOX - Proxmox LXC CoW Implementation

## Quick Start

```bash
# 1. Install Proxmox on Ubuntu (unofficial but supported)
# See "Installing Proxmox on Ubuntu" section below

# 2. Verify installation
pct --version

# 3. Run CoW cloning test
cd extras/addresses/proxmox-address
./test-proxmox-cow.rexx
```

## Overview

**ADDRESS PROXMOX** provides Proxmox LXC container operations with **template-based CoW cloning** using Proxmox's built-in linked clone technology.

## What is Proxmox?

Proxmox VE (Virtual Environment) is an enterprise-grade virtualization platform that combines:
- **LXC Containers** - System containers (what this implementation uses)
- **KVM/QEMU VMs** - Full virtualization
- **Built-in CoW** - Template system with linked clones
- **Web GUI** - Professional management interface
- **Clustering** - Multi-node support
- **Storage** - ZFS, LVM, Ceph integration

## Performance

### Expected Performance (with Templates)
- **Clone speed:** 1-3 seconds (template to linked clone)
- **Space per clone:** Minimal (only stores changes)
- **Boot time:** <1s (container boot)
- **Memory overhead:** ~30-50MB per container
- **Isolation:** LXC namespaces (same as systemd-nspawn)

### Comparison with Other Implementations
| Implementation | Clone Time | Space/Clone | Boot Time | Use Case |
|----------------|------------|-------------|-----------|----------|
| **Proxmox LXC** | **1-3s** | **Minimal** | <1s | **Enterprise containers** |
| LXD + ZFS | 109ms | 13KB | <1s | Full OS containers |
| nspawn + ZFS | 270ms | 14KB | <1s | Simple containers |
| Firecracker + ZFS | 275ms | 0B | <125ms | Serverless |
| QEMU + qcow2 | 165ms | 193KB | 10-30s | Traditional VMs |
| VirtualBox + linked | 200-500ms | Minimal | 10-30s | Desktop VMs |

## Architecture

### CoW Technology: Proxmox Templates & Linked Clones

Proxmox uses a two-step CoW process:

1. **Convert to Template** (`pct template <vmid>`)
   - Marks container as read-only template
   - Becomes base for CoW cloning

2. **Clone from Template** (`pct clone <source> <new-vmid>`)
   - Creates linked clone (CoW)
   - Only stores changes from template
   - Storage backend determines CoW method (ZFS, LVM-thin, etc.)

```
Template (VMID 100)
├── rootfs (read-only)          10GB   (template storage)
└── Used by all clones as base

Clone 1 (VMID 101)
└── rootfs-diff                  50MB   (only changes)

Clone 2 (VMID 102)
└── rootfs-diff                  30MB   (only changes)

Clone 3 (VMID 103)
└── rootfs-diff                  45MB   (only changes)
```

## Commands Implemented

### CoW Cloning Commands
- `register_base` - Convert container to template for CoW cloning
- `clone` - Clone container using linked clone (CoW)
- `clone_from_base` - Clone from registered template base
- `list_bases` - List registered template bases

### LXC Lifecycle
- `status` - Handler status
- `list` - List all containers
- `create` - Create LXC from template
- `start` - Start container
- `stop` - Stop container
- `remove` / `destroy` - Delete container

### Advanced Features
- `deploy_rexx` - Deploy RexxJS binary to container
- `execute` - Execute command in container
- `execute_rexx` - Execute RexxJS script with CHECKPOINT support

## Usage Example

```rexx
REQUIRE "cwd:extras/addresses/proxmox-address/proxmox-address.js"
ADDRESS PROXMOX

/* Check status */
"status"
SAY "Runtime:" RESULT.runtime

/* Create container from Proxmox template */
"create template=local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst vmid=100 hostname=my-base"

/* Register as template base (converts to template) */
"register_base name=ubuntu-base vmid=100"

/* Clone from template base (1-3s with CoW!) */
"clone_from_base base=ubuntu-base vmid=101 hostname=container-1"
SAY "Cloned in" RESULT.cloneTimeMs "ms using" RESULT.method

"clone_from_base base=ubuntu-base vmid=102 hostname=container-2"
"clone_from_base base=ubuntu-base vmid=103 hostname=container-3"

/* List bases */
"list_bases"
SAY "Registered bases:" RESULT.count

/* Start a clone */
"start vmid=101"

/* Cleanup */
"stop vmid=101"
"remove vmid=101"
"remove vmid=102"
"remove vmid=103"
"remove vmid=100"
```

## Advantages

### vs Docker/Podman
- ✅ Enterprise-grade management (GUI + CLI)
- ✅ Built-in clustering and HA
- ✅ Better resource limits and monitoring
- ✅ Professional backup/restore
- ≈ Similar container technology (LXC)

### vs LXD
- ✅ Full virtualization platform (LXC + KVM)
- ✅ Web GUI included
- ✅ Better clustering support
- ❌ Slower cloning (1-3s vs 109ms)
- ❌ More complex setup

### vs Other Implementations
```
Enterprise:    Proxmox > QEMU > VirtualBox > LXD > nspawn > Firecracker
GUI:           Proxmox ≈ VirtualBox > (others: CLI only)
Clone Speed:   LXD > QEMU > nspawn ≈ Firecracker > VirtualBox > Proxmox
Features:      Proxmox > VirtualBox ≈ QEMU > LXD > nspawn > Firecracker
```

## Installing Proxmox on Ubuntu

Proxmox officially runs on Debian, but **can be installed on Ubuntu** (unsupported but works):

### Method 1: Proxmox Packages on Ubuntu (Recommended)

```bash
# Add Proxmox repository (for Ubuntu 22.04/24.04)
wget https://enterprise.proxmox.com/debian/proxmox-release-bookworm.gpg -O /etc/apt/trusted.gpg.d/proxmox-release-bookworm.gpg

# Add repository
echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" | sudo tee /etc/apt/sources.list.d/pve-install-repo.list

# Update and install
sudo apt update
sudo apt install proxmox-ve postfix open-iscsi

# Verify installation
pct --version
qm --version

# Access Web GUI at https://your-ip:8006
```

### Method 2: LXC Tools Only (Lightweight)

If you only want `pct` (Proxmox Container Toolkit) without full Proxmox:

```bash
# Install LXC and dependencies
sudo apt update
sudo apt install lxc lxc-templates bridge-utils

# Note: This gives you LXC but not Proxmox's pct command
# You'd need to modify the handler to use 'lxc' commands instead
```

### Method 3: Full Proxmox via Conversion

Convert Ubuntu to Proxmox (advanced, modifies system significantly):

```bash
# Backup your system first!

# Install Proxmox kernel
sudo apt install pve-kernel-6.2

# Reboot to Proxmox kernel
sudo reboot

# Install Proxmox VE
sudo apt install proxmox-ve

# Reboot
sudo reboot
```

**Warning:** Method 3 significantly modifies your system. Use VMs for testing.

## Storage Backend CoW Support

Proxmox CoW cloning efficiency depends on storage backend:

| Storage Type | CoW Support | Clone Speed | Recommended |
|--------------|-------------|-------------|-------------|
| **ZFS** | ✅ Excellent | Fast | ✅ Best choice |
| **LVM-thin** | ✅ Good | Fast | ✅ Good choice |
| **Ceph RBD** | ✅ Excellent | Medium | ✅ For clusters |
| **Directory** | ❌ Full copy | Slow | ❌ Avoid |
| **NFS** | ❌ Full copy | Slow | ❌ Avoid |

**Recommendation:** Use ZFS or LVM-thin for best CoW performance.

## Proxmox vs Debian Base

Proxmox prefers Debian as the host OS because:
- **Tighter integration** - Built on Debian base
- **Tested packages** - Official support
- **Kernel** - Custom Proxmox kernel
- **Updates** - Managed update process

**However**, running on Ubuntu works with caveats:
- ✅ Core functionality works (LXC, KVM, CoW)
- ✅ pct and qm commands function
- ⚠️ Web GUI may have issues
- ⚠️ Updates require manual management
- ❌ No official support

## Limitations

### Current Implementation
- **LXC only** - No KVM/QEMU VM support yet (uses `pct`, not `qm`)
- **Single node** - No clustering features
- **No GUI integration** - CLI only
- **Manual templates** - Need to create/import templates

### Proxmox Requirements
- **Linux host** - Debian preferred, Ubuntu works
- **Root access** - Requires sudo/root
- **Storage** - ZFS or LVM-thin recommended for CoW
- **Network** - Bridge configuration for containers

## Production Considerations

### When to Use Proxmox
- ✅ Enterprise environment
- ✅ Need both containers AND VMs
- ✅ Want professional GUI
- ✅ Cluster/HA requirements
- ✅ Integrated backup/restore
- ✅ Professional support option

### When NOT to Use
- ❌ Simple single-host containers (use LXD/nspawn)
- ❌ Ultra-fast cloning needed (use LXD)
- ❌ Serverless/FaaS (use Firecracker)
- ❌ Desktop virtualization (use VirtualBox)
- ❌ Don't want Debian-based host

## Container Templates

Proxmox uses standard LXC templates. Common templates:

```bash
# List available templates
pveam available

# Download template
pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.zst

# Templates stored in
ls /var/lib/vz/template/cache/
```

## Next Steps

To make this production-ready:

1. **Add KVM/QEMU support** - Implement `qm` commands for full VMs
2. **Cluster integration** - Multi-node support
3. **Storage management** - Auto-configure ZFS/LVM-thin
4. **Template automation** - Download and manage templates
5. **Backup/restore** - Integrate Proxmox backup system

## Conclusion

Proxmox + Templates provides **enterprise-grade CoW cloning**:
- ✅ 1-3 second clone times (template-based)
- ✅ Minimal space (storage backend CoW)
- ✅ Enterprise features (GUI, clustering, HA)
- ✅ Both containers AND VMs in one platform
- ✅ Same pattern as LXD, QEMU, nspawn, Firecracker, VirtualBox
- ✅ Best for enterprise/production environments

**Status:** CoW cloning implementation complete! 🎉

## Technical Details

### How Proxmox Templates Work

1. **Create Container** (normal LXC)
   ```bash
   pct create 100 local:vztmpl/ubuntu-22.04.tar.zst
   ```

2. **Convert to Template** (makes it read-only CoW base)
   ```bash
   pct template 100
   ```
   - Stops container if running
   - Marks as template
   - Storage becomes read-only base

3. **Clone from Template** (instant CoW copy)
   ```bash
   pct clone 100 101
   ```
   - If source is template → linked clone (CoW)
   - If source is regular → full clone
   - Storage backend handles CoW mechanics

4. **Result**
   - Template: 10GB (read-only)
   - Clone 1: 50MB (only changes)
   - Clone 2: 30MB (only changes)
   - Clone 3: 45MB (only changes)

### Storage Backend Implementation

**ZFS:**
```bash
# Template at
tank/subvol-100-disk-0

# Clones use ZFS snapshots
tank/subvol-100-disk-0@clone-101
tank/subvol-101-disk-0 (clone of snapshot)
```

**LVM-thin:**
```bash
# Template at
pve/vm-100-disk-0

# Clones use LVM snapshots
pve/vm-101-disk-0 (snapshot of vm-100-disk-0)
```

## Test Results

Expected output from test script:

```
=== Proxmox LXC CoW Cloning Test ===

Test 1: Check handler status...
  Runtime: proxmox
  ✅ Proxmox handler ready

Test 2: Creating container...
  ✅ Container created: 100

Test 3: Registering as template base...
  ✅ Template base registered: ubuntu-base

Test 4: Cloning from base (3 linked clones)...
  ✅ Clone 1 completed in 1500 ms (method: linked-clone)
  ✅ Clone 2 completed in 1200 ms (method: linked-clone)
  ✅ Clone 3 completed in 1300 ms (method: linked-clone)

📊 Clone Performance:
  Average time: 1333 ms per clone
  Method: Proxmox template linked clone

Test 5: Verifying clones...
  ✅ Total containers: 4 (expected 4: 1 base + 3 clones)

Proxmox CoW Summary:
  • Template-based linked clones
  • Storage backend CoW (ZFS/LVM-thin)
  • Enterprise virtualization platform
  • Web GUI + CLI management
```
