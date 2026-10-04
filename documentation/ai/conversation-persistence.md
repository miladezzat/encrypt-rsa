# AI SDK conversation persistence

Keep complete AI SDK message history in encrypted storage. The recipe validates messages on reload and saves only completed generations, while preserving message IDs, parts, tool values, data, and metadata.

## Before you start

Follow [AI integration setup](../ai-integrations.md#run-the-examples) and configure [encrypted memory](./encrypted-memory.md). AI SDK is installed in the separate example app, not in `encrypt-rsa`. The recipe targets the version pinned by that app's lockfile.

## Load, generate, and save

```text
Encrypted history
  → decrypt and validate UI messages
  → convert messages and call the model
  → consume the full server stream
  → validate completed history
  → encrypt and save with a revision check
```

| Example function | Responsibility |
|---|---|
| `loadMessages(memory, context, id, validation)` | Reads encrypted memory and validates complete `UIMessage` values against application schemas |
| `persistConversation(options)` | Runs generation, consumes the stream, and saves completed history using the expected revision |
| `jsonData(value)` | Omits optional undefined object fields while rejecting unsupported or lossy JSON values |

These functions are defined in [`persistence.mjs`](https://github.com/miladezzat/encrypt-rsa/blob/master/examples/ai-integrations/persistence.mjs). They are example helpers, not package-root APIs. Pass validated user messages to `persistConversation` along with the loaded history, trusted context, current revision, configured model/tools, and the same validation schemas used on reload.

## Persistence and validation policy

The separate `persistence.mjs` recipe:

1. Decrypts and validates full `UIMessage` objects using `validateUIMessages`, including declared metadata/data schemas and tool schemas.
2. Converts validated UI messages with `convertToModelMessages(original, { tools })` before `streamText`, using each configured tool's `toModelOutput` converter for replayed results.
3. Owns consumption of the full server stream with `toUIMessageStream` and `readUIMessageStream`. A failed UI delivery hook disables delivery while consumption continues.
4. Stores full completed history (IDs, parts, tool input/output, data, metadata) only when the SDK reports a completed outcome. Failures/aborts preserve existing history. A revision conflict rejects instead of overwriting another request.

### Preserve complete message values

SDK optional undefined object fields are omitted explicitly; other non-JSON values reject. Do not flatten history into text or silently reset invalid history. Declare the same schemas/tools on reload. Validate tool input/output and authorize tool execution independently; encrypting a tool result does not make it trustworthy. The recipe supports the pinned SDK version, not an untested generic adapter for every provider/version.

Pass the same tool definitions to `loadMessages(..., { tools })` and `persistConversation({ ..., tools })`. A tool can use `toModelOutput` to format its stored result for the model, including a custom text or multimodal representation. Conversion changes the model prompt only; encrypted UI history keeps the complete original result for later validation and display. A converter failure rejects before generation starts or history is updated.

### Own the server task

Keep the server task alive using the host's background-task facility and await/report the persistence promise. A client disconnect must stop UI delivery, not cancel that task. An explicit server abort cancels generation and does not save partial history. For long-lived jobs use a durable worker; serverless processes may end after the response. Add idempotency, conflict resolution, retries, retention/deletion, rate limits, and durable storage for a deployed application.

### Understand provider access

Plaintext is available to the application and to any provider receiving model messages. At-rest encryption does not provide end-to-end secrecy from an AI provider. Minimize/redact submitted data and apply your provider/privacy policy. Never send private keys or credentials to a model.

## Verify the integration locally

```bash
npm --prefix examples/ai-integrations run typecheck
npm --prefix examples/ai-integrations test
```

Fixture tests exercise completed history, metadata/tool validation, replayed tool output conversion, converter failures, UI disconnects, failed/aborted generation, and write conflicts. They make no paid provider calls. See the [AI SDK persistence documentation](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) when adapting the recipe to your pinned SDK version.

Continue with the [docs assistant](./docs-assistant.md) for approved JSON and signed-message code templates.
