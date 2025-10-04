# Declarative Block Syntax for GCP Handlers

Inspired by Ruby/Groovy block-based DSLs, RexxJS now supports pseudo-declarative syntax for complex GCP resource configurations.

## Philosophy

The declarative syntax follows these principles:

1. **Hierarchical Structure** - Related resources are nested naturally
2. **Single Atomic Operation** - All-or-nothing semantics with rollback
3. **Self-Documenting** - Config structure matches conceptual model
4. **Reduced Boilerplate** - Define intent, not implementation steps

## Syntax Overview

```rexx
ADDRESS GCP 'SERVICE-NAME resource-name WITH
  property value

  nested_block "name" {
    property value

    deeper_block {
      property value
    }
  }
END'
```

## Key Features

### 1. Block Delimiters
- `WITH ... END` - Outer delimiter for declarative block
- `{ ... }` - Inner delimiters for nested structures

### 2. Property Syntax
```
property value          # Simple assignment
property "quoted value" # Quoted strings
property 123           # Numbers
property true          # Booleans
property [item1, item2] # Arrays
```

### 3. Named Blocks
```
backend_service "web-backend" {
  protocol HTTP
}
```

### 4. Anonymous Blocks
```
health_check {
  port 80
}
```

### 5. Comments
```
# This is a comment
// This is also a comment
```

## Load Balancer Examples

### Simple HTTP Load Balancer

```rexx
ADDRESS GCP 'LOAD-BALANCER web-lb WITH
backend_service "web-backend" {
  protocol HTTP

  health_check {
    port 80
    request_path /health
  }
}

frontend {
  port 80
}
END'
```

### HTTPS with Managed SSL

```rexx
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
    domains ["api.example.com"]
  }
}
END'
```

### Advanced Multi-Backend with Path Routing

```rexx
ADDRESS GCP 'LOAD-BALANCER prod-lb WITH
backend_service "web-backend" {
  protocol HTTP
  timeout 30s

  health_check {
    port 80
    request_path /health
    check_interval 10s
  }

  backend {
    instance_group projects/my-project/zones/us-central1-a/instanceGroups/web-servers
    balancing_mode UTILIZATION
    max_utilization 0.8
  }

  cdn {
    enabled true
  }
}

backend_service "api-backend" {
  protocol HTTPS

  health_check {
    protocol HTTPS
    port 443
  }

  backend {
    instance_group projects/my-project/zones/us-central1-a/instanceGroups/api-servers
    balancing_mode RATE
    max_rate_per_instance 100
  }
}

url_map "prod-url-map" {
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
  }
}

frontend {
  port 443
  protocol HTTPS

  ssl_certificate {
    managed true
    domains ["example.com", "www.example.com"]
  }
}
END'
```

## Behind the Scenes

When you use declarative syntax, RexxJS:

1. **Parses** the block into a structured object tree
2. **Validates** the configuration
3. **Orders** resource creation to respect dependencies
4. **Executes** gcloud commands in sequence
5. **Tracks** created resources for rollback
6. **Rolls back** on failure to maintain consistency

## Comparison: Imperative vs Declarative

### Imperative (5 commands, ~30 lines)

```rexx
ADDRESS GCP 'LOAD-BALANCING CREATE HEALTH-CHECK name=web-hc protocol=HTTP port=80'
ADDRESS GCP 'LOAD-BALANCING CREATE BACKEND-SERVICE name=web-backend protocol=HTTP health-check=web-hc'
ADDRESS GCP 'LOAD-BALANCING CREATE URL-MAP name=web-map default-service=web-backend'
ADDRESS GCP 'LOAD-BALANCING CREATE TARGET-HTTP-PROXY name=web-proxy url-map=web-map'
ADDRESS GCP 'LOAD-BALANCING CREATE FORWARDING-RULE name=web-rule target-http-proxy=web-proxy ports=80'
```

### Declarative (1 command, ~12 lines)

```rexx
ADDRESS GCP 'LOAD-BALANCER web-lb WITH
backend_service "web-backend" {
  protocol HTTP
  health_check { port 80 }
}
frontend { port 80 }
END'
```

## Benefits

### Code Quality
- ✓ **More Readable** - Natural hierarchy matches mental model
- ✓ **Less Verbose** - ~60% fewer lines for complex configs
- ✓ **Self-Documenting** - Structure explains relationships
- ✓ **Type Safe** - Parser validates structure

### Operations
- ✓ **Atomic** - All resources created or none
- ✓ **Rollback** - Automatic cleanup on failure
- ✓ **Idempotent** - Can be safely re-run
- ✓ **Traceable** - Single operation in logs

### Maintenance
- ✓ **Easier Updates** - Change in one place
- ✓ **Version Control** - Clear diffs
- ✓ **Reusable** - Template for similar configs
- ✓ **Testable** - Parser can validate without executing

## When to Use Declarative Syntax

**Use declarative for:**
- Complex multi-resource operations (load balancers, VPCs with firewall rules)
- Related resources that form a logical unit
- Configuration that benefits from hierarchical structure
- Operations where atomic semantics are important

**Use imperative for:**
- Single resource operations (create one bucket)
- List/describe/delete operations
- Simple updates
- Scripts that need fine-grained control

## Supported Services

Currently implemented:
- ✓ **Load Balancing** - Full support with health checks, backends, SSL

Planned:
- ⏳ **Cloud Armor** - Security policies with rules
- ⏳ **GKE** - Cluster configuration with node pools
- ⏳ **VPC** - Networks with subnets and firewall rules

## Implementation Details

The declarative parser is implemented in:
- `shared-utils/declarative-parser.js` - Generic block parser
- `gcp-handlers/load-balancing-handler.js` - Load balancer implementation

Parser features:
- Recursive descent parser
- Supports nested blocks
- Handles quoted strings, numbers, booleans, arrays
- Comment stripping
- Error recovery with line numbers

## Future Enhancements

Potential additions:
- Variable substitution: `${var}`
- Conditionals: `if { condition } { ... }`
- Loops: `for each item in list { ... }`
- Imports: `import "common-config.rexx"`
- Validation rules: `validate { required port }`

## References

This syntax is inspired by:
- **Ruby** - Blocks with `do...end` and `{ }`
- **Groovy** - Gradle build scripts
- **HCL** - Terraform configuration language
- **YAML** - Structured data format

As discussed in: https://paulhammant.com/2024/02/14/that-ruby-and-groovy-language-feature/
