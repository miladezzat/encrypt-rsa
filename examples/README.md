# Runnable examples

Build before running examples:

```bash
npm ci
npm run build
```

## Node

```bash
node examples/node-basic.js
```

This example generates keys asynchronously, performs direct SHA-1/SHA-256 encryption, encrypts larger text with legacy and versioned hybrid payloads, signs/verifies with RSA-PSS, rejects a changed message, and parses the generated RSA keys. It throws if any round trip fails. The private key is not printed.

For application imports, use `import NodeRSA from 'encrypt-rsa'` in ESM or `const { default: NodeRSA } = require('encrypt-rsa')` in CommonJS. The example points at the local build so it can run before publishing.

## Browser

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/examples/browser-basic.html`. Generate keys, enter text, and choose an encryption mode. The default is versioned hybrid SHA-256; legacy hybrid SHA-1 and both direct RSA hashes are available. Encrypt, then decrypt. Decryption uses the mode recorded with the encrypted value, even if the selection changes afterward.

Use **Sign Message** then **Verify Signature**. Change the message or signature and verify again to see rejection. Signing authenticates text; it does not encrypt it. The displayed private key is for this local demonstration and must not be shared.

Direct RSA with a 2048-bit key allows 214 UTF-8 bytes with SHA-1 and 190 with SHA-256. Hybrid encryption supports larger text in memory. Empty strings are supported by the library; the interactive encrypt form asks for a message.

## Automated validation

```bash
npm run smoke
npm run smoke:install
npx playwright install chromium
npm run smoke:browser
```

These check the Node example, actual installed CJS/ESM/TypeScript consumers, installed browser entries and global functions, and the browser demo's encryption/signature flows. The browser checks require Chromium and localhost access.

See the [main README](../README.md), [compatibility guide](../documentation/compatibility.md), [payload specification](../documentation/payload-format.md), and [migration guide](../documentation/migration.md).
