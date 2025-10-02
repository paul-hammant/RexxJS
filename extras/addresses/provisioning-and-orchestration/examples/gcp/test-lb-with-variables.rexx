#!/usr/bin/env rexx
/* Load Balancer with Variable Interpolation
 *
 * Demonstrates using RexxJS's global interpolation pattern ({{var}} by default)
 * within declarative blocks for GCP resources.
 */

SAY "=== Load Balancer with Variable Interpolation ==="
SAY ""

/* Set interpolation pattern (optional - defaults to {{var}}) */
/* You can also use: shell (${var}), batch (%var%), etc. */
CALL setInterpolationPattern 'handlebars'  /* {{var}} */

/* Define configuration variables */
env = "production"
region = "us-central1"
domain = "example.com"
health_port = 80
health_path = "/health"
backend_protocol = "HTTP"
backend_timeout = "30s"
ssl_domains = '["example.com", "www.example.com"]'

SAY "Configuration:"
SAY "  Environment: " || env
SAY "  Region: " || region
SAY "  Domain: " || domain
SAY "  Health check: " || backend_protocol || ":" || health_port || health_path
SAY ""

/* Create load balancer with interpolated variables */
ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH
backend_service "{{env}}-backend" {
  protocol {{backend_protocol}}
  timeout {{backend_timeout}}

  health_check {
    protocol {{backend_protocol}}
    port {{health_port}}
    request_path "{{health_path}}"
    check_interval 10s
  }

  cdn {
    enabled true
  }
}

frontend {
  name {{env}}-frontend
  port 443
  protocol HTTPS

  ssl_certificate {
    managed true
    domains {{ssl_domains}}
  }
}
END'

IF RC = 0 THEN DO
  SAY "✓ Load balancer created with interpolated variables:"
  SAY "  • " || env || "-backend (protocol: " || backend_protocol || ")"
  SAY "  • " || env || "-lb-health-check (port: " || health_port || ")"
  SAY "  • " || env || "-frontend (SSL for " || domain || ")"
END
ELSE DO
  SAY "✗ Failed to create load balancer"
  EXIT RC
END

SAY ""
SAY "=== Example: Different Environments ==="
SAY ""

/* Staging environment */
env = "staging"
domain = "staging.example.com"
health_port = 8080

SAY "Creating staging environment..."
ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH
backend_service "{{env}}-backend" {
  protocol HTTP
  health_check { port {{health_port}} }
}
frontend { port 80 }
END'

IF RC = 0 THEN SAY "✓ Staging load balancer created"

SAY ""
SAY "=== Benefits of Variable Interpolation ==="
SAY ""
SAY "1. **DRY Principle**: Define values once, use many times"
SAY "2. **Environment Parity**: Same template, different values"
SAY "3. **Type Safety**: Variables validated at REXX level"
SAY "4. **Readable**: {{var}} syntax is clear and standard"
SAY "5. **Flexible**: Can switch interpolation pattern globally"
SAY ""
SAY "Available patterns:"
SAY "  • handlebars: {{var}}  (default)"
SAY "  • shell: ${var}"
SAY "  • batch: %var%"
SAY "  • doubledollar: $$var$$"
SAY "  • custom: setInterpolationPattern('[[v]]')"
