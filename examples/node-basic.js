// Node.js Basic Example - RSA Encryption & Decryption
// This example demonstrates how to use the encrypt-rsa library in Node.js

const {
  createPrivateAndPublicKeys,
  encryptStringWithRsaPublicKey,
  decryptStringWithRsaPrivateKey,
} = require('../build/node/index.js');

// Step 1: Generate RSA key pair (2048-bit)
console.log('Generating RSA key pair...');
const { publicKey, privateKey } = createPrivateAndPublicKeys(2048);

console.log('Public Key:');
console.log(publicKey.substring(0, 50) + '...\n');

// Step 2: Encrypt a message with public key
const message = 'Hello, RSA Encryption!';
console.log(`Original message: "${message}"`);

const encrypted = encryptStringWithRsaPublicKey({
  text: message,
  publicKey,
});

console.log(`Encrypted (base64): ${encrypted.substring(0, 50)}...\n`);

// Step 3: Decrypt with private key
const decrypted = decryptStringWithRsaPrivateKey({
  text: encrypted,
  privateKey,
});

console.log(`Decrypted message: "${decrypted}"\n`);

// Step 4: Verify encryption/decryption worked
if (decrypted === message) {
  console.log('✓ Success! Message encrypted and decrypted correctly.');
} else {
  console.log('✗ Failed! Message mismatch.');
}

// Step 5: Error handling example
console.log('\n--- Error Handling Example ---');
try {
  const encrypted2 = encryptStringWithRsaPublicKey({
    text: 'This message is way too long to encrypt with a 2048-bit key. ' +
          'RSA with OAEP padding can only encrypt approximately 190 bytes with a 2048-bit key. ' +
          'If you need to encrypt larger messages, consider using a hybrid encryption approach ' +
          'where you encrypt a symmetric key with RSA and then use that key to encrypt your data.',
    publicKey,
  });
} catch (error) {
  console.log('Expected error caught:', error.message);
}
