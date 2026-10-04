# Signed messages and replay prevention

`signMessage` and `verifyMessage` wrap the existing RSA-PSS/SHA-256 signature API in a versioned envelope. They authenticate all claims and payload, enforce expected identity/time policy, and require an atomic nonce claim. They do not encrypt the payload or replace application authorization.

## Contract

```ts
const issuedAt = Date.now();
const text = await rsa.signMessage({ privateKey: signingPrivateKey, message: {
  purpose: 'agent-result', issuer: 'agent-a', audience: 'service-b', keyId: 'signing-2026',
  issuedAt, expiresAt: issuedAt + 60000,
  nonce: randomBytes(24).toString('base64url'), payload: { answer: 'Hello' }
} });
const result = await rsa.verifyMessage({ text,
  expected: { issuer: 'agent-a', audience: 'service-b', purpose: 'agent-result' },
  resolvePublicKey: trustedKeyResolver,
  consumeNonce: atomicReplayStore,
  parse: validateAgentResult
});
```

`randomBytes` above is from Node's `node:crypto`. In a browser use `crypto.getRandomValues` and encode the bytes as base64url. Generate at least 16 random bytes; do not use a model, timestamp, counter, or `Math.random` for nonces. Nonces must match `[A-Za-z0-9_-]{16,128}`. Format validation does not prove randomness.

The exact eight claims are required; extra claims reject. Identity fields (`purpose`, `issuer`, `audience`, `keyId`) are nonempty, trimmed strings up to 256 UTF-16 units without control characters. Times are nonnegative safe integer UTC milliseconds, bounded to leave room for clock skew. `expiresAt` must be later than `issuedAt`, with a maximum 24-hour signing lifetime.

The verifier defaults to a five-minute maximum lifetime and zero clock skew. `maxLifetimeMs` can range from 1 to 86,400,000; `clockSkewMs` from 0 to 60,000. Future issuance outside skew and expiry at or after `expiresAt + skew` reject. `now` defaults to `Date.now`; only supply an alternative trusted clock for tests or explicit clock policy. Time is checked again after asynchronous key resolution/schema validation and nonce storage. Errors never return a verified payload.

Use separate signing and encryption key pairs. Resolve `(issuer, keyId)` against a trusted local configuration/KMS record; reject unknown/revoked IDs. Never fetch an arbitrary URL or accept a public key embedded by the sender. An application must authorize the expected issuer, audience, and purpose before verification. Per-call/constructor signing keys are supported; verification always requires the trusted resolver.

## Atomic replay store

`consumeNonce({ issuer, audience, purpose, nonce, validUntil })` must atomically reserve the tuple `(issuer, audience, purpose, nonce)` exactly once and return literal `true` for the winner. Retain it until the provided `validUntil` UTC timestamp (which includes clock skew). A false result, thrown error, or unavailable store fails closed. Namespace keys by application/environment as well. Excluding key ID preserves replay protection across signing-key rotation.

Use a unique database insertion or Redis `SET ... NX PX` with a TTL computed from `validUntil`, an unambiguous tuple encoding, and trusted server time. Do not use a read-then-write sequence. Share the store between all verifiers and retain claims over restarts for the full validity window. TTL rounding must never delete early. The example's Map is atomic only inside one JavaScript process and is not production replay storage. A nonce may be consumed even if the final time check subsequently rejects; this deliberately fails closed.

Schema parsers should be pure: they run after signature verification but before replay consumption, so concurrent/replayed requests can invoke them more than once. Execute tools or other side effects only after `verifyMessage` succeeds. For exactly-once business effects, use application transaction/idempotency rules; a nonce reservation alone does not guarantee delivery or transactional effects.

## Wire format and trust boundaries

The returned string is canonical JSON with claims plus `version: 1`, `algorithm: 'RSA-PSS-SHA256'`, and a base64 `signature`. The signature covers the UTF-8 string `encrypt-rsa:signed-message:v1\n` followed by the canonical body without the signature. RSA-PSS uses a 32-byte salt. Canonical property sorting uses UTF-16 order and JSON number/string encoding; the supported JSON subset follows RFC 8785 encoding but rejects negative zero. Unicode normalization is not performed.

Receivers require the exact canonical string and reject reordered/whitespace-modified envelopes, duplicate/unknown keys, unsupported algorithms, malformed signatures, changed claims, and invalid payloads. Transport the string unchanged. Node/browser/global builds interoperate. See the [JSON guide](./json.md#bound-resource-use) for byte/depth limits.

A valid signature authenticates the key holder and signed content. It does not establish that an agent's claims are true, remove prompt injection, authorize a tool, hide data, or provide forward secrecy. Treat payloads as untrusted data and enforce schema, permissions, and operation-specific rules. Use HTTPS and application size/rate limits. Review this new protocol before adopting it for high-assurance interoperability.

Run `npm --prefix examples/ai-integrations run messages` after building for a complete local signing, schema, trusted-key, and replay example.
