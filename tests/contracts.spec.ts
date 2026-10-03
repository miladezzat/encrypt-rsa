// These table-driven regressions run cases sequentially to keep crypto workloads bounded.
/* eslint-disable max-len, no-restricted-syntax, no-await-in-loop, no-loop-func */
import { expect } from 'chai';
import * as crypto from 'crypto';
import NodeRSA, * as nodeModule from '../src/node/index';
import WebRSA, * as webModule from '../src/web/index';
import type { INodeRSA, returnCreateKeys, OaepHash } from '../src/shared/types';

async function rejects(result: Promise<unknown>, pattern?: RegExp): Promise<void> {
  expect(result).to.be.instanceOf(Promise);
  let failure: Error | undefined;
  try { await result; } catch (error) { failure = error as Error; }
  expect(failure, 'expected a rejected Promise').not.to.equal(undefined);
  if (pattern) expect((failure as Error).message).to.match(pattern);
}

function craftedHybrid(publicKey: string, keyLength = 32, ivLength = 12): string {
  const aesKey = crypto.randomBytes(keyLength);
  const iv = crypto.randomBytes(ivLength);
  const algorithm = keyLength === 16 ? 'aes-128-gcm' : 'aes-256-gcm';
  const cipher = crypto.createCipheriv(keyLength === 24 ? 'aes-192-gcm' : algorithm, aesKey, iv);
  const data = Buffer.concat([cipher.update('crafted control'), cipher.final()]);
  const wrapped = crypto.publicEncrypt({ key: publicKey, oaepHash: 'sha1' }, aesKey);
  return [wrapped, iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join(':');
}

describe('Public contracts and cross-platform regressions', function () {
  this.timeout(15000);
  let keys: returnCreateKeys;
  let other: returnCreateKeys;
  before(async () => {
    keys = await new NodeRSA().createPrivateAndPublicKeys();
    other = await new WebRSA().createPrivateAndPublicKeys();
  });

  for (const [name, Constructor, module] of [
    ['Node', NodeRSA, nodeModule], ['Web', WebRSA, webModule],
  ] as const) {
    describe(name, () => {
      let rsa: INodeRSA;
      before(() => { rsa = new Constructor(keys.publicKey, keys.privateKey); });
      for (const text of ['', '\uFEFFhello', 'العربية 😀\u0000', '\uFEFF'.repeat(2)]) {
        it(`preserves text ${JSON.stringify(text)} through direct and hybrid encryption`, async () => {
          for (const hash of ['sha1', 'sha256'] as OaepHash[]) {
            const direct = await rsa.encryptStringWithRsaPublicKey({ text, oaepHash: hash });
            expect(await rsa.decryptStringWithRsaPrivateKey({ text: direct, oaepHash: hash })).to.equal(text);
            const large = await rsa.encryptLarge({ text, oaepHash: hash });
            expect(await rsa.decryptLarge({ text: large })).to.equal(text);
          }
        });
      }

      it('round-trips multi-megabyte hybrid text without overflowing the parser stack', async () => {
        const text = 'x'.repeat(6 * 1024 * 1024);
        const payload = await rsa.encryptLarge({ text });
        expect(await rsa.decryptLarge({ text: payload })).to.equal(text);
      });

      it('uses the constructor modulus and supports per-call key overrides', async () => {
        const configured = new Constructor(undefined, undefined, 4096);
        const generated = await configured.createPrivateAndPublicKeys();
        expect(crypto.createPublicKey(generated.publicKey).asymmetricKeyDetails?.modulusLength).to.equal(4096);
        const payload = await rsa.encryptLarge({ text: 'override', publicKey: other.publicKey });
        expect(await rsa.decryptLarge({ text: payload, privateKey: other.privateKey })).to.equal('override');
        const signature = await rsa.sign({ text: 'override', privateKey: other.privateKey });
        expect(await rsa.verify({ text: 'override', signature, publicKey: other.publicKey })).to.equal(true);
      });

      it('rejects missing keys through Promises for every key-dependent method', async () => {
        const empty = new Constructor();
        const calls = [
          () => empty.encryptStringWithRsaPublicKey({ text: 'x' }),
          () => empty.decryptStringWithRsaPrivateKey({ text: 'x' }),
          () => empty.encryptLarge({ text: 'x' }),
          () => empty.decryptLarge({ text: 'x' }),
          () => empty.encrypt({ text: 'x' }), () => empty.decrypt({ text: 'x' }),
          () => empty.sign({ text: 'x' }), () => empty.verify({ text: 'x', signature: 'x' }),
          () => empty.encryptBufferWithRsaPublicKey(new Uint8Array()),
          () => empty.decryptBufferWithRsaPrivateKey('x'),
        ];
        for (const call of calls) await rejects(call(), /key is required/i);
      });

      it('rejects invalid key material and wrong keys', async () => {
        await rejects(rsa.encryptStringWithRsaPublicKey({ text: 'x', publicKey: 'invalid' }), /Invalid public key format/);
        await rejects(rsa.decryptStringWithRsaPrivateKey({ text: 'x', privateKey: 'invalid' }), /Invalid private key format/);
        const payload = await rsa.encryptLarge({ text: 'x' });
        await rejects(rsa.decryptLarge({ text: payload, privateKey: other.privateKey }), /Decryption failed/);
      });

      it('preserves arbitrary bytes including NUL and 255 through buffer methods', async () => {
        const bytes = new Uint8Array([0, 1, 127, 128, 254, 255]);
        const payload = await rsa.encryptBufferWithRsaPublicKey(bytes);
        expect(Array.from(await rsa.decryptBufferWithRsaPrivateKey(payload))).to.deep.equal(Array.from(bytes));
      });

      it('checks both OAEP size boundaries and rejects a mismatched direct hash', async () => {
        for (const [hash, max] of [['sha1', 214], ['sha256', 190]] as const) {
          const payload = await rsa.encryptStringWithRsaPublicKey({ text: 'x'.repeat(max), oaepHash: hash });
          expect(await rsa.decryptStringWithRsaPrivateKey({ text: payload, oaepHash: hash })).to.equal('x'.repeat(max));
          await rejects(rsa.encryptStringWithRsaPublicKey({ text: 'x'.repeat(max + 1), oaepHash: hash }));
          await rejects(rsa.decryptStringWithRsaPrivateKey({ text: payload, oaepHash: hash === 'sha1' ? 'sha256' : 'sha1' }));
        }
      });

      it('rejects unsupported hashes, versions, algorithm mismatches and malformed fields', async () => {
        await rejects(rsa.encryptLarge({ text: 'x', oaepHash: 'md5' as OaepHash }), /Unsupported OAEP hash/);
        await rejects(rsa.encryptLarge({ text: 'x', payloadVersion: 'v2' as 'v1' }), /Unsupported payload version/);
        await rejects(rsa.encryptLarge({ text: 'x', oaepHash: 'sha256', payloadVersion: 'legacy' }), /requires payloadVersion v1/);
        const v1 = await rsa.encryptLarge({ text: 'x', oaepHash: 'sha256' });
        await rejects(rsa.decryptLarge({ text: v1, oaepHash: 'sha1' }), /does not match/);
        for (const malformed of ['not-a-payload', v1.replace(':v1:', ':v2:'), v1.replace('A256GCM', 'A128GCM'), `${v1}:extra`]) {
          await rejects(rsa.decryptLarge({ text: malformed }), /Invalid payload format/);
        }
        const legacy = await rsa.encryptLarge({ text: 'x' });
        const parts = legacy.split(':');
        parts[3] = '!invalid';
        await rejects(rsa.decryptLarge({ text: parts.join(':') }), /Invalid payload format/);
      });

      it('rejects every shortened tag, including moving tag bytes into ciphertext', async () => {
        const original = (await rsa.encryptLarge({ text: 'authenticated data' })).split(':');
        const tag = Buffer.from(original[2], 'base64');
        for (const length of [0, 4, 8, 12, 13, 14, 15, 17]) {
          const fields = [...original];
          fields[2] = (length === 17 ? Buffer.concat([tag, Buffer.from([0])]) : tag.subarray(0, length)).toString('base64');
          await rejects(rsa.decryptLarge({ text: fields.join(':') }), /Invalid payload format/);
        }
        const fields = [...original];
        fields[2] = tag.subarray(1).toString('base64');
        fields[3] = Buffer.concat([Buffer.from(fields[3], 'base64'), tag.subarray(0, 1)]).toString('base64');
        await rejects(rsa.decryptLarge({ text: fields.join(':') }), /Invalid payload format/);
      });

      it('enforces IV12 and unwrapped AES key32 while preserving independently crafted legacy payloads', async () => {
        expect(await rsa.decryptLarge({ text: craftedHybrid(keys.publicKey) })).to.equal('crafted control');
        await rejects(rsa.decryptLarge({ text: craftedHybrid(keys.publicKey, 32, 16) }), /Invalid payload format/);
        for (const length of [16, 24]) await rejects(rsa.decryptLarge({ text: craftedHybrid(keys.publicKey, length) }), /Decryption failed/);
      });

      it('accepts legacy whitespace/unpadded base64 and rejects noncanonical v1', async () => {
        const legacy = await rsa.encryptLarge({ text: 'legacy' });
        const alternative = legacy.split(':').map((field) => ` ${field.replace(/=+$/, '')}\n`).join(':');
        expect(await rsa.decryptLarge({ text: alternative })).to.equal('legacy');
        const v1 = await rsa.encryptLarge({ text: 'v1', payloadVersion: 'v1' });
        await rejects(rsa.decryptLarge({ text: `${v1} ` }), /Invalid payload format/);
      });

      it('authenticates v1 metadata and rejects attempts to strip its header', async () => {
        const v1 = await rsa.encryptLarge({ text: 'header control', payloadVersion: 'v1' });
        await rejects(rsa.decryptLarge({ text: v1.split(':').slice(3).join(':') }), /Decryption failed/);
        await rejects(rsa.decryptLarge({ text: v1.replace('SHA1', 'SHA256') }), /Decryption failed/);
      });

      it('signs and verifies, rejecting modified messages, signatures and wrong keys', async () => {
        const text = '\uFEFFsigned العربية 😀';
        const signature = await rsa.sign({ text });
        expect(await rsa.verify({ text, signature })).to.equal(true);
        expect(await rsa.verify({ text: `${text}!`, signature })).to.equal(false);
        expect(await rsa.verify({ text, signature, publicKey: other.publicKey })).to.equal(false);
        for (const invalid of ['', 'garbage!', Buffer.alloc(256).toString('base64')]) {
          expect(await rsa.verify({ text, signature: invalid })).to.equal(false);
        }
      });

      it('parses RSA keys and rejects header-only, corrupt, EC and wrong-role material', async () => {
        const ec = crypto.generateKeyPairSync('ec', {
          namedCurve: 'prime256v1', publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        expect(await module.isValidRSAPublicKey(keys.publicKey)).to.equal(true);
        expect(await module.isValidRSAPrivateKey(keys.privateKey)).to.equal(true);
        for (const key of [undefined, '', keys.privateKey, ec.publicKey, '-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----']) {
          expect(await module.isValidRSAPublicKey(key)).to.equal(false);
        }
        for (const key of [undefined, '', keys.publicKey, ec.privateKey, '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----']) {
          expect(await module.isValidRSAPrivateKey(key)).to.equal(false);
        }
      });

      it('keeps formatting and Unicode chunk helpers available', () => {
        expect(module.isValidPEMPublicKey(keys.publicKey)).to.equal(true);
        expect(module.isValidPEMPrivateKey(keys.privateKey)).to.equal(true);
        expect(module.isValidPEMKey(keys.privateKey)).to.equal(true);
        expect(module.isValidPEMKey(undefined)).to.equal(false);
        const text = 'العربية 😀'.repeat(40);
        const chunks = module.splitIntoChunks(text);
        expect(module.joinChunks(chunks)).to.equal(text);
        for (const chunk of chunks) expect(Buffer.byteLength(chunk)).to.be.at.most(214);
        expect(module.splitIntoChunks('')).to.deep.equal(['']);
      });
    });
  }

  it('generates keys without blocking the event loop and rejects invalid modulus lengths', async () => {
    let yielded = false;
    const pending = new NodeRSA().createPrivateAndPublicKeys(4096).then(() => {
      expect(yielded, 'timer should run while key generation is pending').to.equal(true);
    });
    setTimeout(() => { yielded = true; }, 0);
    await pending;
    await rejects(new NodeRSA().createPrivateAndPublicKeys(-1));
    await rejects(new WebRSA().createPrivateAndPublicKeys(-1));
  });

  for (const [Sender, Recipient] of [[NodeRSA, WebRSA], [WebRSA, NodeRSA]]) {
    it(`interoperates with ${Sender === NodeRSA ? 'Node' : 'Web'} as producer, using Web-generated keys`, async () => {
      const sender = new Sender(other.publicKey, other.privateKey);
      const recipient = new Recipient(other.publicKey, other.privateKey);
      for (const hash of ['sha1', 'sha256'] as OaepHash[]) {
        const text = '\uFEFFinterop العربية 😀';
        const direct = await sender.encryptStringWithRsaPublicKey({ text, oaepHash: hash });
        expect(await recipient.decryptStringWithRsaPrivateKey({ text: direct, oaepHash: hash })).to.equal(text);
        for (const payloadVersion of hash === 'sha1' ? ['legacy', 'v1'] as const : ['v1'] as const) {
          const payload = await sender.encryptLarge({ text, oaepHash: hash, payloadVersion });
          expect(await recipient.decryptLarge({ text: payload })).to.equal(text);
        }
        const signature = await sender.sign({ text });
        expect(await recipient.verify({ text, signature })).to.equal(true);
      }
    });
  }
});
