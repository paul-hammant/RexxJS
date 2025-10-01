#!/usr/bin/env rexx
/* Test Cloud CDN
 *
 * This script demonstrates Cloud CDN operations:
 *   - Enabling CDN on backend services
 *   - Configuring cache settings (TTL, cache modes)
 *   - Cache invalidation
 *   - Cache key policies
 *   - Getting CDN status
 *
 * Required APIs:
 *   - compute.googleapis.com
 *
 * Required Permissions:
 *   - compute.backendServices.create
 *   - compute.backendServices.get
 *   - compute.backendServices.update
 *   - compute.urlMaps.create
 *   - compute.urlMaps.invalidateCache
 *
 * NOTE: This test demonstrates CDN configuration but requires
 *       a backend service to be created first. The test creates
 *       the necessary components and cleans them up.
 */

SAY "=== Cloud CDN Test ==="
SAY ""

/* Configuration */
LET health_check_name = "rexxjs-test-cdn-hc-" || WORD(DATE('S'), 1)
LET backend_service_name = "rexxjs-test-cdn-backend-" || WORD(DATE('S'), 1)
LET url_map_name = "rexxjs-test-cdn-urlmap-" || WORD(DATE('S'), 1)

SAY "Configuration:"
SAY "  Health Check: " || health_check_name
SAY "  Backend Service: " || backend_service_name
SAY "  URL Map: " || url_map_name
SAY ""

SAY "About Cloud CDN:"
SAY "  Google's globally distributed edge caching"
SAY "  Reduces latency and backend load"
SAY "  Integrated with Cloud Load Balancing"
SAY "  Pay only for cache egress"
SAY ""

/* ========================================
 * Step 1: Create health check and backend service
 * ======================================== */
SAY "Step 1: Setting up backend service for CDN..."
SAY ""

SAY "Creating health check..."
ADDRESS GCP "LOAD-BALANCING CREATE HEALTH-CHECK name=" || health_check_name || " protocol=HTTP port=80"

IF RC \= 0 THEN DO
  SAY "✗ Failed to create health check"
  EXIT RC
END

SAY "Creating backend service..."
ADDRESS GCP "LOAD-BALANCING CREATE BACKEND-SERVICE name=" || backend_service_name || " protocol=HTTP health-check=" || health_check_name

IF RC \= 0 THEN DO
  SAY "✗ Failed to create backend service"
  EXIT RC
END

SAY "✓ Backend service created"
SAY ""

/* ========================================
 * Step 2: Enable Cloud CDN
 * ======================================== */
SAY "Step 2: Enabling Cloud CDN on backend service..."
SAY ""

ADDRESS GCP "CDN ENABLE backend-service=" || backend_service_name || " cache-mode=CACHE_ALL_STATIC default-ttl=3600 max-ttl=86400 client-ttl=3600"

IF RC = 0 THEN DO
  SAY "✓ Cloud CDN enabled on " || backend_service_name
  SAY ""
  SAY "CDN Configuration:"
  SAY "  • Cache mode: CACHE_ALL_STATIC"
  SAY "  • Default TTL: 3600s (1 hour)"
  SAY "  • Max TTL: 86400s (24 hours)"
  SAY "  • Client TTL: 3600s (1 hour)"
  SAY ""
END
ELSE DO
  SAY "✗ Failed to enable CDN (RC=" || RC || ")"
  SAY ""
END

/* ========================================
 * Step 3: Get CDN status
 * ======================================== */
SAY "Step 3: Getting CDN status..."
SAY ""

ADDRESS GCP "CDN GET STATUS backend-service=" || backend_service_name

IF RC = 0 THEN DO
  SAY "✓ CDN status retrieved"
  SAY ""
END

/* ========================================
 * Step 4: Update cache key policy
 * ======================================== */
SAY "Step 4: Updating cache key policy..."
SAY ""

SAY "Configuring cache keys to include query strings..."
ADDRESS GCP "CDN UPDATE CACHE-KEY-POLICY backend-service=" || backend_service_name || " cache-key-include-protocol=true cache-key-include-host=true cache-key-include-query-string=true"

IF RC = 0 THEN DO
  SAY "✓ Cache key policy updated"
  SAY ""
  SAY "Cache key now includes:"
  SAY "  • Protocol (HTTP/HTTPS)"
  SAY "  • Host header"
  SAY "  • Query string"
  SAY ""
  SAY "This means example.com/page?v=1 and example.com/page?v=2"
  SAY "will be cached separately."
  SAY ""
END

/* ========================================
 * Step 5: Demonstrate cache invalidation
 * ======================================== */
SAY "Step 5: Cache invalidation (demonstration)..."
SAY ""

SAY "First, create URL map (needed for invalidation)..."
ADDRESS GCP "LOAD-BALANCING CREATE URL-MAP name=" || url_map_name || " default-service=" || backend_service_name

IF RC = 0 THEN DO
  SAY "✓ URL map created"
  SAY ""

  SAY "To invalidate cache for specific paths:"
  SAY "  CDN INVALIDATE url-map=" || url_map_name || " path=/images/*"
  SAY ""
  SAY "To invalidate all cached content:"
  SAY "  CDN INVALIDATE url-map=" || url_map_name || " path=/*"
  SAY ""
  SAY "To invalidate for specific host:"
  SAY "  CDN INVALIDATE url-map=" || url_map_name || " path=/images/* host=example.com"
  SAY ""
  SAY "Note: Invalidation typically completes in seconds to minutes"
  SAY ""
END

/* ========================================
 * Step 6: Demonstrate advanced CDN features
 * ======================================== */
SAY "Step 6: Advanced CDN features..."
SAY ""

SAY "Cache Modes:"
SAY ""
SAY "CACHE_ALL_STATIC (recommended):"
SAY "  • Caches static content automatically"
SAY "  • Respects Cache-Control headers from origin"
SAY "  • Default mode"
SAY ""

SAY "USE_ORIGIN_HEADERS:"
SAY "  • Only caches if origin sends Cache-Control or Expires"
SAY "  • More control from origin"
SAY ""

SAY "FORCE_CACHE_ALL:"
SAY "  • Caches all content regardless of headers"
SAY "  • Ignores Cache-Control: private, no-cache, no-store"
SAY "  • Use with caution!"
SAY ""

SAY "TTL Settings:"
SAY ""
SAY "Default TTL:"
SAY "  • Used when origin doesn't specify TTL"
SAY "  • Falls back to Cloud CDN default (3600s)"
SAY ""

SAY "Max TTL:"
SAY "  • Maximum time content stays in cache"
SAY "  • Overrides longer Cache-Control max-age"
SAY ""

SAY "Client TTL:"
SAY "  • TTL sent to client browsers"
SAY "  • Separate from edge cache TTL"
SAY ""

SAY "Negative Caching:"
SAY "  • Cache 404, 410 responses"
SAY "  • Reduce origin load for missing content"
SAY "  • Configure with --negative-caching-policy"
SAY ""

/* ========================================
 * Step 7: Disable CDN
 * ======================================== */
SAY "Step 7: Disabling Cloud CDN..."
SAY ""

ADDRESS GCP "CDN DISABLE backend-service=" || backend_service_name

IF RC = 0 THEN DO
  SAY "✓ Cloud CDN disabled"
  SAY ""
END

/* ========================================
 * Step 8: Cleanup
 * ======================================== */
SAY "Step 8: Cleaning up..."
SAY ""

SAY "Deleting URL map..."
ADDRESS GCP "LOAD-BALANCING DELETE URL-MAP name=" || url_map_name
IF RC = 0 THEN SAY "✓ URL map deleted"
SAY ""

SAY "Deleting backend service..."
ADDRESS GCP "LOAD-BALANCING DELETE BACKEND-SERVICE name=" || backend_service_name
IF RC = 0 THEN SAY "✓ Backend service deleted"
SAY ""

SAY "Deleting health check..."
ADDRESS GCP "LOAD-BALANCING DELETE HEALTH-CHECK name=" || health_check_name
IF RC = 0 THEN SAY "✓ Health check deleted"
SAY ""

/* ========================================
 * Summary
 * ======================================== */
SAY "=== Test Complete ==="
SAY ""
SAY "Summary:"
SAY "  • Enabled Cloud CDN on backend service"
SAY "  • Configured cache modes and TTL"
SAY "  • Updated cache key policy"
SAY "  • Demonstrated cache invalidation"
SAY "  • Cleaned up all resources"
SAY ""

SAY "Cloud CDN Concepts:"
SAY ""
SAY "How It Works:"
SAY "  1. Client requests content"
SAY "  2. Request hits nearest Google edge location"
SAY "  3. If cached: Served from edge (cache hit)"
SAY "  4. If not cached: Fetched from origin (cache miss)"
SAY "  5. Response cached at edge for future requests"
SAY ""

SAY "Cache Key Components:"
SAY ""
SAY "Default Cache Key:"
SAY "  • Protocol (HTTP or HTTPS)"
SAY "  • Host header"
SAY "  • URL path"
SAY ""

SAY "Optional Components:"
SAY "  • Query string (all or whitelist)"
SAY "  • Custom headers"
SAY ""

SAY "Example Cache Keys:"
SAY "  Without query string:"
SAY "    https://example.com/image.jpg?v=1 → Same key as"
SAY "    https://example.com/image.jpg?v=2"
SAY ""
SAY "  With query string:"
SAY "    https://example.com/image.jpg?v=1 → Different key from"
SAY "    https://example.com/image.jpg?v=2"
SAY ""

SAY "Cache Control Headers:"
SAY ""
SAY "From Origin:"
SAY "  Cache-Control: public, max-age=3600"
SAY "    • Cacheable by CDN and browsers"
SAY "    • Cache for 1 hour"
SAY ""
SAY "  Cache-Control: private"
SAY "    • Not cacheable by CDN (user-specific)"
SAY "    • Cacheable by browser only"
SAY ""
SAY "  Cache-Control: no-cache"
SAY "    • Revalidate with origin before serving"
SAY ""
SAY "  Cache-Control: no-store"
SAY "    • Do not cache at all"
SAY ""

SAY "Cache Invalidation:"
SAY ""
SAY "When to Invalidate:"
SAY "  • Content updated at origin"
SAY "  • Emergency: Remove incorrect content"
SAY "  • Deployment: Clear old versions"
SAY ""

SAY "Invalidation Methods:"
SAY "  • Path-based: /images/logo.png"
SAY "  • Wildcard: /images/*"
SAY "  • Full cache: /*"
SAY ""

SAY "Invalidation Limits:"
SAY "  • 2000 invalidations per minute"
SAY "  • Usually completes in < 1 minute"
SAY "  • Async operation"
SAY ""

SAY "Best Practices:"
SAY ""
SAY "1. Use versioned URLs instead of invalidation:"
SAY "   /assets/app.js?v=123 → /assets/app.js?v=124"
SAY "   • Faster than invalidation"
SAY "   • No race conditions"
SAY "   • Old versions still cached"
SAY ""

SAY "2. Set appropriate TTLs:"
SAY "   • Static assets (images, CSS, JS): 1 day - 1 year"
SAY "   • Dynamic content: 1 minute - 1 hour"
SAY "   • API responses: 0 - 5 minutes"
SAY ""

SAY "3. Use Cache-Control from origin:"
SAY "   • More granular control"
SAY "   • Per-object TTL"
SAY "   • Respect user privacy (private)"
SAY ""

SAY "4. Enable compression:"
SAY "   • Automatic gzip/brotli compression"
SAY "   • Smaller payloads"
SAY "   • Faster delivery"
SAY ""

SAY "5. Monitor cache hit ratio:"
SAY "   • Target: 80%+ for static content"
SAY "   • Low hit ratio indicates:"
SAY "     - Too many unique URLs"
SAY "     - TTL too short"
SAY "     - Cache key too granular"
SAY ""

SAY "Content Types:"
SAY ""
SAY "Good for CDN:"
SAY "  • Images (JPEG, PNG, WebP)"
SAY "  • Videos (MP4, WebM)"
SAY "  • Static files (CSS, JS, fonts)"
SAY "  • Documents (PDF, ZIP)"
SAY "  • API responses (with short TTL)"
SAY ""

SAY "Not good for CDN:"
SAY "  • User-specific content"
SAY "  • Constantly changing data"
SAY "  • Large files with low reuse"
SAY "  • Content requiring real-time updates"
SAY ""

SAY "Performance Optimization:"
SAY ""
SAY "Maximize Cache Hit Ratio:"
SAY "  • Minimize URL variations"
SAY "  • Normalize query parameters"
SAY "  • Use consistent hostnames"
SAY "  • Avoid unnecessary cookies"
SAY ""

SAY "Optimize TTL:"
SAY "  • Longer TTL = better performance, less fresh"
SAY "  • Shorter TTL = more fresh, worse performance"
SAY "  • Balance based on content type"
SAY ""

SAY "Use Compression:"
SAY "  • Enable at origin or CDN"
SAY "  • Up to 90% size reduction"
SAY "  • Especially effective for text (HTML, CSS, JS, JSON)"
SAY ""

SAY "Monitoring and Logging:"
SAY ""
SAY "Key Metrics:"
SAY "  • Cache hit ratio (%)"
SAY "  • Cache fill bytes"
SAY "  • Request count"
SAY "  • Latency (origin vs cache)"
SAY "  • Error rates"
SAY ""

SAY "Cloud Monitoring Metrics:"
SAY "  • loadbalancing.googleapis.com/https/request_count"
SAY "  • loadbalancing.googleapis.com/https/backend_latencies"
SAY "  • CDN cache hit ratio"
SAY ""

SAY "Logging:"
SAY "  • Enable HTTP request logging on load balancer"
SAY "  • Shows cache hit/miss status"
SAY "  • Logs in Cloud Logging"
SAY ""

SAY "Cost Optimization:"
SAY ""
SAY "Pricing:"
SAY "  • Cache fill (origin → edge): Standard egress rates"
SAY "  • Cache egress (edge → client): CDN egress rates"
SAY "  • CDN egress is cheaper than origin egress"
SAY ""

SAY "Egress Pricing (per GB):"
SAY "  • Same region: Free"
SAY "  • Cross-region: $0.01-$0.02"
SAY "  • Internet (CDN): $0.02-$0.15 (varies by location)"
SAY "  • Internet (origin): $0.08-$0.23"
SAY ""

SAY "Cost Savings:"
SAY "  • Higher cache hit ratio = more savings"
SAY "  • 90% hit ratio = 90% of traffic served at CDN rates"
SAY "  • Can reduce egress costs by 50-80%"
SAY ""

SAY "Troubleshooting:"
SAY ""
SAY "Low Cache Hit Ratio:"
SAY "  • Check cache key policy"
SAY "  • Review Cache-Control headers"
SAY "  • Look for URL variations"
SAY "  • Increase TTL if appropriate"
SAY ""

SAY "Content Not Caching:"
SAY "  • Origin sending Cache-Control: no-cache/no-store"
SAY "  • Origin sending Set-Cookie header"
SAY "  • Requests with cookies or Authorization header"
SAY "  • POST/PUT/DELETE requests (not cacheable)"
SAY ""

SAY "Stale Content:"
SAY "  • Invalidate specific paths"
SAY "  • Reduce TTL for frequently updated content"
SAY "  • Use versioned URLs"
SAY ""

SAY "Integration Patterns:"
SAY ""
SAY "1. Static Website:"
SAY "   Cloud Storage bucket → Load Balancer → CDN enabled"
SAY ""

SAY "2. API with CDN:"
SAY "   Compute Engine/Cloud Run → Load Balancer → CDN enabled"
SAY "   • Short TTL on API responses (30s - 5min)"
SAY "   • Cache key includes query parameters"
SAY ""

SAY "3. Media Streaming:"
SAY "   Cloud Storage (videos) → Load Balancer → CDN enabled"
SAY "   • Long TTL (days/weeks)"
SAY "   • Signed URLs for access control"
SAY ""

SAY "4. Dynamic + Static:"
SAY "   Two backends: dynamic (no CDN), static (CDN)"
SAY "   URL map routes: /api → dynamic, /assets → static"
SAY ""

SAY "For more information:"
SAY "  https://cloud.google.com/cdn/docs"
