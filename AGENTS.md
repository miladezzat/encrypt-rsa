# Agent Instructions

## Project Overview

`encrypt-rsa` is an RSA encryption/decryption library for Node.js and browser environments. The supported public API is the async `NodeRSA` class exposed through the package root and the Node/Web build entries.

## Source Layout

- `src/node/`: Node.js implementation using the built-in `crypto` module.
- `src/web/`: Browser implementation using the Web Crypto API.
- `src/shared/`: Types and helpers shared by Node and Web builds.
- `src/functions/`: Legacy function-level helpers kept for compatibility tests.
- `tests/`: Mocha/Chai tests for Node, Web, package, and example smoke coverage.
- `examples/`: Local examples. Run `npm run build` before running them.

## Development Commands

- Install dependencies: `npm ci`
- Build all outputs: `npm run build`
- Run tests: `npm test`
- Run lint: `npm run lint`
- Run built package/example smoke checks: `npm run smoke`
- Run packed install smoke check: `npm run smoke:install`
- Generate docs: `npm run docs`

## Coding Standards

- Keep Node and Web APIs aligned with `INodeRSA` in `src/shared/types.ts`.
- Crypto methods are async and must return rejected Promises for failures rather than throwing synchronously before a Promise is returned.
- Validate missing public/private keys explicitly and return clear errors.
- Avoid Node-only APIs in browser implementation files.
- Avoid browser-only globals in Node implementation files.
- Keep build output paths and examples aligned with `package.json`.

## Crypto Notes

- Direct RSA encryption uses RSA-OAEP with SHA-1 for Node/Web compatibility.
- Maximum direct RSA plaintext size with RSA-OAEP/SHA-1:
  - 2048-bit key: 214 bytes
  - 4096-bit key: 470 bytes
- Use `encryptLarge` / `decryptLarge` for arbitrary-length text. These use AES-256-GCM with an RSA-wrapped AES key.
- Do not change default OAEP hash behavior without treating it as a compatibility-impacting release.

## Testing Expectations

- Add or update regression tests for every behavior fix.
- Source tests alone are not enough for package changes; keep `npm run smoke` and `npm run smoke:install` passing.
- Example changes should be runnable after `npm run build`.
- CI should protect lint, build, tests, examples, and packed-package installation.

## Documentation Expectations

- Keep README, examples, changelog, and generated docs consistent with actual package behavior.
- If public API or build output changes, update the examples and package smoke tests in the same change.
- Keep license metadata consistent with `LICENSE`.
