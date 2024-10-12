import convertKetToBase64 from './functions/convertKetToBase64';
import createPrivateAndPublicKeys from './functions/createPrivateAndPublicKeys';
import decrypt from './functions/decrypt';
import decryptStringWithRsaPrivateKey from './functions/decryptStringWithRsaPrivateKey';
import encrypt from './functions/encrypt';
import encryptStringWithRsaPublicKey from './functions/encryptStringWithRsaPublicKey';
import {
  parametersOfDecrypt,
  parametersOfDecryptPublic,
  parametersOfEncrypt,
  parametersOfEncryptPrivate,
  returnCreateKeys,
} from './utils/types';

/**
 * NodeRSA class provides encryption and decryption methods using RSA keys.
 * It supports string and buffer encryption/decryption with both public and private keys.
 */
class NodeRSA {
  /**
     * @private
     * @type {string | undefined}
     * Public key used for encryption.
     */
  private publicKey: string | undefined;

  /**
     * @private
     * @type {string | undefined}
     * Private key used for decryption.
     */
  private privateKey: string | undefined;

  /**
     * @private
     * @type {number}
     * Length of the RSA modulus, defaults to 2048 bits.
     */
  private modulusLength: number;

  /**
     * @private
     * @type {'base64'}
     * Encoding format for the keys.
     */
  private keyBase64: 'base64';

  /**
     * Constructs a new instance of the NodeRSA class.
     *
     * @param {string} [publicKey] - Optional public key for encryption.
     * @param {string} [privateKey] - Optional private key for decryption.
     * @param {number} [modulusLength=2048] - Length of the RSA modulus in bits.
     */
  constructor(publicKey?: string, privateKey?: string, modulusLength?: number) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.modulusLength = modulusLength || 2048;
    this.keyBase64 = 'base64';
  }

  /**
     * Encrypts a string using the RSA public key.
     *
     * @param {parametersOfEncrypt} args - Parameters for encryption, including the text and public key.
     * @returns {string} Encrypted string in base64 format.
     */
  public encryptStringWithRsaPublicKey(args: parametersOfEncrypt): string {
    const { publicKey = this.publicKey } = args;
    return encryptStringWithRsaPublicKey({ ...args, publicKey: convertKetToBase64(publicKey as string) });
  }

  /**
     * Decrypts a string using the RSA private key.
     *
     * @param {parametersOfDecrypt} args - Parameters for decryption, including the encrypted text and private key.
     * @returns {string} Decrypted plain text string.
     */
  public decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): string {
    const { privateKey = this.privateKey } = args;
    return decryptStringWithRsaPrivateKey({ ...args, privateKey: convertKetToBase64(privateKey as string) });
  }

  /**
     * Encrypts a string using the RSA private key.
     *
     * @param {parametersOfEncryptPrivate} args - Parameters for encryption, including the text and private key.
     * @returns {string} Encrypted string in base64 format.
     */
  public encrypt(args: parametersOfEncryptPrivate): string {
    const { privateKey = this.privateKey } = args;
    return encrypt({ ...args, privateKey: convertKetToBase64(privateKey as string) });
  }

  /**
     * Decrypts a string using the RSA public key.
     *
     * @param {parametersOfDecryptPublic} args - Parameters for decryption, including the encrypted text and public key.
     * @returns {string} Decrypted plain text string.
     */
  public decrypt(args: parametersOfDecryptPublic): string {
    const { publicKey = this.publicKey } = args;
    return decrypt({ ...args, publicKey: convertKetToBase64(publicKey as string) });
  }

  /**
     * Creates a pair of RSA private and public keys with the given modulus length.
     *
     * @param {number} [modulusLength=this.modulusLength] - Length of the RSA modulus in bits.
     * @returns {returnCreateKeys} The generated RSA private and public keys.
     */
  public createPrivateAndPublicKeys(modulusLength: number = this.modulusLength): returnCreateKeys {
    return createPrivateAndPublicKeys(modulusLength);
  }

  /**
     * Encrypts a buffer using the RSA public key.
     *
     * @param {Buffer} buffer - The buffer to encrypt.
     * @param {string} [publicKey] - Optional public key for encryption.
     * @returns {string} Encrypted buffer as a base64 string.
     */
  public encryptBufferWithRsaPublicKey(buffer: Buffer, publicKey?: string): string {
    const base64String = buffer.toString(this.keyBase64);
    return this.encryptStringWithRsaPublicKey({ text: base64String, publicKey });
  }

  /**
     * Decrypts a buffer using the RSA private key.
     *
     * @param {string} encryptedText - The encrypted base64 string to decrypt.
     * @param {string} [privateKey] - Optional private key for decryption.
     * @returns {Buffer} Decrypted buffer.
     */
  public decryptBufferWithRsaPrivateKey(encryptedText: string, privateKey?: string): Buffer {
    const decryptedBase64 = this.decryptStringWithRsaPrivateKey({ text: encryptedText, privateKey });
    return Buffer.from(decryptedBase64, this.keyBase64);
  }
}

export default NodeRSA;
