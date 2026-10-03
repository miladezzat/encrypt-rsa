// Sequential runtime matrices keep cryptographic work bounded.
/* eslint-disable no-restricted-syntax, no-await-in-loop, no-loop-func, max-len */
import { expect } from 'chai';
import * as crypto from 'crypto';
import NodeRSA from '../src/node/index';
import WebRSA from '../src/web/index';
import { stringifyJson } from '../src/shared/json';
import type {
  JsonValue, MessageClaims, NonceClaim, parametersOfVerifyMessage, returnCreateKeys,
} from '../src/shared/types';

async function rejects(promise: Promise<unknown>, pattern?: RegExp): Promise<void> {
  expect(promise).to.be.instanceOf(Promise);
  let failure: Error | undefined;
  try { await promise; } catch (error) { failure = error as Error; }
  expect(failure, 'expected rejection').not.to.equal(undefined);
  if (pattern) expect(failure?.message).to.match(pattern);
}

describe('Bounded JSON and signed message contracts', function () {
  this.timeout(20000);
  let keys: returnCreateKeys;
  let other: returnCreateKeys;
  const now = 1700000000000;
  const message = (): MessageClaims => ({
    issuer: 'agent-a',
    audience: 'agent-b',
    purpose: 'tool-result',
    keyId: 'signing-key-1',
    issuedAt: now,
    expiresAt: now + 60000,
    nonce: crypto.randomBytes(16).toString('hex'),
    payload: { result: 'العربية 😀', nested: [null, true, 1] },
  });
  before(async () => {
    keys = await new NodeRSA().createPrivateAndPublicKeys();
    other = await new NodeRSA().createPrivateAndPublicKeys();
  });
  const verifier = (text: string, consumed = new Set<string>()): parametersOfVerifyMessage => ({
    text,
    expected: { issuer: 'agent-a', audience: 'agent-b', purpose: 'tool-result' },
    now: () => now,
    resolvePublicKey: ({ issuer, keyId }) => (issuer === 'agent-a' && keyId === 'signing-key-1' ? keys.publicKey : ''),
    consumeNonce: async (claim: NonceClaim) => {
      const id = JSON.stringify([claim.issuer, claim.audience, claim.purpose, claim.nonce]);
      if (consumed.has(id)) return false;
      consumed.add(id);
      return true;
    },
  });

  for (const [name, Constructor] of [['Node', NodeRSA], ['Web', WebRSA]] as const) {
    describe(name, () => {
      let rsa: NodeRSA | WebRSA;
      before(() => { rsa = new Constructor(keys.publicKey, keys.privateKey); });
      for (const value of [null, false, 1.25, '', '\uFEFFالعربية 😀\u0000', [], {}, { text: 'x', array: [null, true, 1] }] as JsonValue[]) {
        it(`round-trips JSON root ${JSON.stringify(value)}`, async () => {
          const text = await rsa.encryptJSON({ value });
          expect(text).to.match(/^encrypt-rsa:v1:RSA-OAEP-SHA256\+A256GCM:/);
          expect(await rsa.decryptJSON({ text })).to.deep.equal(value);
          expect(JSON.parse(await rsa.decryptLarge({ text }))).to.deep.equal(value);
        });
      }
      it('supports per-call keys and synchronous/asynchronous schema parsers', async () => {
        const text = await rsa.encryptJSON({ value: { count: 3 }, publicKey: other.publicKey });
        const parse = (value: JsonValue): number => {
          if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.count !== 'number') throw new Error('schema');
          return value.count;
        };
        expect(await rsa.decryptJSON({ text, privateKey: other.privateKey, parse })).to.equal(3);
        expect(await rsa.decryptJSON({ text, privateKey: other.privateKey, parse: async (value) => parse(value) })).to.equal(3);
        await rejects(rsa.decryptJSON({ text, privateKey: other.privateKey, parse: () => { throw new Error('schema rejection'); } }), /schema rejection/);
        await rejects(rsa.decryptJSON({ text }), /Decryption failed/);
      });
      it('rejects lossy/executable data without invoking accessors or toJSON', async () => {
        const cycle: { self?: unknown } = {};
        cycle.self = cycle;
        const sparse = Array(2);
        const extra = Object.assign([1], { extra: 2 });
        let executed = 0;
        const accessor = Object.defineProperty({}, 'secret', { enumerable: true, get: () => { executed++; return 'x'; } });
        const toJSON = { toJSON: () => { executed++; return 'x'; } };
        const hidden = Object.defineProperty({}, 'secret', { value: 'x' });
        for (const value of [undefined, BigInt(1), NaN, Infinity, -0, new Date(), new Map(), cycle, sparse, extra, accessor, toJSON, hidden, { x: undefined }, { x: Symbol('x') }, { [Symbol('x')]: 1 }, '\ud800', { '\udc00': 1 }]) {
          await rejects(rsa.encryptJSON({ value: value as JsonValue }));
        }
        expect(executed).to.equal(0);
      });
      it('bounds bytes, encoded input, depth, and limit configuration', async () => {
        const text = await rsa.encryptJSON({ value: '😀', limits: { maxBytes: 6 } });
        expect(await rsa.decryptJSON({ text, limits: { maxBytes: 6 } })).to.equal('😀');
        await rejects(rsa.encryptJSON({ value: '😀', limits: { maxBytes: 5 } }), /maxBytes/);
        await rejects(rsa.decryptJSON({ text, limits: { maxBytes: 5 } }), /maxBytes/);
        await rejects(rsa.decryptJSON({ text, limits: { maxPayloadBytes: 10 } }), /maxPayloadBytes/);
        await rejects(rsa.encryptJSON({ value: { a: { b: { c: null } } }, limits: { maxDepth: 2 } }), /maxDepth/);
        for (const maxBytes of [0, -1, 1.5, Infinity, 64 * 1024 * 1024 + 1]) await rejects(rsa.encryptJSON({ value: {}, limits: { maxBytes } }), /Invalid JSON limit/);
        await rejects(rsa.encryptJSON({ value: {}, limits: { maxDepth: 257 } }), /Invalid JSON limit/);
        await rejects(rsa.encryptJSON({ value: 'x'.repeat(1024 * 1024) }), /maxBytes/);
      });
      it('reads JSON from the existing string API and rejects malformed or tampered content', async () => {
        const legacy = await rsa.encryptLarge({ text: '{"ok":true}' });
        expect(await rsa.decryptJSON({ text: legacy })).to.deep.equal({ ok: true });
        for (const malformed of ['not JSON', '{', '{"x":1e400}', '"\\ud800"', '-0']) {
          await rejects(rsa.decryptJSON({ text: await rsa.encryptLarge({ text: malformed }) }));
        }
        const encrypted = (await rsa.encryptJSON({ value: { ok: true } })).split(':');
        encrypted[5] = Buffer.alloc(16).toString('base64');
        await rejects(rsa.decryptJSON({ text: encrypted.join(':') }), /Decryption failed/);
      });
      it('preserves prototype-named JSON keys without polluting object prototypes', async () => {
        const value = JSON.parse('{"__proto__":{"polluted":true},"constructor":"x"}');
        const text = await rsa.encryptJSON({ value });
        expect(await rsa.decryptJSON({ text })).to.deep.equal(value);
        expect(({} as { polluted?: boolean }).polluted).to.equal(undefined);
      });
      it('rejects missing keys and malformed JSON/message arguments through Promises', async () => {
        const empty = new Constructor();
        await rejects(empty.encryptJSON({ value: {} }), /Public key is required/);
        await rejects(empty.decryptJSON({ text: 'x' }), /Private key is required/);
        await rejects(empty.signMessage({ message: message() }), /Private key is required/);
        await rejects(rsa.verifyMessage({ ...verifier('x'), consumeNonce: undefined as never }), /atomic nonce/);
      });
      it('signs canonical messages verifiable independently with RSA-PSS salt32', async () => {
        const claims = message();
        const text = await rsa.signMessage({ message: claims });
        const envelope = JSON.parse(text);
        const { signature } = envelope;
        delete envelope.signature;
        expect(crypto.verify('sha256', Buffer.from(`encrypt-rsa:signed-message:v1\n${stringifyJson(envelope)}`), {
          key: keys.publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32,
        }, Buffer.from(signature, 'base64'))).to.equal(true);
        const verified = await rsa.verifyMessage({ ...verifier(text), parse: (payload) => ({ validated: payload }) });
        expect(verified.payload).to.deep.equal({ validated: claims.payload });
        expect(verified.issuer).to.equal(claims.issuer);
      });
      it('snapshots claims before async signing', async () => {
        const claims = message();
        const pending = rsa.signMessage({ message: claims });
        (claims.payload as { result: string }).result = 'mutated';
        expect((await rsa.verifyMessage(verifier(await pending))).payload).not.to.deep.equal(claims.payload);
      });
      it('rejects every modified security field and noncanonical/duplicate JSON', async () => {
        const text = await rsa.signMessage({ message: message() });
        const envelope = JSON.parse(text);
        for (const [field, value] of Object.entries({
          issuer: 'evil', audience: 'evil', purpose: 'evil', keyId: 'unknown', issuedAt: now - 1, expiresAt: now + 1, nonce: 'aaaaaaaaaaaaaaaa', payload: {}, version: 2, algorithm: 'RSA-PSS-SHA1', extra: true,
        })) {
          await rejects(rsa.verifyMessage(verifier(stringifyJson({ ...envelope, [field]: value }))));
        }
        await rejects(rsa.verifyMessage(verifier(` ${text}`)), /canonical/);
        await rejects(rsa.verifyMessage(verifier(text.replace('{', '{"version":1,'))), /canonical/);
        await rejects(rsa.verifyMessage(verifier(stringifyJson({ ...envelope, signature: 'invalid!' }))));
        await rejects(rsa.verifyMessage({ ...verifier(text), resolvePublicKey: () => other.publicKey }), /signature/);
      });
      it('checks expected scope, timestamps, clock skew, and maximum lifetime', async () => {
        const text = await rsa.signMessage({ message: message() });
        await rejects(rsa.verifyMessage({ ...verifier(text), expected: { issuer: 'agent-a', audience: 'another', purpose: 'tool-result' } }), /identity/);
        await rejects(rsa.verifyMessage({ ...verifier(text), now: () => now - 1 }), /future/);
        await rejects(rsa.verifyMessage({ ...verifier(text), now: () => now + 60000 }), /expired/);
        await rejects(rsa.verifyMessage({ ...verifier(text), maxLifetimeMs: 59999 }), /lifetime/);
        expect((await rsa.verifyMessage({ ...verifier(text), now: () => now - 1, clockSkewMs: 1 })).issuer).to.equal('agent-a');
        for (const clockSkewMs of [-1, 60001, Infinity, 0.5]) await rejects(rsa.verifyMessage({ ...verifier(text), clockSkewMs }), /time policy/);
        await rejects(rsa.verifyMessage({ ...verifier(text), now: () => NaN }), /timestamp/);
        await rejects(rsa.signMessage({ message: { ...message(), expiresAt: now } }), /lifetime/);
        await rejects(rsa.signMessage({ message: { ...message(), nonce: 'short' } }), /nonce/);
      });
      it('atomically rejects simultaneous replay and fails closed on store errors', async () => {
        const text = await rsa.signMessage({ message: message() });
        const args = verifier(text);
        const results = await Promise.allSettled([rsa.verifyMessage(args), rsa.verifyMessage(args)]);
        expect(results.filter((result) => result.status === 'fulfilled')).to.have.length(1);
        await rejects(rsa.verifyMessage({ ...verifier(text), consumeNonce: async () => { throw new Error('store unavailable'); } }), /store unavailable/);
        await rejects(rsa.verifyMessage({ ...verifier(text), consumeNonce: () => Promise.resolve('true' as unknown as boolean) }), /nonce/);
      });
      it('does not consume a nonce before valid signature/schema and retains it through skew', async () => {
        const text = await rsa.signMessage({ message: message() });
        let consumed = 0;
        let validUntil = 0;
        const consumeNonce = async (claim: NonceClaim): Promise<boolean> => { consumed++; validUntil = claim.validUntil; return true; };
        await rejects(rsa.verifyMessage({ ...verifier(text), consumeNonce, resolvePublicKey: () => other.publicKey }));
        await rejects(rsa.verifyMessage({ ...verifier(text), consumeNonce, parse: () => { throw new Error('schema'); } }));
        expect(consumed).to.equal(0);
        await rsa.verifyMessage({ ...verifier(text), consumeNonce, clockSkewMs: 1000 });
        expect(validUntil).to.equal(now + 61000);
      });
      it('rechecks expiry after asynchronous key/schema/store work', async () => {
        const text = await rsa.signMessage({ message: message() });
        let clock = now;
        await rejects(rsa.verifyMessage({ ...verifier(text), now: () => clock, resolvePublicKey: async () => { clock = now + 60000; return keys.publicKey; } }), /expired/);
        clock = now;
        await rejects(rsa.verifyMessage({ ...verifier(text), now: () => clock, parse: async (value) => { clock = now + 60000; return value; } }), /expired/);
        clock = now;
        await rejects(rsa.verifyMessage({ ...verifier(text), now: () => clock, consumeNonce: async () => { clock = now + 60000; return true; } }), /expired/);
      });
    });
  }
  it('interoperates in both directions for JSON and signed messages', async () => {
    const node = new NodeRSA(keys.publicKey, keys.privateKey);
    const web = new WebRSA(keys.publicKey, keys.privateKey);
    const value = { data: ['😀', null], count: 1 };
    expect(await node.decryptJSON({ text: await web.encryptJSON({ value }) })).to.deep.equal(value);
    expect(await web.decryptJSON({ text: await node.encryptJSON({ value }) })).to.deep.equal(value);
    expect((await node.verifyMessage(verifier(await web.signMessage({ message: message() })))).purpose).to.equal('tool-result');
    expect((await web.verifyMessage(verifier(await node.signMessage({ message: message() })))).purpose).to.equal('tool-result');
  });
  it('matches canonical property sorting and numeric encodings in the supported RFC 8785 subset', () => {
    expect(stringifyJson({ z: [1e30, 4.50, 2e-3], a: '\u000f\n"\\' })).to.equal('{"a":"\\u000f\\n\\"\\\\","z":[1e+30,4.5,0.002]}');
    const shared = { value: 1 };
    expect(stringifyJson([shared, shared])).to.equal('[{"value":1},{"value":1}]');
  });
});
