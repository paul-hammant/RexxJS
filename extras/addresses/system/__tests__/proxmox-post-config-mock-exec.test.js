const ProxmoxPostConfigHandler = require('../proxmox-post-config');
const { spawn } = require('child_process');
const EventEmitter = require('events');

// Mock child_process
jest.mock('child_process');

describe('Proxmox Post-Configuration Handler - Mock Exec Tests', () => {
  let proxmoxPostConfig;
  let mockProcess;

  beforeEach(() => {
    spawn.mockClear();
    
    // Create new handler instance
    proxmoxPostConfig = new ProxmoxPostConfigHandler();
    
    // Mock the proxmoxHandler dependency
    proxmoxPostConfig.proxmoxHandler = {
      startContainer: jest.fn().mockResolvedValue({ success: true }),
      execInContainer: jest.fn().mockResolvedValue({ success: true })
    };
    
    mockProcess = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.pid = 12345;
    mockProcess.kill = jest.fn();
    
    spawn.mockReturnValue(mockProcess);
  });

  describe('Base System Setup', () => {
    test('should setup base system packages', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          BASE SYSTEM SETUP                                   ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-post-config "setupBaseSystem vmid='100'"                │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  PCT Exec Commands:                                                           ║
║  ├─ pct exec 100 -- apt update                                                ║
║  ├─ pct exec 100 -- apt install -y curl wget vim nano htop git              ║
║  └─ Result: { vmid: 100, status: 'configured', packages: [...] }             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const setupPromise = proxmoxPostConfig.setupBaseSystem({
        vmid: '100',
        distro: 'debian'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Reading package lists...\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await setupPromise;

      expect(spawn).toHaveBeenCalledWith('pct', [
        'exec', '100', '--', 'apt', 'update'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        vmid: 100,
        distro: 'debian',
        locale: 'en_US.UTF-8',
        timezone: 'UTC',
        packagesInstalled: ['curl', 'wget', 'vim', 'nano', 'htop', 'ca-certificates', 'gnupg', 'lsb-release'],
        message: 'Base system setup completed for container 100'
      });
    });

    test('should handle CentOS package manager', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                      CENTOS PACKAGE MANAGEMENT                               ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-post-config "setupBaseSystem vmid='101' distro='centos'"│ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  PCT Exec Commands:                                                           ║
║  ├─ pct exec 101 -- yum update -y                                             ║
║  ├─ pct exec 101 -- yum install -y curl wget vim nano htop git              ║
║  └─ Result: { vmid: 101, distro: 'centos', packages: [...] }                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const setupPromise = proxmoxPostConfig.setupBaseSystem({
        vmid: '101',
        distro: 'centos'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Loaded plugins: fastestmirror\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await setupPromise;

      expect(spawn).toHaveBeenCalledWith('pct', [
        'exec', '101', '--', 'yum', 'update', '-y'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        vmid: 101,
        distro: 'centos',
        locale: 'en_US.UTF-8',
        timezone: 'UTC',
        packagesInstalled: ['curl', 'wget', 'vim', 'nano', 'htop', 'ca-certificates', 'gnupg', 'lsb-release'],
        message: 'Base system setup completed for container 101'
      });
    });
  });

  describe('Development Environment Setup', () => {
    test('should install Node.js development environment', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         NODE.JS DEV ENVIRONMENT                              ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-post-config "setupDevEnvironment vmid='100' env='nodejs'"│ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  PCT Exec Commands:                                                           ║
║  ├─ pct exec 100 -- curl -fsSL https://deb.nodesource.com/setup_20.x | bash ║
║  ├─ pct exec 100 -- apt install -y nodejs build-essential                   ║
║  ├─ pct exec 100 -- npm install -g yarn pm2                                  ║
║  └─ Result: { vmid: 100, environment: 'nodejs', tools: [...] }               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const setupPromise = proxmoxPostConfig.setupDevelopmentEnvironment({
        vmid: '100',
        environment: 'nodejs',
        distro: 'debian'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Node.js v20.x repository added\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await setupPromise;

      expect(spawn).toHaveBeenCalledWith('pct', [
        'exec', '100', '--', 'curl', '-fsSL', 
        'https://deb.nodesource.com/setup_20.x'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        vmid: 100,
        action: 'setupDevEnvironment',
        environment: 'nodejs',
        tools: ['node', 'npm', 'yarn', 'pm2']
      });
    });

    test('should install Python development environment', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         PYTHON DEV ENVIRONMENT                               ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-post-config "setupDevEnvironment vmid='102' env='python'"│ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  PCT Exec Commands:                                                           ║
║  ├─ pct exec 102 -- apt install -y python3 python3-pip python3-venv         ║
║  ├─ pct exec 102 -- pip3 install virtualenv pipenv poetry                   ║
║  └─ Result: { vmid: 102, environment: 'python', tools: [...] }               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const setupPromise = proxmoxPostConfig.setupDevelopmentEnvironment({
        vmid: '102',
        environment: 'python',
        distro: 'debian'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Successfully installed pip packages\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await setupPromise;

      expect(result).toEqual({
        success: true,
        vmid: 102,
        action: 'setupDevEnvironment',
        environment: 'python',
        tools: ['python3', 'pip3', 'virtualenv', 'pipenv', 'poetry']
      });
    });

    test('should install Go development environment', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           GO DEV ENVIRONMENT                                 ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-post-config "setupDevEnvironment vmid='103' env='go'"   │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  PCT Exec Commands:                                                           ║
║  ├─ pct exec 103 -- wget https://golang.org/dl/go1.21.5.linux-amd64.tar.gz ║
║  ├─ pct exec 103 -- tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz     ║
║  ├─ pct exec 103 -- echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc ║
║  └─ Result: { vmid: 103, environment: 'go', version: '1.21.5' }              ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const setupPromise = proxmoxPostConfig.setupDevelopmentEnvironment({
        vmid: '103',
        environment: 'go',
        distro: 'debian'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Go installation complete\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await setupPromise;

      expect(result).toEqual({
        success: true,
        vmid: 103,
        action: 'setupDevEnvironment',
        environment: 'go',
        tools: ['go'],
        version: '1.21.5'
      });
    });
  });

  describe('SSH Configuration', () => {
    test('should configure SSH access with public key', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           SSH CONFIGURATION                                  ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-post-config "configureSSH vmid='100' user='deploy'"     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  PCT Exec Commands:                                                           ║
║  ├─ pct exec 100 -- useradd -m -s /bin/bash deploy                           ║
║  ├─ pct exec 100 -- mkdir -p /home/deploy/.ssh                               ║
║  ├─ pct exec 100 -- echo "ssh-rsa AAAA..." >> /home/deploy/.ssh/authorized_keys ║
║  ├─ pct exec 100 -- chmod 700 /home/deploy/.ssh                              ║
║  └─ Result: { vmid: 100, sshUser: 'deploy', keyConfigured: true }            ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const configPromise = proxmoxPostConfig.configureSsh({
        vmid: '100',
        username: 'deploy',
        publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC...',
        allowRootLogin: false
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'SSH configuration complete\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await configPromise;

      expect(spawn).toHaveBeenCalledWith('pct', [
        'exec', '100', '--', 'useradd', '-m', '-s', '/bin/bash', 'deploy'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        vmid: 100,
        action: 'configureSSH',
        username: 'deploy',
        keyConfigured: true,
        allowRootLogin: false
      });
    });
  });

  describe('Firewall Configuration', () => {
    test('should configure basic firewall rules', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        FIREWALL CONFIGURATION                                ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-post-config "configureFirewall vmid='100' ports='22,80,443'"│ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  PCT Exec Commands:                                                           ║
║  ├─ pct exec 100 -- apt install -y ufw                                       ║
║  ├─ pct exec 100 -- ufw allow 22                                             ║
║  ├─ pct exec 100 -- ufw allow 80                                             ║
║  ├─ pct exec 100 -- ufw allow 443                                            ║
║  ├─ pct exec 100 -- ufw --force enable                                       ║
║  └─ Result: { vmid: 100, firewall: 'configured', rules: [...] }              ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const firewallPromise = proxmoxPostConfig.configureFirewall({
        vmid: '100',
        allowedPorts: ['22', '80', '443'],
        distro: 'debian'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Firewall configured successfully\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await firewallPromise;

      expect(spawn).toHaveBeenCalledWith('pct', [
        'exec', '100', '--', 'apt', 'install', '-y', 'ufw'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        vmid: 100,
        action: 'configureFirewall',
        firewall: 'ufw',
        allowedPorts: ['22', '80', '443']
      });
    });
  });

  describe('Monitoring Setup', () => {
    test('should install monitoring tools', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          MONITORING SETUP                                    ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-post-config "setupMonitoring vmid='100' tools='basic'"  │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  PCT Exec Commands:                                                           ║
║  ├─ pct exec 100 -- apt install -y htop iotop nethogs                        ║
║  ├─ pct exec 100 -- apt install -y sysstat logrotate                         ║
║  └─ Result: { vmid: 100, monitoring: 'configured', tools: [...] }            ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const monitoringPromise = proxmoxPostConfig.setupMonitoring({
        vmid: '100',
        tools: 'basic',
        distro: 'debian'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Monitoring tools installed\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await monitoringPromise;

      expect(spawn).toHaveBeenCalledWith('pct', [
        'exec', '100', '--', 'apt', 'install', '-y', 'htop', 'iotop', 'nethogs'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        vmid: 100,
        action: 'setupMonitoring',
        tools: ['htop', 'iotop', 'nethogs', 'sysstat', 'logrotate']
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle package installation failures', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        ERROR HANDLING SCENARIO                               ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-post-config "setupBaseSystem vmid='999'"                │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  PCT Exec Commands:                                                           ║
║  ├─ pct exec 999 -- apt update                                                ║
║  ├─ ERROR: CT 999 does not exist                                              ║
║  └─ Result: { success: false, error: 'Container not found' }                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const setupPromise = proxmoxPostConfig.setupBaseSystem({
        vmid: '999',
        distro: 'debian'
      }, {});

      setTimeout(() => {
        mockProcess.stderr.emit('data', 'ERROR: CT 999 does not exist\n');
        mockProcess.emit('close', 1);
      }, 100);

      const result = await setupPromise;

      expect(result).toEqual({
        success: false,
        error: 'Post-configuration command failed',
        details: 'ERROR: CT 999 does not exist\n',
        exitCode: 1,
        vmid: 999
      });
    });
  });
});