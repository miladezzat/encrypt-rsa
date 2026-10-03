/**
 * Web build: NodeRSA using Web Crypto API (async).
 * Same interface as Node build; uses crypto.subtle for RSA-OAEP.
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
  sign as signText,
  verify as verifyText,
} from './crypto';
import type {
  parametersOfDecrypt,
  parametersOfDecryptPublic,
  parametersOfEncrypt,
  parametersOfEncryptLarge,
  parametersOfSign,
  parametersOfVerify,
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
  OaepHash,
  returnCreateKeys,
  parametersOfEncrypt,
  parametersOfEncryptLarge,
  parametersOfSign,
  parametersOfVerify,
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

  /** Stores default keys and modulus length; key generation returns keys without updating these defaults. */
  constructor(publicKey?: string, privateKey?: string, modulusLength?: number) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.modulusLength = modulusLength ?? 2048;
  }

  /** Encrypts UTF-8 text using RSA-OAEP; SHA-1 by default, or explicit SHA-256. */
  public async encryptStringWithRsaPublicKey(args: parametersOfEncrypt): Promise<string> {
    const { publicKey = this.publicKey } = args;
    return encryptStringWithRsaPublicKey({
      ...args,
      publicKey: convertKeyToBase64(requireKey(publicKey, 'public')),
    });
  }

  /** Decrypts base64 RSA-OAEP ciphertext using the same hash as encryption; preserves leading BOMs. */
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
   * the RSA key can hold. Legacy SHA-1 and opt-in v1/SHA-256 output interoperate with Node.
   */
  public async encryptLarge(args: parametersOfEncryptLarge): Promise<string> {
    const { publicKey = this.publicKey } = args;
    return encryptLarge({
      ...args,
      publicKey: convertKeyToBase64(requireKey(publicKey, 'public')),
    });
  }

  /**
   * Decrypts legacy or v1 hybrid data. Enforces AES key32/IV12/tag16 and rejects tampering.
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

  /** Signs UTF-8 text with RSA-PSS/SHA-256 and a 32-byte salt. */
  public async sign(args: parametersOfSign): Promise<string> {
    const { privateKey = this.privateKey } = args;
    return signText({ ...args, privateKey: convertKeyToBase64(requireKey(privateKey, 'private')) });
  }

  /** Verifies a base64 RSA-PSS/SHA-256 signature. Does not decrypt data. */
  public async verify(args: parametersOfVerify): Promise<boolean> {
    const { publicKey = this.publicKey } = args;
    return verifyText({ ...args, publicKey: convertKeyToBase64(requireKey(publicKey, 'public')) });
  }

  /** Generates interoperable SPKI/PKCS#8 RSA PEM keys asynchronously. Default modulus: 2048 bits. */
  public async createPrivateAndPublicKeys(
    modulusLength: number = this.modulusLength,
  ): Promise<returnCreateKeys> {
    return createPrivateAndPublicKeys(modulusLength);
  }

  /** Base64-encodes binary data before direct RSA/SHA-1; at most 159 raw bytes for a 2048-bit key. */
  public async encryptBufferWithRsaPublicKey(
    buffer: Uint8Array,
    publicKey?: string,
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

  /** Restores binary data from a value produced by encryptBufferWithRsaPublicKey. */
  public async decryptBufferWithRsaPrivateKey(
    encryptedText: string,
    privateKey?: string,
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
      },
    );
  }
}

export { isValidRSAPublicKey, isValidRSAPrivateKey } from './crypto';

export default NodeRSA;
