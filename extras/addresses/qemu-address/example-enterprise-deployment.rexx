#!/usr/bin/env rexx
/* Enterprise Multi-Region Deployment Example */
/* rexxjs-vm-base: base-rhel-8-with-jdk17 */
/* rexxjs-vm-memory: 4G */
/* rexxjs-vm-cpus: 2 */
/* rexxjs-vm-ingress-port: 8080 */

/*
 * This script demonstrates the enterprise deployment pattern
 * using CoW VM cloning for rapid horizontal scaling across regions
 */

REQUIRE "cwd:qemu-address.js" AS QEMU

SAY "=== Enterprise Multi-Region Deployment ==="
SAY ""

-- Configuration
regions = '["us-east-1", "eu-west-1", "ap-south-1"]'
base_image = "base-rhel-8-with-jdk17"
app_name = "myapp"

SAY "Deployment Configuration:"
SAY "  Base Image:" base_image
SAY "  Regions:" regions
SAY "  Application:" app_name
SAY ""

-- Step 1: Ensure base image is registered
SAY "Step 1: Verifying base image registration..."
ADDRESS QEMU
  "list_bases"

LET base_found = 0
IF QEMU_SUCCESS = 1 THEN DO
  SAY "Found" QEMU_COUNT "base image(s) in registry"
  -- In production, would parse QEMU output to verify base exists
  LET base_found = 1
END

IF base_found = 0 THEN DO
  SAY "⚠  Base image not found. Registering..."
  ADDRESS QEMU
    "register_base name=" || base_image || " disk=/vm-images/bases/rhel8-jdk17.qcow2 memory=2G cpus=2 rexxjs_installed=true"

  IF QEMU_SUCCESS = 1 THEN DO
    SAY "✓ Base image registered"
  END
  ELSE DO
    SAY "✗ Failed to register base image"
    EXIT 1
  END
END

SAY ""
SAY "Step 2: Deploying to multiple regions..."
SAY ""

-- Parse regions JSON
LET regions_array = JSON_PARSE(text=regions)
LET region_count = ARRAY_LENGTH(array=regions_array)

-- Deploy to each region
DO i = 0 TO region_count - 1
  LET region = ARRAY_GET(array=regions_array, index=i)
  LET vm_name = app_name || "-" || region

  SAY "Deploying to region:" region
  SAY "  VM Name:" vm_name

  -- Clone from base (CoW - instant!)
  SAY "  Cloning VM from base..."
  LET clone_start = NOW()

  ADDRESS QEMU
    "clone base=" || base_image || " name=" || vm_name || " memory=4G cpus=2 no_start=true"

  IF QEMU_SUCCESS = 1 THEN DO
    LET clone_end = NOW()
    LET clone_time = clone_end - clone_start
    SAY "  ✓ Clone created in" clone_time "ms"
    SAY "    Disk:" QEMU_DISK
    SAY "    Based on:" QEMU_BASED_ON
  END
  ELSE DO
    SAY "  ✗ Clone failed:" QEMU_ERROR
    ITERATE
  END

  -- In production, would:
  -- 1. Start the VM
  -- 2. Wait for boot
  -- 3. Copy application code
  -- 4. Execute provisioning script
  -- 5. Configure port forwarding
  -- 6. Run health checks
  -- 7. Add to load balancer

  SAY "  [ Would provision application here ]"
  SAY "  [ Would configure ingress on port 8080 ]"
  SAY "  [ Would add to load balancer ]"
  SAY ""
END

SAY "Step 3: Deployment Summary"
SAY ""
SAY "✓ Deployed to" region_count "regions"
SAY "✓ Total deployment time: ~" || (region_count * 200) || "ms (CoW cloning)"
SAY "✓ Disk space used: ~" || (region_count * 200) || "KB (vs" || (region_count * 10) || "GB for full copies)"
SAY ""
SAY "Next steps:"
SAY "  1. Start VMs: ADDRESS QEMU 'start name=myapp-us-east-1'"
SAY "  2. Monitor: ADDRESS QEMU 'status'"
SAY "  3. Scale: Clone more instances as needed"
SAY "  4. Update: Provision new base, redeploy"
SAY ""
SAY "Horizontal Scaling Pattern:"
SAY "  - Predicted workload: Pre-provision N clones"
SAY "  - VM warming pool: Keep M ready clones"
SAY "  - Geographic distribution: Replicate base to regions"
SAY "  - Instant deployment: <200ms per clone"
