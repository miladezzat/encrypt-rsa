# Optional AI integrations

This is a private, separate Node 22/24 example application. Installing `encrypt-rsa` does not install AI SDK. Build the repository first, then install this app's locked dependencies:

```bash
npm ci
npm run build
npm --prefix examples/ai-integrations ci
npm --prefix examples/ai-integrations run typecheck
npm --prefix examples/ai-integrations test
npm --prefix examples/ai-integrations run memory
npm --prefix examples/ai-integrations run messages
npm --prefix examples/ai-integrations run assistant
npm --prefix examples/ai-integrations run demo
```

The last command opens a local HTTP service at `http://127.0.0.1:3001` (set `PORT` to change it). Choose runtime/operation to view an approved template. It uses AI SDK's fixture model; no external calls, API key, or paid account are needed. The server binds only to localhost and accepts no keys, chat history, or free-form text.

Files:

- `memory.mjs`: encrypted tenant/subject-bound records, optimistic revision checks, and key rotation. Its Map backend is an example; production needs database CAS and authenticated context.
- `persistence.mjs`: validates full SDK UIMessage history, drains the server stream independently of UI delivery, and saves completed history with revision checks. Declare the application's tools/metadata/data schemas when loading. Do not flatten messages to text.
- `message-demo.mjs`: canonical signed result, trusted key resolution, payload validation, and nonce rejection. Its Map replay store is only for one process.
- `assistant.mjs`: a ToolLoopAgent selects a strict template ID; the app verifies that it matches the requested operation. It displays approved code and never executes model output.
- `tests/`: fixture integration tests for isolation, swaps/tampering, rotation/conflicts, complete history/tool values, disconnects/failures, and every template.

To explicitly try a real model through AI Gateway, set `AI_GATEWAY_API_KEY` outside source control, optionally `AI_MODEL`, and run `npm --prefix examples/ai-integrations run assistant -- --live`. The default model is `openai/gpt-6.1-sol`; access/availability depend on your account. This sends only the two public enum requirements and may incur charges. The web demo always stays in fixture mode. Never put a provider key in browser code.

Read the [AI overview and setup](../../documentation/ai-integrations.md), then follow the focused [memory](../../documentation/ai/encrypted-memory.md), [persistence](../../documentation/ai/conversation-persistence.md), and [assistant](../../documentation/ai/docs-assistant.md) guides. The core [JSON guide](../../documentation/json.md), [signed-message guide](../../documentation/signed-messages.md), and [release guide](../../documentation/releasing.md) cover API policy and deployment. Encryption at rest does not hide submitted plaintext from a model provider; signatures do not prevent prompt injection or replace authorization. No live model call is part of the automated tests.
