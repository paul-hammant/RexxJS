#!/usr/bin/env rexx
/* Advanced Load Balancer Declarative Example
 *
 * Shows the full power of declarative syntax with:
 * - Multiple backends
 * - Path-based routing
 * - CDN configuration
 * - Complex health checks
 */

SAY "=== Advanced Multi-Backend Load Balancer ==="
SAY ""

/* This single declarative block replaces ~15 imperative commands */
ADDRESS GCP 'LOAD-BALANCER production-lb WITH
# Backend for web traffic
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

# Backend for API traffic
backend_service "api-backend" {
  protocol HTTPS
  port_name https
  timeout 60s

  health_check {
    protocol HTTPS
    port 443
    request_path /api/health
  }

  backend {
    instance_group projects/my-project/zones/us-central1-a/instanceGroups/api-servers
    balancing_mode RATE
    max_rate_per_instance 100
  }
}

# Backend for static content
backend_service "static-backend" {
  protocol HTTP

  backend {
    bucket_name my-static-content
  }

  cdn {
    enabled true
    cache_mode FORCE_CACHE_ALL
  }
}

# URL routing
url_map "production-url-map" {
  default_service web-backend

  host_rule {
    hosts ["example.com", "*.example.com"]
    path_matcher main
  }

  path_matcher "main" {
    default_service web-backend

    # Route API calls to API backend
    path_rule {
      paths ["/api/*", "/v1/*", "/v2/*"]
      service api-backend
    }

    # Route static content to storage backend
    path_rule {
      paths ["/static/*", "/assets/*", "/images/*"]
      service static-backend
    }
  }
}

# Frontend configuration with SSL
frontend {
  name production-frontend
  port 443
  protocol HTTPS

  ssl_certificate {
    managed true
    domains ["example.com", "www.example.com", "api.example.com"]
  }
}
END'

IF RC = 0 THEN DO
  SAY "✓ Advanced load balancer created successfully"
  SAY ""
  SAY "Architecture:"
  SAY "  • 3 backend services (web, api, static)"
  SAY "  • 3 health checks"
  SAY "  • 1 URL map with path-based routing"
  SAY "  • 1 HTTPS frontend with managed SSL"
  SAY "  • CDN enabled for web + static content"
  SAY ""
  SAY "Traffic routing:"
  SAY "  example.com/           → web-backend"
  SAY "  example.com/api/*      → api-backend"
  SAY "  example.com/static/*   → static-backend (GCS)"
END
ELSE DO
  SAY "✗ Failed to create load balancer"
  SAY "RC =" RC
END

SAY ""
SAY "=== What Happens Behind the Scenes ==="
SAY ""
SAY "1. Parse declarative block → structured config"
SAY "2. Create resources in correct order:"
SAY "   a. Health checks (3x)"
SAY "   b. Backend services (3x) with health checks attached"
SAY "   c. Add backends to services"
SAY "   d. Create URL map with routing rules"
SAY "   e. Create managed SSL certificate"
SAY "   f. Create target HTTPS proxy"
SAY "   g. Create forwarding rule"
SAY "3. If any step fails, rollback all created resources"
SAY ""

SAY "Equivalent imperative code would be:"
SAY "  ~15-20 separate ADDRESS GCP commands"
SAY "  ~40-50 lines of code"
SAY "  Manual ordering and dependency management"
SAY ""

SAY "Declarative version:"
SAY "  1 ADDRESS GCP command"
SAY "  ~25 lines of structured config"
SAY "  Automatic ordering and dependency resolution"
SAY "  Atomic operation with rollback on failure"
