const { AddressProxmoxHandler } = require('../address-proxmox');

function mockSpawnSuccess(stdout = '', code = 0) {
  jest.spyOn(require('child_process'), 'spawn').mockImplementation((cmd, args) => {
    const { EventEmitter } = require('events');
    const ee = new EventEmitter();
    process.nextTick(() => {
      if (args && args.includes('--version')) {
        ee.stdout && ee.stdout.emit && ee.stdout.emit('data', 'pct 1.0');
      }
      ee.emit('close', code);
    });
    ee.stdout = new EventEmitter();
    ee.stderr = new EventEmitter();
    ee.stdin = { write: () => {}, end: () => {} };
    return ee;
  });
}

describe('ADDRESS PROXMOX simple', () => {
  beforeEach(() => { jest.resetModules(); jest.restoreAllMocks(); });

  test('status and create/start/stop/remove lifecycle happy path', async () => {
    mockSpawnSuccess();
    const handler = new AddressProxmoxHandler();
    await handler.initialize({ securityMode: 'permissive' });

    const s1 = await handler.handleAddressCommand('status');
    expect(s1.success).toBe(true);

    // create
    const c = await handler.handleAddressCommand('create template=local:vztmpl/debian-11-standard_11.3-1_amd64.tar.gz hostname=test');
    expect(c.success).toBe(true);
    const vmid = c.vmid;

    // start
    const st = await handler.handleAddressCommand(`start vmid=${vmid}`);
    expect(st.success).toBe(true);

    // stop
    const sp = await handler.handleAddressCommand(`stop vmid=${vmid}`);
    expect(sp.success).toBe(true);

    // remove
    const rm = await handler.handleAddressCommand(`remove vmid=${vmid}`);
    expect(rm.success).toBe(true);
  });
});

