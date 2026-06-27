const assert = require('assert');
const path = require('path');

const builtEntry = path.join(__dirname, '..', 'build', 'node', 'node', 'index.js');
const mod = require(builtEntry);
const NodeRSA = mod.default || mod;

(async () => {
  assert.strictEqual(typeof NodeRSA, 'function', 'built entry should export NodeRSA');
  assert.strictEqual(typeof mod.isValidPEMPublicKey, 'function', 'built entry should export key helpers');

  const nodeRSA = new NodeRSA();
  const { privateKey, publicKey } = await nodeRSA.createPrivateAndPublicKeys(2048);
  const encrypted = await nodeRSA.encryptStringWithRsaPublicKey({
    text: 'package smoke',
    publicKey,
  });
  const decrypted = await nodeRSA.decryptStringWithRsaPrivateKey({
    text: encrypted,
    privateKey,
  });

  assert.strictEqual(decrypted, 'package smoke');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
