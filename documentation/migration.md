# Migration and new capabilities

## Existing 6.x applications

Keep existing method calls unchanged: SHA-1 OAEP and legacy hybrid output remain defaults. Native ESM imports now return the constructor directly. CommonJS stays `require('encrypt-rsa').default`. Promise failure behavior is consistent across Node and browser builds, including buffer methods.

Key generation is now nonblocking in Node. It still returns a Promise of SPKI/PKCS#8 PEM keys and does not set keys on the instance. Text decryption preserves a leading U+FEFF character in both builds.

Hybrid readers now reject malformed tag/IV lengths and wrapped AES keys of the wrong size. Do not depend on permissive Node base64 parsing of invalid punctuation or base64url. The supported legacy format uses standard base64; whitespace and unpadded standard base64 remain accepted.

## Enable SHA-256 and versioned hybrid data

```ts
const payload = await rsa.encryptLarge({ text, publicKey, oaepHash: 'sha256' });
const restored = await rsa.decryptLarge({ text: payload, privateKey });
```

First upgrade readers to recognize v1. Then enable v1 writers. Direct RSA ciphertext has no format header, so both sides must explicitly select `oaepHash: 'sha256'`; its 2048-bit payload limit is 190 bytes.

## Replace private-key operations with signatures

```ts
const signature = await rsa.sign({ text, privateKey });
const valid = await rsa.verify({ text, signature, publicKey });
```

This is RSA-PSS/SHA-256 with a fixed 32-byte salt. Existing private/public `encrypt` and `decrypt` outputs are not RSA-PSS signatures and cannot be verified with the new API. Keep old readers for legacy data until you migrate its consumers. Browser signing and verification are supported; the old private/public encryption flow remains Node only.

## Upgrade validation

Use `await isValidRSAPublicKey(key)` and `await isValidRSAPrivateKey(key)` for native key parsing. Existing `isValidPEM*` functions only check formatting. Strict helpers target SPKI/PKCS#8 and do not check pair matching or impose a modulus-strength policy.

## Upgrade from 3.x

Crypto methods return Promises. Add `await` or `.then()`/`.catch()` to every call. Import from the package root instead of unsupported internal build paths. Buffer methods return `Uint8Array` in shared types; the Node runtime value is a `Buffer`. The removed misspelled `convertKetToBase64` internal files remain unsupported.
