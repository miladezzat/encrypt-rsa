// Node.js basic example - RSA encryption and decryption.
// Run `npm run build` first so the compiled package entry exists.

const builtModule = require('../build/node/node/index.js');

const { default: NodeRSA, isValidRSAPublicKey, isValidRSAPrivateKey } = builtModule;

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

  const modern = await nodeRSA.encryptLarge({ text: largeMessage, publicKey, oaepHash: 'sha256' });
  if (await nodeRSA.decryptLarge({ text: modern, privateKey }) !== largeMessage) {
    throw new Error('Versioned SHA-256 payload mismatch');
  }
  const direct = await nodeRSA.encryptStringWithRsaPublicKey({ text: message, publicKey, oaepHash: 'sha256' });
  if (await nodeRSA.decryptStringWithRsaPrivateKey({ text: direct, privateKey, oaepHash: 'sha256' }) !== message) {
    throw new Error('Direct SHA-256 mismatch');
  }
  const signature = await nodeRSA.sign({ text: message, privateKey });
  if (!await nodeRSA.verify({ text: message, signature, publicKey })) throw new Error('Signature verification failed');
  if (await nodeRSA.verify({ text: `${message}!`, signature, publicKey })) throw new Error('Modified message was accepted');
  if (!await isValidRSAPublicKey(publicKey) || !await isValidRSAPrivateKey(privateKey)) throw new Error('Key validation failed');
  console.log('Success! SHA-256 direct/hybrid, RSA-PSS signatures, and strict key validation verified.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
