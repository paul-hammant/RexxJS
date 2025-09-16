/**
 * Proxmox Post-Instantiation Configuration Handler
 * Handles post-creation configuration, software installation, and environment setup
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { interpolateMessage, logActivity } = require('../../../core/src/address-handler-utils');

// Helper function for logging
function log(operation, details) {
  logActivity('PROXMOX_CONFIG', operation, details);
}

class ProxmoxPostConfigHandler {
  constructor(proxmoxHandler) {
    this.proxmoxHandler = proxmoxHandler;
    this.configTemplates = new Map();
    this.packageManagers = {
      'ubuntu': 'apt',
      'debian': 'apt', 
      'centos': 'yum',
      'fedora': 'dnf',
      'alpine': 'apk'
    };
    this.initSystems = {
      'ubuntu': 'systemd',
      'debian': 'systemd',
      'centos': 'systemd',
      'fedora': 'systemd',
      'alpine': 'openrc'
    };
  }

  async initialize(config = {}) {
    this.defaultUser = config.defaultUser || 'root';
    this.sshKeyPath = config.sshKeyPath || '~/.ssh/id_rsa.pub';
    this.configTemplatesPath = config.configTemplatesPath || './config-templates';
    
    // Load configuration templates if directory exists
    if (fs.existsSync(this.configTemplatesPath)) {
      await this.loadConfigTemplates();
    }

    log('initialize', {
      defaultUser: this.defaultUser,
      templatesPath: this.configTemplatesPath,
      templatesLoaded: this.configTemplates.size
    });
  }

  async handleMessage(message, context) {
    try {
      const interpolatedMessage = await interpolateMessage(message, context.variables || {});
      const { command, subcommand, params } = this.parseCommand(interpolatedMessage);

      log('command', { command, subcommand, params });

      switch (command) {
        case 'setup_base':
          return await this.setupBaseSystem(params, context);
        case 'install_packages':
          return await this.installPackages(params, context);
        case 'configure_ssh':
          return await this.configureSsh(params, context);
        case 'setup_user':
          return await this.setupUser(params, context);
        case 'configure_network':
          return await this.configureNetwork(params, context);
        case 'install_service':
          return await this.installService(params, context);
        case 'apply_template':
          return await this.applyConfigTemplate(params, context);
        case 'setup_development':
          return await this.setupDevelopmentEnvironment(params, context);
        case 'configure_firewall':
          return await this.configureFirewall(params, context);
        case 'setup_monitoring':
          return await this.setupMonitoring(params, context);
        case 'backup_config':
          return await this.backupConfiguration(params, context);
        case 'restore_config':
          return await this.restoreConfiguration(params, context);
        case 'validate_config':
          return await this.validateConfiguration(params, context);
        default:
          throw new Error(`Unknown post-config command: ${command}`);
      }
    } catch (error) {
      log('error', { error: error.message, command: message });
      throw error;
    }
  }

  parseCommand(message) {
    const parts = message.trim().split(/\s+/);
    const command = parts[0] || '';
    const subcommand = parts.length > 1 && !parts[1].includes('=') ? parts[1] : '';
    
    const params = {};
    const startIndex = subcommand ? 2 : 1;
    
    for (let i = startIndex; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('=')) {
        const [key, ...valueParts] = part.split('=');
        params[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
    
    return { command, subcommand, params };
  }

  async setupBaseSystem(params, context) {
    const { vmid, distro = 'ubuntu', locale = 'en_US.UTF-8', timezone = 'UTC' } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    log('setup_base_start', { vmid, distro, locale, timezone });

    try {
      // Ensure container is running
      await this.proxmoxHandler.startContainer({ vmid }, context);

      const packageManager = this.packageManagers[distro] || 'apt';
      
      // Update package lists
      await this.execInContainer(vmid, `${packageManager} update`);

      // Install essential packages
      const essentialPackages = [
        'curl', 'wget', 'vim', 'nano', 'htop', 'ca-certificates', 'gnupg', 'lsb-release'
      ];
      
      if (packageManager === 'apt') {
        await this.execInContainer(vmid, `apt install -y ${essentialPackages.join(' ')}`);
        
        // Configure locale
        await this.execInContainer(vmid, `locale-gen ${locale}`);
        await this.execInContainer(vmid, `update-locale LANG=${locale}`);
      } else if (packageManager === 'yum' || packageManager === 'dnf') {
        await this.execInContainer(vmid, `${packageManager} install -y ${essentialPackages.join(' ')}`);
      } else if (packageManager === 'apk') {
        await this.execInContainer(vmid, `apk add ${essentialPackages.join(' ')}`);
      }

      // Set timezone
      await this.execInContainer(vmid, `timedatectl set-timezone ${timezone} || ln -sf /usr/share/zoneinfo/${timezone} /etc/localtime`);

      // Configure hostname resolution
      await this.execInContainer(vmid, `echo "127.0.0.1 $(hostname)" >> /etc/hosts`);

      log('setup_base_success', { vmid, distro, packagesInstalled: essentialPackages.length });

      return {
        success: true,
        vmid: parseInt(vmid),
        distro,
        locale,
        timezone,
        packagesInstalled: essentialPackages,
        message: `Base system setup completed for container ${vmid}`
      };

    } catch (error) {
      log('setup_base_error', { vmid, error: error.message });
      throw new Error(`Base system setup failed: ${error.message}`);
    }
  }

  async installPackages(params, context) {
    const { vmid, packages, distro = 'ubuntu', update = 'true' } = params;
    
    if (!vmid || !packages) {
      throw new Error('Missing required parameters: vmid, packages');
    }

    const packageList = Array.isArray(packages) ? packages : packages.split(',').map(p => p.trim());
    const packageManager = this.packageManagers[distro] || 'apt';

    log('install_packages_start', { vmid, packages: packageList, packageManager });

    try {
      // Update package lists if requested
      if (update === 'true') {
        await this.execInContainer(vmid, `${packageManager} update`);
      }

      // Install packages
      if (packageManager === 'apt') {
        await this.execInContainer(vmid, `apt install -y ${packageList.join(' ')}`);
      } else if (packageManager === 'yum') {
        await this.execInContainer(vmid, `yum install -y ${packageList.join(' ')}`);
      } else if (packageManager === 'dnf') {
        await this.execInContainer(vmid, `dnf install -y ${packageList.join(' ')}`);
      } else if (packageManager === 'apk') {
        await this.execInContainer(vmid, `apk add ${packageList.join(' ')}`);
      }

      log('install_packages_success', { vmid, packagesInstalled: packageList.length });

      return {
        success: true,
        vmid: parseInt(vmid),
        packages: packageList,
        packageManager,
        message: `Installed ${packageList.length} packages in container ${vmid}`
      };

    } catch (error) {
      log('install_packages_error', { vmid, error: error.message });
      throw new Error(`Package installation failed: ${error.message}`);
    }
  }

  async configureSsh(params, context) {
    const { vmid, enable = 'true', port = '22', key_auth = 'true', password_auth = 'false' } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    log('configure_ssh_start', { vmid, enable, port, key_auth, password_auth });

    try {
      if (enable === 'true') {
        // Install SSH server
        await this.installPackages({ 
          vmid, 
          packages: 'openssh-server', 
          distro: params.distro || 'ubuntu' 
        }, context);

        // Configure SSH
        const sshConfig = [
          `Port ${port}`,
          `PasswordAuthentication ${password_auth === 'true' ? 'yes' : 'no'}`,
          `PubkeyAuthentication ${key_auth === 'true' ? 'yes' : 'no'}`,
          'PermitRootLogin yes',
          'X11Forwarding no',
          'PrintMotd no',
          'AcceptEnv LANG LC_*',
          'Subsystem sftp /usr/lib/openssh/sftp-server'
        ].join('\n');

        await this.execInContainer(vmid, `cat > /etc/ssh/sshd_config << 'SSH_CONFIG_EOF'\n${sshConfig}\nSSH_CONFIG_EOF`);

        // Add SSH public key if provided
        if (key_auth === 'true' && this.sshKeyPath && fs.existsSync(this.sshKeyPath)) {
          const publicKey = fs.readFileSync(this.sshKeyPath, 'utf8').trim();
          await this.execInContainer(vmid, 'mkdir -p /root/.ssh');
          await this.execInContainer(vmid, `echo "${publicKey}" >> /root/.ssh/authorized_keys`);
          await this.execInContainer(vmid, 'chmod 700 /root/.ssh && chmod 600 /root/.ssh/authorized_keys');
        }

        // Start SSH service
        await this.execInContainer(vmid, 'systemctl enable ssh && systemctl start ssh || service ssh start');

        log('configure_ssh_success', { vmid, port, key_auth, password_auth });

        return {
          success: true,
          vmid: parseInt(vmid),
          enabled: true,
          port: parseInt(port),
          keyAuthentication: key_auth === 'true',
          passwordAuthentication: password_auth === 'true',
          message: `SSH configured on container ${vmid}, port ${port}`
        };
      } else {
        // Disable SSH
        await this.execInContainer(vmid, 'systemctl stop ssh && systemctl disable ssh || service ssh stop');
        
        return {
          success: true,
          vmid: parseInt(vmid),
          enabled: false,
          message: `SSH disabled on container ${vmid}`
        };
      }

    } catch (error) {
      log('configure_ssh_error', { vmid, error: error.message });
      throw new Error(`SSH configuration failed: ${error.message}`);
    }
  }

  async setupDevelopmentEnvironment(params, context) {
    const { 
      vmid, 
      languages = 'node,python,go', 
      editors = 'vim,nano', 
      tools = 'git,curl,wget,build-essential',
      node_version = '18',
      python_version = '3.11'
    } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    const languageList = languages.split(',').map(l => l.trim());
    const editorList = editors.split(',').map(e => e.trim());
    const toolList = tools.split(',').map(t => t.trim());

    log('setup_dev_environment_start', { vmid, languages: languageList, editors: editorList, tools: toolList });

    try {
      // Install basic development tools
      await this.installPackages({ 
        vmid, 
        packages: [...toolList, ...editorList].join(','),
        distro: params.distro || 'ubuntu'
      }, context);

      // Install language-specific tools
      for (const language of languageList) {
        switch (language.toLowerCase()) {
          case 'node':
          case 'nodejs':
            await this.setupNodeJs(vmid, node_version);
            break;
          case 'python':
            await this.setupPython(vmid, python_version);
            break;
          case 'go':
            await this.setupGolang(vmid);
            break;
          case 'java':
            await this.setupJava(vmid);
            break;
          case 'rust':
            await this.setupRust(vmid);
            break;
        }
      }

      // Configure Git (if installed)
      if (toolList.includes('git')) {
        await this.execInContainer(vmid, 'git config --global init.defaultBranch main');
        await this.execInContainer(vmid, 'git config --global user.name "Container User"');
        await this.execInContainer(vmid, 'git config --global user.email "user@container.local"');
      }

      log('setup_dev_environment_success', { vmid, languages: languageList });

      return {
        success: true,
        vmid: parseInt(vmid),
        languages: languageList,
        editors: editorList,
        tools: toolList,
        message: `Development environment setup completed for container ${vmid}`
      };

    } catch (error) {
      log('setup_dev_environment_error', { vmid, error: error.message });
      throw new Error(`Development environment setup failed: ${error.message}`);
    }
  }

  async setupNodeJs(vmid, version) {
    // Install Node.js using NodeSource repository
    await this.execInContainer(vmid, `curl -fsSL https://deb.nodesource.com/setup_${version}.x | bash -`);
    await this.execInContainer(vmid, 'apt-get install -y nodejs');
    
    // Install common global packages
    await this.execInContainer(vmid, 'npm install -g yarn pnpm pm2 nodemon');
    
    log('nodejs_installed', { vmid, version });
  }

  async setupPython(vmid, version) {
    // Install Python and pip
    await this.execInContainer(vmid, `apt-get install -y python${version} python${version}-pip python${version}-venv`);
    await this.execInContainer(vmid, `ln -sf /usr/bin/python${version} /usr/bin/python`);
    await this.execInContainer(vmid, `ln -sf /usr/bin/pip${version} /usr/bin/pip`);
    
    // Install common packages
    await this.execInContainer(vmid, 'pip install virtualenv pipenv poetry');
    
    log('python_installed', { vmid, version });
  }

  async setupGolang(vmid) {
    // Install Go
    await this.execInContainer(vmid, 'wget -O go.tar.gz https://golang.org/dl/go1.21.6.linux-amd64.tar.gz');
    await this.execInContainer(vmid, 'tar -C /usr/local -xzf go.tar.gz && rm go.tar.gz');
    
    // Set up Go environment
    const goProfile = `
export PATH=$PATH:/usr/local/go/bin
export GOPATH=/root/go
export GOBIN=/root/go/bin
`;
    await this.execInContainer(vmid, `echo '${goProfile}' >> /root/.bashrc`);
    
    log('golang_installed', { vmid });
  }

  async setupJava(vmid) {
    // Install OpenJDK
    await this.execInContainer(vmid, 'apt-get install -y openjdk-17-jdk maven gradle');
    
    log('java_installed', { vmid });
  }

  async setupRust(vmid) {
    // Install Rust using rustup
    await this.execInContainer(vmid, 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y');
    await this.execInContainer(vmid, 'source /root/.cargo/env && rustup component add rustfmt clippy');
    
    log('rust_installed', { vmid });
  }

  async configureFirewall(params, context) {
    const { vmid, enable = 'true', rules = '22/tcp,80/tcp,443/tcp', policy = 'DROP' } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    log('configure_firewall_start', { vmid, enable, rules, policy });

    try {
      if (enable === 'true') {
        // Install ufw (Uncomplicated Firewall)
        await this.installPackages({ 
          vmid, 
          packages: 'ufw',
          distro: params.distro || 'ubuntu'
        }, context);

        // Set default policy
        await this.execInContainer(vmid, `ufw --force default ${policy.toLowerCase()}`);

        // Add rules
        const ruleList = rules.split(',').map(r => r.trim());
        for (const rule of ruleList) {
          await this.execInContainer(vmid, `ufw allow ${rule}`);
        }

        // Enable firewall
        await this.execInContainer(vmid, 'ufw --force enable');

        log('configure_firewall_success', { vmid, rules: ruleList });

        return {
          success: true,
          vmid: parseInt(vmid),
          enabled: true,
          rules: ruleList,
          policy,
          message: `Firewall configured on container ${vmid}`
        };
      } else {
        // Disable firewall
        await this.execInContainer(vmid, 'ufw --force disable');
        
        return {
          success: true,
          vmid: parseInt(vmid),
          enabled: false,
          message: `Firewall disabled on container ${vmid}`
        };
      }

    } catch (error) {
      log('configure_firewall_error', { vmid, error: error.message });
      throw new Error(`Firewall configuration failed: ${error.message}`);
    }
  }

  async setupMonitoring(params, context) {
    const { vmid, services = 'htop,iotop,nethogs', prometheus = 'false' } = params;
    
    if (!vmid) {
      throw new Error('Missing required parameter: vmid');
    }

    const serviceList = services.split(',').map(s => s.trim());

    log('setup_monitoring_start', { vmid, services: serviceList, prometheus });

    try {
      // Install monitoring tools
      await this.installPackages({ 
        vmid, 
        packages: serviceList.join(','),
        distro: params.distro || 'ubuntu'
      }, context);

      // Optionally install Prometheus node exporter
      if (prometheus === 'true') {
        await this.setupPrometheusExporter(vmid);
      }

      log('setup_monitoring_success', { vmid, services: serviceList });

      return {
        success: true,
        vmid: parseInt(vmid),
        services: serviceList,
        prometheus: prometheus === 'true',
        message: `Monitoring tools installed on container ${vmid}`
      };

    } catch (error) {
      log('setup_monitoring_error', { vmid, error: error.message });
      throw new Error(`Monitoring setup failed: ${error.message}`);
    }
  }

  async setupPrometheusExporter(vmid) {
    // Download and install Prometheus node exporter
    const exporterVersion = '1.6.1';
    const downloadUrl = `https://github.com/prometheus/node_exporter/releases/download/v${exporterVersion}/node_exporter-${exporterVersion}.linux-amd64.tar.gz`;
    
    await this.execInContainer(vmid, `wget -O node_exporter.tar.gz ${downloadUrl}`);
    await this.execInContainer(vmid, 'tar xzf node_exporter.tar.gz');
    await this.execInContainer(vmid, `mv node_exporter-${exporterVersion}.linux-amd64/node_exporter /usr/local/bin/`);
    await this.execInContainer(vmid, 'rm -rf node_exporter*');

    // Create systemd service
    const serviceFile = `
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=nobody
Group=nobody
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
`;

    await this.execInContainer(vmid, `cat > /etc/systemd/system/node_exporter.service << 'SERVICE_EOF'\n${serviceFile}\nSERVICE_EOF`);
    await this.execInContainer(vmid, 'systemctl daemon-reload && systemctl enable node_exporter && systemctl start node_exporter');
    
    log('prometheus_exporter_installed', { vmid, version: exporterVersion });
  }

  async loadConfigTemplates() {
    try {
      const files = fs.readdirSync(this.configTemplatesPath);
      
      for (const file of files) {
        if (file.endsWith('.template')) {
          const templateName = path.basename(file, '.template');
          const templatePath = path.join(this.configTemplatesPath, file);
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          
          this.configTemplates.set(templateName, templateContent);
        }
      }

      log('templates_loaded', { count: this.configTemplates.size });
    } catch (error) {
      log('templates_load_error', { error: error.message });
    }
  }

  async execInContainer(vmid, command, timeout = 30000) {
    return this.proxmoxHandler.execInContainer({ vmid, command, timeout }, {});
  }
}

module.exports = ProxmoxPostConfigHandler;