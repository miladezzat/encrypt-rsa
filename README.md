
# Encrypt By RSA Algorithm

[![npm version](https://badge.fury.io/js/encrypt-rsa.svg)](https://badge.fury.io/js/encrypt-rsa)&nbsp;
![https://img.shields.io/npm/dm/encrypt-rsa.svg](https://img.shields.io/npm/dm/encrypt-rsa.svg)

This package works fine with web browsers and servers

> RSA is a public-key cryptoSystem that is widely used for secure data transmission. It is also one of the oldest. The acronym RSA comes from the surnames of Ron Rivest, Adi Shamir and Leonard Adleman, who publicly described the algorithm in 1977. [Wikipedia](https://en.wikipedia.org/wiki/RSA_(cryptosystem))

RSA algorithm is asymmetric cryptography algorithm. Asymmetric actually means that it works on two different keys i.e. Public Key and Private Key. As the name describes that the Public Key is given to everyone and Private key is kept private.

### For more explanation about RSA Algorithm visit 

- [Rsa Algorithm](https://milad-ezzat.vercel.app/blog/encrypt-by-rsa-algorithm)

1. [Installation](#installation)
2. [Usage](#usage)

## Installation

```bash
  npm i encrypt-rsa --only=production
  // OR
  yarn add encrypt-rsa --only=production
```

## Usage

```js
import EncryptRsa from 'encrypt-rsa';

//OR

const EncryptRsa = require('encrypt-rsa').default;

// create instance
const encryptRsa = new EncryptRsa();
```

### Create Private and Public keys

```js
const { privateKey, publicKey } = nodeRSA.createPrivateAndPublicKeys();
```

### Encrypt Text

```js
const encryptedText = encryptRsa.encrypt({ 
  text: 'hello world',   
  privateKey,
});
console.log(encryptedText);
```

### Decrypt Encrypted Text

```js
const decryptedText = nodeRSA.decrypt({ 
  text: encryptedText, 
  publicKey
});
console.log(decryptedText);
// hello world
```

## Rsa Algorithm:
- [RSA Algorithm](https://simple.wikipedia.org/wiki/RSA_algorithm)


### Contributions
feel free to open an [issue](https://github.com/miladezzat/encrypt-rsa/issues) and make a [pull request](https://github.com/miladezzat/encrypt-rsa/pulls)
