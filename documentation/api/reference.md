# NodeRSA

The default export implements the same Promise API in Node and browsers. Import `NodeRSA` from the package root; conditional exports choose the runtime.

```ts
import NodeRSA from 'encrypt-rsa';
const rsa = new NodeRSA(publicKey, privateKey, 2048);
```

All keys are PEM strings. Constructor keys are optional defaults; per-call keys override them. The default modulus is 2048 bits. Key generation returns a pair without storing it on the instance. Every method below is asynchronous, including rejected failure paths.

See the [shared TypeScript contracts](./types.md) for exact parameter and return types, and [key helpers](./helpers.md) for validation.

## createPrivateAndPublicKeys

```ts
createPrivateAndPublicKeys(modulusLength?: number): Promise<returnCreateKeys>
```

Generates `{ publicKey, privateKey }` as RSA SPKI/PKCS#8 PEM strings. Uses the constructor modulus by default. Node generation is nonblocking. Both runtimes accept each other's generated keys.

## encryptStringWithRsaPublicKey

```ts
encryptStringWithRsaPublicKey({ text, publicKey?, oaepHash? }): Promise<string>
```

Encrypts short UTF-8 text with RSA-OAEP and returns base64 ciphertext. `oaepHash` is `'sha1'` by default; explicitly select `'sha256'` for both endpoints when desired. A public key is required either here or on the constructor.

| RSA modulus | SHA-1 capacity | SHA-256 capacity |
|---|---:|---:|
| 2048 bits | 214 bytes | 190 bytes |
| 4096 bits | 470 bytes | 446 bytes |

Capacity is `modulusBytes - 2 * hashBytes - 2`. Measure with `new TextEncoder().encode(text).length`; JavaScript string length is not the UTF-8 byte count. Use hybrid encryption for larger values.

## decryptStringWithRsaPrivateKey

```ts
decryptStringWithRsaPrivateKey({ text, privateKey?, oaepHash? }): Promise<string>
```

Decrypts base64 RSA-OAEP ciphertext to UTF-8 text. The hash must match encryption; ciphertext carries no hash header. Defaults to SHA-1. Requires the matching private key and preserves Unicode, including a leading BOM.

## encryptLarge

```ts
encryptLarge({ text, publicKey?, oaepHash?, payloadVersion? }): Promise<string>
```

Encrypts text with a fresh AES-256-GCM key wrapped by RSA-OAEP. Returns one encoded string. The default is the legacy four-field SHA-1 payload. `payloadVersion: 'v1'` selects an authenticated algorithm header; `oaepHash: 'sha256'` selects v1 automatically. SHA-256 with an explicit legacy format rejects.

```ts
const encrypted = await rsa.encryptLarge({
  text: 'Long text'.repeat(1000),
  publicKey,
  oaepHash: 'sha256',
});
```

Empty text is supported. Processing is in memory, without a streaming API. See [payload encoding and rollout](../payload-format.md).

## decryptLarge

```ts
decryptLarge({ text, privateKey?, oaepHash? }): Promise<string>
```

Accepts legacy and v1 payloads. Reads the hash from v1; legacy implies SHA-1. An explicit hash asserts that it matches the payload. Requires a 32-byte AES key, 12-byte IV, and 16-byte GCM tag. Malformed or tampered payloads reject.

## encryptJSON

```ts
encryptJSON({ value, publicKey?, limits? }): Promise<string>
```

Encrypts strict, canonical JSON with authenticated v1 hybrid SHA-256. Supports JSON primitives, arrays, and plain objects; rejects lossy serialization, cycles, classes, accessors, sparse arrays, and invalid Unicode. Optional `limits` bound plaintext bytes, encoded input bytes, and depth. See [supported values and limits](../ai-integrations.md#encrypt-and-validate-json).

## decryptJSON

```ts
decryptJSON({ text, privateKey?, limits? }): Promise<JsonValue>
decryptJSON<T>({ text, privateKey?, limits?, parse }): Promise<T>
```

Bounds input before crypto, decrypts legacy or v1 hybrid JSON, and validates JSON bytes and depth. A synchronous or asynchronous `parse` callback validates an application schema and infers its return type. A generic type argument requires a parser; a TypeScript assertion cannot validate decrypted data.

## sign

```ts
sign({ text, privateKey? }): Promise<string>
```

Signs exact UTF-8 text with RSA-PSS/SHA-256 and a fixed 32-byte salt. Returns a base64 signature. Requires a private key. A signature authenticates data and its signer; it does not hide the text.

## verify

```ts
verify({ text, signature, publicKey? }): Promise<boolean>
```

Verifies the same RSA-PSS parameters. Modified text, a mismatched key, or a malformed signature resolves `false`. Missing or invalid verification keys reject. Trust the public key through application configuration. Raw signatures do not enforce expiry or replay protection.

## signMessage

```ts
signMessage({ message, privateKey?, limits? }): Promise<string>
```

Signs a canonical, domain-separated JSON envelope. `message` contains `purpose`, `issuer`, `audience`, `keyId`, `issuedAt`, `expiresAt`, `nonce`, and `payload`. Times are Unix milliseconds; the nonce must be randomly generated. Use a separate signing key. See the [full signed-message contract](../signed-messages.md).

## verifyMessage

```ts
verifyMessage({ text, expected, resolvePublicKey, consumeNonce,
  limits?, now?, clockSkewMs?, maxLifetimeMs? }): Promise<MessageClaims>

verifyMessage<T>({ text, expected, resolvePublicKey, consumeNonce,
  parse, limits?, now?, clockSkewMs?, maxLifetimeMs? }): Promise<MessageClaims<T>>
```

Requires expected issuer, audience, and purpose; a trusted resolver for `{ issuer, keyId }`; and an atomic nonce-consumption callback. Checks canonical bytes, signature, identities, time policy, schema, and replay before returning claims. Defaults are a five-minute maximum lifetime and zero clock skew. `now` defaults to the current Unix time in milliseconds. Invalid/expired/replayed messages and callback failures reject.

`consumeNonce` must atomically return `true` only for the first use, retaining the claim through `validUntil` (including allowed clock skew). A process-local Map is only a single-process demonstration. Use a transactional store or Redis `SET NX` with expiry in a deployed service.

Signatures do not authorize tools, establish truth, or prevent prompt injection. Apply authorization separately.

## encryptBufferWithRsaPublicKey

```ts
encryptBufferWithRsaPublicKey(bytes: Uint8Array, publicKey?: string): Promise<string>
```

Base64-encodes bytes before direct RSA-OAEP/SHA-1 encryption. With a 2048-bit key, the maximum is **159 raw bytes** because base64 expansion consumes capacity. No hash option is exposed. Use base64 plus `encryptLarge` for larger binary data.

## decryptBufferWithRsaPrivateKey

```ts
decryptBufferWithRsaPrivateKey(text: string, privateKey?: string): Promise<Uint8Array>
```

Restores bytes encrypted by the matching buffer method. Node returns a `Buffer`, which is a `Uint8Array`; browsers return a `Uint8Array`.

## encrypt

```ts
encrypt({ text, privateKey? }): Promise<string>
```

Legacy Node-only private-key operation. Anyone with the public key can recover the text, so this provides **no confidentiality**. Use `sign` for new authentication flows. Browsers reject with an unsupported-operation Promise.

## decrypt

```ts
decrypt({ text, publicKey? }): Promise<string>
```

Legacy Node-only public-key inverse of `encrypt`. Browsers reject with an unsupported-operation Promise. Use `verify` to check new RSA-PSS signatures.
