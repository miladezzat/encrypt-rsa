---
layout: home
title: Encryption for Node.js and browsers
hero:
  name: encrypt-rsa
  text: Protect your data. Keep your code simple.
  tagline: RSA encryption, authenticated JSON, and signed messages with one async API for Node.js and browsers.
  image:
    src: /logo.svg
    alt: encrypt-rsa
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Explore the API
      link: /api/reference
features:
  - title: One API, two runtimes
    details: Use native Node crypto on the server and Web Crypto in the browser. Share keys, payloads, and TypeScript types.
    link: /compatibility
    linkText: Runtime compatibility
  - title: Small strings to structured data
    details: Encrypt short text with RSA-OAEP, larger data with AES-256-GCM, and strict JSON with resource limits and schema validation.
    link: /api/reference#encryptjson
    linkText: JSON encryption
  - title: Verify who sent it
    details: RSA-PSS signatures and scoped messages with expiry, trusted key resolution, and an atomic replay protection callback.
    link: /signed-messages
    linkText: Signed messages
  - title: Zero runtime dependencies
    details: Platform cryptography powers the core package. AI SDK recipes live in a separate example app you can adapt to your storage.
    link: /ai-integrations
    linkText: AI integration recipes
---

## From install to encrypted JSON

```bash
npm install encrypt-rsa
```

```ts
import NodeRSA from 'encrypt-rsa';

const rsa = new NodeRSA();
const { publicKey, privateKey } = await rsa.createPrivateAndPublicKeys(2048);

const text = await rsa.encryptJSON({
  value: { message: 'Hello, العربية 😀' },
  publicKey,
});
const value = await rsa.decryptJSON({ text, privateKey });
```

JSON uses authenticated v1 hybrid encryption with RSA-OAEP/SHA-256. Keep private keys in trusted application storage and validate decrypted data before using it.

[Follow the setup guide →](./getting-started.md) · [Read the complete API →](./api/reference.md)
