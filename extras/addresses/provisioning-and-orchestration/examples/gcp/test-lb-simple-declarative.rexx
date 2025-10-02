#!/usr/bin/env rexx
/* Simple Load Balancer Declarative Example
 *
 * Shows the elegant HEREDOC-style syntax for defining a load balancer
 */

SAY "=== Simple Load Balancer Example ==="
SAY ""

/* Traditional imperative approach - 5 commands */
SAY "Old way (5 separate commands):"
SAY '  ADDRESS GCP "LOAD-BALANCING CREATE HEALTH-CHECK ..."'
SAY '  ADDRESS GCP "LOAD-BALANCING CREATE BACKEND-SERVICE ..."'
SAY '  ADDRESS GCP "LOAD-BALANCING CREATE URL-MAP ..."'
SAY '  ADDRESS GCP "LOAD-BALANCING CREATE TARGET-HTTP-PROXY ..."'
SAY '  ADDRESS GCP "LOAD-BALANCING CREATE FORWARDING-RULE ..."'
SAY ""

/* New declarative approach - 1 command with HEREDOC block */
SAY "New way (1 command with declarative block):"
SAY ""

ADDRESS GCP 'LOAD-BALANCER web-lb WITH
backend_service "web-backend" {
  protocol HTTP
  timeout 30s

  health_check {
    port 80
    request_path /health
    check_interval 10s
  }
}

frontend {
  port 80
}
END'

IF RC = 0 THEN DO
  SAY "✓ Load balancer created with declarative syntax"
  SAY ""
  SAY "Resources created:"
  SAY "  • web-lb-health-check"
  SAY "  • web-backend"
  SAY "  • web-lb-url-map"
  SAY "  • web-lb-proxy"
  SAY "  • web-lb-rule"
END

SAY ""
SAY "=== HTTPS Example with SSL ==="
SAY ""

ADDRESS GCP 'LOAD-BALANCER api-lb WITH
backend_service "api-backend" {
  protocol HTTPS

  health_check {
    protocol HTTPS
    port 443
  }
}

frontend {
  port 443
  protocol HTTPS

  ssl_certificate {
    managed true
    domains ["api.example.com", "www.example.com"]
  }
}
END'

IF RC = 0 THEN SAY "✓ HTTPS load balancer created"

SAY ""
SAY "Key benefits:"
SAY "  • All related resources defined together"
SAY "  • Clear hierarchical structure"
SAY "  • Single atomic operation"
SAY "  • More readable than 5+ separate commands"
