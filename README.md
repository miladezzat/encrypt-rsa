# NodeRSA

**NodeRSA** is a library that provides easy-to-use methods for RSA encryption and decryption. It allows generating RSA key pairs, encrypting, and decrypting strings with RSA public and private keys. This library is ideal for secure data transmission, authentication systems, and any application requiring cryptographic security.

## Installation
```bash
npm install encrypt-rsa
// OR
yarn add encrypt-rsa
```

## Usage
**Importing the Library**

```ts
import NodeRSA from 'encrypt-rsa';
```

## Creating an Instance

You can create an instance of the NodeRSA class with optional public and private keys and modulus length.

```ts
const nodeRSA = new NodeRSA(publicKey, privateKey, modulusLength);
```

## Generating RSA Key Pairs
To generate a new pair of RSA keys:

```ts
const { publicKey, privateKey } = nodeRSA.createPrivateAndPublicKeys(modulusLength);
console.log('Public Key:', publicKey);
console.log('Private Key:', privateKey);
```

## Encrypting and Decrypting Strings
### Encrypting with RSA Public Key
```ts
const text = "Hello, World!";
const encryptedString = nodeRSA.encryptStringWithRsaPublicKey({ text, publicKey });
console.log('Encrypted:', encryptedString);
```

### Decrypting with RSA Private Key
```ts
const decryptedString = nodeRSA.decryptStringWithRsaPrivateKey({ text: encryptedString, privateKey });
console.log('Decrypted:', decryptedString);
```

### Encrypting with RSA Private Key
```ts
const text = "Hello, World!";
const encryptedString = nodeRSA.encrypt({ text, privateKey });
console.log('Encrypted with Private Key:', encryptedString);
```

### Decrypting with RSA Public Key
```ts
const decryptedString = nodeRSA.decrypt({ text: encryptedString, publicKey });
console.log('Decrypted with Public Key:', decryptedString);
```

## API
### NodeRSA Class

### Constructor
```ts
constructor(publicKey?: string, privateKey?: string, modulusLength?: number)
```
- `publicKey`: Optional. The RSA public key.
- `privateKey`: Optional. The RSA private key.
- `modulusLength`: Optional. The modulus length for the RSA key pair (default is 2048).

### Methods
1. `createPrivateAndPublicKeys(modulusLength: number = this.modulusLength): returnCreateKeys`
    - Generates a new pair of RSA keys.
    - `modulusLength`: Optional. The modulus length for the RSA key pair (default is the instance's modulus length).
    - Returns an object containing the `publicKey` and `privateKey`.
2. `encryptStringWithRsaPublicKey(args: parametersOfEncrypt): string`
   - Encrypts a string with the given RSA public key.
   - `args`: Object containing `text` and optionally `publicKey`.
   - Returns the encrypted string in base64 format.
  
3. `decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): string`
    - Decrypts a string with the given RSA private key.
    - `args`: Object containing `text` and optionally `privateKey`.
    - Returns the decrypted string.
  
4. `encrypt(args: parametersOfEncryptPrivate): string`
    - Encrypts a string with the given RSA private key.
    - `args`: Object containing `text` and optionally `privateKey`.
    - Returns the encrypted string in base64 format.
    - 
5. `decrypt(args: parametersOfDecryptPublic): string`
    - Decrypts a string with the given RSA public key.
    - `args`: Object containing `text` and optionally `publicKey`.
    - Returns the decrypted string.
  
### Types
1. parametersOfEncrypt
```ts
{
  text: string;
  publicKey?: string;
}
```
2. parametersOfDecrypt
```ts
{
  text: string;
  privateKey?: string;
}
```
3. parametersOfEncryptPrivate
```ts
{
  text: string;
  privateKey?: string;
}
```
4. parametersOfDecryptPublic
```ts
{
  text: string;
  publicKey?: string;
}
```
5. returnCreateKeys
```ts
{
  publicKey: string;
  privateKey: string;
}
```

### Utilities
1. `convertKetToBase64(key: string): string` 
   Converts a given key to base64 format.

### Helper Functions
1. `encode`
Encodes a string to base64.

2. `decode`
Decodes a base64 string.

### Use Cases

#### Secure Data Transmission

NodeRSA can be used to securely transmit sensitive data over insecure channels. Encrypt data with the recipient's public key before sending it. Only the recipient can decrypt the data with their private key.


```ts
// Sender
const encryptedMessage = nodeRSA.encryptStringWithRsaPublicKey({ text: "Sensitive data", publicKey: recipientPublicKey });
// Send `encryptedMessage` to the recipient

// Recipient
const decryptedMessage = nodeRSA.decryptStringWithRsaPrivateKey({ text: encryptedMessage, privateKey: recipientPrivateKey });
console.log('Decrypted Message:', decryptedMessage);
```

#### Authentication Systems
NodeRSA can be used in authentication systems to encrypt credentials and sensitive information.


```ts
// Encrypting user credentials
const encryptedCredentials = nodeRSA.encryptStringWithRsaPublicKey({ text: "username:password", publicKey: serverPublicKey });

// Decrypting credentials on the server
const decryptedCredentials = nodeRSA.decryptStringWithRsaPrivateKey({ text: encryptedCredentials, privateKey: serverPrivateKey });
console.log('Decrypted Credentials:', decryptedCredentials);
```

### Buffer Encryption/Decryption Methods:

1. `encryptBufferWithRsaPublicKey`: Converts a buffer to Base64 and then encrypts the Base64 string.
2. `decryptBufferWithRsaPrivateKey`: Decrypts the Base64 string and converts it back to a buffer.

#### Example Usage
```ts
const nodeRSA = new NodeRSA();

// Generate keys
const { publicKey, privateKey } = nodeRSA.createPrivateAndPublicKeys();

// Example buffer
const buffer = Buffer.from('This is some binary data');

// Encrypt the buffer
const encryptedBuffer = nodeRSA.encryptBufferWithRsaPublicKey(buffer, publicKey);
console.log('Encrypted Buffer:', encryptedBuffer);

// Decrypt back to buffer
const decryptedBuffer = nodeRSA.decryptBufferWithRsaPrivateKey(encryptedBuffer, privateKey);
console.log('Decrypted Buffer:', decryptedBuffer.toString());  // should log: 'This is some binary data'
```


#### Digital Signatures

Although not directly covered by the current implementation, RSA can also be used for creating and verifying digital signatures to ensure data integrity and authenticity.


## Contribution
We welcome contributions to the NodeRSA library! If you'd like to contribute, please follow these steps:

1. Fork the repository on GitHub.
2. Clone your forked repository to your local machine.
```bash
git clone git@github.com:miladezzat/encrypt-rsa.git
```
3. Create a new branch for your feature or bugfix.
```bash
git checkout -b feature/your-feature-name
```
4. Make your changes to the codebase.
5. Commit your changes with a clear and descriptive commit message.
```bash
git commit -m "Description of your feature or fix"
```
6. Push your changes to your forked repository.
```bash
git push origin feature/your-feature-name
```
7. Create a pull request on the original repository. Be sure to include a detailed description of your changes and the problem they solve.

## Code of Conduct
Please note that this project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.


## Reporting Issues
If you encounter any issues, please report them using the GitHub issue tracker. Include details about the problem and your environment (OS, Node.js version, etc.).

Thank you for contributing to NodeRSA!