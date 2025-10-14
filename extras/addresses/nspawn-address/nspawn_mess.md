# systemd-nspawn Test Suite Analysis: The Mess

**Date:** 2025-10-14
**Status:** Tests are fundamentally broken - wrong API expectations

---

## Summary

The nspawn-address Jest test suite (Sept 28, 2025) was **copied from podman-address** without adaptation, resulting in 102/107 failing tests. The tests expect a completely different API than what the actual nspawn-address.js handler implements.

---

## The Problem

### What Exists: nspawn-address.js (Oct 8, 2025)
**~600 lines, simple CoW-focused implementation**

```javascript
// Actual API
"create name=test-container distro=ubuntu release=22.04"
"start name=test-container"
"clone source=base destination=clone-1"
"register_base name=my-base distro=ubuntu"
```

**Features:**
- Directory-based containers in `/var/lib/machines/`
- CoW cloning via ZFS/btrfs/rsync/cp auto-detection
- machinectl integration for container management
- Simple command parsing (split on whitespace, key=value params)
- No security policies, no resource limits
- No provisioning-shared-utils integration

**Philosophy:** Lightweight OS containers with fast CoW cloning (270ms on ZFS)

---

### What Tests Expect: podman-like API (Sept 28, 2025)
**Test files expecting completely different handler**

```javascript
// What tests expect (WRONG!)
"create image=debian:stable name=test-container memory=1g cpus=2.0"
"create image=unauthorized:latest name=test"  // Security validation
"deploy_rexx container=test rexx_binary=/path/to/rexx"
```

**Expected features (DON'T EXIST in nspawn):**
- OCI image concept (`image=debian:stable`)
- Security validation and audit logging
- Memory/CPU limits with enforcement
- Volume path validation
- Binary path security validation
- Command pattern blocking (dangerous commands)
- provisioning-shared-utils integration
- Complex parameter parsing with quoted values

---

## File Breakdown

### Test Files (all in `__tests__/`)

| File | Lines | Tests | Status | Issue |
|------|-------|-------|--------|-------|
| `address-nspawn-simple.test.js` | 40 | 3 | ⚠️ Partial | Expects `image=` param (line 13) |
| `address-nspawn-full.test.js` | 827 | 107 | ❌ Broken | Expects podman API entirely |
| `address-nspawn-security.test.js` | 249 | Security tests | ❌ Broken | No security features exist |
| `address-nspawn-coverage.test.js` | 339 | Coverage tests | ❌ Broken | Tests non-existent features |

**Total:** 4 test files, ~1,455 lines of tests for wrong API

---

## Test Failure Analysis

### Immediate Failure: Initialize Error
```
TypeError: The "original" argument must be of type function. Received undefined
  at AddressNspawnHandler.promisify [as initialize] (nspawn-address.js:69:17)
```

**Root cause:** nspawn handler uses `promisify(exec)` but tests mock child_process differently than handler expects.

### Even if initialization fixed:
102/107 tests would fail because they expect:
1. ❌ `image=` parameter (nspawn uses `distro=` and `release=`)
2. ❌ Security validation methods that don't exist
3. ❌ Resource limit enforcement (memory, cpus)
4. ❌ `deploy_rexx`, `execute_rexx` commands (don't exist)
5. ❌ Volume and binary path validation
6. ❌ Audit logging and security policies
7. ❌ provisioning-shared-utils functions

---

## Why This Happened

### Timeline
1. **Sept 28, 2025**: Test files created (likely copy-paste from podman)
2. **Oct 2-8, 2025**: nspawn-address.js extensively rewritten
   - Simplified to focus on CoW cloning
   - Removed podman-like features
   - Added ZFS/btrfs auto-detection
   - Changed API from `image=` to `distro=`
3. **Oct 14, 2025**: Discovered during test suite fix attempt

### Root Cause
**Architectural divergence:**
- **podman-address.js**: Full-featured OCI container handler (~1,300 lines)
- **nspawn-address.js**: Lightweight CoW-focused handler (~600 lines)

Tests were written for podman architecture, but nspawn took a different path.

---

## Docker/Podman vs systemd-nspawn Image Concepts

### Does nspawn have "images"?

**YES**, but fundamentally different from Docker/Podman:

| Aspect | Docker/Podman | systemd-nspawn |
|--------|---------------|----------------|
| **Image source** | Container registries (Docker Hub, Quay) | Direct URLs or local directories |
| **Image format** | OCI layers (tar.gz with manifest) | Directory trees or .raw disk images |
| **Pull command** | `podman pull ubuntu:22.04` | `importctl pull-tar <url> ubuntu` |
| **Storage** | `/var/lib/containers/storage` (OverlayFS) | `/var/lib/machines/` (directories) |
| **Tags** | Multi-tag support (`latest`, `22.04`) | Name-based only |
| **Layers** | Layered filesystem (space efficient) | Single directory or raw image |
| **Registry** | Centralized (docker.io, quay.io) | Decentralized (any HTTP URL) |

### nspawn Image Commands
```bash
# List images (you have 9!)
machinectl list-images

# Pull Ubuntu cloud image
importctl pull-raw \
  https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img \
  ubuntu-jammy

# Pull tar archive
importctl pull-tar <url> <name>

# Start from image
machinectl start ubuntu-jammy
```

### Current nspawn-address Implementation
**Does NOT use images** - creates minimal containers from scratch:
```javascript
// Creates empty directory structure
"create name=test distro=ubuntu release=22.04"
// Creates: /var/lib/machines/test/{etc,root,tmp,var,usr}
```

This is like `docker run --name test scratch` - starting from nothing.

---

## Comparison with Podman

### podman-address.js Architecture
```javascript
class AddressPodmanHandler {
  // Security
  securityMode = 'moderate|strict|permissive'
  securityPolicies = { maxMemory, maxCpus, allowedVolumePaths, bannedCommands }
  auditLog = []

  // Resource limits
  validateContainerSecurity(params) { /* memory/cpu/volume checks */ }

  // Shared utilities integration
  require('../../_shared/provisioning-shared-utils')
  parseCommand(), validateCommand(), validateVolumePath(), etc.

  // Complex operations
  deploy_rexx(), execute_rexx(), security_audit()
}
```

### nspawn-address.js Architecture
```javascript
class AddressNspawnHandler {
  // CoW focus
  cowMethod = 'zfs|btrfs|rsync|cp'  // Auto-detected
  baseImageRegistry = new Map()

  // Simple operations
  async detectCowMethod() { /* Find best CoW strategy */ }
  async cloneContainer() { /* Fast ZFS/btrfs cloning */ }
  async registerBaseImage() { /* Template containers */ }

  // Direct system integration
  execMachinectl(args) { /* sudo machinectl ... */ }
  execNspawn(args) { /* sudo systemd-nspawn ... */ }
}
```

**Key difference:** Podman handler is about **container management with security**, nspawn is about **fast CoW cloning**.

---

## What Actually Works

### Working Tests
1. ✅ `test-nspawn.rexx` (basic smoke test, Oct 8)
2. ✅ `test-nspawn-cow.rexx` (CoW cloning test, Oct 8)
3. ✅ `published_module_tests/test-nspawn-address.rexx` (comprehensive, Oct 4)

### Working API (from published test)
```rexx
ADDRESS NSPAWN "status"
// Returns: runtime, cowMethod, activeContainers

ADDRESS NSPAWN "create image=ubuntu:latest name=demo memory=1g ports=8890:8080"
// Note: This test ALSO uses image= parameter!
// But nspawn-address.js ignores it and creates minimal container

ADDRESS NSPAWN "start name=demo"
ADDRESS NSPAWN "exec name=demo command='apt-get update'"
ADDRESS NSPAWN "stop name=demo"
ADDRESS NSPAWN "remove name=demo"
```

**Interesting discovery:** Even `test-nspawn-address.rexx` uses `image=` but it works because nspawn handler **ignores unknown parameters**!

---

## Import Path Issues Fixed

### Changes Made (Oct 14)
Fixed import paths in all three broken test files:

```javascript
// Before (WRONG)
require('../address-nspawn')          // Should be '../nspawn-address'
require('../shared-utils')            // Should be '../../_shared/provisioning-shared-utils'

// After (CORRECT)
require('../nspawn-address')          // ✅ Correct handler name
require('../../_shared/provisioning-shared-utils')  // ✅ Correct path
```

**But this doesn't help** because the API mismatch is fundamental.

---

## Recommendations

### Option A: Delete Broken Tests ⭐ RECOMMENDED
**Rationale:** Tests are testing the wrong thing entirely

```bash
cd /home/paul/scm/RexxJS/extras/addresses/nspawn-address/__tests__/

# Keep minimal test (needs fixing)
# address-nspawn-simple.test.js

# DELETE these (fundamentally wrong)
rm address-nspawn-full.test.js        # 827 lines, 107 wrong tests
rm address-nspawn-security.test.js    # 249 lines, tests non-existent features
rm address-nspawn-coverage.test.js    # 339 lines, tests wrong API
```

**Then:** Write new minimal tests matching actual nspawn API (50-100 lines)

---

### Option B: Upgrade nspawn Handler ❌ NOT RECOMMENDED
**Make nspawn match podman architecture**

**Pros:**
- Test suite would work
- Consistency between podman and nspawn

**Cons:**
- ❌ Loses nspawn's simplicity (600 → 1,300+ lines)
- ❌ Adds unnecessary complexity (security policies for OS containers?)
- ❌ Breaks existing working implementation
- ❌ Goes against nspawn's design philosophy
- ❌ ~2-3 days of work to rewrite
- ❌ Would need to maintain two nearly identical handlers

**Verdict:** Don't do this. Nspawn and podman serve different purposes.

---

## What Nspawn Should Be

### Design Philosophy
**systemd-nspawn is for OS containers with fast CoW cloning**, not application containers:

```rexx
// Create base template
ADDRESS NSPAWN "register_base name=ubuntu-base distro=ubuntu release=22.04"

// Clone 10 instances in <3 seconds (ZFS)
DO i = 1 TO 10
  ADDRESS NSPAWN "clone_from_base base=ubuntu-base name=instance-" || i
END

// Each clone: ~270ms, ~14KB disk space
```

**This is nspawn's superpower** - instant CoW cloning. Podman doesn't do this nearly as well.

---

## Corrected Test Suite Design

### New Test Structure (proposed)

```
__tests__/
├── address-nspawn.test.js        # Main test suite (~100 lines)
│   ├── Initialization tests
│   ├── CoW method detection
│   ├── Container CRUD (create, start, stop, delete)
│   ├── Cloning tests
│   └── Base image registry tests
│
└── test-helper.js                 # Existing helper (keep)
```

### Sample Test (what it SHOULD be)
```javascript
describe('ADDRESS NSPAWN Handler', () => {
  test('should detect CoW method', async () => {
    const handler = await createNspawnTestHandler();
    const result = await handler.handleAddressCommand('status');

    expect(result.success).toBe(true);
    expect(result.cowMethod).toMatch(/zfs|btrfs|rsync|cp/);
  });

  test('should create container with distro/release', async () => {
    const handler = await createNspawnTestHandler();
    const result = await handler.handleAddressCommand(
      'create name=test distro=ubuntu release=22.04'
    );

    expect(result.success).toBe(true);
    expect(result.container).toBe('test');
    expect(result.distro).toBe('ubuntu');
    expect(result.release).toBe('22.04');
  });

  test('should clone container', async () => {
    const handler = await createNspawnTestHandler();

    await handler.handleAddressCommand('create name=base distro=ubuntu');
    const result = await handler.handleAddressCommand(
      'clone source=base destination=clone-1'
    );

    expect(result.success).toBe(true);
    expect(result.cloneTimeMs).toBeDefined();
    expect(result.method).toMatch(/zfs|btrfs|rsync|cp/);
  });
});
```

**Total:** ~50-100 lines of meaningful tests, not 1,455 lines of wrong tests.

---

## Conclusion

### The Mess
- ✅ 4 test files, 1,455 lines of code
- ❌ 102/107 tests failing
- ❌ Testing wrong API entirely
- ❌ Copy-pasted from podman without understanding

### The Fix
1. **Delete** broken test files (full, security, coverage)
2. **Fix** simple test (change `image=` to `distro=`)
3. **Write** 50-100 lines of correct tests
4. **Keep** nspawn's simple CoW-focused design
5. **Use** `published_module_tests/test-nspawn-address.rexx` as reference

### Lesson Learned
**Don't copy-paste tests between handlers with different architectures.**

podman ≠ nspawn
- Podman: OCI containers, registries, security policies
- Nspawn: OS containers, CoW cloning, simplicity

---

## Action Items

- [x] Analyze problem and write this document
- [ ] Delete `address-nspawn-{full,security,coverage}.test.js`
- [ ] Fix `address-nspawn-simple.test.js` (change `image=` to `distro=`)
- [ ] Write new minimal test suite (~50-100 lines)
- [ ] Run `published_module_tests/test-nspawn-address.rexx` to verify
- [ ] Document nspawn API clearly in README.md

**Status:** Ready for cleanup and rewrite.

---

**Generated:** 2025-10-14
**Author:** Analysis during nspawn test suite investigation
**Recommendation:** Delete broken tests, write new minimal test suite
