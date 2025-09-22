const {
  parseKeyValueString,
  parseCheckpointOutput,
  parseEnhancedCheckpointOutput,
  wrapScriptWithCheckpoints,
  formatStatus,
} = require('../shared-utils');

describe('shared-utils checkpoint helpers', () => {
  test('parseKeyValueString parses numeric and string values', () => {
    const parsed = parseKeyValueString('a=1 b=test c=42');
    expect(parsed.a).toBe(1);
    expect(parsed.b).toBe('test');
    expect(parsed.c).toBe(42);
  });

  test('parseCheckpointOutput extracts key=value params', () => {
    const output = "line\nCHECKPOINT('PROGRESS', 'stage=run percent=50 item=3')\nend";
    const calls = [];
    parseCheckpointOutput(output, (chk, params) => calls.push({ chk, params }));
    expect(calls).toHaveLength(1);
    expect(calls[0].chk).toBe('PROGRESS');
    expect(calls[0].params.stage).toBe('run');
    expect(calls[0].params.percent).toBe(50);
    expect(calls[0].params.item).toBe(3);
  });

  test('parseEnhancedCheckpointOutput supports JSON and key=value', () => {
    const out = [
      "CHECKPOINT('ONE', '{\"x\":1,\"y\":\"ok\"}')",
      "CHECKPOINT('TWO', 'key=val num=5')",
    ].join('\n');
    const recs = [];
    parseEnhancedCheckpointOutput(out, (rec) => recs.push(rec));
    expect(recs).toHaveLength(2);
    expect(recs[0].checkpoint).toBe('ONE');
    expect(recs[0].params.x).toBe(1);
    expect(recs[0].params.y).toBe('ok');
    expect(recs[1].checkpoint).toBe('TWO');
    expect(recs[1].params.key).toBe('val');
    expect(recs[1].params.num).toBe(5);
  });

  test('wrapScriptWithCheckpoints wraps only when progressCallback present', () => {
    const script = "SAY 'Hello'";
    const wrapped = wrapScriptWithCheckpoints(script, { progressCallback: () => {} });
    expect(wrapped).toContain("CHECKPOINT('INIT'");
    expect(wrapped).toContain(script);
    const untouched = wrapScriptWithCheckpoints(script, {});
    expect(untouched).toBe(script);
  });

  test('formatStatus formats consistently', () => {
    const txt = formatStatus('podman', 2, 10, 'moderate');
    expect(txt).toBe('ADDRESS PODMAN: 2/10 containers active');
  });
});

