# JSON, agent memory, and AI SDK persistence

`encrypt-rsa` 6.1 adds JSON helpers and signed messages that applications can use around AI workflows. The core package contains no AI SDK, model provider, network client, or runtime dependency. AI SDK 7 is pinned only in the private [example app](https://github.com/miladezzat/encrypt-rsa/tree/master/examples/ai-integrations).

## Encrypt and validate JSON

```ts
import NodeRSA, { type JsonValue } from 'encrypt-rsa';
const rsa = new NodeRSA();
const text = await rsa.encryptJSON({ value: { note: 'Hello' }, publicKey });
const note = await rsa.decryptJSON({ text, privateKey, parse: (value: JsonValue) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).join(',') !== 'note' || typeof value.note !== 'string') {
    throw new Error('Invalid note');
  }
  return { note: value.note };
} });
```

`encryptJSON` uses canonical JSON, a fresh AES-256-GCM key, and RSA-OAEP/SHA-256 to wrap that key. It always emits the authenticated v1 hybrid format. `decryptJSON` also accepts legacy hybrid ciphertext containing valid JSON. Writers/readers must both support v1 before rollout. Neither helper changes existing string API defaults.

All JSON roots are supported: null, booleans, finite numbers, strings, arrays, and plain objects (including null-prototype objects). Undefined, negative zero, NaN, Infinity, bigint, symbols, functions, dates/classes, sparse arrays, extra array properties, cycles, hidden/accessor properties, and unpaired Unicode surrogates reject. Serialization reads data descriptors, never getters or `toJSON`. Use ordinary data objects; proxies are not a sandbox boundary. Object property order is canonicalized; repeated references are copied as JSON values.

Decryption resolves `JsonValue`. A synchronous or asynchronous `parse(value)` can validate a schema and transform the result; its return type is inferred. A generic type argument requires a parser, because a TypeScript type alone cannot validate decrypted input. Schema validation is optional for generic JSON but required by your application before using the data. Parsers should be pure and must throw/reject on invalid values. JSON parsing follows standard `JSON.parse` duplicate-key behavior; signed envelopes require canonical bytes and reject duplicate fields.

## Bound resource use

The optional `limits` object applies to JSON helpers and signed messages:

| Limit | Default | Maximum | Meaning |
|---|---:|---:|---|
| `maxBytes` | 1 MiB | 64 MiB | Serialized/decrypted UTF-8 JSON bytes, including JSON syntax |
| `maxPayloadBytes` | 2 MiB | 128 MiB | Input ciphertext or signed-envelope UTF-8 bytes, checked before crypto/parsing |
| `maxDepth` | 128 | 256 | Nested value depth; root is depth zero |

Limits are positive safe integers. Signed envelopes count the entire canonical envelope, including signature, toward `maxBytes`. If you increase plaintext limits, also allow for ciphertext base64/header overhead in `maxPayloadBytes`. Data is processed in memory; this is not a streaming file API. Apply request size limits before buffering HTTP bodies and set application quotas/rate limits.

## Agent memory example

The runnable memory recipe stores encrypted records bound to tenant, authenticated subject, record ID, revision, and key ID. Tenant keyrings are trusted server configuration. Reads reject swapped records; writes use compare-and-set to prevent lost updates. Rotation decrypts with the old key and writes with the active key using the same revision check. Keep old private keys until migration and retention requirements are satisfied.

The example backend is a Map. Replace it with a database transaction/atomic conditional update before using multiple processes. Derive tenant/subject from authentication and enforce authorization before calling it. Do not accept tenant key mappings or private keys from request bodies or model outputs.

Encryption protects confidentiality at rest and detects altered ciphertext. Anyone with the public key can create new ciphertext: encryption does not authenticate a writer or prevent restoring an older valid database snapshot. Protect database writes/revisions, and add signed records or an external trusted revision store when that threat matters. The library does not supply a KMS, database, key lifecycle, or access control.

Memory records carry schema version 1. Readers reject incompatible versions and corrupt records rather than resetting history. For a schema migration, validate the old record with its old schema, transform it, and write the new checkpoint with a revision check. Keep migration code and retired decryption keys until the application confirms that all retained records are readable. The example does not automatically migrate unknown formats.

## AI SDK conversation persistence

The separate `persistence.mjs` recipe:

1. Decrypts and validates full `UIMessage` objects using `validateUIMessages`, including declared metadata/data schemas and tool schemas.
2. Converts validated UI messages with `convertToModelMessages` before `streamText`.
3. Owns consumption of the full server stream with `toUIMessageStream` and `readUIMessageStream`. A failed UI delivery hook disables delivery while consumption continues.
4. Stores full completed history (IDs, parts, tool input/output, data, metadata) only when the SDK reports a completed outcome. Failures/aborts preserve existing history. A revision conflict rejects instead of overwriting another request.

SDK optional undefined object fields are omitted explicitly; other non-JSON values reject. Do not flatten history into text or silently reset invalid history. Declare the same schemas/tools on reload. Validate tool input/output and authorize tool execution independently; encrypting a tool result does not make it trustworthy. The recipe supports the pinned SDK version, not an untested generic adapter for every provider/version.

Keep the server task alive using the host's background-task facility and await/report the persistence promise. A client disconnect must stop UI delivery, not cancel that task. An explicit server abort cancels generation and does not save partial history. For long-lived jobs use a durable worker; serverless processes may end after the response. Add idempotency, conflict resolution, retries, retention/deletion, rate limits, and durable storage for a deployed application.

Plaintext is available to the application and to any provider receiving model messages. At-rest encryption does not provide end-to-end secrecy from an AI provider. Minimize/redact submitted data and apply your provider/privacy policy. Never send private keys or credentials to a model.

## Run the examples

From the repository root, run `npm ci && npm run build`, then:

```bash
npm --prefix examples/ai-integrations ci
npm --prefix examples/ai-integrations run typecheck
npm --prefix examples/ai-integrations test
npm --prefix examples/ai-integrations run memory
npm --prefix examples/ai-integrations run messages
npm --prefix examples/ai-integrations run assistant
npm --prefix examples/ai-integrations run demo
```

The local docs assistant at `http://127.0.0.1:3001` accepts two public choices (runtime and operation), uses a fixture model by default, and displays validated, approved templates. It has no free-form secret input and executes no generated code. A separate CLI `assistant -- --live` can use AI Gateway with `AI_GATEWAY_API_KEY` and optional `AI_MODEL` (default `openai/gpt-6.1-sol`); that opt-in makes external calls and may incur charges. Keep credentials in the server environment. The web demo always uses fixtures.

Fixture tests verify integration mechanics without a paid call. They do not prove a provider's availability, output quality, or privacy guarantees. See [AI SDK persistence documentation](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) and the [signed-message guide](https://github.com/miladezzat/encrypt-rsa/blob/master/documentation/signed-messages.md).
