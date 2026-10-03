const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const withPackedConsumer = require('./packed-consumer');

withPackedConsumer(async (consumer) => {
  const run = (script, flags = []) => execFileSync('node', [...flags, '-e', script], { cwd: consumer, stdio: 'pipe' });
  const exercise = `
    const rsa = new NodeRSA();
    const { privateKey, publicKey } = await rsa.createPrivateAndPublicKeys();
    if (!await isValidRSAPublicKey(publicKey)) throw new Error('key export missing');
    const ciphertext = await rsa.encryptLarge({ text: '\\uFEFFinstalled package', publicKey, oaepHash: 'sha256' });
    if (await rsa.decryptLarge({ text: ciphertext, privateKey }) !== '\\uFEFFinstalled package') throw new Error('round trip failed');
    const signature = await rsa.sign({ text: 'installed package', privateKey });
    if (!await rsa.verify({ text: 'installed package', signature, publicKey })) throw new Error('signature failed');
  `;
  run(`const {default: NodeRSA, isValidRSAPublicKey} = require('encrypt-rsa');
    (async () => { ${exercise} })().catch(e => { console.error(e); process.exit(1); });`);
  run(`import NodeRSA, { isValidRSAPublicKey } from 'encrypt-rsa'; ${exercise}`, ['--input-type=module']);

  fs.writeFileSync(path.join(consumer, 'consumer.mts'), `
    import NodeRSA, { isValidRSAPublicKey, OaepHash, parametersOfEncryptLarge } from 'encrypt-rsa';
    const hash: OaepHash = 'sha256';
    const args: parametersOfEncryptLarge = { text: 'types', oaepHash: hash, payloadVersion: 'v1' };
    const rsa = new NodeRSA();
    const ciphertext: Promise<string> = rsa.encryptLarge(args);
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
