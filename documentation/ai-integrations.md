# AI integrations

Use `encrypt-rsa` around your AI application to encrypt stored memory and conversation history, or verify signed agent messages. Start with a recipe below, then adapt its storage, identity, and key handling to your application.

## Choose a recipe

| Your goal | Guide | Runnable source |
|---|---|---|
| Encrypt scoped agent memory and rotate keys | [Encrypted agent memory](./ai/encrypted-memory.md) | [`memory-demo.mjs`](https://github.com/miladezzat/encrypt-rsa/blob/master/examples/ai-integrations/memory-demo.mjs) |
| Persist complete AI SDK message history | [Conversation persistence](./ai/conversation-persistence.md) | [`persistence.mjs`](https://github.com/miladezzat/encrypt-rsa/blob/master/examples/ai-integrations/persistence.mjs) |
| Explore reviewed code templates | [Local docs assistant](./ai/docs-assistant.md) | [`assistant.mjs`](https://github.com/miladezzat/encrypt-rsa/blob/master/examples/ai-integrations/assistant.mjs) |
| Authenticate an expiring agent result | [Signed messages and replay prevention](./signed-messages.md) | [`message-demo.mjs`](https://github.com/miladezzat/encrypt-rsa/blob/master/examples/ai-integrations/message-demo.mjs) |

## What gets installed?

| Install | Includes |
|---|---|
| `npm install encrypt-rsa` | The async crypto API for Node.js and browsers, with zero runtime dependencies |
| Install the separate example app | AI SDK 7 and its locked development/example dependencies |

The core contains no AI SDK, model provider, network client, database, or KMS. Memory stores, persistence adapters, and the docs assistant are recipes in the [private example app](https://github.com/miladezzat/encrypt-rsa/tree/master/examples/ai-integrations), not additional exports from the package. Here, **private** means the app is not published to npm; its source is public in the repository.

## Run the examples

Clone the [repository](https://github.com/miladezzat/encrypt-rsa), then run from its root:

```bash
npm ci
npm run build
npm --prefix examples/ai-integrations ci
npm --prefix examples/ai-integrations run typecheck
npm --prefix examples/ai-integrations test
```

Choose a demo:

```bash
npm --prefix examples/ai-integrations run memory
npm --prefix examples/ai-integrations run messages
npm --prefix examples/ai-integrations run assistant
npm --prefix examples/ai-integrations run demo
```

Node 22 and 24 are the tested example runtimes. Memory and message demos make no model calls. The assistant CLI and local web demo use fixtures by default; no provider credentials are needed. See [optional live CLI usage](./ai/docs-assistant.md#optional-live-cli) for the separate opt-in and possible charges.

## JSON foundations {#encrypt-and-validate-json}

<span id="bound-resource-use"></span>

Use the [JSON encryption guide](./json.md) for supported values, canonical serialization, and schema parsers. The [resource limits table](./json.md#bound-resource-use) documents the default 1 MiB JSON size, 2 MiB encoded input size, and depth 128. These are core features usable without AI.

## Agent memory example

The [memory recipe](./ai/encrypted-memory.md) binds encrypted records to a tenant, user, record ID, revision, and key ID. It rejects swapped records, detects revision conflicts, and demonstrates key rotation. Replace its Map backend with durable atomic storage for a deployed application.

## AI SDK conversation persistence

The [persistence recipe](./ai/conversation-persistence.md) reloads validated full `UIMessage` history and saves only completed generation. It preserves structured message parts and owns server stream consumption independently of UI delivery. Keep the server task alive and apply conflict/idempotency policy in your application.

## Before deploying an integration

- Derive tenant/user identity from authentication and enforce authorization before accessing records.
- Keep private keys in trusted server storage, apply a rotation/retention policy, and use separate signing and encryption pairs.
- Add durable storage with atomic revision checks and, for signed messages, a shared atomic replay store.
- Validate decrypted records, tool input/output, and message schemas before use.
- Set size/rate limits, retention/deletion rules, and durable background-job handling where needed.

Encryption protects data **at rest**. Your application and any model provider receiving decrypted messages see their plaintext. Anyone with a public encryption key can create ciphertext; encryption alone does not authenticate a writer. A valid signature authenticates signed content and its key holder, not the truth of an agent's response or permission to run a tool.

Continue with [encrypted memory](./ai/encrypted-memory.md), [conversation persistence](./ai/conversation-persistence.md), or the [docs assistant](./ai/docs-assistant.md).
