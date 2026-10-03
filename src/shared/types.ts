/** OAEP hash shared by Node and Web; SHA-1 remains the compatibility default. */
export type OaepHash = 'sha1' | 'sha256';

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
