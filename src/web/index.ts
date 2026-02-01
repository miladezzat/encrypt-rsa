/**
 * Web build: NodeRSA using Web Crypto API (async).
 * Same interface as Node build; uses crypto.subtle for RSA-OAEP.
 */
import convertKetToBase64 from './convertKetToBase64';
import {
  createPrivateAndPublicKeys,
  decryptStringWithRsaPrivateKey,
  decryptPublic,
  encryptStringWithRsaPublicKey,
  encryptPrivate,
} from './crypto';
import type {
  parametersOfDecrypt,
  parametersOfDecryptPublic,
  parametersOfEncrypt,
  parametersOfEncryptPrivate,
  returnCreateKeys,
  INodeRSA,
} from '../shared/types';

export type {
  returnCreateKeys,
  parametersOfEncrypt,
  parametersOfDecrypt,
  parametersOfEncryptPrivate,
  parametersOfDecryptPublic,
  INodeRSA,
} from '../shared/types';

export {
  isValidPEMPublicKey,
  isValidPEMPrivateKey,
  isValidPEMKey,
  splitIntoChunks,
  joinChunks,
} from '../shared/helpers';

class NodeRSA implements INodeRSA {
  private publicKey: string | undefined;
  private privateKey: string | undefined;
  private modulusLength: number;
  private keyBase64: 'base64' = 'base64';

  constructor(publicKey?: string, privateKey?: string, modulusLength?: number) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.modulusLength = modulusLength ?? 2048;
  }

  public encryptStringWithRsaPublicKey(args: parametersOfEncrypt): Promise<string> {
    const { publicKey = this.publicKey } = args;
    return encryptStringWithRsaPublicKey({
      ...args,
      publicKey: convertKetToBase64(publicKey as string),
    });
  }

  public decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): Promise<string> {
    const { privateKey = this.privateKey } = args;
    return decryptStringWithRsaPrivateKey({
      ...args,
      privateKey: convertKetToBase64(privateKey as string),
    });
  }

  public encrypt(args: parametersOfEncryptPrivate): Promise<string> {
    const { privateKey = this.privateKey } = args;
    return encryptPrivate({
      ...args,
      privateKey: convertKetToBase64(privateKey as string),
    });
  }

  public decrypt(args: parametersOfDecryptPublic): Promise<string> {
    const { publicKey = this.publicKey } = args;
    return decryptPublic({
      ...args,
      publicKey: convertKetToBase64(publicKey as string),
    });
  }

  public createPrivateAndPublicKeys(
    modulusLength: number = this.modulusLength
  ): Promise<returnCreateKeys> {
    return createPrivateAndPublicKeys(modulusLength);
  }

  public encryptBufferWithRsaPublicKey(
    buffer: Uint8Array,
    publicKey?: string
  ): Promise<string> {
    if (this.keyBase64 !== 'base64') {
      throw new Error('Only base64 encoding is supported');
    }
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64String = btoa(binary);
    return this.encryptStringWithRsaPublicKey({ text: base64String, publicKey });
  }

  public decryptBufferWithRsaPrivateKey(
    encryptedText: string,
    privateKey?: string
  ): Promise<Uint8Array> {
    if (this.keyBase64 !== 'base64') {
      throw new Error('Only base64 encoding is supported');
    }
    return this.decryptStringWithRsaPrivateKey({ text: encryptedText, privateKey }).then(
      (decryptedBase64) => {
        const binary = atob(decryptedBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }
    );
  }
}

export default NodeRSA;
