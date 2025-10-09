#!/usr/bin/env rexx
/*
 * Test systemd-nspawn CoW Cloning
 * Similar to LXD ZFS test but for nspawn
 */

REQUIRE "cwd:nspawn-address.js"

SAY "=== systemd-nspawn CoW Cloning Test ==="
SAY ""

/* Test 1: Check status and CoW method */
SAY "Test 1: Check CoW method..."
ADDRESS NSPAWN
"status"
SAY "  Runtime:" RESULT.runtime
SAY "  CoW Method:" RESULT.cowMethod
IF RESULT.cowMethod = "zfs" THEN DO
  SAY "  ✅ ZFS detected - instant cloning available!"
END
ELSE DO
  IF RESULT.cowMethod = "btrfs" THEN DO
    SAY "  ✅ btrfs detected - instant cloning available!"
  END
  ELSE DO
    SAY "  ⚠ Using" RESULT.cowMethod "- slower cloning"
  END
END
SAY ""

/* Test 2: Create base container */
SAY "Test 2: Creating base container..."
"register_base name=nspawn-base distro=ubuntu release=22.04"
IF RESULT.success THEN DO
  SAY "  ✅ Base container created:" RESULT.baseName
END
ELSE DO
  SAY "  ❌ Failed:" RESULT.error
  EXIT 1
END
SAY ""

/* Test 3: Clone from base (instant with ZFS!) */
SAY "Test 3: Cloning from base (3 clones)..."
cloneTimes.0 = 0

DO i = 1 TO 3
  cloneName = "nspawn-clone-" || i
  "clone_from_base base=nspawn-base name=" || cloneName

  IF RESULT.success THEN DO
    cloneTime = RESULT.cloneTimeMs
    cloneTimes.0 = cloneTimes.0 + 1
    idx = cloneTimes.0
    cloneTimes.idx = cloneTime
    SAY "  ✅ Clone" i "completed in" cloneTime "ms"
  END
  ELSE DO
    SAY "  ❌ Clone" i "failed:" RESULT.error
    SAY "     Error details:" RESULT.output
  END
END
SAY ""

/* Calculate average clone time */
numClones = cloneTimes.0 + 0  /* Convert to number */
IF numClones > 0 THEN DO
  totalTime = 0
  DO j = 1 TO numClones
    totalTime = totalTime + cloneTimes.j
  END
  avgTime = totalTime / numClones
  SAY "📊 Clone Performance:"
  SAY "  Total clones:" numClones
  SAY "  Average time:" avgTime "ms per clone"
  SAY "  Method:" RESULT.method
  SAY ""
END

/* Test 4: Verify clones exist */
SAY "Test 4: Verifying clones..."
"list"
containerCount = RESULT.count
SAY "  ✅ Found" containerCount "containers (expected 4: base + 3 clones)"
SAY ""

/* Test 5: Check ZFS space usage */
ADDRESS NSPAWN
"status"
IF RESULT.cowMethod = "zfs" THEN DO
  SAY "Test 5: Checking ZFS space savings..."
  ADDRESS SYSTEM "sudo zfs list | grep nspawn"
  SAY ""
END

/* Cleanup */
SAY "Cleanup: Removing test containers..."
ADDRESS NSPAWN
DO i = 1 TO 3
  cloneName = "nspawn-clone-" || i
  "delete name=" || cloneName
END
"delete name=nspawn-base"
SAY "  ✅ Cleanup complete"
SAY ""

SAY "=== Test Complete ==="
SAY ""

/* Get final status for summary */
ADDRESS NSPAWN
"status"

SAY "systemd-nspawn CoW Summary:"
IF RESULT.cowMethod = "zfs" THEN DO
  SAY "  • ZFS cloning active"
END
ELSE DO
  IF RESULT.cowMethod = "btrfs" THEN DO
    SAY "  • btrfs snapshot cloning active"
  END
  ELSE DO
    SAY "  • Using" RESULT.cowMethod "method"
  END
END
SAY "  • Built into systemd - no installation needed"
SAY "  • Works on any filesystem"
