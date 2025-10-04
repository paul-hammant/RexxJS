#!/usr/bin/env rexx
/* Test Cloud Armor
 *
 * This script demonstrates Cloud Armor (security) operations:
 *   - Creating security policies
 *   - Adding security rules (allow/deny, rate limiting)
 *   - IP-based filtering
 *   - Attaching policies to backend services
 *   - WAF (Web Application Firewall) rules
 *
 * Required APIs:
 *   - compute.googleapis.com
 *
 * Required Permissions:
 *   - compute.securityPolicies.create
 *   - compute.securityPolicies.delete
 *   - compute.securityPolicies.get
 *   - compute.securityPolicies.list
 *   - compute.securityPolicies.use
 *   - compute.backendServices.create
 *   - compute.backendServices.update
 *   - compute.backendServices.setSecurityPolicy
 *
 * NOTE: This test demonstrates Cloud Armor configuration
 *       but does NOT perform actual attack simulations.
 */

SAY "=== Cloud Armor Test ==="
SAY ""

/* Configuration */
LET policy_name = "rexxjs-test-armor-" || WORD(DATE('S'), 1)
LET health_check_name = "rexxjs-test-armor-hc-" || WORD(DATE('S'), 1)
LET backend_service_name = "rexxjs-test-armor-backend-" || WORD(DATE('S'), 1)

SAY "Configuration:"
SAY "  Security Policy: " || policy_name
SAY "  Health Check: " || health_check_name
SAY "  Backend Service: " || backend_service_name
SAY ""

SAY "About Cloud Armor:"
SAY "  DDoS protection and Web Application Firewall (WAF)"
SAY "  Protects applications from attacks"
SAY "  IP allow/deny lists, rate limiting, geo-based rules"
SAY "  Integrated with Cloud Load Balancing"
SAY ""

/* ========================================
 * Step 1: List existing security policies
 * ======================================== */
SAY "Step 1: Listing existing security policies..."
SAY ""

ADDRESS GCP "ARMOR LIST POLICIES"

IF RC = 0 THEN DO
  SAY "✓ Security policies listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list policies (RC=" || RC || ")"
  SAY ""
END

/* ========================================
 * Step 2: Create a security policy
 * ======================================== */
SAY "Step 2: Creating security policy..."
SAY "  Name: " || policy_name
SAY ""

ADDRESS GCP "ARMOR CREATE POLICY name=" || policy_name || ' description="Test security policy for RexxJS"'

IF RC = 0 THEN DO
  SAY "✓ Security policy created: " || policy_name
  SAY ""
  SAY "Security policies contain rules that:"
  SAY "  • Allow or deny traffic based on conditions"
  SAY "  • Rate limit requests"
  SAY "  • Block attacks (XSS, SQLi, etc.)"
  SAY "  • Geo-based filtering"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create policy (RC=" || RC || ")"
  SAY ""
  SAY "Common reasons:"
  SAY "  • Compute Engine API not enabled"
  SAY "  • Insufficient permissions"
  SAY "  • Policy name already exists"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 3: Add IP deny rule
 * ======================================== */
SAY "Step 3: Adding IP deny rule..."
SAY ""

SAY "Blocking IP range 192.0.2.0/24 (documentation range)..."
ADDRESS GCP "ARMOR ADD RULE policy=" || policy_name || " priority=1000 action=deny-403 src-ip-ranges=192.0.2.0/24 description='Block test IP range'"

IF RC = 0 THEN DO
  SAY "✓ IP deny rule added (priority 1000)"
  SAY ""
  SAY "This rule blocks requests from 192.0.2.0/24:"
  SAY "  • Action: deny-403 (returns HTTP 403 Forbidden)"
  SAY "  • Priority: 1000 (lower = higher priority)"
  SAY "  • Evaluation: Rules checked in priority order"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to add rule (RC=" || RC || ")"
  SAY ""
END

/* ========================================
 * Step 4: Add rate limiting rule
 * ======================================== */
SAY "Step 4: Adding rate limiting rule..."
SAY ""

SAY "Rate limit: 100 requests per minute..."
ADDRESS GCP "ARMOR ADD RULE policy=" || policy_name || " priority=2000 action=rate-based-ban rate-limit-threshold-count=100 rate-limit-threshold-interval-sec=60 ban-duration-sec=600 description='Rate limit: 100 req/min'"

IF RC = 0 THEN DO
  SAY "✓ Rate limiting rule added (priority 2000)"
  SAY ""
  SAY "Rate limiting configuration:"
  SAY "  • Threshold: 100 requests per 60 seconds"
  SAY "  • Action: Ban client for 600 seconds (10 minutes)"
  SAY "  • Scope: Per client IP address"
  SAY ""
  SAY "How it works:"
  SAY "  1. Monitor requests per client IP"
  SAY "  2. If threshold exceeded: Ban client"
  SAY "  3. Banned clients get HTTP 429 (Too Many Requests)"
  SAY "  4. Ban expires after 10 minutes"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to add rate limiting rule"
  SAY ""
END

/* ========================================
 * Step 5: Demonstrate advanced rules (NOT EXECUTED)
 * ======================================== */
SAY "Step 5: Advanced security rules (demonstration)..."
SAY ""

SAY "Geo-based rules:"
SAY '  ARMOR ADD RULE policy=' || policy_name || ' priority=3000 expression="origin.region_code == ''CN''" action=deny-403 description="Block China"'
SAY ""

SAY "Expression-based rules use Common Expression Language (CEL):"
SAY ""
SAY "Block specific country:"
SAY '  expression="origin.region_code == ''CN''"'
SAY ""

SAY "Allow only specific countries:"
SAY '  expression="origin.region_code == ''US'' || origin.region_code == ''CA''"'
SAY ""

SAY "Block by ASN (Autonomous System Number):"
SAY '  expression="origin.asn == 12345"'
SAY ""

SAY "User-Agent filtering:"
SAY '  expression="has(request.headers[''user-agent'']) && request.headers[''user-agent''].contains(''BadBot'')"'
SAY ""

SAY "Path-based rules:"
SAY '  expression="request.path.startsWith(''/admin'')"'
SAY ""

SAY "Combine conditions:"
SAY '  expression="origin.region_code == ''CN'' && request.path.startsWith(''/api'')"'
SAY ""

SAY "⚠️  Skipping advanced rule creation to keep test simple"
SAY ""

/* ========================================
 * Step 6: Create backend and attach policy
 * ======================================== */
SAY "Step 6: Creating backend service and attaching policy..."
SAY ""

SAY "Creating health check..."
ADDRESS GCP "LOAD-BALANCING CREATE HEALTH-CHECK name=" || health_check_name || " protocol=HTTP port=80"

IF RC = 0 THEN DO
  SAY "✓ Health check created"
END

SAY ""
SAY "Creating backend service..."
ADDRESS GCP "LOAD-BALANCING CREATE BACKEND-SERVICE name=" || backend_service_name || " protocol=HTTP health-check=" || health_check_name

IF RC = 0 THEN DO
  SAY "✓ Backend service created"
END

SAY ""
SAY "Attaching security policy to backend..."
ADDRESS GCP "ARMOR ATTACH backend-service=" || backend_service_name || " policy=" || policy_name

IF RC = 0 THEN DO
  SAY "✓ Security policy attached to " || backend_service_name
  SAY ""
  SAY "Now all traffic through this backend is protected:"
  SAY "  • IP deny rules enforced"
  SAY "  • Rate limiting enforced"
  SAY "  • DDoS protection active"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to attach policy"
  SAY ""
END

/* ========================================
 * Step 7: Describe policy
 * ======================================== */
SAY "Step 7: Getting policy details..."
SAY ""

ADDRESS GCP "ARMOR DESCRIBE POLICY name=" || policy_name

IF RC = 0 THEN DO
  SAY "✓ Policy details retrieved"
  SAY ""
END

/* ========================================
 * Step 8: Cleanup
 * ======================================== */
SAY "Step 8: Cleaning up..."
SAY ""

SAY "Detaching security policy..."
ADDRESS GCP "ARMOR DETACH backend-service=" || backend_service_name
IF RC = 0 THEN SAY "✓ Policy detached"
SAY ""

SAY "Deleting backend service..."
ADDRESS GCP "LOAD-BALANCING DELETE BACKEND-SERVICE name=" || backend_service_name
IF RC = 0 THEN SAY "✓ Backend service deleted"
SAY ""

SAY "Deleting health check..."
ADDRESS GCP "LOAD-BALANCING DELETE HEALTH-CHECK name=" || health_check_name
IF RC = 0 THEN SAY "✓ Health check deleted"
SAY ""

SAY "Deleting security policy..."
ADDRESS GCP "ARMOR DELETE POLICY name=" || policy_name
IF RC = 0 THEN SAY "✓ Security policy deleted"
SAY ""

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created security policy: " || policy_name
SAY "  • Added IP deny rule (priority 1000)"
SAY "  • Added rate limiting rule (priority 2000)"
SAY "  • Attached policy to backend service"
SAY "  • Cleaned up all resources"
SAY ""

SAY "Cloud Armor Concepts:"
SAY ""
SAY "Security Policy:"
SAY "  • Container for security rules"
SAY "  • Attached to backend services"
SAY "  • Rules evaluated in priority order"
SAY "  • Default rule (priority 2147483647): allow"
SAY ""

SAY "Rule Priority:"
SAY "  • Lower number = higher priority"
SAY "  • Range: 0 to 2,147,483,647"
SAY "  • Rules checked in order until match"
SAY "  • Recommended ranges:"
SAY "    - 1000-9999: Deny rules"
SAY "    - 10000-19999: Rate limit rules"
SAY "    - 20000+: Allow rules"
SAY ""

SAY "Rule Actions:"
SAY ""
SAY "allow:"
SAY "  • Permit request"
SAY "  • Continue to backend"
SAY ""

SAY "deny(403):"
SAY "  • Block request"
SAY "  • Return HTTP 403 Forbidden"
SAY ""

SAY "deny(404):"
SAY "  • Block request"
SAY "  • Return HTTP 404 Not Found"
SAY "  • Hides existence of resource"
SAY ""

SAY "deny(502):"
SAY "  • Block request"
SAY "  • Return HTTP 502 Bad Gateway"
SAY "  • Appears as backend error"
SAY ""

SAY "rate-based-ban:"
SAY "  • Count requests per client"
SAY "  • Ban if threshold exceeded"
SAY "  • Return HTTP 429 Too Many Requests"
SAY ""

SAY "redirect:"
SAY "  • Redirect to different URL"
SAY "  • Useful for maintenance pages"
SAY ""

SAY "Threat Intelligence:"
SAY ""
SAY "Google Cloud Armor provides built-in protection against:"
SAY "  • DDoS attacks (L3/L4/L7)"
SAY "  • SQL injection (SQLi)"
SAY "  • Cross-site scripting (XSS)"
SAY "  • Local file inclusion (LFI)"
SAY "  • Remote code execution (RCE)"
SAY "  • Protocol attacks"
SAY ""

SAY "Preconfigured WAF Rules:"
SAY ""
SAY "OWASP Top 10:"
SAY "  • ModSecurity Core Rule Set (CRS)"
SAY "  • Protection against common attacks"
SAY "  • Sensitivity levels: Low, Medium, High"
SAY ""

SAY "To enable:"
SAY '  evaluatePreconfiguredExpr(''xss-stable'')'
SAY '  evaluatePreconfiguredExpr(''sqli-stable'')'
SAY ""

SAY "Rate Limiting Strategies:"
SAY ""
SAY "Per-Client IP:"
SAY "  • Default scope"
SAY "  • Separate counter per IP"
SAY "  • Good for: Most use cases"
SAY ""

SAY "Per-Region:"
SAY "  • Aggregate across all IPs from region"
SAY "  • Good for: Geo-based limits"
SAY ""

SAY "Global:"
SAY "  • Single counter for all requests"
SAY "  • Good for: Protecting backend capacity"
SAY ""

SAY "Common Rate Limits:"
SAY "  • API (authenticated): 1000 req/min per user"
SAY "  • API (anonymous): 100 req/min per IP"
SAY "  • Web pages: 500 req/min per IP"
SAY "  • Login endpoints: 10 req/min per IP"
SAY ""

SAY "Expression Language (CEL):"
SAY ""
SAY "Request Properties:"
SAY "  • request.path - URL path"
SAY "  • request.headers - HTTP headers"
SAY "  • request.query - Query parameters"
SAY "  • origin.ip - Client IP address"
SAY "  • origin.region_code - Country code (ISO 3166-1 alpha-2)"
SAY "  • origin.asn - Autonomous System Number"
SAY ""

SAY "String Functions:"
SAY "  • .startsWith('prefix')"
SAY "  • .endsWith('suffix')"
SAY "  • .contains('substring')"
SAY "  • .matches('regex')"
SAY ""

SAY "Logical Operators:"
SAY "  • && (AND)"
SAY "  • || (OR)"
SAY "  • ! (NOT)"
SAY ""

SAY "Example Expressions:"
SAY ""
SAY "Block admin access from outside US:"
SAY '  request.path.startsWith(''/admin'') && origin.region_code != ''US'''
SAY ""

SAY "Allow only mobile apps (custom header):"
SAY '  has(request.headers[''x-api-key'']) && request.headers[''x-api-key''] == ''secret'''
SAY ""

SAY "Block specific user agents:"
SAY '  has(request.headers[''user-agent'']) && request.headers[''user-agent''].matches(''BadBot.*'')'
SAY ""

SAY "Best Practices:"
SAY ""
SAY "1. Start with monitoring (preview mode):"
SAY "   • Add rules with --preview"
SAY "   • Monitor logs without blocking"
SAY "   • Tune rules before enforcement"
SAY ""

SAY "2. Layer defense:"
SAY "   • IP deny lists (highest priority)"
SAY "   • Rate limiting (medium priority)"
SAY "   • WAF rules (lower priority)"
SAY "   • Default allow (lowest priority)"
SAY ""

SAY "3. Use appropriate actions:"
SAY "   • deny-403: Obvious attacks (known bad IPs)"
SAY "   • deny-404: Hide sensitive paths"
SAY "   • rate-based-ban: Excessive requests"
SAY ""

SAY "4. Monitor and tune:"
SAY "   • Review Cloud Logging for blocked requests"
SAY "   • Check for false positives"
SAY "   • Adjust sensitivity levels"
SAY "   • Update IP lists regularly"
SAY ""

SAY "5. Combine with other security:"
SAY "   • Identity-Aware Proxy (IAP) for authentication"
SAY "   • VPC Service Controls for network isolation"
SAY "   • SSL certificates for encryption"
SAY "   • Cloud CDN for performance"
SAY ""

SAY "Monitoring and Logging:"
SAY ""
SAY "Cloud Logging:"
SAY "  • All enforced and preview rule matches"
SAY "  • Request details (IP, path, headers)"
SAY "  • Rule that matched"
SAY "  • Action taken"
SAY ""

SAY "Cloud Monitoring Metrics:"
SAY "  • Requests blocked"
SAY "  • Requests allowed"
SAY "  • Requests by policy"
SAY "  • Requests by action"
SAY ""

SAY "Log Query Examples:"
SAY '  resource.type="http_load_balancer"'
SAY '  jsonPayload.enforcedSecurityPolicy.name="my-policy"'
SAY ""

SAY "Common Attack Scenarios:"
SAY ""
SAY "DDoS Protection:"
SAY "  • Automatic detection and mitigation"
SAY "  • Rate limiting rules for application layer"
SAY "  • No configuration needed for network layer"
SAY ""

SAY "Credential Stuffing:"
SAY "  • Rate limit login endpoints"
SAY "  • Monitor for unusual patterns"
SAY "  • Consider CAPTCHA for suspicious IPs"
SAY ""

SAY "Bot Traffic:"
SAY "  • User-Agent filtering"
SAY "  • Challenge suspicious requests"
SAY "  • Allow known good bots (Googlebot, etc.)"
SAY ""

SAY "Geographic Attacks:"
SAY "  • Block regions you don't serve"
SAY "  • Allow-list for expected countries"
SAY "  • Monitor for unusual geographic patterns"
SAY ""

SAY "Integration with Load Balancing:"
SAY ""
SAY "Attachment Points:"
SAY "  • Backend services (most common)"
SAY "  • Can have different policies per backend"
SAY "  • Example: Strict policy for /admin, permissive for /public"
SAY ""

SAY "Typical Architecture:"
SAY "  Internet → Forwarding Rule → Target Proxy → URL Map"
SAY "           ↓"
SAY "         Backend Service 1 (Cloud Armor: api-policy)"
SAY "         Backend Service 2 (Cloud Armor: web-policy)"
SAY ""

SAY "Cost:"
SAY ""
SAY "Pricing:"
SAY "  • $6/month per policy"
SAY "  • $0.75 per million requests"
SAY "  • Additional $10/month for WAF rules"
SAY "  • Additional $1 per million for custom rules"
SAY ""

SAY "Cost Optimization:"
SAY "  • Consolidate policies when possible"
SAY "  • Use efficient rule expressions"
SAY "  • Block obvious attacks early (saves requests)"
SAY ""

SAY "Troubleshooting:"
SAY ""
SAY "Legitimate Traffic Blocked:"
SAY "  • Check Cloud Logging for rule matches"
SAY "  • Use preview mode to test changes"
SAY "  • Adjust WAF sensitivity (High → Medium → Low)"
SAY "  • Add allow rules for known good IPs"
SAY ""

SAY "Policy Not Working:"
SAY "  • Verify policy attached to backend service"
SAY "  • Check rule priorities (lower = higher priority)"
SAY "  • Ensure expressions are correct"
SAY "  • Check for conflicting rules"
SAY ""

SAY "High False Positive Rate:"
SAY "  • Lower WAF sensitivity level"
SAY "  • Use preview mode to tune"
SAY "  • Add exceptions for specific patterns"
SAY "  • Review logs for common false positives"
SAY ""

SAY "Comparison with Other Solutions:"
SAY ""
SAY "Cloud Armor vs. Traditional WAF:"
SAY "  • Cloud Armor: Fully managed, no infrastructure"
SAY "  • Traditional WAF: Self-managed, more control"
SAY "  • Cloud Armor: Integrated with GCP services"
SAY "  • Traditional WAF: May require VMs/appliances"
SAY ""

SAY "Cloud Armor vs. Cloudflare:"
SAY "  • Cloud Armor: GCP-native, no DNS change"
SAY "  • Cloudflare: Multi-cloud, requires DNS change"
SAY "  • Both offer DDoS protection and WAF"
SAY "  • Choose based on existing infrastructure"
SAY ""

SAY "For more information:"
SAY "  https://cloud.google.com/armor/docs"
