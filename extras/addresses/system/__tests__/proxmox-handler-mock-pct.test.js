const ProxmoxHandler = require('../proxmox-handler');
const { spawn } = require('child_process');
const EventEmitter = require('events');

// Mock child_process
jest.mock('child_process');

describe('Proxmox Handler - Mock PCT Tests', () => {
  let proxmoxHandler;
  let mockProcess;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods
    spawn.mockClear();
    
    // Create new handler instance
    proxmoxHandler = new ProxmoxHandler();
    
    // Setup mock process
    mockProcess = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.pid = 12345;
    mockProcess.kill = jest.fn();
    
    spawn.mockReturnValue(mockProcess);
  });

  afterEach(() => {
    // Clear active containers
    proxmoxHandler.activeContainers.clear();
  });

  describe('Container Lifecycle Management', () => {
    test('should create LXC container with pct create', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           PCT CREATE WORKFLOW                                ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "create template='debian-12' hostname='web01'"  │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Proxmox PCT Commands:                                                        ║
║  ├─ pct create 100 debian-12 --hostname=web01 --memory=512 --cores=1         ║
║  └─ Result: { vmid: 100, status: 'created', hostname: 'web01' }              ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const createPromise = proxmoxHandler.createContainer({
        template: 'debian-12',
        hostname: 'web01',
        memory: '1024',
        cores: '2'
      }, {});

      // Simulate successful pct create command
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Container 100 created successfully\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await createPromise;

      expect(spawn).toHaveBeenCalledWith('pct', [
        'create',
        '100',
        'debian-12',
        '--hostname=web01',
        '--memory=1024',
        '--cores=2',
        '--rootfs=local-lvm:8G',
        '--net0=name=eth0,bridge=vmbr0,ip=dhcp',
        '--unprivileged=true',
        '--onboot=false'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        vmid: 100,
        hostname: 'web01',
        template: 'debian-12',
        status: 'created',
        message: 'Container 100 created successfully'
      });

      expect(proxmoxHandler.activeContainers.has('100')).toBe(true);
    });

    test('should start container with pct start', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                            PCT START WORKFLOW                                ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "start vmid='100'"                              │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Proxmox PCT Commands:                                                        ║
║  ├─ pct start 100                                                             ║
║  └─ Result: { vmid: 100, status: 'running', uptime: 0 }                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      // Pre-populate a container
      proxmoxHandler.activeContainers.set('100', {
        vmid: 100,
        hostname: 'web01',
        status: 'stopped'
      });

      const startPromise = proxmoxHandler.startContainer({ vmid: '100' }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Starting container 100\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await startPromise;

      expect(spawn).toHaveBeenCalledWith('pct', ['start', '100'], expect.any(Object));
      expect(result).toEqual({
        success: true,
        vmid: 100,
        status: 'running',
        message: 'Container 100 started successfully'
      });
    });

    test('should stop container with pct stop', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                            PCT STOP WORKFLOW                                 ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "stop vmid='100'"                               │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Proxmox PCT Commands:                                                        ║
║  ├─ pct stop 100                                                              ║
║  └─ Result: { vmid: 100, status: 'stopped' }                                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      proxmoxHandler.activeContainers.set('100', {
        vmid: 100,
        hostname: 'web01',
        status: 'running'
      });

      const stopPromise = proxmoxHandler.stopContainer({ vmid: '100' }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Stopping container 100\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await stopPromise;

      expect(spawn).toHaveBeenCalledWith('pct', ['stop', '100'], expect.any(Object));
      expect(result).toEqual({
        success: true,
        vmid: 100,
        status: 'stopped',
        force: false,
        message: 'Container 100 stopped successfully'
      });
    });

    test('should destroy container with pct destroy', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          PCT DESTROY WORKFLOW                                ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "destroy vmid='100'"                            │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Proxmox PCT Commands:                                                        ║
║  ├─ pct destroy 100 --purge                                                   ║
║  └─ Result: { vmid: 100, status: 'destroyed' }                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      proxmoxHandler.activeContainers.set('100', {
        vmid: 100,
        hostname: 'web01',
        status: 'stopped'
      });

      const destroyPromise = proxmoxHandler.destroyContainer({ vmid: '100' }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Container 100 destroyed\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await destroyPromise;

      expect(spawn).toHaveBeenCalledWith('pct', ['destroy', '100'], expect.any(Object));
      expect(result).toEqual({
        success: true,
        vmid: 100,
        status: 'destroyed',
        force: false,
        purge: false,
        message: 'Container 100 destroyed successfully'
      });
      expect(proxmoxHandler.activeContainers.has('100')).toBe(false);
    });
  });

  describe('Container Snapshots and Cloning', () => {
    test('should create snapshot with pct snapshot', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         PCT SNAPSHOT WORKFLOW                                ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "snapshot vmid='100' snapname='pre-deploy'"     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Proxmox PCT Commands:                                                        ║
║  ├─ pct snapshot 100 pre-deploy --description="Snapshot pre-deploy"          ║
║  └─ Result: { vmid: 100, snapshot: 'pre-deploy', status: 'created' }         ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      proxmoxHandler.activeContainers.set('100', {
        vmid: 100,
        hostname: 'web01',
        status: 'running'
      });

      const snapshotPromise = proxmoxHandler.createSnapshot({
        vmid: '100',
        snapname: 'pre-deploy',
        description: 'Snapshot before deployment'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Snapshot pre-deploy created for container 100\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await snapshotPromise;

      expect(spawn).toHaveBeenCalledWith('pct', [
        'snapshot',
        '100',
        'pre-deploy',
        '--description=Snapshot before deployment'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        vmid: 100,
        snapname: 'pre-deploy',
        description: 'Snapshot before deployment',
        created: expect.any(String),
        message: 'Snapshot pre-deploy created for container 100'
      });
    });

    test('should clone container with pct clone', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           PCT CLONE WORKFLOW                                 ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "clone source='100' target='101'"               │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Proxmox PCT Commands:                                                        ║
║  ├─ pct clone 100 101 --hostname=web01-clone --full                          ║
║  └─ Result: { source: 100, target: 101, status: 'cloned' }                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      proxmoxHandler.activeContainers.set('100', {
        vmid: 100,
        hostname: 'web01',
        status: 'running'
      });

      const clonePromise = proxmoxHandler.cloneContainer({
        vmid: '100',
        newid: '101',
        hostname: 'web01-clone'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Cloning container 100 to 101\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await clonePromise;

      expect(spawn).toHaveBeenCalledWith('pct', [
        'clone',
        '100',
        '101',
        '--hostname=web01-clone'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        sourceVMID: 100,
        newVMID: 101,
        hostname: 'web01-clone',
        full: false,
        message: 'Container 100 cloned to 101'
      });
    });
  });

  describe('Container Information and Monitoring', () => {
    test('should list all containers with pct list', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                           PCT LIST WORKFLOW                                  ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "list"                                          │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Proxmox PCT Commands:                                                        ║
║  ├─ pct list                                                                  ║
║  └─ Result: { containers: [{ vmid: 100, status: 'running' }] }               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const listPromise = proxmoxHandler.listContainers({}, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'VMID STATUS LOCK NAME\n');
        mockProcess.stdout.emit('data', '100 running - web01\n');
        mockProcess.stdout.emit('data', '101 stopped - web02\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await listPromise;

      expect(spawn).toHaveBeenCalledWith('pct', ['list'], expect.any(Object));
      expect(result).toEqual({
        success: true,
        containers: [
          { vmid: 100, status: 'running', name: 'web01' },
          { vmid: 101, status: 'stopped', name: 'web02' }
        ],
        count: 2,
        node: 'proxmox'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle pct command failures gracefully', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          PCT ERROR HANDLING                                  ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "start vmid='999'"  // Non-existent container   │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Proxmox PCT Commands:                                                        ║
║  ├─ pct start 999                                                             ║
║  ├─ ERROR: CT 999 does not exist                                              ║
║  └─ Result: { success: false, error: 'Container not found' }                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const startPromise = proxmoxHandler.startContainer({ vmid: '999' }, {});

      setTimeout(() => {
        mockProcess.stderr.emit('data', 'ERROR: CT 999 does not exist\n');
        mockProcess.emit('close', 1);
      }, 100);

      try {
        await startPromise;
        // Should not reach this point
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Container start failed: pct command failed: ERROR: CT 999 does not exist\n');
      }
    });

    test('should validate security policies for templates', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        SECURITY POLICY VALIDATION                            ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "create template='unknown-distro' policy='strict'"│ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Security Check:                                                              ║
║  ├─ Policy: strict                                                            ║
║  ├─ Template: unknown-distro (NOT in allowed list)                            ║
║  └─ Result: { success: false, error: 'Template not allowed' }                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      // Initialize handler in strict mode
      await proxmoxHandler.initialize({
        securityMode: 'strict',
        allowedTemplates: ['local:vztmpl/debian-12-standard_12.2-1_amd64.tar.gz']
      });

      try {
        await proxmoxHandler.createContainer({
          template: 'unknown-distro',
          hostname: 'test'
        }, {});
        
        // Should not reach this point
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Template unknown-distro not allowed by security policy');
        expect(spawn).not.toHaveBeenCalled();
      }
    });
  });

  describe('Resource Management', () => {
    test('should enforce container count limits', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         CONTAINER LIMIT ENFORCEMENT                          ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS proxmox-handler "create template='debian-12'" (max reached)     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Container Limit Validation:                                                  ║
║  ├─ Max containers: 2 (limit set low for testing)                            ║
║  ├─ Current containers: 2                                                     ║
║  └─ Result: { success: false, error: 'Maximum containers reached' }          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      // Initialize with low max container limit
      await proxmoxHandler.initialize({ maxContainers: 2 });
      
      // Add two containers to reach limit
      proxmoxHandler.activeContainers.set('100', { vmid: 100, status: 'running' });
      proxmoxHandler.activeContainers.set('101', { vmid: 101, status: 'running' });

      try {
        await proxmoxHandler.createContainer({
          template: 'debian-12',
          hostname: 'test'
        }, {});
        
        // Should not reach this point
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Container creation failed: Maximum containers (2) reached');
        expect(spawn).not.toHaveBeenCalled();
      }
    });
  });
});