# Encrypt By RSA Algorithm

[![npm version](https://badge.fury.io/js/encrypt-rsa.svg)](https://badge.fury.io/js/encrypt-rsa)&nbsp;


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

const nodeRSA = new NodeRSA();

// you must have 'public-key' file the key you want to encrypt by it

const encryptedText = nodeRSA.encryptStringWithRsaPublicKey({ 
  text: 'hello', 
  keyPath: path.join(__dirname, './public-key') 
});

console.log({ encryptedText });

//result:  {
//   encryptedText: 'QAoJBAj7ZqYR9Qb9vFGfpjBVY7BP0MtlPywyxMSodA7WmOmOn0glOlrLxUqjJrmaKsqxdJxZadEMAM8+6gLNhwcLtbFPRLQEUTSHk2NNhehsPOESoNjwbXOj5Y+zBCSkjVuW6MRkdaTZeGXi0sii1OqvIQGmOaOR2xzEdDj2eD8='
// }

// you must have 'private-key' file the key you want to decrypt by it

const decryptedText = nodeRSA.decryptStringWithRsaPrivateKey({ 
  text: encryptedText, 
  keyPath: path.join(__dirname, './private-key') 
});

console.log({ decryptedText });
// result: { decryptedText: 'hello' }

```

