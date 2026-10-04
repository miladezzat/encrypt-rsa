# Encrypted agent memory

Store structured memory as encrypted JSON and bind each record to its tenant, authenticated user, ID, revision, and encryption key. The runnable recipe uses the core JSON API; it does not call a model.

## Before you start

Follow [AI integration setup](../ai-integrations.md#run-the-examples) and [JSON validation and limits](../json.md). The `EncryptedMemory` and `MemoryBackend` classes belong to the separate example app; they are not exports from the npm package.

## Run the recipe

```bash
npm --prefix examples/ai-integrations run memory
```

The command writes an encrypted record, rotates it to a new key, and confirms that another user sees no record in their scope.

## Follow the complete example

The code below is included from the runnable source. Its generated keys are for the demo; a service should load a durable keyring from trusted configuration.

<<< ../../examples/ai-integrations/memory-demo.mjs{js}

## Read, write, and rotate

| Operation | Result |
|---|---|
| `read(context, id)` | Returns `{ revision, value }`; a missing record has revision `0` and value `null` |
| `write(context, id, value, expectedRevision)` | Encrypts under the active key and returns the new revision; a concurrent update rejects |
| `rotate(context, id)` | Reads with the retained key and rewrites under the active key with a revision check |

## Record isolation and key rotation

The runnable memory recipe stores encrypted records bound to tenant, authenticated subject, record ID, revision, and key ID. Tenant keyrings are trusted server configuration. Reads reject swapped records; writes use compare-and-set to prevent lost updates. Rotation decrypts with the old key and writes with the active key using the same revision check. Keep old private keys until migration and retention requirements are satisfied.

## Production storage and identity

The example backend is a Map. Replace it with a database transaction/atomic conditional update before using multiple processes. Derive tenant/subject from authentication and enforce authorization before calling it. Do not accept tenant key mappings or private keys from request bodies or model outputs.

## Confidentiality and writer trust

Encryption protects confidentiality at rest and detects altered ciphertext. Anyone with the public key can create new ciphertext: encryption does not authenticate a writer or prevent restoring an older valid database snapshot. Protect database writes/revisions, and add signed records or an external trusted revision store when that threat matters. The library does not supply a KMS, database, key lifecycle, or access control.

## Schema migrations

Memory records carry schema version 1. Readers reject incompatible versions and corrupt records rather than resetting history. For a schema migration, validate the old record with its old schema, transform it, and write the new checkpoint with a revision check. Keep migration code and retired decryption keys until the application confirms that all retained records are readable. The example does not automatically migrate unknown formats.

## Adapt the recipe to your application

1. Authenticate and authorize the user before deriving `context`.
2. Use durable tenant keyrings and retain retired private keys until all retained records are migrated.
3. Replace the Map with atomic database writes using the expected revision.
4. Validate the schema of the application's `value`, including when migrating older records.
5. Set request limits, retention/deletion rules, and application quotas.

Continue with [conversation persistence](./conversation-persistence.md) to store complete AI SDK histories or [signed messages](../signed-messages.md) to authenticate an agent's results.
