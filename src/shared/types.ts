/** OAEP hash shared by Node and Web; SHA-1 remains the compatibility default. */
export type OaepHash = 'sha1' | 'sha256';

/** JSON data supported without silent serialization losses. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
/** UTF-8 and depth bounds for new JSON/message helpers; existing string APIs are unaffected. */
export type JsonLimits = { maxBytes?: number; maxPayloadBytes?: number; maxDepth?: number };
/** Fully resolved JSON limits. */
export type ResolvedJsonLimits = Required<JsonLimits>;
/** A schema parser validates unknown application data and may transform it. */
export type JsonParser<T> = (value: JsonValue) => T | Promise<T>;
/** Encrypt strict JSON using SHA-256 and the v1 hybrid format. */
export type parametersOfEncryptJSON = { value: JsonValue; publicKey?: string; limits?: JsonLimits };
/** Without an application parser, decrypted data is JsonValue, never an unchecked application type. */
export type parametersOfDecryptJSON<T = JsonValue> = {
  text: string; privateKey?: string; limits?: JsonLimits; parse?: JsonParser<T>;
};
/** Signed message claims. Timestamps are Unix milliseconds; nonce must be randomly generated. */
export type MessageClaims<T = JsonValue> = {
  purpose: string; issuer: string; audience: string; keyId: string;
  issuedAt: number; expiresAt: number; nonce: string; payload: T;
};
/** Sign a canonical, domain-separated RSA-PSS message envelope. */
export type parametersOfSignMessage = { message: MessageClaims; privateKey?: string; limits?: JsonLimits };
/** Replay store input. validUntil includes the verifier's allowed clock skew. */
export type NonceClaim = {
  issuer: string; audience: string; purpose: string; nonce: string; validUntil: number;
};
/** Trusted key resolution and atomic replay protection are mandatory. Store failures reject verification. */
export type parametersOfVerifyMessage<T = JsonValue> = {
  text: string;
  expected: { issuer: string; audience: string; purpose: string };
  resolvePublicKey: (identity: { issuer: string; keyId: string }) => string | Promise<string>;
  consumeNonce: (claim: NonceClaim) => boolean | Promise<boolean>;
  parse?: JsonParser<T>;
  limits?: JsonLimits;
  now?: () => number;
  clockSkewMs?: number;
  maxLifetimeMs?: number;
};

/**
 * Type representing the return value of a function that creates RSA keys.
 *
 * @typedef {Object} returnCreateKeys
 * @property {string} privateKey - The generated RSA private key.
 * @property {string} publicKey - The generated RSA public key.
 */
export type returnCreateKeys = {
  privateKey: string;
  publicKey: string;
};

/**
 * Type representing the parameters required to encrypt text using a public key.
 *
 * @typedef {Object} parametersOfEncrypt
 * @property {string} text - The plain text to be encrypted.
 * @property {string} [publicKey] - Optional RSA public key; otherwise uses the constructor key.
 * @property {OaepHash} [oaepHash] - SHA-1 by default; explicitly select SHA-256 for both direct RSA endpoints.
 */
export type parametersOfEncrypt = {
  text: string;
  publicKey?: string;
  oaepHash?: OaepHash;
};

/** Hybrid output is legacy by default; SHA-256 implies authenticated v1 output. */
export type parametersOfEncryptLarge = parametersOfEncrypt & {
  payloadVersion?: 'legacy' | 'v1';
};

/** Sign exact UTF-8 text using RSA-PSS/SHA-256, with an optional constructor private key. */
export type parametersOfSign = { text: string; privateKey?: string };
/** Verify a base64 RSA-PSS signature; invalid signatures resolve false, invalid keys reject. */
export type parametersOfVerify = { text: string; signature: string; publicKey?: string };

/**
 * Type representing the parameters required to decrypt text using a private key.
 *
 * @typedef {Object} parametersOfDecrypt
 * @property {string} text - The base64-encoded string to be decrypted.
 * @property {string} [privateKey] - Optional RSA private key; otherwise uses the constructor key.
 * @property {OaepHash} [oaepHash] - Required to match direct encryption; optional assertion for hybrid payloads.
 */
export type parametersOfDecrypt = {
  text: string;
  privateKey?: string;
  oaepHash?: OaepHash;
};

/**
 * Type representing the parameters required to encrypt text using a private key.
 *
 * @typedef {Object} parametersOfEncryptPrivate
 * @property {string} text - The plain text to be encrypted.
 * @property {string} [privateKey] - Optional RSA private key for encryption. If not provided, a default key may be used.
 */
export type parametersOfEncryptPrivate = {
  text: string;
  privateKey?: string;
};

/**
 * Type representing the parameters required to decrypt text using a public key.
 *
 * @typedef {Object} parametersOfDecryptPublic
 * @property {string} text - The base64-encoded string to be decrypted.
 * @property {string} [publicKey] - Optional RSA public key for decryption. If not provided, a default key may be used.
 */
export type parametersOfDecryptPublic = {
  text: string;
  publicKey?: string;
};

/**
 * Shared public interface for NodeRSA (Node and Web builds).
 * Both implementations use the same method names, parameter types, and return types.
 */
export interface INodeRSA {
  encryptStringWithRsaPublicKey(args: parametersOfEncrypt): Promise<string>;
  decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): Promise<string>;
  encryptLarge(args: parametersOfEncryptLarge): Promise<string>;
  decryptLarge(args: parametersOfDecrypt): Promise<string>;
  encryptJSON(args: parametersOfEncryptJSON): Promise<string>;
  decryptJSON<T>(args: parametersOfDecryptJSON<T> & { parse: JsonParser<T> }): Promise<T>;
  decryptJSON(args: parametersOfDecryptJSON): Promise<JsonValue>;
  signMessage(args: parametersOfSignMessage): Promise<string>;
  verifyMessage<T>(args: parametersOfVerifyMessage<T> & { parse: JsonParser<T> }): Promise<MessageClaims<T>>;
  verifyMessage(args: parametersOfVerifyMessage): Promise<MessageClaims>;
  sign(args: parametersOfSign): Promise<string>;
  verify(args: parametersOfVerify): Promise<boolean>;
  encrypt(args: parametersOfEncryptPrivate): Promise<string>;
  decrypt(args: parametersOfDecryptPublic): Promise<string>;
  createPrivateAndPublicKeys(modulusLength?: number): Promise<returnCreateKeys>;
  encryptBufferWithRsaPublicKey(
    buffer: Uint8Array,
    publicKey?: string
  ): Promise<string>;
  decryptBufferWithRsaPrivateKey(
    encryptedText: string,
    privateKey?: string
  ): Promise<Uint8Array>;
}
