const NspawnHandler = require('../nspawn-handler');
const { spawn } = require('child_process');
const EventEmitter = require('events');

// Mock child_process
jest.mock('child_process');

describe('systemd-nspawn Handler - Mock machinectl Tests', () => {
  let nspawnHandler;
  let mockProcess;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods
    spawn.mockClear();
    
    // Create new handler instance
    nspawnHandler = new NspawnHandler();
    
    // Setup fresh mock process for each test
    mockProcess = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.pid = 12345;
    mockProcess.kill = jest.fn();
    
    spawn.mockReturnValue(mockProcess);
  });

  afterEach(() => {
    // Clear active machines
    nspawnHandler.activeMachines.clear();
  });

  describe('Machine Lifecycle Management', () => {
    test('should create nspawn machine with machinectl clone', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         MACHINECTL CREATE WORKFLOW                           ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "create image='debian:stable' name='web01'"      │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl show-image debian:stable                                       ║
║  ├─ machinectl clone debian:stable web01                                      ║
║  └─ Result: { name: 'web01', status: 'created', image: 'debian:stable' }     ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      // Mock ensureImageAvailable to avoid complex command sequencing
      nspawnHandler.ensureImageAvailable = jest.fn().mockResolvedValue();

      const createPromise = nspawnHandler.createMachine({
        image: 'debian:stable',
        name: 'web01',
        memory: '1024M',
        cpus: '2'
      }, {});

      // Simulate successful clone command
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Machine web01 cloned successfully\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await createPromise;

      expect(spawn).toHaveBeenCalledWith('machinectl', [
        'clone', 'debian:stable', 'web01'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        name: 'web01',
        image: 'debian:stable',
        status: 'created',
        memory: '1024M',
        cpus: '2',
        message: 'Machine web01 created successfully'
      });

      expect(nspawnHandler.activeMachines.has('web01')).toBe(true);
    });

    test('should start machine with machinectl start', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          MACHINECTL START WORKFLOW                           ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "start name='web01'"                             │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl start web01 --network-bridge=host                             ║
║  └─ Result: { name: 'web01', status: 'running', boot: false }                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      // Pre-populate a machine
      nspawnHandler.activeMachines.set('web01', {
        name: 'web01',
        image: 'debian:stable',
        status: 'stopped'
      });

      const startPromise = nspawnHandler.startMachine({ name: 'web01' }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Starting machine web01\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await startPromise;

      expect(spawn).toHaveBeenCalledWith('machinectl', [
        'start', 'web01', '--network-bridge=host'
      ], expect.any(Object));
      
      expect(result).toEqual({
        success: true,
        name: 'web01',
        status: 'running',
        boot: false,
        message: 'Machine web01 started successfully'
      });
    });

    test('should stop machine with machinectl stop', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          MACHINECTL STOP WORKFLOW                            ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "stop name='web01'"                              │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl stop web01                                                     ║
║  └─ Result: { name: 'web01', status: 'stopped', force: false }               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      nspawnHandler.activeMachines.set('web01', {
        name: 'web01',
        image: 'debian:stable',
        status: 'running'
      });

      const stopPromise = nspawnHandler.stopMachine({ name: 'web01' }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Stopping machine web01\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await stopPromise;

      expect(spawn).toHaveBeenCalledWith('machinectl', ['stop', 'web01'], expect.any(Object));
      expect(result).toEqual({
        success: true,
        name: 'web01',
        status: 'stopped',
        force: false,
        message: 'Machine web01 stopped successfully'
      });
    });

    test('should terminate machine with machinectl terminate', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        MACHINECTL TERMINATE WORKFLOW                         ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "terminate name='web01'"                         │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl terminate web01                                                ║
║  └─ Result: { name: 'web01', status: 'terminated' }                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      nspawnHandler.activeMachines.set('web01', {
        name: 'web01',
        image: 'debian:stable',
        status: 'running'
      });

      const terminatePromise = nspawnHandler.terminateMachine({ name: 'web01' }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Machine web01 terminated\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await terminatePromise;

      expect(spawn).toHaveBeenCalledWith('machinectl', ['terminate', 'web01'], expect.any(Object));
      expect(result).toEqual({
        success: true,
        name: 'web01',
        status: 'terminated',
        message: 'Machine web01 terminated successfully'
      });
    });

    test('should remove machine with machinectl remove', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         MACHINECTL REMOVE WORKFLOW                           ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "remove name='web01'"                            │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl terminate web01                                                ║
║  ├─ machinectl remove web01                                                   ║
║  └─ Result: { name: 'web01', status: 'removed' }                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      nspawnHandler.activeMachines.set('web01', {
        name: 'web01',
        image: 'debian:stable',
        status: 'stopped'
      });

      const removePromise = nspawnHandler.removeMachine({ name: 'web01' }, {});

      // Mock terminate command (may fail, should be ignored)
      setTimeout(() => {
        spawn.mockReturnValueOnce(mockProcess);
        mockProcess.stderr.emit('data', 'Machine already stopped\n');
        mockProcess.emit('close', 1);
      }, 50);

      // Mock remove command
      setTimeout(() => {
        spawn.mockReturnValueOnce(mockProcess);
        mockProcess.stdout.emit('data', 'Machine web01 removed\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await removePromise;

      expect(result).toEqual({
        success: true,
        name: 'web01',
        status: 'removed',
        purge: false,
        message: 'Machine web01 removed successfully'
      });
      
      expect(nspawnHandler.activeMachines.has('web01')).toBe(false);
    });
  });

  describe('Machine Operations', () => {
    test('should clone machine with machinectl clone', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         MACHINECTL CLONE WORKFLOW                            ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "clone name='web01' newName='web02'"             │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl clone web01 web02                                              ║
║  └─ Result: { sourceName: 'web01', newName: 'web02', readonly: false }       ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      nspawnHandler.activeMachines.set('web01', {
        name: 'web01',
        image: 'debian:stable',
        status: 'running'
      });

      const clonePromise = nspawnHandler.cloneMachine({
        name: 'web01',
        newName: 'web02'
      }, {});

      setTimeout(() => {
        spawn.mockReturnValueOnce(mockProcess);
        mockProcess.stdout.emit('data', 'Cloning machine web01 to web02\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await clonePromise;

      expect(spawn).toHaveBeenCalledWith('machinectl', [
        'clone', 'web01', 'web02'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        sourceName: 'web01',
        newName: 'web02',
        readonly: false,
        message: 'Machine web01 cloned to web02'
      });
    });

    test('should execute commands in machine with machinectl shell', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         MACHINECTL EXEC WORKFLOW                             ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "exec name='web01' command='uname -a'"           │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl shell web01 /bin/bash -c "uname -a"                           ║
║  └─ Result: { name: 'web01', command: 'uname -a', output: 'Linux...' }       ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const execPromise = nspawnHandler.execInMachine({
        name: 'web01',
        command: 'uname -a'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Linux web01 5.15.0-generic #72-Ubuntu SMP\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await execPromise;

      expect(spawn).toHaveBeenCalledWith('machinectl', [
        'shell', 'web01', '/bin/bash', '-c', 'uname -a'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        name: 'web01',
        command: 'uname -a',
        output: 'Linux web01 5.15.0-generic #72-Ubuntu SMP',
        message: 'Command executed in machine web01'
      });
    });

    test('should list all machines with machinectl list', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         MACHINECTL LIST WORKFLOW                             ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "list"                                           │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl list --no-legend                                               ║
║  └─ Result: { machines: [{ name: 'web01', class: 'container' }], count: 1 }  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const listPromise = nspawnHandler.listMachines({}, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'web01 container systemd-nspawn running\n');
        mockProcess.stdout.emit('data', 'web02 container systemd-nspawn stopped\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await listPromise;

      expect(spawn).toHaveBeenCalledWith('machinectl', ['list', '--no-legend'], expect.any(Object));
      expect(result).toEqual({
        success: true,
        machines: [
          { name: 'web01', class: 'container', service: 'systemd-nspawn', state: 'running' },
          { name: 'web02', class: 'container', service: 'systemd-nspawn', state: 'stopped' }
        ],
        count: 2
      });
    });

    test('should get machine status with machinectl status', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        MACHINECTL STATUS WORKFLOW                            ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "status name='web01'"                            │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl status web01                                                   ║
║  └─ Result: { name: 'web01', state: 'running', leader: '12345' }             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const statusPromise = nspawnHandler.getMachineStatus({ name: 'web01' }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', `web01
   Since: Mon 2025-01-16 10:30:00 UTC; 1h 23min ago
   Leader: 12345 (systemd)
   Service: systemd-nspawn; class container
   Root: /var/lib/machines/web01
   State: running
   Memory: 156.3M
   Tasks: 47
`);
        mockProcess.emit('close', 0);
      }, 100);

      const result = await statusPromise;

      expect(spawn).toHaveBeenCalledWith('machinectl', ['status', 'web01'], expect.any(Object));
      expect(result).toEqual({
        success: true,
        name: 'web01',
        state: 'running',
        leader: '12345 (systemd)',
        memory: '156.3M',
        tasks: '47'
      });
    });
  });

  describe('RexxJS Integration', () => {
    test('should deploy RexxJS binary to machine', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          REXXJS DEPLOYMENT                                   ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "deploy_rexx name='web01'"                       │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl copy-to web01 /path/rexx-linux-x64 /usr/local/bin/rexx        ║
║  ├─ machinectl shell web01 /bin/bash -c "chmod +x /usr/local/bin/rexx"       ║
║  └─ Result: { name: 'web01', rexxPath: '/usr/local/bin/rexx' }               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      // Mock fs.existsSync to return true
      const fs = require('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      const deployPromise = nspawnHandler.deployRexx({
        name: 'web01',
        rexx_binary: '/home/paul/scm/rexxjs/RexxJS/rexx-linux-x64'
      }, {});

      // Mock copy-to command
      setTimeout(() => {
        mockProcess.stdout.emit('data', 'File copied successfully\n');
        mockProcess.emit('close', 0);
      }, 50);

      // Mock chmod command
      setTimeout(() => {
        spawn.mockReturnValueOnce(mockProcess);
        mockProcess.stdout.emit('data', '');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await deployPromise;

      expect(result).toEqual({
        success: true,
        name: 'web01',
        rexxPath: '/usr/local/bin/rexx',
        message: 'RexxJS deployed to machine web01'
      });

      fs.existsSync.mockRestore();
    });

    test('should execute RexxJS script in machine', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         REXXJS SCRIPT EXECUTION                              ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "execute_rexx name='web01' script='say \"hello\"'"│ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl shell web01 /bin/bash -c "echo 'say \"hello\"' > /tmp/..."    ║
║  ├─ machinectl shell web01 /bin/bash -c "/usr/local/bin/rexx /tmp/..."       ║
║  ├─ machinectl shell web01 /bin/bash -c "rm -f /tmp/..."                     ║
║  └─ Result: { name: 'web01', scriptOutput: 'hello' }                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      // Pre-configure machine with RexxJS
      nspawnHandler.activeMachines.set('web01', {
        name: 'web01',
        hasRexx: true,
        rexxPath: '/usr/local/bin/rexx'
      });

      // Mock execInMachine for the three calls (write, execute, cleanup)
      nspawnHandler.execInMachine = jest.fn()
        .mockResolvedValueOnce({ success: true, output: '', message: 'Script written' })  // write
        .mockResolvedValueOnce({ success: true, output: 'hello', message: 'Script executed' })  // execute  
        .mockResolvedValueOnce({ success: true, output: '', message: 'Script cleaned' });  // cleanup

      const executePromise = nspawnHandler.executeRexx({
        name: 'web01',
        script: 'say "hello"'
      }, {});

      const result = await executePromise;

      expect(result).toEqual({
        success: true,
        name: 'web01',
        scriptOutput: 'hello',
        message: 'RexxJS script executed in machine web01'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle machinectl command failures gracefully', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        MACHINECTL ERROR HANDLING                             ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "start name='nonexistent'"                       │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl start nonexistent --network-bridge=host                       ║
║  ├─ ERROR: No machine 'nonexistent' known                                    ║
║  └─ Result: Error thrown with descriptive message                            ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const startPromise = nspawnHandler.startMachine({ name: 'nonexistent' }, {});

      setTimeout(() => {
        spawn.mockReturnValueOnce(mockProcess);
        mockProcess.stderr.emit('data', 'No machine \'nonexistent\' known\n');
        mockProcess.emit('close', 1);
      }, 100);

      try {
        await startPromise;
        // Should not reach this point
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Machine start failed: machinectl command failed: No machine \'nonexistent\' known\n');
      }
    });

    test('should validate security policies for images', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        SECURITY POLICY VALIDATION                            ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "create image='unknown:malicious'"               │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Security Check:                                                              ║
║  ├─ Policy: strict                                                            ║
║  ├─ Image: unknown:malicious (NOT in allowed list)                           ║
║  └─ Result: Error thrown with security policy violation                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      // Initialize handler in strict mode
      await nspawnHandler.initialize({
        securityMode: 'strict',
        allowedImages: ['debian:stable', 'ubuntu:22.04']
      });

      try {
        await nspawnHandler.createMachine({
          image: 'unknown:malicious',
          name: 'test'
        }, {});
        
        // Should not reach this point
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Image unknown:malicious not allowed by security policy');
        expect(spawn).not.toHaveBeenCalled();
      }
    });

    test('should enforce machine count limits', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         MACHINE LIMIT ENFORCEMENT                            ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "create image='debian:stable'" (max reached)     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  Machine Limit Validation:                                                    ║
║  ├─ Max machines: 2 (limit set low for testing)                              ║
║  ├─ Current machines: 2                                                       ║
║  └─ Result: Error thrown with maximum machines reached                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      // Initialize with low max machine limit
      await nspawnHandler.initialize({ maxMachines: 2 });
      
      // Add two machines to reach limit
      nspawnHandler.activeMachines.set('machine1', { name: 'machine1', status: 'running' });
      nspawnHandler.activeMachines.set('machine2', { name: 'machine2', status: 'running' });

      try {
        await nspawnHandler.createMachine({
          image: 'debian:stable',
          name: 'machine3'
        }, {});
        
        // Should not reach this point
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Maximum machines (2) reached');
        expect(spawn).not.toHaveBeenCalled();
      }
    });
  });

  describe('Image Management', () => {
    test('should import image with machinectl pull-tar', async () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         MACHINECTL IMPORT WORKFLOW                           ║
║                                                                               ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  ADDRESS nspawn-handler "import image='custom:latest' url='http://...'"  │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                               ║
║  systemd-nspawn Commands:                                                     ║
║  ├─ machinectl pull-tar http://example.com/image.tar.xz custom:latest        ║
║  └─ Result: { image: 'custom:latest', source: 'http://...' }                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      const importPromise = nspawnHandler.importImage({
        image: 'custom:latest',
        url: 'http://example.com/image.tar.xz'
      }, {});

      setTimeout(() => {
        mockProcess.stdout.emit('data', 'Pulling image custom:latest\n');
        mockProcess.emit('close', 0);
      }, 100);

      const result = await importPromise;

      expect(spawn).toHaveBeenCalledWith('machinectl', [
        'pull-tar', 'http://example.com/image.tar.xz', 'custom:latest'
      ], expect.any(Object));

      expect(result).toEqual({
        success: true,
        image: 'custom:latest',
        source: 'http://example.com/image.tar.xz',
        message: 'Image custom:latest imported successfully'
      });
    });
  });
});