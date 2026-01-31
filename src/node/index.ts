/**
 * Node build: NodeRSA with async API (Option A).
 * Same interface as web build; wraps sync Node crypto in Promise.resolve.
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
    return Promise.resolve(
      encryptStringWithRsaPublicKey({ ...args, publicKey: convertKetToBase64(publicKey as string) })
    );
  }

  public decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): Promise<string> {
    const { privateKey = this.privateKey } = args;
    return Promise.resolve(
      decryptStringWithRsaPrivateKey({ ...args, privateKey: convertKetToBase64(privateKey as string) })
    );
  }

  public encrypt(args: parametersOfEncryptPrivate): Promise<string> {
    const { privateKey = this.privateKey } = args;
    return Promise.resolve(
      encryptPrivate({ ...args, privateKey: convertKetToBase64(privateKey as string) })
    );
  }

  public decrypt(args: parametersOfDecryptPublic): Promise<string> {
    const { publicKey = this.publicKey } = args;
    return Promise.resolve(
      decryptPublic({ ...args, publicKey: convertKetToBase64(publicKey as string) })
    );
  }

  public createPrivateAndPublicKeys(modulusLength: number = this.modulusLength): Promise<returnCreateKeys> {
    return Promise.resolve(createPrivateAndPublicKeys(modulusLength));
  }

  public encryptBufferWithRsaPublicKey(
    buffer: Uint8Array,
    publicKey?: string
  ): Promise<string> {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const base64String = buf.toString(this.keyBase64);
    return this.encryptStringWithRsaPublicKey({ text: base64String, publicKey });
  }

  public decryptBufferWithRsaPrivateKey(
    encryptedText: string,
    privateKey?: string
  ): Promise<Uint8Array> {
    return this.decryptStringWithRsaPrivateKey({ text: encryptedText, privateKey }).then(
      (decryptedBase64) => Buffer.from(decryptedBase64, this.keyBase64) as Uint8Array
    );
  }
}

export default NodeRSA;
