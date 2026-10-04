# Runnable examples

Clone the [repository](https://github.com/miladezzat/encrypt-rsa), then install and build:

```bash
npm ci
npm run build
```

## Node.js

```bash
node examples/node-basic.js
```

The [Node example](https://github.com/miladezzat/encrypt-rsa/blob/master/examples/node-basic.js) runs direct and hybrid encryption, binary values, signatures, and key validation against the built package.

## Browser

Serve the repository on localhost and open [examples/browser-basic.html](https://github.com/miladezzat/encrypt-rsa/blob/master/examples/browser-basic.html). It loads the local standalone global bundle. Browser cryptography requires a secure context: HTTPS or localhost.

For automated checks:

```bash
npx playwright install chromium
npm run smoke:browser
```

Install the optional AI example dependencies before running the combined browser smoke suite, as described below.

## JSON memory and signed messages

The private [AI integration app](https://github.com/miladezzat/encrypt-rsa/tree/master/examples/ai-integrations) demonstrates tenant-bound encrypted memory, key rotation, and scoped signed messages:

```bash
npm --prefix examples/ai-integrations ci
npm --prefix examples/ai-integrations run memory
npm --prefix examples/ai-integrations run messages
```

## AI SDK persistence and docs assistant

```bash
npm --prefix examples/ai-integrations run typecheck
npm --prefix examples/ai-integrations test
npm --prefix examples/ai-integrations run assistant
npm --prefix examples/ai-integrations run demo
```

The assistant demo opens at `http://127.0.0.1:3001`. It uses offline fixtures and approved templates. Real provider calls require a separate explicit CLI opt-in and credentials; they can incur charges. Follow the [memory recipe](./ai/encrypted-memory.md), [persistence recipe](./ai/conversation-persistence.md), or [assistant walkthrough](./ai/docs-assistant.md) for the next steps.
