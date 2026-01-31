# Feature parity: Node vs Web

Both builds implement the same **INodeRSA** interface. This table shows what is implemented where and any limitations.

| Feature | Node (`src/node/`) | Web (`src/web/`) | Notes |
|--------|--------------------|------------------|--------|
| **Constructor** `(publicKey?, privateKey?, modulusLength?)` | Yes | Yes | Same signature; default `modulusLength` 2048. |
| **encryptStringWithRsaPublicKey** `(args) → Promise<string>` | Yes | Yes | Encrypt with public key. RSA-OAEP + SHA-1 in both. |
| **decryptStringWithRsaPrivateKey** `(args) → Promise<string>` | Yes | Yes | Decrypt with private key. RSA-OAEP + SHA-1 in both. |
| **encrypt** `(args) → Promise<string>` | Yes | **Throws** | Encrypt with **private** key. Web Crypto has no equivalent; web build throws with a clear message. |
| **decrypt** `(args) → Promise<string>` | Yes | **Throws** | Decrypt with **public** key. Web Crypto has no equivalent; web build throws with a clear message. |
| **createPrivateAndPublicKeys** `(modulusLength?) → Promise<{ publicKey, privateKey }>` | Yes | Yes | PEM (SPKI + PKCS#8). Keys interchangeable between Node and Web. |
| **encryptBufferWithRsaPublicKey** `(buffer, publicKey?) → Promise<string>` | Yes | Yes | Buffer → base64 string, then encrypt. Node: `Buffer`/`Uint8Array`; Web: `Uint8Array`. |
| **decryptBufferWithRsaPrivateKey** `(encryptedText, privateKey?) → Promise<Uint8Array>` | Yes | Yes | Decrypt then base64 → bytes. Node returns `Buffer` (extends `Uint8Array`); Web returns `Uint8Array`. |

## Shared behavior

- **Key format:** PEM (SPKI public, PKCS#8 private). Keys generated on one build work with the other for **encryptStringWithRsaPublicKey** / **decryptStringWithRsaPrivateKey** and **createPrivateAndPublicKeys**.
- **Algorithm:** RSA-OAEP with SHA-1 for public encrypt / private decrypt so ciphertext is compatible between Node and Web.
- **Key normalization:** Both use `convertKetToBase64` (from `shared` helpers) so keys can be passed with optional leading spaces.

## Intended differences

| Item | Node | Web |
|------|------|-----|
| **encrypt(privateKey)** / **decrypt(publicKey)** | Implemented (Node `crypto`). | Not supported; methods throw with a message directing users to the public/private encrypt/decrypt methods. |
| **Buffer type** | Accepts `Buffer \| Uint8Array`; returns `Buffer` from buffer methods. | Accepts `Uint8Array`; returns `Uint8Array`. |

## Verification

- **Node:** `tests/functionalty.node.spec.ts` (all 8 features covered, including encrypt/decrypt with private/public and buffers).
- **Web:** `tests/functionalty.web.spec.ts` (all supported features; encrypt/decrypt with private/public assert that they throw).

Run both: `npm test`.
