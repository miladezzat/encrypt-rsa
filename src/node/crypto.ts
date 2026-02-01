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
