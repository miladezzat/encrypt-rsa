import { publicEncrypt, privateDecrypt } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

type parameters = {
  text: string,
  keyPath: string
}

class NodeRSA {
  private publicKeyPath: string;

  private privateKeyPath: string;

  /**
   *
   * @param publicKeyPath this should be absolute path
   * @param privateKeyPath this should be absolute path
   */
  constructor(publicKeyPath: string = '', privateKeyPath:string = '') {
    this.publicKeyPath = publicKeyPath;
    this.privateKeyPath = privateKeyPath;
  }

  /**
   *
   * @param {Object} args
   * @param {String} args.publicKeyPath
   * @param {String} args.text the text that you need to encrypt
   *
   * @returns {String}
   */
  public encryptStringWithRsaPublicKey(args: parameters): string {
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
  public decryptStringWithRsaPrivateKey(args: parameters): string {
    const { text, keyPath = this.privateKeyPath } = args;
    const absolutePath: string = resolve(keyPath);

    const privateKey: string = readFileSync(absolutePath, 'utf8');
    const buffer: Buffer = Buffer.from(text, 'base64');
    const decrypted: Buffer = privateDecrypt(privateKey, buffer);

    return decrypted.toString('utf8');
  }
}

export default NodeRSA;
