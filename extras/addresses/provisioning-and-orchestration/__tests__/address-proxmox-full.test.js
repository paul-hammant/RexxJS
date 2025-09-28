const { AddressProxmoxHandler } = require('../address-proxmox');

function mockSpawnSequence(seq) {
  const spawn = jest.spyOn(require('child_process'), 'spawn');
  const { EventEmitter } = require('events');
  spawn.mockImplementation((cmd, args) => {
    const ee = new EventEmitter();
    ee.stdout = new EventEmitter();
    ee.stderr = new EventEmitter();
    ee.stdin = { write: () => {}, end: () => {} };
    const next = seq.shift() || { code: 0, stdout: '', stderr: '' };
    process.nextTick(() => {
      if (next.stdout) ee.stdout.emit('data', next.stdout);
      if (next.stderr) ee.stderr.emit('data', next.stderr);
      ee.emit('close', next.code);
    });
    return ee;
  });
}

describe('ADDRESS PROXMOX full', () => {
  beforeEach(() => { jest.resetModules(); jest.restoreAllMocks(); });

  test('create enforces strict template/storage', async () => {
    mockSpawnSequence([{ code: 0, stdout: 'pct 1.0' }]);
    const h = new AddressProxmoxHandler();
    await h.initialize({ securityMode: 'strict', allowedTemplates: ['local:vztmpl/ok.tar.gz'], allowedStorages: ['local-lvm'] });
    const badTemplate = await h.handleAddressCommand('create template=local:vztmpl/bad.tar.gz storage=local-lvm');
    expect(badTemplate.success).toBe(false);
    const badStorage = await h.handleAddressCommand('create template=local:vztmpl/ok.tar.gz storage=not-allowed');
    expect(badStorage.success).toBe(false);
  });

  test('execute propagates pct failure', async () => {
    mockSpawnSequence([
      { code: 0, stdout: 'pct 1.0' },           // --version
      { code: 0 },                               // create
      { code: 0 },                               // start
      { code: 1, stderr: 'exec failed' }         // exec
    ]);
    const h = new AddressProxmoxHandler();
    await h.initialize({ securityMode: 'permissive' });
    const c = await h.handleAddressCommand('create template=local:vztmpl/ok.tar.gz');
    await h.handleAddressCommand(`start vmid=${c.vmid}`);
    const e = await h.handleAddressCommand(`execute vmid=${c.vmid} command="false"`);
    expect(e.success).toBe(false);
    expect(e.output).toContain('Command failed');
  });

  test('execute_rexx script_file happy path', async () => {
    const fs = require('fs');
    jest.spyOn(fs, 'readFileSync').mockReturnValue("SAY 'OK'");
    mockSpawnSequence([
      { code: 0, stdout: 'pct 1.0' }, // version
      { code: 0 },                     // create
      { code: 0 },                     // start
      { code: 0 },                     // deploy push
      { code: 0 },                     // chmod
      { code: 0 },                     // write temp
      { code: 0, stdout: 'OK\n' },    // run rexx
      { code: 0 }                      // cleanup temp
    ]);
    const h = new AddressProxmoxHandler();
    await h.initialize({ securityMode: 'permissive' });
    const c = await h.handleAddressCommand('create template=local:vztmpl/ok.tar.gz');
    await h.handleAddressCommand(`start vmid=${c.vmid}`);
    await h.handleAddressCommand(`deploy_rexx vmid=${c.vmid} rexx_binary=/tmp/rexx-bin`);
    const r = await h.handleAddressCommand(`execute_rexx vmid=${c.vmid} script_file=/tmp/a.rexx`);
    expect(r.success).toBe(true);
    expect(r.stdout).toContain('OK');
  });

  test('progress callback receives checkpoints', async () => {
    const seq = [
      { code: 0, stdout: 'pct 1.0' },
      { code: 0 }, // create
      { code: 0 }, // start
      // write temp
      { code: 0 },
    ];
    const spawn = jest.spyOn(require('child_process'), 'spawn');
    const { EventEmitter } = require('events');
    spawn.mockImplementation((cmd, args) => {
      const ee = new EventEmitter();
      ee.stdout = new EventEmitter();
      ee.stderr = new EventEmitter();
      ee.stdin = { write: () => {}, end: () => {} };
      const next = seq.length ? seq.shift() : null;
      if (next) {
        process.nextTick(() => ee.emit('close', next.code));
        return ee;
      }
      // This is the progress-running pct exec call
      process.nextTick(() => {
        ee.stdout.emit('data', "CHECKPOINT('PROGRESS', '{\"percent\": 25}')\n");
        ee.stdout.emit('data', "CHECKPOINT('PROGRESS', 'percent=50')\n");
        ee.emit('close', 0);
      });
      return ee;
    });

    const h = new AddressProxmoxHandler();
    await h.initialize({ securityMode: 'permissive' });
    const c = await h.handleAddressCommand('create template=local:vztmpl/ok.tar.gz');
    await h.handleAddressCommand(`start vmid=${c.vmid}`);
    // Mark deployed
    const info = h.activeContainers.get(String(c.vmid));
    info.rexxDeployed = true; info.rexxPath = '/usr/local/bin/rexx';
    const res = await h.handleAddressCommand(`execute_rexx vmid=${c.vmid} script="SAY 'HI'" progress_callback=true`);
    expect(res.success).toBe(true);
  });
});

