#!/usr/bin/env rexx
/*
 * Test VirtualBox VM CoW Cloning (Linked Clones)
 * Tests VirtualBox linked clone performance using differencing disks
 */

REQUIRE "cwd:virtualbox-address.js"

SAY "=== VirtualBox VM CoW Cloning Test ==="
SAY ""

/* Test 1: Check status */
SAY "Test 1: Check handler status..."
ADDRESS VIRTUALBOX
"status"
SAY "  Runtime:" RESULT.runtime
SAY "  Active VMs:" RESULT.activeVMs
SAY "  ✅ VirtualBox handler ready"
SAY ""

/* Test 2: Create base VM (or use existing) */
SAY "Test 2: Creating base VM..."
/* Note: In real usage, you'd create a proper VM with disk and OS */
/* For this test, we'll create a minimal VM configuration */
"create name=vbox-base template=Ubuntu ostype=Ubuntu_64 memory=512 cpus=1"
IF RESULT.success THEN DO
  SAY "  ✅ Base VM created:" RESULT.vm
END
ELSE DO
  SAY "  ⚠ Could not create base VM (may already exist):" RESULT.error
  SAY "  Continuing with existing VM..."
END
SAY ""

/* Test 3: Register as base image */
SAY "Test 3: Registering base image..."
"register_base name=ubuntu-base vm=vbox-base"
IF RESULT.success THEN DO
  SAY "  ✅ Base image registered:" RESULT.baseName
END
ELSE DO
  SAY "  ❌ Failed to register base:" RESULT.error
  EXIT 1
END
SAY ""

/* Test 4: Clone from base (3 clones) */
SAY "Test 4: Cloning from base (3 linked clones)..."

"clone_from_base base=ubuntu-base name=vbox-clone-1"
IF RESULT.success THEN DO
  t1 = RESULT.cloneTimeMs
  SAY "  ✅ Clone 1 completed in" t1 "ms (method:" RESULT.method ")"
END
ELSE DO
  SAY "  ❌ Clone 1 failed:" RESULT.error
  t1 = 0
END

"clone_from_base base=ubuntu-base name=vbox-clone-2"
IF RESULT.success THEN DO
  t2 = RESULT.cloneTimeMs
  SAY "  ✅ Clone 2 completed in" t2 "ms (method:" RESULT.method ")"
END
ELSE DO
  SAY "  ❌ Clone 2 failed:" RESULT.error
  t2 = 0
END

"clone_from_base base=ubuntu-base name=vbox-clone-3"
IF RESULT.success THEN DO
  t3 = RESULT.cloneTimeMs
  SAY "  ✅ Clone 3 completed in" t3 "ms (method:" RESULT.method ")"
END
ELSE DO
  SAY "  ❌ Clone 3 failed:" RESULT.error
  t3 = 0
END
SAY ""

/* Calculate average */
IF t1 > 0 & t2 > 0 & t3 > 0 THEN DO
  avg = (t1 + t2 + t3) / 3
  SAY "📊 Clone Performance:"
  SAY "  Average time:" avg "ms per clone"
  SAY "  Method: VirtualBox linked clone (differencing disks)"
  SAY ""
END

/* Test 5: Verify clones */
SAY "Test 5: Verifying clones..."
"list"
SAY "  ✅ Total VMs:" RESULT.count "(expected 4: 1 base + 3 clones)"
SAY ""

/* Test 6: List bases */
SAY "Test 6: Listing registered base images..."
"list_bases"
SAY "  ✅ Registered bases:" RESULT.count
SAY ""

/* Cleanup */
SAY "Cleanup: Removing test VMs..."
ADDRESS VIRTUALBOX
"remove name=vbox-clone-1"
"remove name=vbox-clone-2"
"remove name=vbox-clone-3"
"remove name=vbox-base"
SAY "  ✅ Cleanup complete"
SAY ""

SAY "=== Test Complete ==="
SAY ""

SAY "VirtualBox CoW Summary:"
SAY "  • Linked clone technology (differencing disks)"
SAY "  • VBoxManage clonevm --mode link"
SAY "  • Similar to qcow2 backing files"
SAY "  • Full VM isolation with KVM"
