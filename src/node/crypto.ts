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
  const publicKeyDecoded: string = decode(publicKey as string);
  const buffer: Buffer = Buffer.from(text);
  const encrypted: Buffer = crypto.publicEncrypt(
    { key: publicKeyDecoded, ...OAEP_OPTIONS },
    buffer
  );
  return encrypted.toString('base64');
}

export function decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): string {
  const { text, privateKey } = args;
  const privateKeyDecoded: string = decode(privateKey as string);
  const buffer: Buffer = Buffer.from(text, 'base64');
  const decrypted: Buffer = crypto.privateDecrypt(
    { key: privateKeyDecoded, ...OAEP_OPTIONS },
    buffer
  );
  return decrypted.toString('utf8');
}

export function encryptPrivate(args: parametersOfEncryptPrivate): string {
  const { text, privateKey } = args;
  const privateKeyDecoded: string = decode(privateKey as string);
  const buffer: Buffer = Buffer.from(text);
  const encrypted: Buffer = crypto.privateEncrypt(privateKeyDecoded, buffer);
  return encrypted.toString('base64');
}

export function decryptPublic(args: parametersOfDecryptPublic): string {
  const { text, publicKey } = args;
  const publicKeyDecoded: string = decode(publicKey as string);
  const buffer: Buffer = Buffer.from(text, 'base64');
  const decrypted: Buffer = crypto.publicDecrypt(publicKeyDecoded, buffer);
  return decrypted.toString('utf8');
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
