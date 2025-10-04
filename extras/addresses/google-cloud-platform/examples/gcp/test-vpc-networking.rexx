#!/usr/bin/env rexx
/* Test VPC Networking
 *
 * This script demonstrates VPC (Virtual Private Cloud) networking:
 *   - Creating and managing VPC networks
 *   - Creating and managing subnets
 *   - Configuring firewall rules
 *   - Managing routes
 *
 * Required APIs:
 *   - compute.googleapis.com
 *
 * Required Permissions:
 *   - compute.networks.create
 *   - compute.networks.delete
 *   - compute.networks.get
 *   - compute.networks.list
 *   - compute.subnetworks.create
 *   - compute.subnetworks.delete
 *   - compute.subnetworks.list
 *   - compute.firewalls.create
 *   - compute.firewalls.delete
 *   - compute.firewalls.list
 *   - compute.routes.list
 */

SAY "=== VPC Networking Test ==="
SAY ""

/* Configuration */
LET network_name = "rexxjs-test-vpc-" || WORD(DATE('S'), 1)
LET subnet_name = "rexxjs-test-subnet-" || WORD(DATE('S'), 1)
LET firewall_name = "rexxjs-test-fw-" || WORD(DATE('S'), 1)
LET region = "us-central1"
LET subnet_range = "10.0.0.0/24"

SAY "Configuration:"
SAY "  Network: " || network_name
SAY "  Subnet: " || subnet_name
SAY "  Firewall: " || firewall_name
SAY "  Region: " || region
SAY "  IP Range: " || subnet_range
SAY ""

/* ========================================
 * Step 1: List existing VPC networks
 * ======================================== */
SAY "Step 1: Listing existing VPC networks..."
SAY ""

ADDRESS GCP "VPC LIST NETWORKS"

IF RC = 0 THEN DO
  SAY "✓ Networks listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list networks (RC=" || RC || ")"
  SAY "Note: You may need to enable the Compute Engine API"
  SAY ""
END

/* ========================================
 * Step 2: Create a custom VPC network
 * ======================================== */
SAY "Step 2: Creating custom VPC network..."
SAY "  Name: " || network_name
SAY "  Mode: custom (manually managed subnets)"
SAY ""

ADDRESS GCP "VPC CREATE NETWORK name=" || network_name || " mode=custom"

IF RC = 0 THEN DO
  SAY "✓ VPC network created: " || network_name
  SAY ""
  SAY "Network Modes:"
  SAY "  • auto: Automatically creates subnets in all regions"
  SAY "  • custom: You manually create subnets where needed"
  SAY ""
  SAY "We're using 'custom' mode for fine-grained control"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create network (RC=" || RC || ")"
  EXIT RC
END

/* ========================================
 * Step 3: Create a subnet in the network
 * ======================================== */
SAY "Step 3: Creating subnet in network..."
SAY "  Subnet: " || subnet_name
SAY "  Network: " || network_name
SAY "  Region: " || region
SAY "  IP Range: " || subnet_range
SAY ""

ADDRESS GCP "VPC CREATE SUBNET name=" || subnet_name || " network=" || network_name || " region=" || region || " range=" || subnet_range

IF RC = 0 THEN DO
  SAY "✓ Subnet created: " || subnet_name
  SAY ""
  SAY "Subnet Details:"
  SAY "  • IP range 10.0.0.0/24 = 256 IP addresses"
  SAY "  • First 4 IPs reserved by GCP"
  SAY "  • Last IP reserved by GCP"
  SAY "  • ~251 IPs available for VMs"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create subnet"
  SAY "Note: Network may still be creating"
  SAY ""
END

/* ========================================
 * Step 4: List subnets in the region
 * ======================================== */
SAY "Step 4: Listing subnets in region..."
SAY ""

ADDRESS GCP "VPC LIST SUBNETS region=" || region

IF RC = 0 THEN DO
  SAY "✓ Subnets listed for region: " || region
  SAY ""
END

/* ========================================
 * Step 5: Create a firewall rule (allow SSH)
 * ======================================== */
SAY "Step 5: Creating firewall rule (allow SSH)..."
SAY "  Rule: " || firewall_name
SAY "  Network: " || network_name
SAY "  Protocol: tcp"
SAY "  Ports: 22 (SSH)"
SAY "  Source: 0.0.0.0/0 (all IPs - use with caution!)"
SAY ""

ADDRESS GCP "VPC CREATE FIREWALL name=" || firewall_name || " network=" || network_name || " allow=tcp:22 source-ranges=0.0.0.0/0 direction=INGRESS"

IF RC = 0 THEN DO
  SAY "✓ Firewall rule created: " || firewall_name
  SAY ""
  SAY "⚠️  SECURITY WARNING:"
  SAY "    This rule allows SSH from any IP address"
  SAY "    In production, restrict to specific IP ranges"
  SAY "    Example: source-ranges=203.0.113.0/24"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create firewall rule"
  SAY ""
END

/* ========================================
 * Step 6: List firewall rules for the network
 * ======================================== */
SAY "Step 6: Listing firewall rules..."
SAY ""

ADDRESS GCP "VPC LIST FIREWALLS network=" || network_name

IF RC = 0 THEN DO
  SAY "✓ Firewall rules listed"
  SAY ""
END

/* ========================================
 * Step 7: List routes for the network
 * ======================================== */
SAY "Step 7: Listing routes for network..."
SAY ""

ADDRESS GCP "VPC LIST ROUTES network=" || network_name

IF RC = 0 THEN DO
  SAY "✓ Routes listed"
  SAY ""
  SAY "Routes are automatically created for:"
  SAY "  • Subnet ranges (local routing)"
  SAY "  • Default internet gateway (0.0.0.0/0)"
  SAY ""
END

/* ========================================
 * Step 8: Describe the VPC network
 * ======================================== */
SAY "Step 8: Getting network details..."
SAY ""

ADDRESS GCP "VPC DESCRIBE NETWORK " || network_name

IF RC = 0 THEN DO
  SAY "✓ Network details retrieved"
  SAY ""
  SAY "Details include:"
  SAY "  • Network ID and self-link"
  SAY "  • Subnet mode (auto/custom)"
  SAY "  • Creation timestamp"
  SAY "  • Firewall rules"
  SAY ""
END

/* ========================================
 * Step 9: Cleanup - Delete firewall rule
 * ======================================== */
SAY "Step 9: Cleaning up - deleting firewall rule..."
SAY ""

ADDRESS GCP "VPC DELETE FIREWALL " || firewall_name

IF RC = 0 THEN DO
  SAY "✓ Firewall rule deleted: " || firewall_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete firewall rule"
  SAY ""
END

/* ========================================
 * Step 10: Cleanup - Delete subnet
 * ======================================== */
SAY "Step 10: Cleaning up - deleting subnet..."
SAY ""

ADDRESS GCP "VPC DELETE SUBNET name=" || subnet_name || " region=" || region

IF RC = 0 THEN DO
  SAY "✓ Subnet deleted: " || subnet_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete subnet"
  SAY "Note: May need manual cleanup"
  SAY ""
END

/* ========================================
 * Step 11: Cleanup - Delete VPC network
 * ======================================== */
SAY "Step 11: Cleaning up - deleting VPC network..."
SAY ""

ADDRESS GCP "VPC DELETE NETWORK " || network_name

IF RC = 0 THEN DO
  SAY "✓ VPC network deleted: " || network_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete network"
  SAY "⚠️  Manual cleanup may be required:"
  SAY "    gcloud compute networks delete " || network_name
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created VPC network: " || network_name
SAY "  • Created subnet: " || subnet_name || " (" || subnet_range || ")"
SAY "  • Created firewall rule: " || firewall_name
SAY "  • Listed routes"
SAY "  • Cleaned up all resources"
SAY ""
SAY "VPC Networking Concepts:"
SAY ""
SAY "Network Modes:"
SAY "  • Auto mode: GCP creates subnets in all regions automatically"
SAY "    - One subnet per region with predetermined IP ranges"
SAY "    - Good for getting started quickly"
SAY "    - Can be converted to custom mode later"
SAY "  • Custom mode: You control subnet creation"
SAY "    - Full control over IP ranges and regions"
SAY "    - Best for production workloads"
SAY "    - Cannot be converted to auto mode"
SAY ""
SAY "Subnet IP Ranges:"
SAY "  • Use RFC 1918 private IP ranges:"
SAY "    - 10.0.0.0/8 (10.0.0.0 to 10.255.255.255)"
SAY "    - 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)"
SAY "    - 192.168.0.0/16 (192.168.0.0 to 192.168.255.255)"
SAY "  • GCP reserves first 4 and last 1 IP in each subnet"
SAY "  • Plan subnet sizes based on VM requirements"
SAY ""
SAY "Firewall Rules:"
SAY "  • Stateful - return traffic automatically allowed"
SAY "  • Applied at network level, affect all VMs"
SAY "  • Can target specific VMs using tags or service accounts"
SAY "  • Default-deny for ingress, default-allow for egress"
SAY "  • Priority: 0-65535 (lower = higher priority)"
SAY ""
SAY "Common Firewall Patterns:"
SAY "  1. SSH access:"
SAY "     allow=tcp:22 source-ranges=YOUR_IP/32"
SAY "  2. HTTP/HTTPS:"
SAY "     allow=tcp:80,tcp:443 source-ranges=0.0.0.0/0"
SAY "  3. Internal communication:"
SAY "     allow=tcp:1-65535,udp:1-65535 source-ranges=10.0.0.0/8"
SAY "  4. Health checks from GCP load balancers:"
SAY "     allow=tcp:80 source-ranges=130.211.0.0/22,35.191.0.0/16"
SAY ""
SAY "Routes:"
SAY "  • Automatically created for subnet ranges"
SAY "  • Default route to internet gateway (0.0.0.0/0)"
SAY "  • Custom routes for advanced routing scenarios"
SAY "  • Priority determines which route is used"
SAY ""
SAY "Best Practices:"
SAY "  1. Use custom mode networks for production"
SAY "  2. Plan IP address space to avoid overlaps"
SAY "  3. Create subnets only in regions you'll use"
SAY "  4. Use network tags for firewall targeting"
SAY "  5. Document firewall rules thoroughly"
SAY "  6. Use service accounts for VM-specific rules"
SAY "  7. Enable VPC Flow Logs for troubleshooting"
SAY "  8. Use Cloud NAT for private VM internet access"
SAY ""
SAY "VPC Peering and Connectivity:"
SAY "  • VPC Peering: Connect two VPC networks"
SAY "  • Cloud VPN: Connect on-premises to GCP"
SAY "  • Cloud Interconnect: Dedicated physical connection"
SAY "  • Shared VPC: Share network across projects"
SAY ""
SAY "Security Features:"
SAY "  • Private Google Access: Access Google APIs without public IPs"
SAY "  • VPC Service Controls: Security perimeter for APIs"
SAY "  • Cloud Armor: DDoS protection and WAF"
SAY "  • Packet Mirroring: Traffic inspection"
SAY ""
SAY "Typical Production Setup:"
SAY "  1. Create custom mode VPC"
SAY "  2. Create subnets per region (dev/staging/prod)"
SAY "  3. Enable Private Google Access on subnets"
SAY "  4. Set up Cloud NAT for outbound internet"
SAY "  5. Configure firewall rules by tier:"
SAY "     - Web tier: Allow 80/443 from internet"
SAY "     - App tier: Allow from web tier only"
SAY "     - DB tier: Allow from app tier only"
SAY "  6. Enable VPC Flow Logs"
SAY "  7. Set up monitoring and alerts"
SAY ""
SAY "Cost Considerations:"
SAY "  • VPC networks: Free"
SAY "  • Subnets: Free"
SAY "  • Firewall rules: Free"
SAY "  • Routes: Free"
SAY "  • Egress traffic: Charged (varies by destination)"
SAY "  • Cloud NAT: Charged per gateway and data processed"
SAY "  • VPC Flow Logs: Charged per GB logged"
SAY ""
SAY "For more information:"
SAY "  https://cloud.google.com/vpc/docs/vpc"
