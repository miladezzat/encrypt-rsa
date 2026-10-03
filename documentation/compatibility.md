# Node and browser compatibility

The package exposes the same Promise-based class and shared TypeScript interface in Node and browsers. Native ESM, CommonJS, browser bundlers, and the browser global build are covered by consumer smoke checks.

| Feature | Node | Browser |
|---|---|---|
| Generate RSA/SPKI + PKCS#8 keys | Nonblocking `crypto.generateKeyPair` | `crypto.subtle.generateKey` |
| Direct RSA-OAEP encryption | SHA-1 default; SHA-256 opt-in | Same |
| AES-256-GCM hybrid encryption | Legacy default; v1 opt-in | Same |
| RSA-PSS signatures | SHA-256, 32-byte salt | Same |
| JSON encryption | Bounded v1 SHA-256 hybrid + schema parser | Same |
| Signed messages | Canonical claims, expiry, atomic replay callback | Same |
| Strict RSA key helpers | Async parsing; SPKI/PKCS#8 | Same |
| PEM formatting helpers | Synchronous header/footer checks | Same |
| Buffer methods | Accept `Uint8Array`/`Buffer`; return `Buffer` | Accept/return `Uint8Array` |
| Legacy private-key `encrypt` / public-key `decrypt` | Supported | Rejected Promise |
| Cryptographic operation keys | Also accepts legacy PKCS#1 | SPKI/PKCS#8 only |
| Missing-key failure | Rejected Promise | Rejected Promise |
| Unicode including leading BOM | Preserved | Preserved |

Node 22 and 24 are the CI targets. Browser operations require a secure context and Web Crypto. Browser code has no Node crypto or Buffer dependency. Browser tests execute in Chromium; compatibility with every browser release is not implied.

Both sides may use keys generated on either side. Direct encryption requires an agreed OAEP hash; hybrid v1 payloads identify their hash. Signatures use the same fixed RSA-PSS parameters in both builds. Constructor keys are defaults for operations; key generation returns keys without changing the instance.

For Node CommonJS, use `require('encrypt-rsa').default`. For Node ESM and browser bundlers, use `import NodeRSA from 'encrypt-rsa'`. The standalone browser script exposes `encryptRSA.NodeRSA` and convenience functions for key generation, direct/hybrid strings, signatures, and strict RSA validation.
