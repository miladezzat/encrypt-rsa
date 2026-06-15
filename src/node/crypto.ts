/**
 * Node-specific crypto implementation using Node's crypto module and Buffer.
 * Uses RSA-OAEP with SHA-1 for cross-compatibility with Web Crypto.
 */
import * as crypto from 'crypto';
import { decode } from '../shared/helpers';
import type {
  parametersOfDecrypt,
  parametersOfDecryptPublic,
  parametersOfEncrypt,
  parametersOfEncryptPrivate,
  returnCreateKeys,
} from '../shared/types';

const OAEP_OPTIONS = {
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha1' as const,
};

export function encryptStringWithRsaPublicKey(args: parametersOfEncrypt): string {
  const { text, publicKey } = args;
  try {
    const publicKeyDecoded: string = decode(publicKey as string);
    const buffer: Buffer = Buffer.from(text);
    const encrypted: Buffer = crypto.publicEncrypt(
      { key: publicKeyDecoded, ...OAEP_OPTIONS },
      buffer as unknown as Uint8Array,
    );
    return encrypted.toString('base64');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      throw new Error('Invalid public key format. Ensure the key is valid PEM format starting with "-----BEGIN PUBLIC KEY-----"');
    }
    if (errorMsg.includes('too long')) {
      throw new Error('Data too large to encrypt. RSA can only encrypt ~245 bytes with 2048-bit keys. Use chunking for larger data.');
    }
    throw error;
  }
}

export function decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): string {
  const { text, privateKey } = args;
  try {
    const privateKeyDecoded: string = decode(privateKey as string);
    const buffer: Buffer = Buffer.from(text, 'base64');
    const decrypted: Buffer = crypto.privateDecrypt(
      { key: privateKeyDecoded, ...OAEP_OPTIONS },
      buffer as unknown as Uint8Array,
    );
    return decrypted.toString('utf8');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      throw new Error('Invalid private key format. Ensure the key is valid PEM format starting with "-----BEGIN PRIVATE KEY-----"');
    }
    if (errorMsg.includes('decrypt') || errorMsg.includes('padding')) {
      throw new Error('Decryption failed. Ensure you are using the correct private key that matches the public key used for encryption.');
    }
    throw error;
  }
}

/**
 * Hybrid encryption: encrypts arbitrary-length text by encrypting it with a
 * one-time AES-256-GCM key, then wrapping that AES key with RSA-OAEP (SHA-1).
 * This removes the RSA size limit that causes ERR_OSSL_RSA_DATA_TOO_LARGE_FOR_KEY_SIZE.
 *
 * Output is a single base64 string: `encKey:iv:tag:ciphertext`.
 */
export function encryptLarge(args: parametersOfEncrypt): string {
  const { text, publicKey } = args;
  try {
    const publicKeyDecoded: string = decode(publicKey as string);

    const aesKey: Buffer = crypto.randomBytes(32);
    const iv: Buffer = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey as unknown as Uint8Array, iv as unknown as Uint8Array);
    const ciphertext: Buffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag: Buffer = cipher.getAuthTag();

    const encryptedKey: Buffer = crypto.publicEncrypt(
      { key: publicKeyDecoded, ...OAEP_OPTIONS },
      aesKey as unknown as Uint8Array,
    );

    return [encryptedKey, iv, tag, ciphertext]
      .map((b) => b.toString('base64'))
      .join(':');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      throw new Error('Invalid public key format. Ensure the key is valid PEM format starting with "-----BEGIN PUBLIC KEY-----"');
    }
    throw error;
  }
}

/**
 * Decrypts a value produced by encryptLarge: unwraps the AES key with the RSA
 * private key, then decrypts the ciphertext with AES-256-GCM.
 */
export function decryptLarge(args: parametersOfDecrypt): string {
  const { text, privateKey } = args;
  try {
    const privateKeyDecoded: string = decode(privateKey as string);

    const parts = text.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid payload format. Expected "encKey:iv:tag:ciphertext" produced by encryptLarge.');
    }
    const [encryptedKey, iv, tag, ciphertext] = parts.map((p) => Buffer.from(p, 'base64'));

    const aesKey: Buffer = crypto.privateDecrypt(
      { key: privateKeyDecoded, ...OAEP_OPTIONS },
      encryptedKey as unknown as Uint8Array,
    );

    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey as unknown as Uint8Array, iv as unknown as Uint8Array);
    decipher.setAuthTag(tag as unknown as Uint8Array);
    const decrypted: Buffer = Buffer.concat([decipher.update(ciphertext as unknown as Uint8Array), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      throw new Error('Invalid private key format. Ensure the key is valid PEM format starting with "-----BEGIN PRIVATE KEY-----"');
    }
    if (errorMsg.includes('decrypt') || errorMsg.includes('padding') || errorMsg.includes('auth')) {
      throw new Error('Decryption failed. Ensure you are using the correct private key and an unmodified payload produced by encryptLarge.');
    }
    throw error;
  }
}

export function encryptPrivate(args: parametersOfEncryptPrivate): string {
  const { text, privateKey } = args;
  try {
    const privateKeyDecoded: string = decode(privateKey as string);
    const buffer: Buffer = Buffer.from(text);
    const encrypted: Buffer = crypto.privateEncrypt(privateKeyDecoded, buffer as unknown as Uint8Array);
    return encrypted.toString('base64');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      throw new Error('Invalid private key format. Ensure the key is valid PEM format starting with "-----BEGIN PRIVATE KEY-----"');
    }
    throw error;
  }
}

export function decryptPublic(args: parametersOfDecryptPublic): string {
  const { text, publicKey } = args;
  try {
    const publicKeyDecoded: string = decode(publicKey as string);
    const buffer: Buffer = Buffer.from(text, 'base64');
    const decrypted: Buffer = crypto.publicDecrypt(publicKeyDecoded, buffer as unknown as Uint8Array);
    return decrypted.toString('utf8');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      throw new Error('Invalid public key format. Ensure the key is valid PEM format starting with "-----BEGIN PUBLIC KEY-----"');
    }
    throw error;
  }
}

export function createPrivateAndPublicKeys(modulusLength: number = 2048): returnCreateKeys {
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
    return { publicKey, privateKey };
  }
  return { privateKey: '', publicKey: '' };
}
