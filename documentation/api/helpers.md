# Key and text helpers

Named exports are available from the package root in both runtimes:

```ts
import {
  isValidRSAPublicKey, isValidRSAPrivateKey,
  isValidPEMPublicKey, isValidPEMPrivateKey, isValidPEMKey,
  splitIntoChunks, joinChunks,
} from 'encrypt-rsa';
```

## isValidRSAPublicKey

`isValidRSAPublicKey(key: unknown): Promise<boolean>` parses SPKI PEM key material through platform cryptography. Returns `false` for malformed, non-RSA, or wrong-role keys.

## isValidRSAPrivateKey

`isValidRSAPrivateKey(key: unknown): Promise<boolean>` parses PKCS#8 PEM RSA private key material. Returns `false` for malformed, non-RSA, or wrong-role keys.

These helpers do not establish that two keys match or satisfy your application's strength policy. Node cryptographic operations additionally accept legacy PKCS#1 keys, while strict validators and browser operations use SPKI/PKCS#8.

## isValidPEMPublicKey

`isValidPEMPublicKey(key: unknown): boolean` checks public PEM header/footer text only.

## isValidPEMPrivateKey

`isValidPEMPrivateKey(key: unknown): boolean` checks private PEM header/footer text only.

## isValidPEMKey

`isValidPEMKey(key: unknown): boolean` accepts either of the formatting checks above. All formatting helpers are synchronous and return `false` for non-string input.

::: warning Formatting is not validation
A correctly labeled PEM block may still contain invalid key material. Use the asynchronous RSA validators when validating a key supplied by an application.
:::

## splitIntoChunks

`splitIntoChunks(text: string, chunkSize = 214): string[]` splits text on Unicode code-point boundaries using UTF-8 byte counts. The default is the direct RSA/SHA-1 capacity of a 2048-bit key. Empty text returns `['']`. A chunk size smaller than one encoded character cannot provide that byte bound.

Prefer authenticated hybrid encryption for long data. Independently encrypted chunks do not authenticate their order or completeness.

## joinChunks

`joinChunks(chunks: string[]): string` concatenates chunks without separators.
