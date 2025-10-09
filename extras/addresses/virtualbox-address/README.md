# ADDRESS VIRTUALBOX - VirtualBox VM CoW Implementation

## Quick Start

```bash
# 1. Verify VirtualBox installation
VBoxManage --version

# 2. Check system requirements
cd extras/addresses/virtualbox-address
./test-virtualbox-cow.rexx
```

## Overview

**ADDRESS VIRTUALBOX** provides VirtualBox VM operations with **linked clone** (CoW) support using differencing disks.

## What are VirtualBox Linked Clones?

VirtualBox linked clones are lightweight VM copies that use **differencing disks** - a Copy-on-Write technology similar to qcow2 backing files:

- **Fast cloning**: ~200-500ms (creates differencing disk, not full copy)
- **Space efficient**: Only stores changes from base VM
- **Full isolation**: Complete KVM-based VM isolation
- **Any OS**: Windows, Linux, macOS, BSD guests supported

## Performance

### Expected Performance (with Linked Clones)
- **Clone speed:** 200-500ms (differencing disk creation)
- **Boot time:** 10-30s (full VM boot)
- **Memory overhead:** ~128MB base + guest RAM
- **Space per clone:** Minimal (only stores changes)

### Comparison with Other Implementations
| Implementation | Clone Time | Boot Time | Overhead | Use Case |
|----------------|------------|-----------|----------|----------|
| **VirtualBox + linked** | **200-500ms** | 10-30s | 128MB+ | **Any OS, full VMs** |
| Firecracker + ZFS | 275ms | <125ms | 5MB | Serverless (Linux only) |
| nspawn + ZFS | 270ms | <1s | 30MB | Simple containers |
| LXD + ZFS | 109ms | <1s | 50MB | Full OS containers |
| QEMU + qcow2 | 165ms | 10-30s | 128MB+ | Traditional VMs |

## Architecture

### CoW Technology: Linked Clones with Differencing Disks

```
Base VM (vbox-base)
├── Base.vdi (10GB)        # Base virtual disk
└── (read-only reference)

Clone 1 (vbox-clone-1)
└── Clone1-diff.vdi (50KB)  # Only stores writes

Clone 2 (vbox-clone-2)
└── Clone2-diff.vdi (50KB)  # Only stores writes

Clone 3 (vbox-clone-3)
└── Clone3-diff.vdi (50KB)  # Only stores writes
```

**Command:** `VBoxManage clonevm <base> --name <clone> --mode link --register`

## Commands Implemented

### CoW Cloning Commands
- `register_base` - Register VM as base image for cloning
- `clone` - Clone VM using linked clone (CoW)
- `clone_from_base` - Clone from registered base image
- `list_bases` - List registered base images

### VM Lifecycle
- `status` - Handler status
- `list` - List all VMs
- `create` - Create new VM
- `start` - Start VM
- `stop` - Stop VM
- `remove` - Delete VM
- `pause` / `resume` - Pause/resume VM
- `save_state` / `restore_state` - Save/restore VM state

### Advanced Features
- `snapshot` / `restore` - Snapshot management
- `deploy_rexx` - Deploy RexxJS binary to VM
- `execute` - Execute command in VM
- `execute_rexx` - Execute RexxJS script with CHECKPOINT support
- `install_guest_additions` - Install Guest Additions
- `configure_network` - Configure VM networking

## Usage Example

```rexx
REQUIRE "cwd:extras/addresses/virtualbox-address/virtualbox-address.js"
ADDRESS VIRTUALBOX

/* Check status */
"status"
SAY "Runtime:" RESULT.runtime

/* Create base VM */
"create name=my-base template=Ubuntu ostype=Ubuntu_64 memory=2048 cpus=2"

/* Register as base image */
"register_base name=ubuntu-base vm=my-base"

/* Clone from base (200-500ms with linked clone!) */
"clone_from_base base=ubuntu-base name=vm-1"
SAY "Cloned in" RESULT.cloneTimeMs "ms using" RESULT.method

"clone_from_base base=ubuntu-base name=vm-2"
"clone_from_base base=ubuntu-base name=vm-3"

/* List bases */
"list_bases"
SAY "Registered bases:" RESULT.count

/* Start a clone */
"start name=vm-1"

/* Cleanup */
"stop name=vm-1"
"remove name=vm-1"
"remove name=vm-2"
"remove name=vm-3"
"remove name=my-base"
```

## Advantages

### vs Containers (Docker/LXD/nspawn)
- ✅ Any OS support (Windows, macOS, BSD)
- ✅ Stronger isolation (full KVM)
- ✅ Full hardware emulation
- ❌ Slower boot (10-30s vs <1s)
- ❌ Higher overhead (128MB+ vs 5-50MB)

### vs QEMU
- ✅ Better GUI/management tools
- ✅ Easier snapshot management
- ✅ Guest Additions for better integration
- ✅ Same CoW technology (differencing disks)
- ≈ Similar performance

### vs Other Implementations
```
OS Support:    VirtualBox > QEMU > LXD ≈ nspawn ≈ Firecracker
Isolation:     VirtualBox ≈ QEMU ≈ Firecracker > LXD ≈ nspawn
Clone Speed:   LXD > QEMU > nspawn ≈ Firecracker > VirtualBox
Boot Speed:    Firecracker > nspawn ≈ LXD >> QEMU ≈ VirtualBox
Maturity:      VirtualBox ≈ QEMU > LXD > nspawn > Firecracker
```

## Limitations

### Current Implementation
- **Clone speed**: Slower than ZFS-based (200-500ms vs 100-270ms)
- **Boot time**: Traditional VM boot (10-30s)
- **Memory**: Higher base overhead (~128MB)
- **Requires VirtualBox**: Not lightweight like systemd-nspawn

### VirtualBox Requirements
- **Host**: Linux, Windows, macOS
- **Virtualization**: VT-x/AMD-V recommended
- **Guest Additions**: Needed for best features
- **Storage**: More than containers, less than full VMs

## Production Considerations

### When to Use VirtualBox
- ✅ Need Windows/macOS guests
- ✅ GUI-based VM management
- ✅ Desktop virtualization
- ✅ Development environments
- ✅ Testing across OS types

### When NOT to Use
- ❌ High-density deployments (use Firecracker)
- ❌ Container workloads (use LXD/nspawn)
- ❌ Minimal overhead needed (use Firecracker)
- ❌ Fastest boot times (use Firecracker/nspawn)

## Setup

### Installation (Ubuntu/Debian)
```bash
# Install VirtualBox
sudo apt update
sudo apt install virtualbox virtualbox-ext-pack

# Verify installation
VBoxManage --version

# Add user to vboxusers group
sudo usermod -aG vboxusers $USER

# Log out and back in for group changes
```

### Create Base VM (Example)
```bash
# Download Ubuntu ISO (example)
wget https://releases.ubuntu.com/22.04/ubuntu-22.04.3-live-server-amd64.iso

# Create VM via VBoxManage
VBoxManage createvm --name ubuntu-base --ostype Ubuntu_64 --register
VBoxManage modifyvm ubuntu-base --memory 2048 --cpus 2
VBoxManage createhd --filename ~/VirtualBox\ VMs/ubuntu-base/ubuntu-base.vdi --size 10240
VBoxManage storagectl ubuntu-base --name "SATA Controller" --add sata
VBoxManage storageattach ubuntu-base --storagectl "SATA Controller" --port 0 --device 0 --type hdd --medium ~/VirtualBox\ VMs/ubuntu-base/ubuntu-base.vdi

# Install OS (manual step - start VM and install)
VBoxManage startvm ubuntu-base --type gui

# After installation, register as base
./test-virtualbox-cow.rexx
```

## How Linked Clones Work

### Technical Details

1. **Base VM Creation**
   - Full virtual disk created (e.g., 10GB)
   - OS installed normally

2. **Linked Clone Creation** (~200-500ms)
   ```bash
   VBoxManage clonevm base --name clone1 --mode link --register
   ```
   - Creates differencing disk (small file)
   - References base disk (read-only)
   - Only writes stored in differencing disk

3. **Runtime Behavior**
   - Reads: Served from base disk
   - Writes: Stored in differencing disk
   - Each clone completely isolated

4. **Storage Savings**
   ```
   Base VM:     10GB     (full disk)
   Clone 1:     50KB     (only changes)
   Clone 2:     50KB     (only changes)
   Clone 3:     50KB     (only changes)
   Total:       10GB + 150KB ≈ 10GB

   vs Full Copies: 40GB (4 × 10GB)
   Savings: 75%+
   ```

## Comparison with Full Clone

| Aspect | Linked Clone | Full Clone |
|--------|-------------|------------|
| **Creation Time** | 200-500ms | Minutes |
| **Disk Space** | Base + changes | Full copy each |
| **Base Changes** | Affect all clones | Independent |
| **Performance** | Same as full | Same |
| **Use Case** | Testing, dev | Production backups |

## Next Steps

To make this production-ready:

1. **Automated base image creation** - Script OS installation
2. **Snapshot integration** - Combine snapshots with clones
3. **Network automation** - Auto-configure bridges/NAT
4. **Guest Additions automation** - Auto-install in bases
5. **Monitoring** - VM health and resource tracking

## Conclusion

VirtualBox + Linked Clones provides **versatile VM CoW cloning** with:
- ✅ Sub-500ms clone times (differencing disks)
- ✅ Any OS support (Windows, Linux, macOS, BSD)
- ✅ Full KVM isolation
- ✅ Mature ecosystem (GUI, CLI, API)
- ✅ Same pattern as LXD, QEMU, nspawn, Firecracker
- ✅ Best choice for multi-OS development

**Status:** CoW cloning implementation complete! 🎉

## Test Results

```
=== VirtualBox VM CoW Cloning Test ===

Test 1: Check handler status...
  Runtime: virtualbox
  ✅ VirtualBox handler ready

Test 2: Creating base VM...
  ✅ Base VM created: vbox-base

Test 3: Registering base image...
  ✅ Base image registered: ubuntu-base

Test 4: Cloning from base (3 linked clones)...
  ✅ Clone 1 completed in 350 ms (method: linked-clone)
  ✅ Clone 2 completed in 320 ms (method: linked-clone)
  ✅ Clone 3 completed in 340 ms (method: linked-clone)

📊 Clone Performance:
  Average time: 337 ms per clone
  Method: VirtualBox linked clone (differencing disks)

Test 5: Verifying clones...
  ✅ Total VMs: 4 (expected 4: 1 base + 3 clones)

Test 6: Listing registered base images...
  ✅ Registered bases: 1

VirtualBox CoW Summary:
  • Linked clone technology (differencing disks)
  • VBoxManage clonevm --mode link
  • Similar to qcow2 backing files
  • Full VM isolation with KVM
```
