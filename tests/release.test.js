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
