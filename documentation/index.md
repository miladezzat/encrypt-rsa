---
layout: home
title: Encryption for app data and AI memory
hero:
  name: encrypt-rsa
  text: Protect app data and AI memory.
  tagline: RSA encryption, authenticated JSON, and signed messages for Node.js and browsers. Explore recipes for encrypted AI memory and conversation storage.
  image:
    src: /ai-storage.svg
    alt: AI memory is validated as JSON, encrypted with AES and RSA, and saved as ciphertext.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: AI integrations
      link: /ai-integrations
    - theme: alt
      text: Explore the API
      link: /api/reference
features:
  - title: One API, zero runtime dependencies
    details: Use native Node crypto and browser Web Crypto. Share keys, payloads, and TypeScript types with one async API.
    link: /compatibility
    linkText: Runtime compatibility
  - title: AI memory and conversations
    details: Store agent memory and full AI SDK message history as encrypted JSON. Follow separate, runnable integration recipes.
    link: /ai-integrations
    linkText: Explore AI recipes
  - title: Structured data, validated
    details: Encrypt JSON with AES-256-GCM and RSA-OAEP/SHA-256. Bound resource use and validate a schema on decryption.
    link: /json
    linkText: JSON guide
  - title: Verify who sent it
    details: RSA-PSS signatures and scoped messages with expiry, trusted key resolution, and an atomic replay protection callback.
    link: /signed-messages
    linkText: Signed messages
---

<HomeAI />

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

[Follow the setup guide →](./getting-started.md) · [Validate a JSON schema →](./json.md) · [Read the complete API →](./api/reference.md)

## Find the right guide

| You want to… | Start here |
|---|---|
| Install the package and generate keys | [Getting started](./getting-started.md) |
| Encrypt application data | [JSON and schema validation](./json.md) or [text and binary APIs](./api/reference.md#encryptstringwithrsapublickey) |
| Build an AI integration | [AI overview and setup](./ai-integrations.md) |
| Authenticate an expiring message | [Signed messages and replay prevention](./signed-messages.md) |
| Move between Node.js and browsers | [Runtime compatibility](./compatibility.md) |
| Upgrade an existing installation | [Migration guide](./migration.md) |
