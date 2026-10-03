# Hybrid payload specification

`encryptLarge` uses a random 32-byte AES key, a random 12-byte IV, and AES-256-GCM with a 16-byte authentication tag. Only the AES key is encrypted using RSA-OAEP. Fields are base64 strings separated by colons, not one base64 encoding of the complete payload.

## Legacy

```text
encryptedKey:iv:tag:ciphertext
```

Legacy payloads always use RSA-OAEP/SHA-1 and have no additional authenticated data. They remain the default output when neither `oaepHash` nor `payloadVersion` is supplied. Empty plaintext has an empty final field. Readers accept whitespace and omitted padding in standard legacy base64, while rejecting invalid punctuation and base64url encodings.

## Version 1

```text
encrypt-rsa:v1:RSA-OAEP-SHA1+A256GCM:encryptedKey:iv:tag:ciphertext
encrypt-rsa:v1:RSA-OAEP-SHA256+A256GCM:encryptedKey:iv:tag:ciphertext
```

The exact UTF-8 header preceding the four encoded fields is AES-GCM additional authenticated data. This binds the format version and algorithm identifier to the ciphertext. Stripping the header, changing the suite, or changing encrypted data causes decryption to fail. v1 requires canonical padded standard base64, with an empty ciphertext field allowed.

`{ payloadVersion: 'v1' }` selects the first suite. `{ oaepHash: 'sha256' }` selects the second and implies v1. Explicit legacy/SHA-256 encryption is rejected. Decryption determines the hash from the recognized suite; an explicit `oaepHash` argument must match. Unsupported versions or suites are rejected, with no fallback to another algorithm.

Both readers check decoded IV12/tag16 before RSA decryption and AES key32 after RSA unwrapping. The encrypted AES-key field length follows the RSA modulus, so it is not fixed at 256 bytes. The parser requires exactly four legacy fields or seven v1 fields. Wrong keys and GCM authentication failures reject without releasing plaintext.

## Rollout

Upgrade all readers before enabling v1 writers. Older versions of the library can read only the legacy four-field format. Existing valid legacy payloads remain decryptable. Shortened tags, nonstandard IV lengths, and AES-128/192 payloads are rejected because they do not conform to this package's generated AES-256-GCM format.

A signature is separate from a hybrid payload. GCM authenticates the encrypted data under its AES key; anyone possessing the recipient's public key can create a new valid encrypted message. Use trusted RSA-PSS signatures when sender authentication is required.
