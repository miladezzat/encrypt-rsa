# Local docs assistant

Explore approved `encrypt-rsa` templates by choosing a runtime and operation. The assistant selects a template ID with AI SDK, checks that it matches your choices, and displays reviewed example code. It never executes generated code.

## Run without a provider account

Complete [AI integration setup](../ai-integrations.md#run-the-examples), then start the demo:

```bash
npm --prefix examples/ai-integrations run demo
```

Open `http://127.0.0.1:3001`. The server binds to localhost; set `PORT` if you need another port. It always uses offline fixtures, so no API key or paid account is needed.

1. Choose **Node.js** or **Browser**.
2. Choose **Encrypt JSON** or **Sign message**.
3. Review the matching template and fill in its application-specific placeholders in your own code.

| Choice | What the template demonstrates |
|---|---|
| Node.js + JSON | `encryptJSON` and schema-validated `decryptJSON` |
| Browser + JSON | The same JSON API over Web Crypto in a secure context |
| Node.js + signed message | Signing, trusted key resolution, payload validation, and atomic replay prevention |
| Browser + signed message | Verifying a server-signed message with the expected audience |

The web form accepts only the two public choices. It has no field for keys, chat history, secrets, or free-form prompts. Generated responses must match the strict template schema and requested operation.

## Use the fixture CLI

```bash
npm --prefix examples/ai-integrations run assistant
```

This prints the default Node.js JSON recommendation and notices without making external calls. The [assistant source](https://github.com/miladezzat/encrypt-rsa/blob/master/examples/ai-integrations/assistant.mjs) contains all four templates and selection validation.

## Optional live CLI

A separate explicit opt-in can use AI Gateway:

```bash
# Provide AI_GATEWAY_API_KEY in the server environment, outside source control.
npm --prefix examples/ai-integrations run assistant -- --live
```

Set `AI_MODEL` to select an available model; the CLI's default is `openai/gpt-6.1-sol`. Model access depends on your account. The live CLI sends the two public enum requirements and may incur provider charges. Keep credentials on the server; never put a provider key in browser code. The web demo stays in fixture mode even when credentials are available.

## Use the output correctly

Approved templates still require your own keys, schema parsers, authentication, storage, and nonce policy. Keep encryption and signing keys separate. Encryption does not hide plaintext submitted to a provider; signatures do not establish truth, prevent prompt injection, or authorize a tool.

Read [JSON encryption](../json.md) and [signed messages](../signed-messages.md) before adapting the output. Fixture tests verify selection and validation mechanics; they do not prove a live provider's availability, output quality, or privacy guarantees.
