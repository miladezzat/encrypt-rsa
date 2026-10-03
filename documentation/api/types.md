# TypeScript types

Import public types from the package root. Both implementations share the same contracts:

```ts
import type { JsonValue, JsonLimits, MessageClaims, INodeRSA } from 'encrypt-rsa';
```

| Type | Purpose |
|---|---|
| `OaepHash` | `'sha1'` or `'sha256'` |
| `returnCreateKeys` | PEM public/private key pair |
| `JsonValue`, `JsonLimits`, `JsonParser<T>` | Supported JSON values, bounds, and schema parser |
| `MessageClaims<T>`, `NonceClaim` | Signed claims and atomic replay-store input |
| `parametersOfEncrypt`, `parametersOfDecrypt`, `parametersOfEncryptLarge` | Direct and hybrid string arguments |
| `parametersOfEncryptJSON`, `parametersOfDecryptJSON<T>` | JSON encryption and validated decryption |
| `parametersOfSign`, `parametersOfVerify` | RSA-PSS text operations |
| `parametersOfSignMessage`, `parametersOfVerifyMessage<T>` | Scoped signed-message operations |
| `parametersOfEncryptPrivate`, `parametersOfDecryptPublic` | Legacy Node-only operations |
| `INodeRSA` | Complete shared Promise interface |

## Shared source contracts

The following is included directly from the source used by both builds. `ResolvedJsonLimits` is an internal type, not a package-root export.

<<< ../../src/shared/types.ts
