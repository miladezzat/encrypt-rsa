const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkRelease } = require('../scripts/check-release');
const local = { name: 'encrypt-rsa', version: '6.1.0' };
const registry = (version, extra = {}) => async (url) => {
  assert.equal(url, 'https://registry.npmjs.org/encrypt-rsa/latest');
  return { ok: true, json: async () => ({ name: local.name, version, ...extra }) };
};
test('publish newer stable version; skip unchanged', async () => {
  assert.equal(await checkRelease(local, registry('6.0.0')), true);
  assert.equal(await checkRelease(local, registry('6.1.0')), false);
});
test('reject older versions across each component', async () => {
  for (const version of ['7.0.0', '6.2.0', '6.1.1']) await assert.rejects(checkRelease(local, registry(version)), /older/);
});
test('fail closed for registry errors and unexpected data', async () => {
  for (const status of [404, 401, 429, 500]) await assert.rejects(checkRelease(local, async () => ({ ok: false, status })), /lookup failed/);
  await assert.rejects(checkRelease(local, async () => { throw new Error('offline'); }), /offline/);
  for (const version of [undefined, '6.1.0-beta.1', '06.1.0', 'broken']) await assert.rejects(checkRelease(local, registry(version)), /stable/);
  await assert.rejects(checkRelease(local, registry('6.0.0', { name: 'other' })), /different package/);
  await assert.rejects(checkRelease({ ...local, version: 'x' }, registry('6.0.0')), /stable/);
});

const { verifyRelease } = require('../scripts/verify-release');
const integrity = `sha512-${Buffer.alloc(64).toString('base64')}`;
const releaseResponse = (extra = {}) => ({ ok: true, json: async () => ({ ...local, dist: { integrity }, ...extra }) });
const clock = () => {
  let elapsed = 0;
  return { now: () => elapsed, wait: async ms => { elapsed += ms; }, log: () => {} };
};
test('verification waits for processing, transient HTTP failures, and network recovery', async () => {
  let attempts = 0;
  const options = { ...clock(), fetchRegistry: async (url, request) => {
    assert.equal(url, 'https://registry.npmjs.org/encrypt-rsa/6.1.0');
    assert.equal(request.cache, 'no-store');
    attempts++;
    if (attempts === 1) return { ok: false, status: 404 };
    if (attempts === 2) throw new Error('offline');
    if (attempts === 3) return { ok: false, status: 503 };
    return releaseResponse();
  } };
  assert.equal((await verifyRelease(local, options)).version, '6.1.0');
  assert.equal(attempts, 4);
});
test('verification checks exact version and integrity; permanent errors fail immediately', async () => {
  for (const status of [400, 401, 403]) {
    let waits = 0;
    await assert.rejects(verifyRelease(local, { ...clock(), wait: async () => { waits++; }, fetchRegistry: async () => ({ ok: false, status }) }), /HTTP/);
    assert.equal(waits, 0);
  }
  for (const extra of [{ version: '6.0.0' }, { name: 'other' }, { dist: {} }]) {
    await assert.rejects(verifyRelease(local, { ...clock(), fetchRegistry: async () => releaseResponse(extra) }), /metadata/);
  }
});
test('verification has a bounded timeout and does not publish or falsely succeed', async () => {
  let attempts = 0;
  await assert.rejects(verifyRelease(local, { ...clock(), timeoutMs: 10000,
    fetchRegistry: async () => { attempts++; return { ok: false, status: 404 }; } }), /Timed out.*Check npm/);
  assert.equal(attempts, 2);
  await assert.rejects(verifyRelease(local, { timeoutMs: 0 }), /timeout/);
});
