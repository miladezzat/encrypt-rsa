
# NodeRSA

[![npm version](https://badge.fury.io/js/encrypt-rsa.svg)](https://badge.fury.io/js/encrypt-rsa)&nbsp;
![https://img.shields.io/npm/dm/encrypt-rsa.svg](https://img.shields.io/npm/dm/encrypt-rsa.svg)

This package works fine with web browsers and servers

> RSA is a public-key cryptoSystem that is widely used for secure data transmission. It is also one of the oldest. The acronym RSA comes from the surnames of Ron Rivest, Adi Shamir and Leonard Adleman, who publicly described the algorithm in 1977. [Wikipedia](https://en.wikipedia.org/wiki/RSA_(cryptosystem))

RSA algorithm is asymmetric cryptography algorithm. Asymmetric actually means that it works on two different keys i.e. Public Key and Private Key. As the name describes that the Public Key is given to everyone and Private key is kept private.

### For more explanation about RSA Algorithm visit 

- [Rsa Algorithm](https://milad-ezzat.vercel.app/blog/encrypt-by-rsa-algorithm)

**NodeRSA** is a library that provides easy-to-use methods for RSA encryption and decryption. It allows generating RSA key pairs, encrypting, and decrypting strings with RSA public and private keys. This library is ideal for secure data transmission, authentication systems, and any application requiring cryptographic security.

## Installation
```bash
npm install node-rsa
// OR
yarn add node-rsa
```

## Usage
**Importing the Library**

```ts
import NodeRSA from 'node-rsa';
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

#### Digital Signatures

Although not directly covered by the current implementation, RSA can also be used for creating and verifying digital signatures to ensure data integrity and authenticity.

