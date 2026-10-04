# JSON encryption and schema validation

Use `encryptJSON` and `decryptJSON` for application records, settings, and message history. This guide covers the core API; you can use it without an AI framework.

## Encrypt and validate JSON

```ts
import NodeRSA, { type JsonValue } from 'encrypt-rsa';
const rsa = new NodeRSA();
const { publicKey, privateKey } = await rsa.createPrivateAndPublicKeys(2048);

function validateNote(value: JsonValue) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).join(',') !== 'note' || typeof value.note !== 'string') {
    throw new Error('Invalid note');
  }
  return { note: value.note };
}

const text = await rsa.encryptJSON({ value: { note: 'Hello' }, publicKey });
const note = await rsa.decryptJSON({ text, privateKey, parse: validateNote });
```

`encryptJSON` uses canonical JSON, a fresh AES-256-GCM key, and RSA-OAEP/SHA-256 to wrap that key. It always emits the authenticated v1 hybrid format. `decryptJSON` also accepts legacy hybrid ciphertext containing valid JSON. Writers/readers must both support v1 before rollout. Neither helper changes existing string API defaults.

## Supported data

All JSON roots are supported:

| Value | Requirement |
|---|---|
| `null`, booleans, and strings | Strings must contain valid Unicode |
| Numbers | Finite values; negative zero rejects |
| Arrays | Dense elements with no extra properties |
| Plain objects | Enumerable data properties; null-prototype objects are supported |

Unsupported values reject instead of silently changing during serialization:

- `undefined`, `NaN`, `Infinity`, bigint, symbols, and functions.
- Dates, class instances, sparse arrays, extra array properties, and cycles.
- Hidden/accessor properties and unpaired Unicode surrogates.

Serialization reads data descriptors, never getters or `toJSON`. Use ordinary data objects; proxies are not a sandbox boundary. Object property order is canonicalized; repeated references are copied as JSON values.

## Validate the decrypted schema

Decryption resolves `JsonValue`. A synchronous or asynchronous `parse(value)` can validate a schema and transform the result; its return type is inferred. A generic type argument requires a parser, because a TypeScript type alone cannot validate decrypted input. Schema validation is optional for generic JSON but required by your application before using the data. Parsers should be pure and must throw/reject on invalid values. JSON parsing follows standard `JSON.parse` duplicate-key behavior; signed envelopes require canonical bytes and reject duplicate fields.

## Bound resource use

The optional `limits` object applies to JSON helpers and signed messages:

| Limit | Default | Maximum | Meaning |
|---|---:|---:|---|
| `maxBytes` | 1 MiB | 64 MiB | Serialized/decrypted UTF-8 JSON bytes, including JSON syntax |
| `maxPayloadBytes` | 2 MiB | 128 MiB | Input ciphertext or signed-envelope UTF-8 bytes, checked before crypto/parsing |
| `maxDepth` | 128 | 256 | Nested value depth; root is depth zero |

Limits are positive safe integers. Signed envelopes count the entire canonical envelope, including signature, toward `maxBytes`. If you increase plaintext limits, also allow for ciphertext base64/header overhead in `maxPayloadBytes`. Data is processed in memory; this is not a streaming file API. Apply request size limits before buffering HTTP bodies and set application quotas/rate limits.

## Set application limits

Pass the same policy to both operations:

```ts
const limits = { maxBytes: 64 * 1024, maxPayloadBytes: 128 * 1024, maxDepth: 32 };
const limitedText = await rsa.encryptJSON({ value: { note: 'Hello' }, publicKey, limits });
const limitedNote = await rsa.decryptJSON({
  text: limitedText, privateKey, limits, parse: validateNote,
});
```

This reuses `rsa`, the keys, and `validateNote` from the first example. Size/depth limits bound resource use; they do not replace application validation or authorization.

## Next steps

- [Complete JSON method signatures](./api/reference.md#encryptjson)
- [Encrypted payload format and version compatibility](./payload-format.md)
- [Encrypted agent memory](./ai/encrypted-memory.md)
- [AI SDK conversation persistence](./ai/conversation-persistence.md)
