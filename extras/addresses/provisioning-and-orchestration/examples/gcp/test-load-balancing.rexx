#!/usr/bin/env rexx
/* Test Cloud Load Balancing
 *
 * This script demonstrates Cloud Load Balancing operations:
 *   - Creating health checks
 *   - Creating backend services
 *   - Creating URL maps
 *   - Creating target proxies
 *   - Creating forwarding rules
 *   - Setting up HTTP(S) load balancing
 *
 * Required APIs:
 *   - compute.googleapis.com
 *
 * Required Permissions:
 *   - compute.healthChecks.create
 *   - compute.healthChecks.delete
 *   - compute.healthChecks.get
 *   - compute.healthChecks.list
 *   - compute.backendServices.create
 *   - compute.backendServices.delete
 *   - compute.backendServices.get
 *   - compute.backendServices.list
 *   - compute.backendServices.update
 *   - compute.urlMaps.create
 *   - compute.urlMaps.delete
 *   - compute.urlMaps.get
 *   - compute.urlMaps.list
 *   - compute.targetHttpProxies.create
 *   - compute.targetHttpProxies.delete
 *   - compute.targetHttpProxies.get
 *   - compute.targetHttpProxies.list
 *   - compute.forwardingRules.create
 *   - compute.forwardingRules.delete
 *   - compute.forwardingRules.get
 *   - compute.forwardingRules.list
 *   - compute.sslCertificates.create
 *   - compute.sslCertificates.list
 *
 * NOTE: This test demonstrates load balancing setup but does NOT
 *       create actual compute instances or instance groups.
 *       For a complete setup, you would need:
 *       1. Compute instances
 *       2. Instance groups
 *       3. Backend configuration
 */

SAY "=== Cloud Load Balancing Test ==="
SAY ""

/* Configuration */
LET health_check_name = "rexxjs-test-hc-" || WORD(DATE('S'), 1)
LET backend_service_name = "rexxjs-test-backend-" || WORD(DATE('S'), 1)
LET url_map_name = "rexxjs-test-urlmap-" || WORD(DATE('S'), 1)
LET target_proxy_name = "rexxjs-test-proxy-" || WORD(DATE('S'), 1)
LET forwarding_rule_name = "rexxjs-test-rule-" || WORD(DATE('S'), 1)

SAY "Configuration:"
SAY "  Health Check: " || health_check_name
SAY "  Backend Service: " || backend_service_name
SAY "  URL Map: " || url_map_name
SAY "  Target Proxy: " || target_proxy_name
SAY "  Forwarding Rule: " || forwarding_rule_name
SAY ""

SAY "About Cloud Load Balancing:"
SAY "  Global load balancing with single anycast IP"
SAY "  SSL termination and HTTP(S) support"
SAY "  Health checks and autoscaling"
SAY "  Integration with Cloud CDN and Cloud Armor"
SAY ""

/* ========================================
 * Step 1: List existing health checks
 * ======================================== */
SAY "Step 1: Listing existing health checks..."
SAY ""

ADDRESS GCP "LOAD-BALANCING LIST HEALTH-CHECKS"

IF RC = 0 THEN DO
  SAY "✓ Health checks listed"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to list health checks (RC=" || RC || ")"
  SAY ""
END

/* ========================================
 * Step 2: Create a health check
 * ======================================== */
SAY "Step 2: Creating HTTP health check..."
SAY "  Name: " || health_check_name
SAY "  Protocol: HTTP"
SAY "  Port: 80"
SAY "  Path: /"
SAY ""

ADDRESS GCP "LOAD-BALANCING CREATE HEALTH-CHECK name=" || health_check_name || " protocol=HTTP port=80 request-path=/ check-interval=10s timeout=5s"

IF RC = 0 THEN DO
  SAY "✓ Health check created: " || health_check_name
  SAY ""
  SAY "Health check monitors backend instance health:"
  SAY "  • Check interval: Every 10 seconds"
  SAY "  • Timeout: 5 seconds"
  SAY "  • Healthy threshold: 2 consecutive successes"
  SAY "  • Unhealthy threshold: 2 consecutive failures"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create health check (RC=" || RC || ")"
  SAY ""
  SAY "Common reasons:"
  SAY "  • Compute Engine API not enabled"
  SAY "  • Insufficient permissions"
  SAY "  • Health check already exists"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 3: Create a backend service
 * ======================================== */
SAY "Step 3: Creating backend service..."
SAY "  Name: " || backend_service_name
SAY "  Protocol: HTTP"
SAY "  Health Check: " || health_check_name
SAY ""

ADDRESS GCP "LOAD-BALANCING CREATE BACKEND-SERVICE name=" || backend_service_name || " protocol=HTTP health-check=" || health_check_name

IF RC = 0 THEN DO
  SAY "✓ Backend service created: " || backend_service_name
  SAY ""
  SAY "Backend services group backend instances:"
  SAY "  • Define load balancing algorithm (ROUND_ROBIN, etc.)"
  SAY "  • Set session affinity"
  SAY "  • Configure health checks"
  SAY "  • Enable Cloud CDN"
  SAY ""
  SAY "To add backends, you would use:"
  SAY "  LOAD-BALANCING ADD-BACKEND backend-service=" || backend_service_name || " instance-group=my-group instance-group-zone=us-central1-a"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create backend service (RC=" || RC || ")"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 4: Create a URL map
 * ======================================== */
SAY "Step 4: Creating URL map..."
SAY "  Name: " || url_map_name
SAY "  Default Service: " || backend_service_name
SAY ""

ADDRESS GCP "LOAD-BALANCING CREATE URL-MAP name=" || url_map_name || " default-service=" || backend_service_name

IF RC = 0 THEN DO
  SAY "✓ URL map created: " || url_map_name
  SAY ""
  SAY "URL maps route requests to backends:"
  SAY "  • Default backend for unmatched requests"
  SAY "  • Path-based routing (/api → api-backend)"
  SAY "  • Host-based routing (api.example.com → api-backend)"
  SAY "  • Advanced routing rules"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create URL map (RC=" || RC || ")"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 5: Create a target HTTP proxy
 * ======================================== */
SAY "Step 5: Creating target HTTP proxy..."
SAY "  Name: " || target_proxy_name
SAY "  URL Map: " || url_map_name
SAY ""

ADDRESS GCP "LOAD-BALANCING CREATE TARGET-HTTP-PROXY name=" || target_proxy_name || " url-map=" || url_map_name

IF RC = 0 THEN DO
  SAY "✓ Target HTTP proxy created: " || target_proxy_name
  SAY ""
  SAY "Target proxies:"
  SAY "  • HTTP proxy: Terminates HTTP traffic"
  SAY "  • HTTPS proxy: Terminates HTTPS, requires SSL cert"
  SAY "  • Routes to URL map"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to create target HTTP proxy (RC=" || RC || ")"
  SAY ""
  EXIT RC
END

/* ========================================
 * Step 6: Demonstrate HTTPS setup (NOT EXECUTED)
 * ======================================== */
SAY "Step 6: HTTPS load balancing setup (demonstration only)..."
SAY ""

SAY "For HTTPS, you need an SSL certificate:"
SAY ""
SAY "1. Create managed SSL certificate:"
SAY "   LOAD-BALANCING CREATE SSL-CERTIFICATE name=my-cert domains=example.com managed=true"
SAY "   • Google provisions and renews automatically"
SAY "   • Requires domain ownership verification"
SAY "   • Can take 15-60 minutes to provision"
SAY ""

SAY "2. Create target HTTPS proxy:"
SAY "   LOAD-BALANCING CREATE TARGET-HTTPS-PROXY name=my-https-proxy url-map=" || url_map_name || " ssl-certificates=my-cert"
SAY ""

SAY "3. Create forwarding rule on port 443:"
SAY "   LOAD-BALANCING CREATE FORWARDING-RULE name=my-https-rule target-https-proxy=my-https-proxy ports=443"
SAY ""

SAY "⚠️  Skipping actual HTTPS setup to avoid certificate provisioning"
SAY ""

/* ========================================
 * Step 7: List components
 * ======================================== */
SAY "Step 7: Listing load balancing components..."
SAY ""

SAY "Backend services:"
ADDRESS GCP "LOAD-BALANCING LIST BACKEND-SERVICES"
SAY ""

SAY "URL maps:"
ADDRESS GCP "LOAD-BALANCING LIST URL-MAPS"
SAY ""

SAY "Target HTTP proxies:"
ADDRESS GCP "LOAD-BALANCING LIST TARGET-HTTP-PROXIES"
SAY ""

/* ========================================
 * Step 8: Cleanup - Delete components in reverse order
 * ======================================== */
SAY "Step 8: Cleaning up - deleting components..."
SAY ""

SAY "Deleting target HTTP proxy..."
ADDRESS GCP "LOAD-BALANCING DELETE TARGET-HTTP-PROXY name=" || target_proxy_name
IF RC = 0 THEN SAY "✓ Target HTTP proxy deleted"
ELSE SAY "✗ Failed to delete target HTTP proxy"
SAY ""

SAY "Deleting URL map..."
ADDRESS GCP "LOAD-BALANCING DELETE URL-MAP name=" || url_map_name
IF RC = 0 THEN SAY "✓ URL map deleted"
ELSE SAY "✗ Failed to delete URL map"
SAY ""

SAY "Deleting backend service..."
ADDRESS GCP "LOAD-BALANCING DELETE BACKEND-SERVICE name=" || backend_service_name
IF RC = 0 THEN SAY "✓ Backend service deleted"
ELSE SAY "✗ Failed to delete backend service"
SAY ""

SAY "Deleting health check..."
ADDRESS GCP "LOAD-BALANCING DELETE HEALTH-CHECK name=" || health_check_name
IF RC = 0 THEN SAY "✓ Health check deleted"
ELSE SAY "✗ Failed to delete health check"
SAY ""

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Created health check: " || health_check_name
SAY "  • Created backend service: " || backend_service_name
SAY "  • Created URL map: " || url_map_name
SAY "  • Created target HTTP proxy: " || target_proxy_name
SAY "  • Cleaned up all resources"
SAY ""

SAY "Load Balancing Architecture:"
SAY ""
SAY "1. Client Request Flow:"
SAY "   Internet → Global Forwarding Rule → Target Proxy → URL Map → Backend Service → Instance Group → VM Instance"
SAY ""

SAY "2. Components:"
SAY ""
SAY "   Forwarding Rule:"
SAY "     • External IP address"
SAY "     • Port (80 for HTTP, 443 for HTTPS)"
SAY "     • Points to target proxy"
SAY "     • Global or regional"
SAY ""

SAY "   Target Proxy:"
SAY "     • HTTP or HTTPS"
SAY "     • SSL certificate (for HTTPS)"
SAY "     • Points to URL map"
SAY ""

SAY "   URL Map:"
SAY "     • Routing rules"
SAY "     • Host matching"
SAY "     • Path matching"
SAY "     • Points to backend services"
SAY ""

SAY "   Backend Service:"
SAY "     • Load balancing algorithm"
SAY "     • Session affinity"
SAY "     • Health check"
SAY "     • Timeout settings"
SAY "     • CDN enabled/disabled"
SAY "     • Points to backend groups"
SAY ""

SAY "   Backend (Instance Group or NEG):"
SAY "     • Managed instance group (MIG)"
SAY "     • Unmanaged instance group"
SAY "     • Network endpoint group (NEG)"
SAY "     • Balancing mode (RATE, UTILIZATION)"
SAY "     • Capacity settings"
SAY ""

SAY "   Health Check:"
SAY "     • Protocol (HTTP, HTTPS, TCP, SSL)"
SAY "     • Check interval"
SAY "     • Timeout"
SAY "     • Healthy/unhealthy thresholds"
SAY ""

SAY "Load Balancing Types:"
SAY ""
SAY "HTTP(S) Load Balancing (Global):"
SAY "  • Layer 7 (application)"
SAY "  • Content-based routing"
SAY "  • Global anycast IP"
SAY "  • SSL termination"
SAY "  • Cloud CDN integration"
SAY "  • Cloud Armor integration"
SAY "  • Best for: Web applications, APIs"
SAY ""

SAY "TCP/SSL Proxy (Global):"
SAY "  • Layer 4 (transport)"
SAY "  • Non-HTTP(S) TCP traffic"
SAY "  • Global anycast IP"
SAY "  • SSL termination (SSL Proxy)"
SAY "  • Best for: TCP applications"
SAY ""

SAY "Network Load Balancing (Regional):"
SAY "  • Layer 4 (network)"
SAY "  • Pass-through (no proxying)"
SAY "  • Regional IP"
SAY "  • High performance"
SAY "  • Best for: UDP, high-throughput TCP"
SAY ""

SAY "Internal Load Balancing (Regional):"
SAY "  • Private IP address"
SAY "  • Internal VPC traffic only"
SAY "  • Layer 4 or Layer 7"
SAY "  • Best for: Internal microservices"
SAY ""

SAY "Session Affinity:"
SAY ""
SAY "Options:"
SAY "  • NONE: No affinity (default)"
SAY "  • CLIENT_IP: Based on client IP"
SAY "  • GENERATED_COOKIE: HTTP cookie"
SAY "  • CLIENT_IP_PROTO: IP + protocol"
SAY ""

SAY "Load Balancing Algorithms:"
SAY ""
SAY "ROUND_ROBIN (default):"
SAY "  • Distributes requests evenly"
SAY "  • Simple and effective"
SAY ""

SAY "LEAST_REQUEST:"
SAY "  • Sends to backend with fewest active requests"
SAY "  • Good for long-lived connections"
SAY ""

SAY "RATE (for backend balancing):"
SAY "  • Based on requests per second"
SAY "  • Set max RPS per instance"
SAY ""

SAY "UTILIZATION (for backend balancing):"
SAY "  • Based on CPU utilization"
SAY "  • Set target CPU percentage"
SAY ""

SAY "Health Checks:"
SAY ""
SAY "Protocol Options:"
SAY "  • HTTP: GET request to path"
SAY "  • HTTPS: Secure GET request"
SAY "  • TCP: TCP connection"
SAY "  • SSL: SSL handshake"
SAY "  • HTTP/2: HTTP/2 request"
SAY "  • gRPC: gRPC health check protocol"
SAY ""

SAY "Best Practices:"
SAY "  • Check interval: 5-10 seconds"
SAY "  • Timeout: < check interval"
SAY "  • Healthy threshold: 2"
SAY "  • Unhealthy threshold: 2"
SAY "  • Path: Lightweight endpoint (/health)"
SAY ""

SAY "URL Map Routing:"
SAY ""
SAY "Path Matching:"
SAY "  • Exact: /api"
SAY "  • Prefix: /api/*"
SAY "  • Full path: /api/v1/users"
SAY ""

SAY "Host Matching:"
SAY "  • api.example.com → api-backend"
SAY "  • www.example.com → web-backend"
SAY "  • *.example.com → wildcard-backend"
SAY ""

SAY "Advanced Routing:"
SAY "  • Header matching"
SAY "  • Query parameter matching"
SAY "  • Traffic splitting (A/B testing)"
SAY "  • URL redirect"
SAY "  • URL rewrite"
SAY ""

SAY "SSL Certificates:"
SAY ""
SAY "Managed Certificates:"
SAY "  • Google provisions automatically"
SAY "  • Auto-renewal (no expiration)"
SAY "  • Domain validation required"
SAY "  • Support for multiple domains"
SAY "  • Recommended for most use cases"
SAY ""

SAY "Self-Managed Certificates:"
SAY "  • You provide certificate + private key"
SAY "  • Full control"
SAY "  • Manual renewal"
SAY "  • Good for: Custom CAs, wildcards"
SAY ""

SAY "Integration with Other Services:"
SAY ""
SAY "Cloud CDN:"
SAY "  • Enable on backend service"
SAY "  • Cache static content"
SAY "  • Reduce latency"
SAY "  • Lower backend load"
SAY ""

SAY "Cloud Armor:"
SAY "  • Attach security policy to backend"
SAY "  • DDoS protection"
SAY "  • IP allow/deny lists"
SAY "  • Rate limiting"
SAY "  • WAF rules"
SAY ""

SAY "Cloud Monitoring:"
SAY "  • Request count"
SAY "  • Latency percentiles"
SAY "  • Error rates"
SAY "  • Backend health"
SAY ""

SAY "Cloud Logging:"
SAY "  • HTTP request logs"
SAY "  • Enable with --enable-logging"
SAY "  • Sample rate configurable"
SAY ""

SAY "Cost Considerations:"
SAY ""
SAY "Pricing Components:"
SAY "  • Forwarding rules: $0.025/hour (~$18/month)"
SAY "  • Data processing: $0.008-$0.016/GB"
SAY "  • Backend instance costs (Compute Engine)"
SAY "  • Network egress charges"
SAY ""

SAY "Cost Optimization:"
SAY "  • Use autoscaling to match demand"
SAY "  • Enable Cloud CDN to reduce origin traffic"
SAY "  • Use regional load balancing when global not needed"
SAY "  • Optimize health check intervals"
SAY ""

SAY "Common Patterns:"
SAY ""
SAY "1. Simple HTTP Load Balancer:"
SAY "   Health Check → Backend Service → URL Map → Target HTTP Proxy → Forwarding Rule"
SAY ""

SAY "2. HTTPS with Auto Certificate:"
SAY "   Create managed SSL cert → Create HTTPS proxy → Create forwarding rule on 443"
SAY ""

SAY "3. Multi-Region Setup:"
SAY "   Backend Service with backends in multiple regions → Global load balancing"
SAY ""

SAY "4. Microservices Routing:"
SAY "   URL Map with path rules → /api → api-backend, /web → web-backend"
SAY ""

SAY "5. Blue/Green Deployment:"
SAY "   Two backend services (blue, green) → URL map traffic split"
SAY ""

SAY "Troubleshooting:"
SAY ""
SAY "502 Bad Gateway:"
SAY "  • Backend instances not healthy"
SAY "  • Firewall blocking health checks"
SAY "  • Backend not listening on correct port"
SAY ""

SAY "Health Check Failures:"
SAY "  • Check firewall rules (allow 35.191.0.0/16, 130.211.0.0/22)"
SAY "  • Verify backend responds on health check path"
SAY "  • Check timeout settings"
SAY ""

SAY "High Latency:"
SAY "  • Backend performance issues"
SAY "  • Not enough backend capacity"
SAY "  • Enable Cloud CDN"
SAY "  • Use more regions"
SAY ""

SAY "For more information:"
SAY "  https://cloud.google.com/load-balancing/docs"
