// Node.js basic example - RSA encryption and decryption.
// Run `npm run build` first so the compiled package entry exists.

const builtModule = require('../build/node/node/index.js');

const NodeRSA = builtModule.default || builtModule;

(async () => {
  const nodeRSA = new NodeRSA();

  console.log('Generating RSA key pair...');
  const { publicKey, privateKey } = await nodeRSA.createPrivateAndPublicKeys(2048);

  console.log('Public Key:');
  console.log(`${publicKey.substring(0, 50)}...\n`);

  const message = 'Hello, RSA Encryption!';
  console.log(`Original message: "${message}"`);

  const encrypted = await nodeRSA.encryptStringWithRsaPublicKey({
    text: message,
    publicKey,
  });

  console.log(`Encrypted (base64): ${encrypted.substring(0, 50)}...\n`);

  const decrypted = await nodeRSA.decryptStringWithRsaPrivateKey({
    text: encrypted,
    privateKey,
  });

  console.log(`Decrypted message: "${decrypted}"\n`);

  if (decrypted !== message) {
    throw new Error('Message mismatch after encryption/decryption round trip');
  }

  console.log('Success! Message encrypted and decrypted correctly.');

  console.log('\n--- Large Payload Example ---');
  const largeMessage = 'This message can be much larger than the RSA payload limit. '.repeat(20);
  const encryptedLarge = await nodeRSA.encryptLarge({
    text: largeMessage,
    publicKey,
  });
  const decryptedLarge = await nodeRSA.decryptLarge({
    text: encryptedLarge,
    privateKey,
  });

  if (decryptedLarge !== largeMessage) {
    throw new Error('Large message mismatch after hybrid encryption/decryption round trip');
  }

  console.log('Success! Large message encrypted with hybrid RSA/AES and decrypted correctly.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
