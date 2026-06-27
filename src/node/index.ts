/**
 * Node build: NodeRSA with async API (Option A).
 * Same interface as web build; wraps sync Node crypto in Promise.resolve.
 */
import convertKeyToBase64 from './convertKeyToBase64';
import {
  createPrivateAndPublicKeys,
  decryptStringWithRsaPrivateKey,
  decryptPublic,
  encryptStringWithRsaPublicKey,
  encryptPrivate,
  encryptLarge,
  decryptLarge,
} from './crypto';
import type {
  parametersOfDecrypt,
  parametersOfDecryptPublic,
  parametersOfEncrypt,
  parametersOfEncryptPrivate,
  returnCreateKeys,
  INodeRSA,
} from '../shared/types';

function requireKey(key: string | undefined, keyName: 'public' | 'private'): string {
  if (!key) {
    throw new Error(`${keyName === 'public' ? 'Public' : 'Private'} key is required`);
  }

  return key;
}

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

  public async encryptStringWithRsaPublicKey(args: parametersOfEncrypt): Promise<string> {
    const { publicKey = this.publicKey } = args;
    return encryptStringWithRsaPublicKey({
      ...args,
      publicKey: convertKeyToBase64(requireKey(publicKey, 'public')),
    });
  }

  public async decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): Promise<string> {
    const { privateKey = this.privateKey } = args;
    return decryptStringWithRsaPrivateKey({
      ...args,
      privateKey: convertKeyToBase64(requireKey(privateKey, 'private')),
    });
  }

  /**
   * Encrypts arbitrary-length text using hybrid encryption (AES-256-GCM + RSA-OAEP).
   * Use this instead of encryptStringWithRsaPublicKey when the data is larger than
   * the RSA key can hold (avoids ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_KEY_SIZE).
   * Decrypt with decryptLarge using the matching private key.
   */
  public async encryptLarge(args: parametersOfEncrypt): Promise<string> {
    const { publicKey = this.publicKey } = args;
    return encryptLarge({
      ...args,
      publicKey: convertKeyToBase64(requireKey(publicKey, 'public')),
    });
  }

  /**
   * Decrypts a value produced by encryptLarge using the RSA private key.
   */
  public async decryptLarge(args: parametersOfDecrypt): Promise<string> {
    const { privateKey = this.privateKey } = args;
    return decryptLarge({
      ...args,
      privateKey: convertKeyToBase64(requireKey(privateKey, 'private')),
    });
  }

  public async encrypt(args: parametersOfEncryptPrivate): Promise<string> {
    const { privateKey = this.privateKey } = args;
    return encryptPrivate({
      ...args,
      privateKey: convertKeyToBase64(requireKey(privateKey, 'private')),
    });
  }

  public async decrypt(args: parametersOfDecryptPublic): Promise<string> {
    const { publicKey = this.publicKey } = args;
    return decryptPublic({
      ...args,
      publicKey: convertKeyToBase64(requireKey(publicKey, 'public')),
    });
  }

  public async createPrivateAndPublicKeys(modulusLength: number = this.modulusLength): Promise<returnCreateKeys> {
    return createPrivateAndPublicKeys(modulusLength);
  }

  public encryptBufferWithRsaPublicKey(
    buffer: Uint8Array,
    publicKey?: string,
  ): Promise<string> {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const base64String = buf.toString(this.keyBase64);
    return this.encryptStringWithRsaPublicKey({ text: base64String, publicKey });
  }

  public decryptBufferWithRsaPrivateKey(
    encryptedText: string,
    privateKey?: string,
  ): Promise<Uint8Array> {
    return this.decryptStringWithRsaPrivateKey({ text: encryptedText, privateKey }).then(
      (decryptedBase64) => Buffer.from(decryptedBase64, this.keyBase64) as Uint8Array,
    );
  }
}

export default NodeRSA;
