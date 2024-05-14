import * as crypto from 'crypto';
import { decode, encode } from './utils/helpers';
import {
  parametersOfDecrypt,
  parametersOfEncrypt,
  returnCreateKeys,
} from './utils/types';

class NodeRSA {
  private publicKey: string | undefined;

  private privateKey: string | undefined;

  private modulusLength: number;

  private keyBase64: string;

  /**
     *
     * @param publicKey
     * @param privateKey
     */
  constructor(publicKey?: string, privateKey?: string, modulusLength?: number) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.modulusLength = modulusLength || 2048;
    this.keyBase64 = '';
  }

  /**
     *
     * @param {Object} args
     * @param {String} args.privateKey
     * @param {String} args.text the text that you need to encrypt
     * @deprecated
     * @returns {String}
     */
  public encryptStringWithRsaPublicKey(args: parametersOfEncrypt): string {
    const { text, privateKey = this.privateKey } = args;
    const publicKeyDecoded: string = decode(this.convertKetToBase64(privateKey as string));

    const buffer: Buffer = Buffer.from(text);
    const encrypted: Buffer = crypto?.publicEncrypt(publicKeyDecoded, buffer);

    return encrypted.toString('base64');
  }

  /**
     *
     * @param {Object} args
     * @param {String} args.privateKey
     * @param {String} args.text the text that you need to decrypt
     * @deprecated
     * @returns {String}
     */
  public decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): string {
    const { text, publicKey = this.publicKey } = args;

    const publicKeyDecoded: string = decode(this.convertKetToBase64(publicKey as string));

    const buffer: Buffer = Buffer.from(text, 'base64');
    const decrypted: Buffer = crypto?.privateDecrypt(publicKeyDecoded as string, buffer);

    return decrypted.toString('utf8');
  }

  /**
   *
   * @param {Object} args
   * @param {String} args.privateKey
   * @param {String} args.text the text that you need to encrypt
   *
   * @returns {String}
   */
  public encrypt(args: parametersOfEncrypt): string {
    const { text, privateKey = this.privateKey } = args;
    const publicKeyDecoded: string = decode(this.convertKetToBase64(privateKey as string));

    const buffer: Buffer = Buffer.from(text);
    const encrypted: Buffer = crypto?.publicEncrypt(publicKeyDecoded, buffer);

    return encrypted.toString('base64');
  }

  /**
     *
     * @param {Object} args
     * @param {String} args.privateKey
     * @param {String} args.text the text that you need to decrypt
     *
     * @returns {String}
     */
  public decrypt(args: parametersOfDecrypt): string {
    const { text, publicKey = this.publicKey } = args;

    const publicKeyDecoded: string = decode(this.convertKetToBase64(publicKey as string));

    const buffer: Buffer = Buffer.from(text, 'base64');
    const decrypted: Buffer = crypto?.privateDecrypt(publicKeyDecoded as string, buffer);

    return decrypted.toString('utf8');
  }

  public createPrivateAndPublicKeys(modulusLength: number = this.modulusLength): returnCreateKeys {
    if (typeof crypto.generateKeyPairSync === 'function') {
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      return { publicKey: privateKey, privateKey: publicKey };
    }

    return { privateKey: '', publicKey: '' };
  }

  private convertKetToBase64(key: string) {
    return encode(key.replace(/^ +/gm, '') || this.keyBase64);
  }
}

export default NodeRSA;
