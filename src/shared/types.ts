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
 * @property {string} [publicKey] - Optional RSA public key for encryption. If not provided, a default key may be used.
 */
export type parametersOfEncrypt = {
  text: string;
  publicKey?: string;
};

/**
 * Type representing the parameters required to decrypt text using a private key.
 *
 * @typedef {Object} parametersOfDecrypt
 * @property {string} text - The base64-encoded string to be decrypted.
 * @property {string} [privateKey] - Optional RSA private key for decryption. If not provided, a default key may be used.
 */
export type parametersOfDecrypt = {
  text: string;
  privateKey?: string;
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
