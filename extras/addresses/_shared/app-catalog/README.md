# Unified Application Deployment Catalog

A shared, parameterized solution for deploying reference applications across **8 different container/VM environments**.

## Supported Environments

1. **Docker** - Container runtime
2. **Podman** - Rootless container runtime
3. **LXD** - System containers (fast CoW cloning)
4. **QEMU** - Full VMs
5. **systemd-nspawn** - Lightweight containers
6. **Firecracker** - MicroVMs (serverless)
7. **VirtualBox** - Desktop VMs
8. **Proxmox** - Enterprise LXC containers

## Reference Applications

### Currently Available

| App ID | Name | Language | Runtime | Port | Description |
|--------|------|----------|---------|------|-------------|
| `sinatra-hello` | Sinatra Hello World | Ruby | Ruby + Sinatra | 4567 | Minimal web framework |
| `express-hello` | Express.js Hello | JavaScript | Node.js + Express | 3000 | Node web framework |
| `flask-hello` | Flask Hello | Python | Python3 + Flask | 5000 | Python web framework |

### Coming Soon

Applications you can add to the registry:

- **Django** (Python, port 8000)
- **Rails** (Ruby, port 3000)
- **FastAPI** (Python, port 8000)
- **Spring Boot** (Java, port 8080)
- **Gin** (Go, port 8080)
- **Phoenix** (Elixir, port 4000)

## Architecture

```
extras/addresses/_shared/app-catalog/
├── app-registry.js              # Application definitions
├── deploy-app.rexx              # Unified deployment script
├── deploy-sinatra-example.rexx  # Complete example
└── README.md                    # This file
```

### Application Registry Structure

Each application in `app-registry.js` defines:

```javascript
{
  name: 'App Name',
  language: 'ruby',
  runtime: 'ruby',
  description: 'Brief description',

  // OS-specific installation steps
  install: {
    'debian': ['apt-get update', 'apt-get install -y ruby', ...],
    'ubuntu': [...],
    'alpine': [...],
    'rhel': [...],
    'fedora': [...]
  },

  // Application files (name -> content)
  app: {
    'app.rb': '...',
    'config.yml': '...'
  },

  // Optional setup commands (after install, before start)
  setup: ['npm install', 'bundle install', ...],

  // Start command
  start: 'ruby app.rb',

  // Network port
  port: 4567,

  // Health check command
  healthCheck: 'curl -s http://localhost:4567/health'
}
```

## Usage

### Quick Example: Deploy Sinatra to Docker

```bash
cd extras/addresses/_shared/app-catalog
./deploy-sinatra-example.rexx
```

This will:
1. Create a Debian-based Docker container
2. Install Ruby and Sinatra
3. Deploy a hello world web app
4. Provide instructions to run it

### Generic Deployment

```bash
./deploy-app.rexx <environment> <app-id> [instance-name] [base-image]
```

**Examples:**

```bash
# Deploy Sinatra to Docker
./deploy-app.rexx docker sinatra-hello my-sinatra debian:stable

# Deploy Flask to Podman
./deploy-app.rexx podman flask-hello my-flask alpine:latest

# Deploy Express to LXD
./deploy-app.rexx lxd express-hello my-node ubuntu:22.04
```

### From REXX Scripts

```rexx
/* Load app registry */
REQUIRE 'cwd:app-catalog/app-registry.js' AS AppRegistry

/* Get application definition */
app = AppRegistry.getApp('sinatra-hello')
SAY 'Deploying:' app.name
SAY 'Port:' app.port

/* List all apps */
apps = AppRegistry.listApps()
DO app OVER apps
  SAY app.id '-' app.name '(' || app.language || ')'
END

/* Detect OS for install commands */
osRelease = '...'  /* From container */
distro = AppRegistry.detectDistro(osRelease)
installCmds = app.install[distro]
```

## Deployment Pattern

The unified deployment follows this pattern for **all environments**:

### 1. Environment Setup
```rexx
ADDRESS <ENVIRONMENT>
"create ..."
"start ..."
```

### 2. OS Detection
```rexx
"execute ... command=cat /etc/os-release"
distro = AppRegistry.detectDistro(RESULT.stdout)
```

### 3. Dependency Installation
```rexx
installCmds = app.install[distro]
DO cmd OVER installCmds
  "execute ... command=" || cmd
END
```

### 4. Application Deployment
```rexx
"execute ... command=mkdir -p /app"

/* For each file in app.app */
DO filename OVER app.app~allIndexes
  /* Write to temp file */
  /* Copy to container/VM */
END
```

### 5. Setup & Start
```rexx
/* Optional setup */
DO cmd OVER app.setup
  "execute ... command=cd /app &&" cmd
END

/* Start application */
"execute ... command=cd /app &&" app.start
```

## Environment-Specific Notes

### Docker / Podman
- ✅ Full support
- Uses `ADDRESS DOCKER` or `ADDRESS PODMAN`
- Commands: `create`, `start`, `execute`, `copy_to`

### LXD
- ✅ Full support
- Uses `ADDRESS LXD`
- Fast CoW cloning available
- Commands: `create`, `start`, `execute`
- File copy: `lxc file push`

### systemd-nspawn
- ✅ Full support
- Uses `ADDRESS NSPAWN`
- Built-in to systemd
- File copy: `machinectl copy-to`

### QEMU
- ⏳ Partial support
- Requires SSH/guest agent for execute
- VM-based, slower boot

### Firecracker
- ⏳ Partial support
- Requires rootfs setup
- Ultra-fast boot (<125ms)

### VirtualBox
- ⏳ Partial support
- Requires guest additions for file ops
- Good for desktop/cross-platform

### Proxmox
- ⏳ Partial support
- LXC containers or KVM VMs
- Requires Proxmox VE installation

## Adding New Applications

1. **Define in app-registry.js:**

```javascript
'my-app': {
  name: 'My Application',
  language: 'python',
  runtime: 'python3',
  description: 'My custom app',

  install: {
    'debian': ['apt-get update', 'apt-get install -y python3 python3-pip'],
    // ... other distros
  },

  app: {
    'app.py': `
      # Your application code here
    `
  },

  start: 'python3 app.py',
  port: 8000,
  healthCheck: 'curl -s http://localhost:8000/health'
}
```

2. **Test deployment:**

```bash
./deploy-app.rexx docker my-app test-instance debian:stable
```

## Benefits

### For Developers
- ✅ **Single script** works across 8 environments
- ✅ **OS-agnostic** - Supports Debian, Ubuntu, Alpine, RHEL, Fedora
- ✅ **Reusable** - Define once, deploy anywhere
- ✅ **Extensible** - Easy to add new apps

### For Infrastructure
- ✅ **Consistent** - Same deployment pattern everywhere
- ✅ **Testable** - Test in Docker, deploy to Proxmox
- ✅ **Portable** - Switch environments without code changes
- ✅ **Documented** - Self-documenting application registry

## Examples Gallery

### Example 1: Multi-Environment Test

```rexx
/* Test same app across all environments */
apps = ['sinatra-hello']
envs = ['DOCKER', 'PODMAN', 'LXD', 'NSPAWN']

DO env OVER envs
  DO app OVER apps
    SAY 'Deploying' app 'to' env
    /* ... deployment code ... */
  END
END
```

### Example 2: Language Stack Comparison

```rexx
/* Compare Ruby, Node, Python performance */
apps = ['sinatra-hello', 'express-hello', 'flask-hello']

DO app OVER apps
  startTime = TIME('E')
  /* ... deploy to Docker ... */
  deployTime = TIME('E')
  SAY app 'deployed in' deployTime 'seconds'
END
```

### Example 3: Development to Production

```bash
# Develop locally with Docker
./deploy-app.rexx docker sinatra-hello dev-app

# Test on LXD (fast cloning)
./deploy-app.rexx lxd sinatra-hello stage-app

# Deploy to Proxmox production
./deploy-app.rexx proxmox sinatra-hello prod-app
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs <instance-name>

# Check if running
docker ps -a | grep <instance-name>
```

### Dependencies fail to install
- Check OS detection: Different distros use different package managers
- Verify base image has package manager (some minimal images don't)
- Check network connectivity in container

### Application files not found
- Verify `/app` directory created
- Check file copy succeeded
- Verify permissions: `docker exec <instance> ls -la /app`

### Port conflicts
- Each app uses different port (4567, 3000, 5000)
- Use `-p` flag to map to host: `docker run -p 8080:4567 ...`

## Next Steps

1. **Add more applications** to app-registry.js
2. **Complete all 8 environment handlers** (QEMU, Firecracker, VirtualBox, Proxmox)
3. **Add service management** (systemd, supervisord integration)
4. **Add networking** (expose ports, reverse proxy setup)
5. **Add persistence** (volume mounts, database integration)
6. **Add CI/CD** (automated testing across environments)

## See Also

- [Docker ADDRESS Handler](../../docker-address/)
- [Podman ADDRESS Handler](../../podman-address/)
- [LXD ADDRESS Handler](../../lxd-address/)
- [Provisioning Comparison](../../PROVISIONING_COMPARISON.md)
