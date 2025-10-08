# Testing the CoW Cloning System

## Quick Start

### 1. Test CoW Cloning (Node.js)
```bash
cd /home/paul/scm/RexxJS/extras/addresses/qemu-address
./test-cow-simple.js
```

**Expected output:**
```
=== QEMU CoW Cloning Test ===
✓ Handler initialized
✓ Base image created
✓ Base image registered
✓ Found 1 base image(s)
✓ Clone created in ~160ms
✓ Backing file verified
✓ Multiple clones created
✨ All tests passed!
```

### 2. Test with RexxJS (after binary rebuild)
```bash
./bin/rexx test-cow-cloning.rexx
```

### 3. Test Enterprise Deployment Pattern
```bash
./bin/rexx example-enterprise-deployment.rexx
```

## Test Files

| File | Purpose | Status |
|------|---------|--------|
| `test-cow-simple.js` | Direct Node.js test | ✅ Passing |
| `test-cow-cloning.rexx` | RexxJS integration test | ⏳ Needs binary rebuild |
| `example-enterprise-deployment.rexx` | Enterprise pattern demo | ⏳ Needs binary rebuild |

## Manual Testing

### Register a Base Image
```rexx
REQUIRE "cwd:qemu-address.js" AS QEMU

ADDRESS QEMU
  "register_base name=my-base disk=/path/to/disk.qcow2 memory=2G cpus=2"
```

### Clone from Base
```rexx
ADDRESS QEMU
  "clone base=my-base name=instance-1 no_start=true"
```

### List Base Images
```rexx
ADDRESS QEMU
  "list_bases"

SAY "Found:" QEMU_COUNT "base images"
```

### Provision from Script
```rexx
ADDRESS QEMU
  "provision script=/path/to/script.rexx keep_running=true snapshot=true"
```

## Performance Expectations

- **Clone time**: <200ms per clone
- **Disk usage**: ~200KB per clone (for empty base)
- **Space savings**: 99.98% vs full copies
- **Concurrent clones**: 4 clones in <700ms

## Cleanup

```bash
# Remove all test clones
rm -f /home/paul/vm-images/instances/*.qcow2

# Remove test base
rm -f /home/paul/vm-images/bases/test-base.qcow2

# Or clean everything
rm -rf /home/paul/vm-images/*
```

## Troubleshooting

### VNC Port Conflicts
If you see "Failed to find an available port":
- Use `no_start=true` parameter when cloning
- Stop running VMs before starting new ones
- Check for stale QEMU processes: `ps aux | grep qemu`

### Module Loading Issues
If RexxJS can't find the module:
- Use absolute path: `REQUIRE "/full/path/to/qemu-address.js"`
- Or use `cwd:` prefix: `REQUIRE "cwd:qemu-address.js"`

### Base Image Not Found
```
Error: Base image X not found or not ready
```
- Run `list_bases` to see registered bases
- Register the base with `register_base` command
- Verify disk path exists and is qcow2 format

## Next Steps

1. **Rebuild RexxJS binary** to include --stdin support
2. **Test full provisioning** with running VMs
3. **Implement SSH/guest agent** integration
4. **Add VM warming pool** for instant allocation
5. **Test layered backing chains** (clone from clone)
