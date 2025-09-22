const { AddressRemoteDockerHandler } = require('../address-remote-docker');

function mockSSHHandlerSequence(seq) {
  return async (op, params) => {
    const next = seq.length ? seq.shift() : { exitCode: 0, stdout: '', stderr: '' };
    const success = next.exitCode === 0;
    return { success, exitCode: next.exitCode, stdout: next.stdout || '', stderr: next.stderr || '', output: success ? (next.stdout||'') : (next.stderr||'') };
  };
}

describe('ADDRESS REMOTE DOCKER', () => {
  test('create/start/execute/deploy_rexx happy path', async () => {
    const ssh = mockSSHHandlerSequence([
      { exitCode: 0, stdout: '' }, // create
      { exitCode: 0, stdout: '' }, // start
      { exitCode: 0, stdout: '' }, // scp up binary
      { exitCode: 0, stdout: '' }, // docker cp
      { exitCode: 0, stdout: '' }, // chmod
      { exitCode: 0, stdout: 'HELLO\n' } // exec rexx
    ]);
    const h = new AddressRemoteDockerHandler({ sshHandler: ssh });
    await h.initialize();
    const host = 'example.com';
    const c = await h.handleAddressCommand('create host=example.com image=alpine name=t1');
    expect(c.success).toBe(true);
    const s = await h.handleAddressCommand('start host=example.com name=t1');
    expect(s.success).toBe(true);
    const d = await h.handleAddressCommand('deploy_rexx host=example.com name=t1 local_binary=/tmp/rexx');
    expect(d.success).toBe(true);
    const r = await h.handleAddressCommand('execute_rexx host=example.com name=t1 script="SAY \"HELLO\""');
    expect(r.success).toBe(true);
    expect((r.stdout||'').includes('HELLO')).toBe(true);
  });

  test('docker exec error propagates', async () => {
    const ssh = mockSSHHandlerSequence([
      { exitCode: 1, stderr: 'boom' }
    ]);
    const h = new AddressRemoteDockerHandler({ sshHandler: ssh });
    await h.initialize();
    const res = await h.handleAddressCommand('execute host=example.com name=t1 command="false"');
    expect(res.success).toBe(false);
  });
});

