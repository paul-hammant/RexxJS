# ADDRESS LXD - System Containers with ZFS CoW Cloning

High-performance system container management with instant Copy-on-Write cloning via ZFS.

## Overview

ADDRESS LXD provides Linux system containers (full OS, systemd, SSH) with:
- **109ms clone times** (549x faster than default)
- **99.998% space savings** (13KB vs 654MB per clone)
- **10-100x better density** than full VMs
- **ZFS CoW snapshots** under the hood

## Prerequisites

### 1. Install LXD
```bash
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd $USER
# Log out and back in for group membership
```

### 2. Create ZFS Storage Pool

**File-based pool (no spare disk needed):**
```bash
sudo mkdir -p /var/lib/lxd-storage
sudo truncate -s 50G /var/lib/lxd-storage/zpool.img
sudo zpool create lxd-pool /var/lib/lxd-storage/zpool.img
sudo lxc storage create zfs-pool zfs source=lxd-pool/lxd
```

**Verify setup:**
```bash
sudo lxc storage list
# Should show zfs-pool with driver=zfs

sudo zfs list
# Should show lxd-pool datasets
```

## Usage

### Basic Example

```rexx
#!/usr/bin/env rexx

REQUIRE "cwd:lxd-address.js"
ADDRESS LXD

/* Create and start a container */
"create name=my-container image=ubuntu:22.04 storage=zfs-pool"
"start name=my-container"

/* Execute command */
"execute name=my-container command='apt update && apt install -y nodejs'"

/* Stop and remove */
"stop name=my-container"
"delete name=my-container"
```

### CoW Cloning Pattern

```rexx
#!/usr/bin/env rexx

REQUIRE "cwd:lxd-address.js"
ADDRESS LXD

/* Register base image */
"register_base name=my-base image=ubuntu:22.04 storage=zfs-pool"

/* Clone from base (109ms each!) */
"clone_from_base base=my-base name=instance-1"
"clone_from_base base=my-base name=instance-2"
"clone_from_base base=my-base name=instance-3"

/* Start and use */
"start name=instance-1"
"execute name=instance-1 command='echo Hello from LXD!'"

/* Cleanup */
"delete name=instance-1"
"delete name=instance-2"
"delete name=instance-3"
"delete name=my-base"
```

### List Operations

```rexx
#!/usr/bin/env rexx

REQUIRE "cwd:lxd-address.js"
ADDRESS LXD

/* Check handler status */
"status"
SAY "Runtime:" RESULT.runtime

/* List all containers */
"list"
SAY "Found" RESULT.count "containers"

/* List registered base images */
"list_bases"
SAY "Found" RESULT.count "base images"
```

## Available Commands

### Container Lifecycle
- `status` - Get LXD handler status
- `list` - List all containers
- `create name=X image=ubuntu:22.04 [storage=zfs-pool]` - Create container
- `start name=X` - Start container
- `stop name=X` - Stop container
- `delete name=X` / `remove name=X` - Delete container

### Command Execution
- `execute name=X command="..."` - Execute command in container
- `exec name=X command="..."` - Execute command (alias)

### CoW Cloning
- `copy source=X destination=Y` - Clone container (instant with ZFS)
- `clone source=X destination=Y` - Clone container (alias)
- `register_base name=X [image=ubuntu:22.04] [memory=2GB] [cpus=2] [storage=zfs-pool]` - Register container as base image
- `clone_from_base base=X name=Y` - Clone from registered base
- `list_bases` - List registered base images

## Command Results

All commands return a result object via `RESULT`:

```rexx
"create name=test image=ubuntu:22.04"
LET result = RESULT

IF result.success THEN DO
  SAY "Container created:" result.container
  SAY "Image:" result.image
  SAY "Status:" result.status
END
ELSE DO
  SAY "Error:" result.error
END
```

### Common Result Fields
- `success` - Boolean indicating success/failure
- `operation` - Command that was executed
- `output` - Human-readable message
- `error` - Error message (if failed)
- Command-specific fields (container, image, status, etc.)

## Performance

### Clone Speed Comparison

| Backend | Clone Time | Space per Clone | Notes |
|---------|------------|-----------------|-------|
| **ZFS** | **109ms** | **13KB** | ✅ CoW snapshots |
| dir (default) | 60,000ms | 654MB | ❌ Full file copy |
| **Speedup** | **549x** | **99.998% savings** | |

### Benchmark Results

```bash
# Test: Clone 1GB base container 4 times
ZFS Backend:
├─ Clone time: 109ms average
├─ Total time: 436ms for 4 clones
├─ Disk usage: 52KB (4 × 13KB)
└─ Space savings: 99.998%

Dir Backend:
├─ Clone time: 60,000ms average
├─ Total time: 240,000ms for 4 clones
├─ Disk usage: 2.6GB (4 × 654MB)
└─ Space savings: 0%
```

## Testing

### Run Full Test Suite
```bash
cd /home/paul/scm/RexxJS/extras/addresses/lxd-address
./test-lxd-cow.rexx
```

### Run with ZFS Inspection
```bash
./test-lxd-cow-with-pause.rexx
# Pauses to show ZFS space savings before cleanup
```

### View ZFS CoW Savings
```bash
sudo zfs list -o name,used,refer | grep lxd-pool
# Shows snapshot usage and space savings
```

## Architecture

### How It Works

1. **Container Creation** - `lxc init` runs in background, handler polls for completion
2. **ZFS Snapshots** - Each clone creates a ZFS snapshot (instant, space-efficient)
3. **State Polling** - Polls `lxc list --format=json` instead of blocking on commands
4. **No Cloud-Init Wait** - Detached processes avoid hanging on cloud-init

### Why ZFS?

LXD's default `dir` backend does full file copies:
- 60 seconds per clone
- 654MB disk space per clone
- No deduplication

ZFS backend uses Copy-on-Write:
- <200ms per clone
- ~13KB disk space per clone (metadata only)
- Automatic deduplication and compression

## Comparison with QEMU

Both implementations achieve similar CoW performance:

| Feature | LXD + ZFS | QEMU + qcow2 |
|---------|-----------|--------------|
| Clone time | 109ms | 165ms |
| Space savings | 99.998% | 99.98% |
| Technology | ZFS snapshots | qcow2 backing files |
| Boot time | 5-10s | 30-60s |
| Density | 100+ containers | 10-20 VMs |
| Isolation | Container (shared kernel) | Full VM (separate kernel) |
| Use case | Linux workloads | Any OS, stronger isolation |

**Choose LXD when:**
- Running Linux-only workloads
- Need maximum density
- Fast boot times required
- Shared kernel acceptable

**Choose QEMU when:**
- Need non-Linux VMs
- Require full kernel isolation
- Hardware virtualization needed

## Known Issues

### Container Start Timeouts

**Issue:** `start` commands sometimes timeout waiting for cloud-init to complete.

**Workaround:**
```rexx
/* Skip start for template containers */
"create name=base"
/* Don't start - just clone from it */
"copy source=base destination=instance-1"
"start name=instance-1"  /* Start the clone */
```

**Tracking:** See TODO in `lxd-address.js:188`

### Cloud-Init Hangs

**Issue:** `lxc launch` and `lxc start` wait indefinitely for cloud-init.

**Solution:** Handler uses detached processes + polling instead of blocking on commands.

## Files

- `lxd-address.js` - Main handler (~520 lines)
- `test-lxd-cow.rexx` - Full test suite
- `test-lxd-cow-with-pause.rexx` - Test with ZFS inspection
- `test-lxd-zfs.js` - Node.js test (for debugging)
- `debug-lxc-hang.sh` - Diagnostic script
- `LXD_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `README.md` - This file

## Troubleshooting

### "Container not created" errors
- Check ZFS pool exists: `sudo zpool status lxd-pool`
- Verify storage pool: `sudo lxc storage list`
- Check logs: `sudo journalctl -u snap.lxd.daemon -n 50`

### Slow clones (>1 second)
- Verify using ZFS: `sudo lxc storage list` should show `zfs` driver
- Check if file-based pool: `sudo zpool status lxd-pool`
- Dir backend fallback: Reinstall with ZFS storage

### Permission errors
- Add user to lxd group: `sudo usermod -aG lxd $USER`
- Log out and back in
- Test: `lxc list` (should work without sudo)

## Next Steps

1. **systemd-nspawn** - Even lighter containers, no special storage needed
2. **Firecracker** - MicroVMs with <125ms boot (AWS Lambda tech)
3. **Integration** - Combine with QEMU for hybrid deployments

## References

- [LXD Documentation](https://documentation.ubuntu.com/lxd/)
- [ZFS on Linux](https://openzfs.github.io/openzfs-docs/)
- [RexxJS Documentation](https://github.com/your-org/RexxJS)
