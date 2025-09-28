const { AddressSSHHandler } = require('../address-ssh');

function mockRunSequence(seq) {
  return (cmd, args, timeout) => {
    const next = seq.length ? seq.shift() : { code: 0, stdout: '', stderr: '' };
    const success = next.code === 0;
    return Promise.resolve({
      success,
      operation: 'exec',
      exitCode: next.code,
      stdout: (next.stdout || '').trim(),
      stderr: (next.stderr || '').trim(),
      output: success ? (next.stdout || '').trim() : (next.stderr || '').trim()
    });
  };
}

describe('ADDRESS SSH', () => {
  beforeEach(() => { jest.resetModules(); jest.restoreAllMocks(); });

  test('connect, status, close', async () => {
    const h = new AddressSSHHandler();
    await h.initialize();
    const c = await h.handleAddressCommand('connect host=example.com user=me');
    expect(c.success).toBe(true);
    const s = await h.handleAddressCommand('status');
    expect(s.sessions.length).toBe(1);
    const cl = await h.handleAddressCommand(`close id=${c.id}`);
    expect(cl.success).toBe(true);
  });

  test('exec success and failure', async () => {
    const h = new AddressSSHHandler();
    await h.initialize();
    h.run = mockRunSequence([
      { code: 0, stdout: 'ok' },
      { code: 1, stderr: 'nope' }
    ]);
    await h.handleAddressCommand('connect host=example.com user=me');
    const ok = await h.handleAddressCommand('exec id=ssh-1 command="echo ok"');
    expect(ok.success).toBe(true);
    const bad = await h.handleAddressCommand('exec id=ssh-1 command="false"');
    expect(bad.success).toBe(false);
  });

  test('copy_to and copy_from validate params', async () => {
    const h = new AddressSSHHandler();
    await h.initialize();
    h.run = mockRunSequence([
      { code: 0 },
      { code: 0 }
    ]);
    await h.handleAddressCommand('connect host=host user=u');
    const up = await h.handleAddressCommand('copy_to id=ssh-1 local=/tmp/a remote=/tmp/a');
    expect(up.success).toBe(true);
    const dn = await h.handleAddressCommand('copy_from id=ssh-1 remote=/tmp/a local=/tmp/b');
    expect(dn.success).toBe(true);
  });
});
