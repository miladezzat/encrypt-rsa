const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const withPackedConsumer = require('./packed-consumer');

withPackedConsumer(async (consumer) => {
  const run = (script, flags = []) => execFileSync('node', [...flags, '-e', script], { cwd: consumer, stdio: 'pipe' });
  const installedMetadata = JSON.parse(fs.readFileSync(path.join(consumer, 'node_modules/encrypt-rsa/package.json')));
  if (Object.keys(installedMetadata.dependencies || {}).length || installedMetadata.peerDependencies) throw new Error('Core must remain dependency-free');
  if (fs.existsSync(path.join(consumer, 'node_modules/encrypt-rsa/examples'))) throw new Error('Private AI app must not be packed');
  const exercise = `
    const rsa = new NodeRSA();
    const { privateKey, publicKey } = await rsa.createPrivateAndPublicKeys();
    if (!await isValidRSAPublicKey(publicKey)) throw new Error('key export missing');
    const ciphertext = await rsa.encryptLarge({ text: '\\uFEFFinstalled package', publicKey, oaepHash: 'sha256' });
    if (await rsa.decryptLarge({ text: ciphertext, privateKey }) !== '\\uFEFFinstalled package') throw new Error('round trip failed');
    const json = await rsa.encryptJSON({ value: { note: 'installed 😀' }, publicKey });
    const parsed = await rsa.decryptJSON({ text: json, privateKey, parse: value => {
      if (value.note !== 'installed 😀') throw new Error('invalid JSON'); return value.note;
    } });
    if (parsed !== 'installed 😀') throw new Error('JSON round trip failed');
    const now = Date.now();
    const message = { issuer: 'a', audience: 'b', purpose: 'test', keyId: 'key-1', issuedAt: now, expiresAt: now + 60000, nonce: 'random-test-nonce-12345678', payload: { note: 'signed' } };
    const envelope = await rsa.signMessage({ message, privateKey });
    let consumed = false;
    const args = { text: envelope, expected: { issuer: 'a', audience: 'b', purpose: 'test' }, resolvePublicKey: () => publicKey, consumeNonce: () => { if (consumed) return false; consumed = true; return true; } };
    if ((await rsa.verifyMessage(args)).payload.note !== 'signed') throw new Error('message round trip failed');
    let replayRejected = false; try { await rsa.verifyMessage(args); } catch { replayRejected = true; }
    if (!replayRejected) throw new Error('message replay accepted');
    const signature = await rsa.sign({ text: 'installed package', privateKey });
    if (!await rsa.verify({ text: 'installed package', signature, publicKey })) throw new Error('signature failed');
  `;
  run(`const {default: NodeRSA, isValidRSAPublicKey} = require('encrypt-rsa');
    (async () => { ${exercise} })().catch(e => { console.error(e); process.exit(1); });`);
  run(`import NodeRSA, { isValidRSAPublicKey } from 'encrypt-rsa'; ${exercise}`, ['--input-type=module']);

  fs.writeFileSync(path.join(consumer, 'consumer.mts'), `
    import NodeRSA, { isValidRSAPublicKey, OaepHash, parametersOfEncryptLarge, JsonValue, MessageClaims, INodeRSA } from 'encrypt-rsa';
    const hash: OaepHash = 'sha256';
    const args: parametersOfEncryptLarge = { text: 'types', oaepHash: hash, payloadVersion: 'v1' };
    const rsa = new NodeRSA();
    const ciphertext: Promise<string> = rsa.encryptLarge(args);
    const api: INodeRSA = rsa;
    const rawJson: Promise<JsonValue> = api.decryptJSON({ text: '' });
    const parsedJson: Promise<{ note: string }> = rsa.decryptJSON({ text: '', parse: () => ({ note: 'validated' }) });
    // @ts-expect-error A schema-free generic must not pretend validation happened.
    rsa.decryptJSON<{ note: string }>({ text: '' });
    const verifiedMessage: Promise<MessageClaims<{ note: string }>> = api.verifyMessage({ text: '',
      expected: { issuer: 'a', audience: 'b', purpose: 'test' }, resolvePublicKey: () => '', consumeNonce: () => true,
      parse: () => ({ note: 'validated' }) });
    const valid: Promise<boolean> = isValidRSAPublicKey('invalid');
    const signature: Promise<string> = rsa.sign({ text: 'types' });
    const verified: Promise<boolean> = rsa.verify({ text: 'types', signature: 'invalid' });
  `);
  fs.writeFileSync(path.join(consumer, 'consumer.cts'), `
    import mod = require('encrypt-rsa');
    const rsa = new mod.default();
    const ciphertext: Promise<string> = rsa.encryptLarge({ text: 'types', oaepHash: 'sha256' });
  `);
  execFileSync('node', [require.resolve('typescript/lib/tsc'), '--noEmit', '--strict', '--target', 'es2020',
    '--module', 'node16', '--moduleResolution', 'node16', '--types', 'node',
    '--typeRoots', path.dirname(path.dirname(require.resolve('@types/node/package.json'))),
    'consumer.mts', 'consumer.cts'], { cwd: consumer, stdio: 'pipe' });
  console.log('Packed package: CommonJS, native ESM, and TypeScript consumers passed');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
