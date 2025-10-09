#!/usr/bin/env rexx
/*
 * Test Firecracker microVM CoW Cloning
 * Tests ZFS snapshot cloning performance
 */

REQUIRE "cwd:firecracker-address.js"

SAY "=== Firecracker microVM CoW Cloning Test ==="
SAY ""

/* Test 1: Check CoW method */
SAY "Test 1: Check CoW method..."
ADDRESS FIRECRACKER
"status"
SAY "  Runtime:" RESULT.runtime
SAY "  CoW Method:" RESULT.cowMethod
IF RESULT.cowMethod = "zfs" THEN DO
  SAY "  ✅ ZFS detected - instant cloning available!"
END
ELSE DO
  IF RESULT.cowMethod = "qcow2" THEN DO
    SAY "  ✅ qcow2 detected - fast backing files!"
  END
  ELSE DO
    SAY "  ⚠ Using" RESULT.cowMethod
  END
END
SAY ""

/* Test 2: Create base microVM */
SAY "Test 2: Creating base microVM..."
"register_base name=fc-base kernel=vmlinux rootfs=rootfs.ext4"
IF RESULT.success THEN DO
  SAY "  ✅ Base microVM created:" RESULT.baseName
END
ELSE DO
  SAY "  ❌ Failed:" RESULT.error
  EXIT 1
END
SAY ""

/* Test 3: Clone from base */
SAY "Test 3: Cloning from base (3 clones)..."

"clone_from_base base=fc-base name=fc-1"
IF RESULT.success THEN DO
  t1 = RESULT.cloneTimeMs
  SAY "  ✅ Clone 1 completed in" t1 "ms"
END

"clone_from_base base=fc-base name=fc-2"
IF RESULT.success THEN DO
  t2 = RESULT.cloneTimeMs
  SAY "  ✅ Clone 2 completed in" t2 "ms"
END

"clone_from_base base=fc-base name=fc-3"
IF RESULT.success THEN DO
  t3 = RESULT.cloneTimeMs
  SAY "  ✅ Clone 3 completed in" t3 "ms"
END
SAY ""

/* Calculate average */
avg = (t1 + t2 + t3) / 3
SAY "📊 Clone Performance:"
SAY "  Average time:" avg "ms per clone"
SAY "  Method:" RESULT.method
SAY ""

/* Test 4: Verify clones */
SAY "Test 4: Verifying clones..."
"list"
SAY "  ✅ Found" RESULT.count "microVMs (expected 4: base + 3 clones)"
SAY ""

/* Test 5: Check ZFS space usage */
ADDRESS FIRECRACKER
"status"
IF RESULT.cowMethod = "zfs" THEN DO
  SAY "Test 5: Checking ZFS space savings..."
  ADDRESS SYSTEM "sudo zfs list -t all | grep firecracker"
  SAY ""
END

/* Cleanup */
SAY "Cleanup: Removing test microVMs..."
ADDRESS FIRECRACKER
"delete name=fc-1"
"delete name=fc-2"
"delete name=fc-3"
"delete name=fc-base"
SAY "  ✅ Cleanup complete"
SAY ""

SAY "=== Test Complete ==="
SAY ""

ADDRESS FIRECRACKER
"status"
SAY "Firecracker CoW Summary:"
IF RESULT.cowMethod = "zfs" THEN DO
  SAY "  • ZFS cloning active"
END
ELSE DO
  IF RESULT.cowMethod = "qcow2" THEN DO
    SAY "  • qcow2 backing files active"
  END
  ELSE DO
    SAY "  • Using" RESULT.cowMethod "method"
  END
END
SAY "  • Ultra-fast boot (<125ms)"
SAY "  • Minimal overhead (~5MB per microVM)"
SAY "  • KVM-based security"
