import { test } from 'node:test';
import assert from 'node:assert/strict';
import NodeRSA from '../../../build/node/index.mjs';
import { EncryptedMemory, MemoryBackend } from '../memory.mjs';
import { loadMessages, persistConversation, jsonData } from '../persistence.mjs';
import { fixtureModel } from '../fixtures.mjs';
import { recommend, validateRequirements } from '../assistant.mjs';
import { MockLanguageModelV4 } from 'ai/test';
import { jsonSchema } from 'ai';

const rsa = new NodeRSA();
const key = await rsa.createPrivateAndPublicKeys();
const context = { tenant: 'tenant-a', subject: 'user-a' };
function setup() {
  const backend = new MemoryBackend();
  const ring = { active: 'v1', keys: new Map([['v1', key]]) };
  return { backend, ring, memory: new EncryptedMemory(backend, new Map([['tenant-a', ring], ['tenant-b', ring]])) };
}
const messages = [{ id: 'user-message-1', role: 'user', parts: [{ type: 'text', text: 'How do I encrypt JSON?' }] }];

test('memory stores ciphertext, partitions tenant/user, preserves JSON, rejects swaps and tampering', async () => {
  const { memory, backend } = setup();
  const value = { note: 'private 😀', parts: [{ type: 'tool-result', output: { ok: true } }] };
  await memory.write(context, 'chat', value, 0);
  assert.deepEqual((await memory.read(context, 'chat')).value, value);
  assert.equal(JSON.stringify([...backend.rows.values()]).includes('private'), false);
  assert.equal((await memory.read({ ...context, subject: 'user-b' }, 'chat')).value, null);
  assert.equal((await memory.read({ ...context, tenant: 'tenant-b' }, 'chat')).value, null);
  await memory.write(context, 'other', { other: true }, 0);
  const [first, second] = backend.rows.keys();
  const original = backend.rows.get(first);
  backend.rows.set(first, backend.rows.get(second));
  await assert.rejects(memory.read(context, 'chat'), /mismatch/);
  backend.rows.set(first, { ...original, ciphertext: original.ciphertext.slice(0, -4) + 'AAAA' });
  await assert.rejects(memory.read(context, 'chat'));
  await assert.rejects(memory.read({ ...context, tenant: 'unknown' }, 'chat'), /Unknown/);
  await assert.rejects(memory.read(context, '../escape'), /identifier/);
});

test('CAS prevents lost updates; key rotation retains old decrypt keys until rewrite', async () => {
  const { memory, ring, backend } = setup();
  await memory.write(context, 'chat', ['old'], 0);
  const writes = await Promise.allSettled([memory.write(context, 'chat', ['a'], 1), memory.write(context, 'chat', ['b'], 1)]);
  assert.equal(writes.filter(result => result.status === 'fulfilled').length, 1);
  const next = await rsa.createPrivateAndPublicKeys();
  ring.keys.set('v2', next); ring.active = 'v2';
  const before = await memory.read(context, 'chat');
  await memory.rotate(context, 'chat'); ring.keys.delete('v1');
  assert.deepEqual((await memory.read(context, 'chat')).value, before.value);
  assert.equal([...backend.rows.values()][0].keyId, 'v2');
  await assert.rejects(memory.write(context, 'chat', undefined, 3));
  await assert.rejects(memory.write(context, 'chat', [], -1));
});

test('SDK streams persist completed full history and survive UI disconnect', async () => {
  const { memory } = setup(); let calls = 0;
  const result = await persistConversation({ memory, context, id: 'chat', messages, revision: 0, model: fixtureModel('Completed answer'),
    onSnapshot: () => { calls++; throw new Error('client disconnected'); } });
  assert.equal(calls, 1);
  assert.equal(result.messages[0].id, messages[0].id);
  assert.equal(result.messages[1].role, 'assistant');
  assert.ok(result.messages[1].id);
  assert.equal(result.messages[1].parts.find(part => part.type === 'text').text, 'Completed answer');
  assert.deepEqual((await loadMessages(memory, context, 'chat')).messages, result.messages);
  const continued = await persistConversation({ memory, context, id: 'chat', revision: 1,
    messages: [...result.messages, { ...messages[0], id: 'user-message-2' }], model: fixtureModel('Second answer') });
  assert.equal(continued.messages.length, 4);
  assert.equal(continued.messages[1].id, result.messages[1].id);
});

test('SDK validates metadata/data/tools and preserves full tool output', async () => {
  const { memory } = setup();
  const numberSchema = jsonSchema({ type: 'number' }, { validate: value => typeof value === 'number' ? { success: true, value } : { success: false, error: new Error('number required') } });
  const validation = { metadataSchema: numberSchema, dataSchemas: { count: numberSchema }, tools: { count: { inputSchema: numberSchema, outputSchema: numberSchema } } };
  const full = [{ id: 'tool-1', role: 'assistant', metadata: 1, parts: [
    { type: 'tool-count', toolCallId: 'call-1', state: 'output-available', input: 1, output: 2 },
    { type: 'data-count', id: 'data-1', data: 2 }, { type: 'text', text: 'done', state: 'done' },
  ] }];
  await memory.write(context, 'chat', full, 0);
  assert.deepEqual((await loadMessages(memory, context, 'chat', validation)).messages, full);
  full[0].metadata = 'bad'; await memory.write(context, 'chat', full, 1);
  await assert.rejects(loadMessages(memory, context, 'chat', validation));
});

test('failed generation, malformed messages and write conflicts never overwrite history', async () => {
  const { memory } = setup(); await memory.write(context, 'chat', messages, 0);
  const failed = new MockLanguageModelV4({ doStream: async () => { throw new Error('provider failed'); } });
  await assert.rejects(persistConversation({ memory, context, id: 'chat', messages, revision: 1, model: failed }));
  assert.deepEqual((await memory.read(context, 'chat')).value, messages);
  await assert.rejects(persistConversation({ memory, context, id: 'chat', messages: [{ invalid: true }], revision: 1, model: fixtureModel() }));
  await assert.rejects(persistConversation({ memory, context, id: 'chat', messages, revision: 0, model: fixtureModel() }), /conflict/);
  assert.deepEqual((await memory.read(context, 'chat')).value, messages);
  assert.deepEqual(jsonData({ optional: undefined, parts: [] }), { parts: [] });
  for (const invalid of [NaN, Infinity, -0, new Date(), [undefined]]) assert.throws(() => jsonData(invalid));
});

test('assistant selects all four validated templates; rejects secrets, incompatible model and invalid output', async () => {
  for (const runtime of ['node', 'browser']) for (const operation of ['encrypt-json', 'sign-message']) {
    const result = await recommend({ runtime, operation });
    assert.equal(result.templateId, `${runtime}-${operation === 'encrypt-json' ? 'json' : 'message'}`);
    assert.match(result.code, operation === 'encrypt-json' ? /encryptJSON/ : /verifyMessage/);
    assert.match(result.guide, /^https:\/\/github.com\/miladezzat\/encrypt-rsa/);
  }
  assert.throws(() => validateRequirements({ runtime: 'node', operation: 'encrypt-json', privateKey: 'secret' }));
  assert.throws(() => validateRequirements({ runtime: 'unknown', operation: 'encrypt-json' }));
  await assert.rejects(recommend({ runtime: 'node', operation: 'encrypt-json' }, fixtureModel('{"templateId":"browser-json"}')), /incompatible/);
  await assert.rejects(recommend({ runtime: 'node', operation: 'encrypt-json' }, fixtureModel('{"templateId":"unsafe"}')));
});

test('abort and unavailable storage preserve history; normalization rejects cycles/accessors', async () => {
  const { memory } = setup();
  const controller = new AbortController(); controller.abort();
  await assert.rejects(persistConversation({ memory, context, id: 'chat', messages, revision: 0,
    model: fixtureModel(), abortSignal: controller.signal }));
  assert.equal((await memory.read(context, 'chat')).revision, 0);
  memory.backend.compareAndSet = async () => { throw new Error('storage unavailable'); };
  await assert.rejects(persistConversation({ memory, context, id: 'chat', messages, revision: 0, model: fixtureModel() }), /storage unavailable/);
  assert.equal((await memory.read(context, 'chat')).revision, 0);
  const cycle = {}; cycle.self = cycle; assert.throws(() => jsonData(cycle), /acyclic/);
  let called = false; const getter = Object.defineProperty({}, 'secret', { enumerable: true, get: () => { called = true; } });
  assert.throws(() => jsonData(getter), /data properties/); assert.equal(called, false);
});

test('every approved code template executes with validated placeholders', async () => {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  for (const runtime of ['node', 'browser']) for (const operation of ['encrypt-json', 'sign-message']) {
    const template = await recommend({ runtime, operation });
    // Execute only app-owned static templates, never provider-generated source.
    const code = template.code.replace(/^import .*;$/gm, '');
    const issuer = 'agent-a'; const audience = runtime === 'browser' ? 'web-app' : 'service-b';
    const issuedAt = Date.now();
    const signedText = await rsa.signMessage({ privateKey: key.privateKey, message: {
      purpose: 'agent-result', issuer, audience, keyId: 'signing-2026', issuedAt,
      expiresAt: issuedAt + 60000, nonce: 'fixture-nonce-at-least-16', payload: { result: 'Hello' },
    } });
    const schema = value => {
      assert.ok(value && typeof value === 'object' && !Array.isArray(value)); return value;
    };
    await new AsyncFunction('NodeRSA', 'publicKey', 'privateKey', 'signingPrivateKey', 'validateNote', 'validateResult',
      'trustedKeyResolver', 'atomicReplayStore', 'signedText', 'randomBytes', code)(
      NodeRSA, key.publicKey, key.privateKey, key.privateKey, schema, schema,
      () => key.publicKey, () => true, signedText, (await import('node:crypto')).randomBytes,
    );
  }
});

test('a key rotation during encryption cannot mislabel the stored ciphertext', async () => {
  const { memory, ring, backend } = setup();
  ring.keys.set('v2', await rsa.createPrivateAndPublicKeys());
  const pending = memory.write(context, 'chat', { ok: true }, 0);
  ring.active = 'v2';
  await pending;
  assert.equal([...backend.rows.values()][0].keyId, 'v1');
  assert.deepEqual((await memory.read(context, 'chat')).value, { ok: true });
});

test('an existing null history is rejected rather than reset to an empty conversation', async () => {
  const { memory } = setup();
  assert.deepEqual((await loadMessages(memory, context, 'chat')).messages, []);
  await memory.write(context, 'chat', null, 0);
  await assert.rejects(loadMessages(memory, context, 'chat'));
});
