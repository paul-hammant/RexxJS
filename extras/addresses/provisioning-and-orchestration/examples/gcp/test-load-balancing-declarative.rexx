#!/usr/bin/env rexx
/* Test Cloud Load Balancing - Declarative Block Syntax
 *
 * Demonstrates the pseudo-declarative DSL for defining a complete
 * HTTP(S) load balancer with all related resources in one block.
 *
 * This is inspired by Ruby/Groovy block syntax for elegant configuration.
 */

SAY "=== Cloud Load Balancing Declarative Test ==="
SAY ""

/* ========================================
 * Traditional Imperative Approach (5 commands)
 * ======================================== */
SAY "Traditional approach requires 5 separate commands:"
SAY "  1. CREATE HEALTH-CHECK"
SAY "  2. CREATE BACKEND-SERVICE"
SAY "  3. CREATE URL-MAP"
SAY "  4. CREATE TARGET-HTTP-PROXY"
SAY "  5. CREATE FORWARDING-RULE"
SAY ""

/* ========================================
 * NEW: Declarative Block Approach (1 command)
 * ======================================== */
SAY "Declarative approach: Define entire load balancer in one block"
SAY ""

/* Using REXX HEREDOC syntax for the declarative block */
lb_config = '
backend_service "web-backend" {
  protocol HTTP
  port_name http
  timeout 30s

  health_check {
    protocol HTTP
    port 80
    request_path /health
    check_interval 10s
    timeout 5s
    healthy_threshold 2
    unhealthy_threshold 3
  }

  backend {
    instance_group projects/my-project/zones/us-central1-a/instanceGroups/web-servers
    balancing_mode UTILIZATION
    max_utilization 0.8
  }

  cdn {
    enabled true
    cache_mode CACHE_ALL_STATIC
  }
}

url_map "web-url-map" {
  default_service web-backend

  host_rule {
    hosts ["example.com", "*.example.com"]
    path_matcher main
  }

  path_matcher "main" {
    default_service web-backend

    path_rule {
      paths ["/api/*", "/v1/*"]
      service api-backend
    }

    path_rule {
      paths ["/static/*"]
      service static-backend
    }
  }
}

frontend {
  name web-frontend
  ip_address 34.120.45.67
  port 80
  protocol HTTP
  target_proxy http
}
'

/* Execute the declarative load balancer creation */
SAY "Creating load balancer with declarative block syntax..."
SAY ""

ADDRESS GCP "LOAD-BALANCER web-lb WITH" || lb_config || "END"

IF RC = 0 THEN DO
  SAY "✓ Load balancer created successfully"
  SAY ""
  SAY "Resources created:"
  SAY "  • Health check: web-backend-health-check"
  SAY "  • Backend service: web-backend"
  SAY "  • URL map: web-url-map"
  SAY "  • Target HTTP proxy: web-lb-proxy"
  SAY "  • Forwarding rule: web-frontend"
END
ELSE DO
  SAY "✗ Failed to create load balancer"
  EXIT RC
END

SAY ""
SAY "=== Alternative: Inline Heredoc Syntax ==="
SAY ""

/* Alternative syntax: Inline HEREDOC without variable */
ADDRESS GCP 'LOAD-BALANCER api-lb WITH
backend_service "api-backend" {
  protocol HTTPS
  port_name https

  health_check {
    protocol HTTPS
    port 443
    request_path /health
  }

  backend {
    instance_group projects/my-project/zones/us-west1-a/instanceGroups/api-servers
    balancing_mode RATE
    max_rate_per_instance 100
  }
}

frontend {
  name api-frontend
  port 443
  protocol HTTPS

  ssl_certificate {
    managed true
    domains ["api.example.com"]
  }
}
END'

IF RC = 0 THEN DO
  SAY "✓ API load balancer created"
END

SAY ""
SAY "=== Comparison: Lines of Code ==="
SAY ""
SAY "Traditional imperative approach:"
SAY "  ~25-30 lines (5 commands + parameters)"
SAY ""
SAY "Declarative block approach:"
SAY "  ~20-25 lines (1 command, nested structure)"
SAY ""
SAY "Benefits:"
SAY "  ✓ Single atomic operation (all-or-nothing)"
SAY "  ✓ Clear hierarchical structure"
SAY "  ✓ Related resources grouped together"
SAY "  ✓ More readable and maintainable"
SAY "  ✓ Reduced command overhead"
SAY ""

/* ========================================
 * Show what gets generated behind the scenes
 * ======================================== */
SAY "=== Behind the Scenes ==="
SAY ""
SAY "The declarative block is parsed and converted to:"
SAY "  1. Intermediate YAML/JSON structure"
SAY "  2. Written to temporary file"
SAY "  3. Passed to: gcloud compute forwarding-rules import --source=temp.yaml"
SAY "  4. Temp file is cleaned up"
SAY ""

/* ========================================
 * Cleanup example
 * ======================================== */
SAY "To delete (still uses simple syntax):"
SAY "  ADDRESS GCP \"LOAD-BALANCING DELETE FORWARDING-RULE name=web-frontend\""
SAY "  ADDRESS GCP \"LOAD-BALANCING DELETE URL-MAP name=web-url-map\""
SAY "  ADDRESS GCP \"LOAD-BALANCING DELETE BACKEND-SERVICE name=web-backend\""
SAY ""

SAY "=== Test Complete ==="
