#!/usr/bin/env rexx
/* Test Cloud DNS
 *
 * This script demonstrates Cloud DNS management:
 *   - Creating and managing DNS zones
 *   - Adding and removing DNS records
 *   - Different record types (A, AAAA, CNAME, MX, TXT)
 *
 * Required APIs:
 *   - dns.googleapis.com
 *
 * Required Permissions:
 *   - dns.managedZones.create
 *   - dns.managedZones.delete
 *   - dns.managedZones.get
 *   - dns.managedZones.list
 *   - dns.changes.create
 *   - dns.changes.get
 *   - dns.resourceRecordSets.list
 *
 * NOTE: You need to own the domain or use a test domain
 *       This test uses example.com which won't actually resolve
 *       For real testing, use a domain you control
 */

SAY "=== Cloud DNS Test ==="
SAY ""

/* Configuration */
LET zone_name = "rexxjs-test-zone-" || WORD(DATE('S'), 1)
LET dns_name = "example.com."  /* Must end with a dot! */
LET description = "Test zone created by RexxJS"

SAY "Configuration:"
SAY "  Zone name: " || zone_name
SAY "  DNS name: " || dns_name
SAY "  Description: " || description
SAY ""

SAY "⚠️  IMPORTANT:"
SAY "    This test uses 'example.com' which you don't own"
SAY "    The zone will be created but won't affect real DNS"
SAY "    To test with a real domain, update the dns_name variable"
SAY ""

/* ========================================
 * Step 1: List existing DNS zones
 * ======================================== */
SAY "Step 1: Listing existing DNS zones..."
SAY ""

ADDRESS GCP "DNS LIST ZONES"

IF RC = 0 THEN DO
  SAY "✓ DNS zones listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list zones (RC=" || RC || ")"
  SAY "Note: You may need to enable the Cloud DNS API"
  SAY ""
END

/* ========================================
 * Step 2: Create a managed DNS zone
 * ======================================== */
SAY "Step 2: Creating managed DNS zone..."
SAY "  Zone: " || zone_name
SAY "  Domain: " || dns_name
SAY ""

ADDRESS GCP "DNS CREATE ZONE name=" || zone_name || " dns-name=" || dns_name || " description='" || description || "'"

IF RC = 0 THEN DO
  SAY "✓ DNS zone created: " || zone_name
  SAY ""
  SAY "What happens when you create a zone:"
  SAY "  • GCP creates NS (nameserver) records"
  SAY "  • GCP creates SOA (Start of Authority) record"
  SAY "  • You get 4 nameservers to use at your registrar"
  SAY ""
  SAY "To make this zone active, you would:"
  SAY "  1. Note the nameservers from 'DNS DESCRIBE ZONE " || zone_name || "'"
  SAY "  2. Go to your domain registrar (e.g., Google Domains, GoDaddy)"
  SAY "  3. Replace the registrar's nameservers with GCP's"
  SAY "  4. Wait 24-48 hours for DNS propagation"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create zone (RC=" || RC || ")"
  EXIT RC
END

/* ========================================
 * Step 3: Describe the zone to see nameservers
 * ======================================== */
SAY "Step 3: Getting zone details (including nameservers)..."
SAY ""

ADDRESS GCP "DNS DESCRIBE ZONE " || zone_name

IF RC = 0 THEN DO
  SAY "✓ Zone details retrieved"
  SAY ""
  SAY "The output shows:"
  SAY "  • Zone ID and creation time"
  SAY "  • Nameservers (ns-cloud-*.googledomains.com)"
  SAY "  • DNS name"
  SAY ""
END

/* ========================================
 * Step 4: List records in the zone
 * ======================================== */
SAY "Step 4: Listing DNS records in zone..."
SAY ""

ADDRESS GCP "DNS LIST RECORDS zone=" || zone_name

IF RC = 0 THEN DO
  SAY "✓ DNS records listed"
  SAY ""
  SAY "Default records created automatically:"
  SAY "  • NS records: Point to Google's nameservers"
  SAY "  • SOA record: Start of Authority with zone metadata"
  SAY ""
END

/* ========================================
 * Step 5: Add an A record (IPv4 address)
 * ======================================== */
SAY "Step 5: Adding A record..."
SAY "  Name: www.example.com."
SAY "  Type: A"
SAY "  IP: 1.2.3.4"
SAY "  TTL: 300 seconds (5 minutes)"
SAY ""

ADDRESS GCP "DNS ADD-RECORD zone=" || zone_name || " name=www.example.com. type=A ttl=300 data=1.2.3.4"

IF RC = 0 THEN DO
  SAY "✓ A record added"
  SAY ""
  SAY "A Record Usage:"
  SAY "  • Maps domain name to IPv4 address"
  SAY "  • Most common DNS record type"
  SAY "  • Used for: websites, APIs, servers"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to add A record"
  SAY "Note: Zone may still be creating"
  SAY ""
END

/* ========================================
 * Step 6: Add a CNAME record (alias)
 * ======================================== */
SAY "Step 6: Adding CNAME record..."
SAY "  Name: blog.example.com."
SAY "  Type: CNAME"
SAY "  Target: www.example.com."
SAY ""

ADDRESS GCP "DNS ADD-RECORD zone=" || zone_name || " name=blog.example.com. type=CNAME ttl=300 data=www.example.com."

IF RC = 0 THEN DO
  SAY "✓ CNAME record added"
  SAY ""
  SAY "CNAME Record Usage:"
  SAY "  • Creates an alias to another domain"
  SAY "  • blog.example.com → www.example.com → 1.2.3.4"
  SAY "  • Cannot be used for zone apex (example.com.)"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to add CNAME record"
  SAY ""
END

/* ========================================
 * Step 7: Add a TXT record (verification/SPF)
 * ======================================== */
SAY "Step 7: Adding TXT record..."
SAY "  Name: example.com."
SAY "  Type: TXT"
SAY "  Value: 'v=spf1 include:_spf.google.com ~all'"
SAY ""

ADDRESS GCP "DNS ADD-RECORD zone=" || zone_name || " name=example.com. type=TXT ttl=300 data='v=spf1 include:_spf.google.com ~all'"

IF RC = 0 THEN DO
  SAY "✓ TXT record added"
  SAY ""
  SAY "TXT Record Usage:"
  SAY "  • Domain verification (Google, Microsoft, etc.)"
  SAY "  • SPF records for email authentication"
  SAY "  • DKIM/DMARC for email security"
  SAY "  • General metadata storage"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to add TXT record"
  SAY ""
END

/* ========================================
 * Step 8: Add an MX record (email)
 * ======================================== */
SAY "Step 8: Adding MX record for email..."
SAY "  Name: example.com."
SAY "  Type: MX"
SAY "  Priority: 10"
SAY "  Mail server: mail.example.com."
SAY ""

ADDRESS GCP "DNS ADD-RECORD zone=" || zone_name || " name=example.com. type=MX ttl=300 data='10 mail.example.com.'"

IF RC = 0 THEN DO
  SAY "✓ MX record added"
  SAY ""
  SAY "MX Record Usage:"
  SAY "  • Specifies mail servers for the domain"
  SAY "  • Priority: Lower number = higher priority"
  SAY "  • Can have multiple MX records for redundancy"
  SAY "  • Format: 'priority mailserver.domain.com.'"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to add MX record"
  SAY ""
END

/* ========================================
 * Step 9: List all records again
 * ======================================== */
SAY "Step 9: Listing all DNS records after additions..."
SAY ""

ADDRESS GCP "DNS LIST RECORDS zone=" || zone_name

IF RC = 0 THEN DO
  SAY "✓ Records listed"
  SAY ""
  SAY "You should now see:"
  SAY "  • NS and SOA (automatic)"
  SAY "  • A record (www → 1.2.3.4)"
  SAY "  • CNAME record (blog → www)"
  SAY "  • TXT record (SPF)"
  SAY "  • MX record (mail server)"
  SAY ""
END

/* ========================================
 * Step 10: Delete a DNS record
 * ======================================== */
SAY "Step 10: Deleting the CNAME record..."
SAY ""

ADDRESS GCP "DNS DELETE-RECORD zone=" || zone_name || " name=blog.example.com. type=CNAME"

IF RC = 0 THEN DO
  SAY "✓ CNAME record deleted"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete CNAME record"
  SAY ""
END

/* ========================================
 * Step 11: Cleanup - Delete the zone
 * ======================================== */
SAY "Step 11: Cleaning up - deleting DNS zone..."
SAY ""

SAY "Note: We need to delete all non-essential records first"
SAY "      (NS and SOA records will be deleted automatically)"
SAY ""

/* Delete custom records we added */
ADDRESS GCP "DNS DELETE-RECORD zone=" || zone_name || " name=www.example.com. type=A"
ADDRESS GCP "DNS DELETE-RECORD zone=" || zone_name || " name=example.com. type=TXT"
ADDRESS GCP "DNS DELETE-RECORD zone=" || zone_name || " name=example.com. type=MX"

SAY "Deleted custom records, now deleting zone..."
SAY ""

ADDRESS GCP "DNS DELETE ZONE " || zone_name

IF RC = 0 THEN DO
  SAY "✓ DNS zone deleted: " || zone_name
  SAY ""
END
ELSE DO
  SAY "✗ Failed to delete zone"
  SAY "⚠️  Manual cleanup may be required:"
  SAY "    gcloud dns managed-zones delete " || zone_name
  SAY ""
END

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created DNS zone: " || zone_name || " for " || dns_name
SAY "  • Added A record (www → 1.2.3.4)"
SAY "  • Added CNAME record (blog → www)"
SAY "  • Added TXT record (SPF)"
SAY "  • Added MX record (mail server)"
SAY "  • Deleted CNAME record"
SAY "  • Cleaned up zone"
SAY ""
SAY "DNS Record Types Reference:"
SAY ""
SAY "A Record (IPv4 address):"
SAY "  Example: www.example.com. → 1.2.3.4"
SAY "  Use: Map domain to IPv4 address"
SAY ""
SAY "AAAA Record (IPv6 address):"
SAY "  Example: www.example.com. → 2001:db8::1"
SAY "  Use: Map domain to IPv6 address"
SAY ""
SAY "CNAME Record (alias):"
SAY "  Example: blog.example.com. → www.example.com."
SAY "  Use: Create alias to another domain"
SAY "  Note: Cannot be used for zone apex"
SAY ""
SAY "MX Record (mail server):"
SAY "  Example: 10 mail.example.com."
SAY "  Use: Specify email servers"
SAY "  Format: priority mailserver"
SAY ""
SAY "TXT Record (text data):"
SAY "  Examples:"
SAY "    • SPF: v=spf1 include:_spf.google.com ~all"
SAY "    • DKIM: v=DKIM1; k=rsa; p=MIGfMA0..."
SAY "    • Verification: google-site-verification=abc123"
SAY "  Use: Verification, email auth, metadata"
SAY ""
SAY "NS Record (nameserver):"
SAY "  Example: ns-cloud-a1.googledomains.com."
SAY "  Use: Delegate DNS authority"
SAY "  Note: Created automatically"
SAY ""
SAY "SOA Record (Start of Authority):"
SAY "  Contains: Primary NS, admin email, serial, timers"
SAY "  Use: Zone metadata and refresh settings"
SAY "  Note: Created automatically"
SAY ""
SAY "TTL (Time To Live):"
SAY "  • 300 (5 min): Good for testing/frequent changes"
SAY "  • 3600 (1 hour): Balanced for most use cases"
SAY "  • 86400 (24 hours): Stable records, lower query costs"
SAY "  • Lower TTL = faster updates but more queries"
SAY "  • Higher TTL = slower updates but fewer queries"
SAY ""
SAY "Common DNS Patterns:"
SAY ""
SAY "1. Basic Website:"
SAY "   @ (apex)    A       1.2.3.4"
SAY "   www         CNAME   example.com."
SAY ""
SAY "2. Google Workspace Email:"
SAY "   @           MX      1 aspmx.l.google.com."
SAY "   @           MX      5 alt1.aspmx.l.google.com."
SAY "   @           TXT     v=spf1 include:_spf.google.com ~all"
SAY ""
SAY "3. Subdomain pointing to external service:"
SAY "   app         CNAME   myapp.herokuapp.com."
SAY "   api         CNAME   myapi.cloudflare.net."
SAY ""
SAY "4. Load-balanced website (multiple A records):"
SAY "   www         A       1.2.3.4"
SAY "   www         A       5.6.7.8"
SAY "   www         A       9.10.11.12"
SAY ""
SAY "Best Practices:"
SAY "  1. Always end domain names with a dot (.)"
SAY "  2. Use reasonable TTL values (300-3600 for most cases)"
SAY "  3. Set lower TTL before planned changes"
SAY "  4. Use DNSSEC for security (not shown in this test)"
SAY "  5. Monitor DNS query patterns in Cloud Console"
SAY "  6. Use Cloud DNS ALIAS records for zone apex"
SAY "  7. Keep NS records in sync with registrar"
SAY "  8. Document your DNS setup"
SAY ""
SAY "Cloud DNS Features:"
SAY "  • Global anycast network (low latency)"
SAY "  • 100% SLA uptime guarantee"
SAY "  • DNSSEC support"
SAY "  • Private DNS zones (for VPCs)"
SAY "  • Geo-routing (route based on location)"
SAY "  • Integration with Cloud Load Balancing"
SAY ""
SAY "Pricing:"
SAY "  • Hosted zones: $0.20 per zone per month"
SAY "  • Queries: $0.40 per million queries"
SAY "  • First 1 billion queries per month included"
SAY "  • Very cost-effective for most use cases"
SAY ""
SAY "For more information:"
SAY "  https://cloud.google.com/dns/docs"
