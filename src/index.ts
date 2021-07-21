import { publicEncrypt, privateDecrypt } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parametersOfEncryptAndDecrypt, returnCreateKeys } from './utils/types';

const { generateKeyPairSync } = require('crypto');

class NodeRSA {
  private publicKeyPath: string;

  private privateKeyPath: string;

  private modulusLength: number ;

  /**
   *
   * @param publicKeyPath this should be absolute path
   * @param privateKeyPath this should be absolute path
   */
  constructor(publicKeyPath: string = '', privateKeyPath:string = '', modulusLength?:number) {
    this.publicKeyPath = publicKeyPath;
    this.privateKeyPath = privateKeyPath;
    this.modulusLength = modulusLength || 2048;
  }

  /**
   *
   * @param {Object} args
   * @param {String} args.publicKeyPath
   * @param {String} args.text the text that you need to encrypt
   *
   * @returns {String}
   */
  public encryptStringWithRsaPublicKey(args: parametersOfEncryptAndDecrypt): string {
    const { text, keyPath = this.publicKeyPath } = args;

    const absolutePath: string = resolve(keyPath);

    const publicKey: string = readFileSync(absolutePath, 'utf8');
    const buffer: Buffer = Buffer.from(text);
    const encrypted: Buffer = publicEncrypt(publicKey, buffer);

    return encrypted.toString('base64');
  }

  /**
   *
   * @param {Object} args
   * @param {String} args.privateKeyPath
   * @param {String} args.text the text that you need to decrypt
   *
   * @returns {String}
   */
  public decryptStringWithRsaPrivateKey(args: parametersOfEncryptAndDecrypt): string {
    const { text, keyPath = this.privateKeyPath } = args;
    const absolutePath: string = resolve(keyPath);

    const privateKey: string = readFileSync(absolutePath, 'utf8');
    const buffer: Buffer = Buffer.from(text, 'base64');
    const decrypted: Buffer = privateDecrypt(privateKey, buffer);

    return decrypted.toString('utf8');
  }

  public createPrivateAndPublicKeys(modulusLength:number = this.modulusLength):returnCreateKeys {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
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

    return { privateKey, publicKey };
  }
}

export default NodeRSA;
