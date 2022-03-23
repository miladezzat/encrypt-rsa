
# Encrypt By RSA Algorithm

[![npm version](https://badge.fury.io/js/encrypt-rsa.svg)](https://badge.fury.io/js/encrypt-rsa)&nbsp;
![https://img.shields.io/npm/dm/encrypt-rsa.svg](https://img.shields.io/npm/dm/encrypt-rsa.svg)

> RSA is a public-key cryptosystem that is widely used for secure data transmission. It is also one of the oldest. The acronym RSA comes from the surnames of Ron Rivest, Adi Shamir and Leonard Adleman, who publicly described the algorithm in 1977. [Wikipedia](https://en.wikipedia.org/wiki/RSA_(cryptosystem))

RSA algorithm is asymmetric cryptography algorithm. Asymmetric actually means that it works on two different keys i.e. Public Key and Private Key. As the name describes that the Public Key is given to everyone and Private key is kept private.

## For more explanation about RSA Algorithm visit [RSA algorithm](https://milad-ezzat.vercel.app/blog/encrypt-by-rsa-algorithm)

1. [Installation](#installation)
2. [Usage](#usage)

## Installation

```bash
  npm i encrypt-rsa

  // OR

  yarn add encrypt-rsa
```


## Usage

```js
import NodeRSA from 'encrypt-rsa';

//OR

const NodeRSA = require('encrypt-rsa').default;

const fs = require('fs'); // Or import * as fs from 'fs';

const nodeRSA = new NodeRSA();

// create public and private keys

const { privateKey, publicKey } = nodeRSA.createPrivateAndPublicKeys()


// you must have 'public-key' file the key you want to encrypt by it

const encryptedText = nodeRSA.encryptStringWithRsaPublicKey({ 
  text: 'hello', 
  publicKey: public 
});

console.log({ encryptedText });

//result:  {
//   encryptedText: 'QAoJBAj7ZqYR9Qb9vFGfpjBVY7BP0MtlPywyxMSodA7WmOmOn0glOlrLxUqjJrmaKsqxdJxZadEMAM8+6gLNhwcLtbFPRLQEUTSHk2NNhehsPOESoNjwbXOj5Y+zBCSkjVuW6MRkdaTZeGXi0sii1OqvIQGmOaOR2xzEdDj2eD8='
// }

// you must have 'private-key' file the key you want to decrypt by it

const decryptedText = nodeRSA.decryptStringWithRsaPrivateKey({ 
  text: encryptedText, 
  privateKey: private 
});

console.log({ decryptedText });
// result: { decryptedText: 'hello' }

```
