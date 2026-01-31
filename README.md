# NodeRSA

**NodeRSA** is a library that provides easy-to-use methods for RSA encryption and decryption. It supports **Node.js** and **browser** (web) with the same API. Generate RSA key pairs, encrypt and decrypt strings with public and private keys. Ideal for secure data transmission, authentication systems, and any application requiring cryptographic security.

## Installation

```bash
npm install encrypt-rsa
# OR
yarn add encrypt-rsa
```

## Breaking changes (vs 3.x)

If you are upgrading from **3.x**, this release includes breaking changes. You should bump to **4.0.0** when publishing:

1. **Async API** – All crypto methods now return **Promises** (sync → async). You must use `await` or `.then()`.
   - **Before (3.x):** `const encrypted = nodeRSA.encryptStringWithRsaPublicKey({ text, publicKey });`
   - **After (4.x):** `const encrypted = await nodeRSA.encryptStringWithRsaPublicKey({ text, publicKey });`
2. **Entry points** – The package now has separate Node and Web builds. `main`/`module`/`types` point to the Node build; the `browser` field and conditional `exports` point to the Web build. If you required a specific path (e.g. `encrypt-rsa/build/index.js`), update to the new entry points or use the package root `encrypt-rsa`.
3. **Buffer methods** – `decryptBufferWithRsaPrivateKey` now returns `Promise<Uint8Array>` (type). In Node the runtime value is still a `Buffer` (extends `Uint8Array`). Prefer `Uint8Array` in types; avoid relying on `instanceof Buffer` in shared code.

See [CHANGELOG.md](./CHANGELOG.md) for the full list of changes.

## Node and Web (browser)

One package, two environments:

- **Node.js**: Uses the built-in `crypto` module. All crypto methods return **Promises** (async API).
- **Browser**: Uses the Web Crypto API. Same async API; bundlers resolve the web build via `exports` / `browser` field.

You use the same import; the correct implementation is chosen at build/runtime:

```ts
import NodeRSA from 'encrypt-rsa';
```

- In Node (or when your bundler targets Node), you get the Node build.
- When your bundler targets the browser, you get the web build.

**Browser note:** In the browser build, `encrypt(privateKey)` and `decrypt(publicKey)` are not supported (Web Crypto does not support that flow) and will throw. Use `encryptStringWithRsaPublicKey` / `decryptStringWithRsaPrivateKey` for encryption and decryption.

### Same interface (Node and Web)

Both the Node and Web builds expose the **same class and method signatures** (they implement the shared `INodeRSA` interface). You write the same code; only the resolved implementation changes:

- **Same class:** `NodeRSA`
- **Same constructor:** `(publicKey?: string, privateKey?: string, modulusLength?: number)`
- **Same methods:** `encryptStringWithRsaPublicKey`, `decryptStringWithRsaPrivateKey`, `encrypt`, `decrypt`, `createPrivateAndPublicKeys`, `encryptBufferWithRsaPublicKey`, `decryptBufferWithRsaPrivateKey`
- **Same parameter and return types:** All crypto methods return `Promise<...>`; buffer methods use `Uint8Array` (in Node, `Buffer` extends `Uint8Array` so it works as well).

See [docs/FEATURE_PARITY.md](docs/FEATURE_PARITY.md) for a feature-by-feature comparison of Node vs Web (including the browser limitation for `encrypt`/`decrypt` with private/public key).

## Usage

### Example: Node.js

```ts
// Node (CommonJS or ESM)
import NodeRSA from 'encrypt-rsa';

const nodeRSA = new NodeRSA();
const { publicKey, privateKey } = await nodeRSA.createPrivateAndPublicKeys(2048);

const encrypted = await nodeRSA.encryptStringWithRsaPublicKey({
  text: 'Secret message',
  publicKey,
});
console.log('Encrypted:', encrypted);

const decrypted = await nodeRSA.decryptStringWithRsaPrivateKey({
  text: encrypted,
  privateKey,
});
console.log('Decrypted:', decrypted);
```

### Example: Browser (Web)

```ts
// Browser (ESM or bundled) – same API
import NodeRSA from 'encrypt-rsa';

const nodeRSA = new NodeRSA();
const { publicKey, privateKey } = await nodeRSA.createPrivateAndPublicKeys(2048);

const encrypted = await nodeRSA.encryptStringWithRsaPublicKey({
  text: 'Secret message',
  publicKey,
});
console.log('Encrypted:', encrypted);

const decrypted = await nodeRSA.decryptStringWithRsaPrivateKey({
  text: encrypted,
  privateKey,
});
console.log('Decrypted:', decrypted);
```

When your bundler targets the browser, it resolves the web build; the code above is unchanged.

### Creating an instance

```ts
const nodeRSA = new NodeRSA(publicKey?, privateKey?, modulusLength?);
```

### Generating RSA key pairs

All crypto methods return **Promises**. Use `await` or `.then()`:

```ts
const { publicKey, privateKey } = await nodeRSA.createPrivateAndPublicKeys(modulusLength);
console.log('Public Key:', publicKey);
console.log('Private Key:', privateKey);
```

### Encrypting and decrypting strings

#### Encrypt with public key, decrypt with private key

```ts
const text = 'Hello, World!';
const encryptedString = await nodeRSA.encryptStringWithRsaPublicKey({ text, publicKey });
console.log('Encrypted:', encryptedString);

const decryptedString = await nodeRSA.decryptStringWithRsaPrivateKey({
  text: encryptedString,
  privateKey,
});
console.log('Decrypted:', decryptedString);
```

#### Encrypt with private key, decrypt with public key (Node only)

In the **browser build**, these methods throw. In **Node**, they work:

```ts
const encryptedString = await nodeRSA.encrypt({ text, privateKey });
console.log('Encrypted with Private Key:', encryptedString);

const decryptedString = await nodeRSA.decrypt({ text: encryptedString, publicKey });
console.log('Decrypted with Public Key:', decryptedString);
```

### Buffer encryption (same interface: `Uint8Array`)

Both Node and Web use **`Uint8Array`** in the method signature. In Node, `Buffer` extends `Uint8Array`, so you can pass a `Buffer` as well. Return type is `Promise<Uint8Array>` in both environments.

```ts
// Node
const buffer = Buffer.from('This is some binary data');

// Browser (or shared code)
const buffer = new TextEncoder().encode('This is some binary data');

const encryptedBuffer = await nodeRSA.encryptBufferWithRsaPublicKey(buffer, publicKey);
const decryptedBuffer = await nodeRSA.decryptBufferWithRsaPrivateKey(
  encryptedBuffer,
  privateKey
);

// Node: decryptedBuffer is Buffer
// Browser: decryptedBuffer is Uint8Array
console.log(
  decryptedBuffer instanceof Uint8Array
    ? new TextDecoder().decode(decryptedBuffer)
    : decryptedBuffer.toString()
);
```

## API

### NodeRSA class

#### Constructor

```ts
constructor(publicKey?: string, privateKey?: string, modulusLength?: number)
```

- `publicKey`: Optional. RSA public key (PEM).
- `privateKey`: Optional. RSA private key (PEM).
- `modulusLength`: Optional. Modulus length in bits (default 2048).

#### Methods (all crypto methods return `Promise<...>`)

| Method | Returns | Description |
|--------|---------|-------------|
| `createPrivateAndPublicKeys(modulusLength?)` | `Promise<{ publicKey, privateKey }>` | Generate RSA key pair (PEM). |
| `encryptStringWithRsaPublicKey(args)` | `Promise<string>` | Encrypt with public key. |
| `decryptStringWithRsaPrivateKey(args)` | `Promise<string>` | Decrypt with private key. |
| `encrypt(args)` | `Promise<string>` | Encrypt with private key. **Node only.** |
| `decrypt(args)` | `Promise<string>` | Decrypt with public key. **Node only.** |
| `encryptBufferWithRsaPublicKey(buffer, publicKey?)` | `Promise<string>` | Encrypt buffer; returns base64 string. |
| `decryptBufferWithRsaPrivateKey(encryptedText, privateKey?)` | `Promise<Uint8Array>` | Decrypt to buffer (same type in Node and Web). |

#### Parameter types

- `parametersOfEncrypt`: `{ text: string; publicKey?: string }`
- `parametersOfDecrypt`: `{ text: string; privateKey?: string }`
- `parametersOfEncryptPrivate`: `{ text: string; privateKey?: string }`
- `parametersOfDecryptPublic`: `{ text: string; publicKey?: string }`
- `returnCreateKeys`: `{ publicKey: string; privateKey: string }`

### Algorithm and key format

- **RSA-OAEP** with **SHA-1** for encrypt/decrypt with public/private key (cross-compatible between Node and browser).
- Keys are **PEM** (SPKI for public, PKCS#8 for private). Keys generated on one side work on the other.

## Use cases

### Secure data transmission

```ts
// Sender
const encryptedMessage = await nodeRSA.encryptStringWithRsaPublicKey({
  text: 'Sensitive data',
  publicKey: recipientPublicKey,
});
// Send encryptedMessage to the recipient

// Recipient
const decryptedMessage = await nodeRSA.decryptStringWithRsaPrivateKey({
  text: encryptedMessage,
  privateKey: recipientPrivateKey,
});
console.log('Decrypted Message:', decryptedMessage);
```

### Authentication

```ts
const encryptedCredentials = await nodeRSA.encryptStringWithRsaPublicKey({
  text: 'username:password',
  publicKey: serverPublicKey,
});

const decryptedCredentials = await nodeRSA.decryptStringWithRsaPrivateKey({
  text: encryptedCredentials,
  privateKey: serverPrivateKey,
});
console.log('Decrypted Credentials:', decryptedCredentials);
```

## Testing

The project includes tests for both the **Node** and **web** builds:

- **Node tests** (`tests/functionalty.node.spec.ts`): Run against the Node build; cover all methods including encrypt/decrypt with private/public key and buffer operations.
- **Web tests** (`tests/functionalty.web.spec.ts`): Run against the web build; require `crypto.subtle` (Node 19+ or a browser). Skipped automatically when Web Crypto is not available.

```bash
npm test
```

Both suites run with `npm test`. Web tests are skipped when `crypto.subtle` is not available (e.g. Node below 19).

## Documentation

API documentation is generated with [Compodoc](https://compodoc.app). To generate the docs (from the Node build source):

```bash
npm run docs
```

Generated files are written to the `docs/` folder. To serve them locally:

```bash
npm run docs:serve
```

The docs reflect the **NodeRSA** class and its async API (Node and web share the same interface).

## Releasing

- **Changelog from commits:** Run `npm run changelog` to update [CHANGELOG.md](./CHANGELOG.md) from conventional commits since the last tag (`feat:`, `fix:`, `BREAKING CHANGE:`, etc.).
- **Full release:** Run `npm run release -- --release-as major|minor|patch` to bump version, update the changelog, commit, and tag. Push to `master` to trigger the publish workflow (see [.github/workflows/publish.yml](./.github/workflows/publish.yml)).

**Publish via GitHub Actions (on merge to `master`):**

1. **Secret:** In the repo go to **Settings → Secrets and variables → Actions** and add **NPM_TOKEN** (npm automation token with “Publish” permission).
2. **Trigger:** Merging (or pushing) to the **master** branch runs the workflow: install → test → build → publish. The [JS-DevTools/npm-publish](https://github.com/JS-DevTools/npm-publish) action publishes only if the version in `package.json` is **greater** than the latest on npm; otherwise the job succeeds but skips publishing.
3. **Optional:** To make installs reproducible in CI, commit `package-lock.json` (remove it from `.gitignore`) and change the workflow step from `npm install` to `npm ci`.

## Contribution

1. Fork the repository on GitHub.
2. Clone your fork: `git clone git@github.com:miladezzat/encrypt-rsa.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes, then commit with a clear message.
5. Push to your fork and open a pull request with a description of your changes.

## Code of conduct

This project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.

## Reporting issues

Please report issues via the [GitHub issue tracker](https://github.com/miladezzat/encrypt-rsa/issues). Include details about the problem and your environment (OS, Node.js version, bundler, etc.).
