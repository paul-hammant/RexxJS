#!/usr/bin/env rexx
/**
 * Test LXD ZFS CoW Cloning - WITH PAUSE to inspect ZFS
 */

SAY "=== LXD ZFS CoW Test (with pause) ==="
SAY ""

REQUIRE "cwd:lxd-address.js"
ADDRESS LXD

SAY "Cleanup: Removing any previous test containers..."
"delete name=rexx-lxd-base"
"delete name=rexx-clone-1"
"delete name=rexx-clone-2"
"delete name=rexx-clone-3"
"delete name=rexx-clone-4"
SAY "  ✓ Cleanup complete"
SAY ""

SAY "Creating base and 4 clones..."
"create name=rexx-lxd-base image=ubuntu:22.04 storage=zfs-pool"
SAY "  ✓ Base created"

"copy source=rexx-lxd-base destination=rexx-clone-1"
"copy source=rexx-lxd-base destination=rexx-clone-2"
"copy source=rexx-lxd-base destination=rexx-clone-3"
"copy source=rexx-lxd-base destination=rexx-clone-4"
SAY "  ✓ 4 clones created"
SAY ""

SAY "=== ZFS Space Usage ==="
ADDRESS SYSTEM
"sudo zfs list -o name,used,refer | head -1"
"sudo zfs list -o name,used,refer | grep rexx-lxd | head -10"
SAY ""

SAY "Press ENTER to cleanup and exit..."
PULL answer

ADDRESS LXD
"delete name=rexx-lxd-base"
"delete name=rexx-clone-1"
"delete name=rexx-clone-2"
"delete name=rexx-clone-3"
"delete name=rexx-clone-4"
SAY "✓ Cleanup complete"
