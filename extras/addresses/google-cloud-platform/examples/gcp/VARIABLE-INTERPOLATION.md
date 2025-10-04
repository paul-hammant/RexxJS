# Variable Interpolation in Declarative Blocks

## Architecture Overview

Variable interpolation in GCP ADDRESS handlers integrates with RexxJS's global interpolation configuration system.

```
┌──────────────────────────────────────────────────────┐
│ REXX Script                                          │
│ • setInterpolationPattern('handlebars')  # {{var}}   │
│ • env = "production"                                 │
│ • port = 443                                         │
│ • ADDRESS GCP 'LB {{env}}-lb WITH...'               │
└─────────────────────┬────────────────────────────────┘
                      │
                      │ command + variablePool (read-only)
                      ▼
┌──────────────────────────────────────────────────────┐
│ RexxJS Core                                          │
│ • Collects all REXX variables into pool              │
│ • { env: "production", port: 443, ... }             │
│ • Passes to ADDRESS handler (frozen/immutable)       │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│ UnifiedGcpHandler (address-gcp.js)                   │
│ execute(command, variablePool) {                     │
│   this.variablePool = Object.freeze({...varPool})   │
│   // Handlers cannot mutate this pool               │
│ }                                                    │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│ LoadBalancingHandler                                 │
│ • Accesses this.parent.variablePool                  │
│ • Passes to DeclarativeParser(variablePool)          │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│ DeclarativeParser                                    │
│ • Gets current pattern from interpolation-config.js  │
│ • Applies pattern.regex (e.g., /\{\{([^}]*)\}\}/g)  │
│ • Looks up vars in frozen variablePool               │
│ • Replaces {{env}} → "production", {{port}} → 443   │
└──────────────────────────────────────────────────────┘
```

## Key Principles

### 1. **Variable Pool is Read-Only**
```javascript
// In UnifiedGcpHandler
this.variablePool = Object.freeze({ ...variablePool });
```
- Handlers receive a **frozen copy** of variables
- Cannot mutate REXX variable state
- Ensures referential transparency

### 2. **Global Interpolation Pattern**
```rexx
/* Set once for entire RexxJS session */
CALL setInterpolationPattern 'handlebars'  /* {{var}} */
```
- All ADDRESS handlers respect this setting
- Options: `handlebars`, `shell`, `batch`, `doubledollar`, or custom
- Consistent across all declarative blocks

### 3. **Interpolation Happens in Parser**
- RexxJS does **NOT** pre-interpolate (command is in quotes)
- Handler passes raw command text to parser
- Parser applies interpolation using global pattern
- This gives parser control over when/how to interpolate

## Usage Examples

### Basic Interpolation

```rexx
#!/usr/bin/env rexx

/* Variables defined in REXX scope */
env = "production"
region = "us-central1"
port = 443

/* Default pattern is {{var}} */
ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH
backend_service "{{env}}-backend" {
  protocol HTTPS
  health_check { port {{port}} }
}
END'
```

**Result:** Creates `production-lb` with backend `production-backend` on port 443

### Different Interpolation Patterns

```rexx
/* Option 1: Handlebars (default) */
CALL setInterpolationPattern 'handlebars'
ADDRESS GCP '... {{domain}} ...'

/* Option 2: Shell-style */
CALL setInterpolationPattern 'shell'
ADDRESS GCP '... ${domain} ...'

/* Option 3: Batch-style */
CALL setInterpolationPattern 'batch'
ADDRESS GCP '... %domain% ...'

/* Option 4: Custom pattern */
CALL setInterpolationPattern '[[v]]'
ADDRESS GCP '... [[domain]] ...'
```

### Complex Example

```rexx
#!/usr/bin/env rexx

/* Configuration */
CALL setInterpolationPattern 'handlebars'

/* Environment-specific variables */
env = "staging"
regions = '["us-central1", "us-east1"]'
domain = "staging.example.com"
health_check_port = 8080
health_check_path = "/healthz"
backend_timeout = "60s"
ssl_managed = "true"

/* Create multi-region load balancer */
ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH
backend_service "{{env}}-backend" {
  protocol HTTPS
  timeout {{backend_timeout}}

  health_check {
    protocol HTTPS
    port {{health_check_port}}
    request_path "{{health_check_path}}"
    check_interval 10s
    healthy_threshold 2
  }

  cdn {
    enabled true
    cache_mode CACHE_ALL_STATIC
  }
}

url_map "{{env}}-url-map" {
  default_service {{env}}-backend
}

frontend {
  name {{env}}-frontend
  port 443
  protocol HTTPS

  ssl_certificate {
    managed {{ssl_managed}}
    domains ["{{domain}}"]
  }
}
END'
```

### Looping Over Environments

```rexx
#!/usr/bin/env rexx

/* Create load balancers for multiple environments */
environments = "dev staging production"

DO i = 1 TO WORDS(environments)
  env = WORD(environments, i)

  /* Set environment-specific config */
  IF env = "production" THEN DO
    port = 443
    protocol = "HTTPS"
  END
  ELSE DO
    port = 80
    protocol = "HTTP"
  END

  /* Create load balancer with interpolated vars */
  SAY "Creating" env "environment..."
  ADDRESS GCP 'LOAD-BALANCER {{env}}-lb WITH
  backend_service "{{env}}-backend" {
    protocol {{protocol}}
    health_check { port {{port}} }
  }
  END'

  IF RC = 0 THEN SAY "  ✓" env "created"
END
```

## Variable Lookup Rules

### 1. **Direct Lookup**
```rexx
domain = "example.com"
/* {{domain}} → "example.com" */
```

### 2. **Missing Variables**
```rexx
/* If {{unknown}} not in variable pool */
/* Result: {{unknown}} left as-is (not replaced) */
```

### 3. **Variable Scope**
```rexx
/* All REXX variables are global and passed to handler */
domain = "example.com"

CALL subroutine

subroutine:
  subdomain = "api"  /* Also global in REXX */
  ADDRESS GCP '... {{subdomain}}.{{domain}} ...'
  /* Both variables accessible */
  RETURN
```

## Advanced: Nested Structures

Variables can be used anywhere in the declarative block:

```rexx
backend_name = "web-backend"
backend_protocol = "HTTP"
backend_timeout = "30s"
health_port = 80
health_path = "/health"
health_interval = "10s"

ADDRESS GCP 'LOAD-BALANCER my-lb WITH
backend_service "{{backend_name}}" {
  protocol {{backend_protocol}}
  timeout {{backend_timeout}}

  health_check {
    port {{health_port}}
    request_path "{{health_path}}"
    check_interval {{health_interval}}
  }
}
END'
```

## Integration with interpolation-config.js

The DeclarativeParser integrates with RexxJS core:

```javascript
// declarative-parser.js
const interpolationConfig = require('../../../../core/src/interpolation-config.js');

interpolateVariables(str) {
  const pattern = interpolationConfig.getCurrentPattern();

  return str.replace(pattern.regex, (match) => {
    const varName = pattern.extractVar(match);

    if (varName in this.variableStore) {
      return this.variableStore[varName];
    }

    return match; // Variable not found, leave as-is
  });
}
```

## Benefits

### 1. **DRY Principle**
Define configuration once, use in multiple places:
```rexx
domain = "example.com"
/* Use {{domain}} throughout declarative blocks */
```

### 2. **Environment Parity**
Same template, different values:
```rexx
/* dev.config */
env = "dev"
port = 80

/* production.config */
env = "production"
port = 443

/* Same declarative block for both */
```

### 3. **Type Safety**
Variables are validated at REXX level before interpolation

### 4. **Consistency**
All RexxJS code uses the same interpolation pattern

### 5. **Immutability**
Handlers cannot corrupt REXX variable state (read-only pool)

## Future: Conditionals and Loops

While not yet implemented, the declarative syntax could support:

### Conditionals (Future)
```rexx
env = "production"

ADDRESS GCP 'LOAD-BALANCER my-lb WITH
backend_service "my-backend" {
  protocol HTTP

  # Future syntax
  @if {{env}} == "production" {
    cdn { enabled true }
    timeout 60s
  }
  @else {
    timeout 30s
  }
}
END'
```

### Loops (Future)
```rexx
regions = "us-central1 us-east1 us-west1"

ADDRESS GCP 'VPC my-network WITH
# Future syntax
@foreach region in {{regions}} {
  subnet "subnet-{{region}}" {
    region {{region}}
    ip_cidr_range "10.0.{{index}}.0/24"
  }
}
END'
```

## Current Limitations

1. **No conditionals** - Use REXX IF/THEN to compose blocks
2. **No loops in blocks** - Use REXX DO loops to invoke multiple times
3. **No variable mutation** - Handlers cannot write back to REXX variables
4. **String interpolation only** - No expressions like `{{port + 1}}`

These limitations are **by design** - REXX is the scripting language, declarative blocks are data structures.

## References

- RexxJS interpolation-config.js: `/core/src/interpolation-config.js`
- Declarative parser: `/extras/addresses/shared-utils/declarative-parser.js`
- Load balancing handler: `/extras/addresses/provisioning-and-orchestration/gcp-handlers/load-balancing-handler.js`
