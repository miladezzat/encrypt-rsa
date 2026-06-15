/**
 * Web build: Web Crypto API (RSA-OAEP with SHA-1).
 * PEM import/export, encrypt/decrypt with public/private, generateKey.
 * encrypt(private)/decrypt(public) not supported in Web Crypto; throws in browser.
 */
import {
  decode, pemToBinary, binaryToPem, base64ToBytes, bytesToBase64,
} from '../shared/helpers';
import type {
  parametersOfDecrypt,
  parametersOfDecryptPublic,
  parametersOfEncrypt,
  parametersOfEncryptPrivate,
  returnCreateKeys,
} from '../shared/types';

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto;
  }
  throw new Error(
    'Web Crypto API (crypto.subtle) is not available. Please ensure you are using HTTPS or localhost, and using a modern browser (Chrome 37+, Firefox 34+, Safari 11+, Edge 79+).',
  );
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  try {
    const pemDecoded = decode(pem);
    const binary = pemToBinary(pemDecoded);
    return getCrypto().subtle.importKey(
      'spki',
      binary,
      { name: 'RSA-OAEP', hash: 'SHA-1' },
      false,
      ['encrypt'],
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      throw new Error('Invalid public key format. Ensure the key is valid PEM format starting with "-----BEGIN PUBLIC KEY-----"');
    }
    throw error;
  }
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  try {
    const pemDecoded = decode(pem);
    const binary = pemToBinary(pemDecoded);
    return getCrypto().subtle.importKey(
      'pkcs8',
      binary,
      { name: 'RSA-OAEP', hash: 'SHA-1' },
      false,
      ['decrypt'],
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      throw new Error('Invalid private key format. Ensure the key is valid PEM format starting with "-----BEGIN PRIVATE KEY-----"');
    }
    throw error;
  }
}

export async function encryptStringWithRsaPublicKey(
  args: parametersOfEncrypt,
): Promise<string> {
  try {
    const { text, publicKey } = args;
    const key = await importPublicKey(publicKey as string);
    const data = new TextEncoder().encode(text);
    const encrypted = await getCrypto().subtle.encrypt(
      { name: 'RSA-OAEP' },
      key,
      data,
    );
    const bytes = new Uint8Array(encrypted);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('too long')) {
      throw new Error('Data too large to encrypt. RSA can only encrypt ~245 bytes with 2048-bit keys. Use chunking for larger data.');
    }
    throw error;
  }
}

export async function decryptStringWithRsaPrivateKey(
  args: parametersOfDecrypt,
): Promise<string> {
  try {
    const { text, privateKey } = args;
    const key = await importPrivateKey(privateKey as string);
    const binary = atob(text);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decrypted = await getCrypto().subtle.decrypt(
      { name: 'RSA-OAEP' },
      key,
      bytes,
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('decrypt') || errorMsg.includes('padding')) {
      throw new Error('Decryption failed. Ensure you are using the correct private key that matches the public key used for encryption.');
    }
    throw error;
  }
}

/**
 * Hybrid encryption (Web): encrypts arbitrary-length text with a one-time
 * AES-256-GCM key, then wraps that key with RSA-OAEP (SHA-1). Removes the RSA
 * size limit. Output is byte-compatible with the Node build's encryptLarge:
 * a single base64 string `encKey:iv:tag:ciphertext`.
 */
export async function encryptLarge(args: parametersOfEncrypt): Promise<string> {
  try {
    const { text, publicKey } = args;
    const rsaKey = await importPublicKey(publicKey as string);
    const { subtle } = getCrypto();

    const aesKey = await subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt'],
    );
    const iv = getCrypto().getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(text);
    const encrypted = new Uint8Array(
      await subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, data),
    );

    // Web Crypto appends the 16-byte GCM tag to the ciphertext; split it out
    // so the format matches Node (separate tag).
    const tag = encrypted.slice(encrypted.length - 16);
    const ciphertext = encrypted.slice(0, encrypted.length - 16);

    const rawAesKey = new Uint8Array(await subtle.exportKey('raw', aesKey));
    const encryptedKey = new Uint8Array(
      await subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAesKey),
    );

    return [encryptedKey, iv, tag, ciphertext]
      .map((b) => bytesToBase64(b))
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
 * Decrypts a value produced by encryptLarge (Node or Web): unwraps the AES key
 * with the RSA private key, then decrypts with AES-256-GCM.
 */
export async function decryptLarge(args: parametersOfDecrypt): Promise<string> {
  try {
    const { text, privateKey } = args;
    const rsaKey = await importPrivateKey(privateKey as string);
    const { subtle } = getCrypto();

    const parts = text.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid payload format. Expected "encKey:iv:tag:ciphertext" produced by encryptLarge.');
    }
    const [encryptedKey, iv, tag, ciphertext] = parts.map((p) => base64ToBytes(p));

    const rawAesKey = await subtle.decrypt({ name: 'RSA-OAEP' }, rsaKey, encryptedKey);
    const aesKey = await subtle.importKey(
      'raw',
      rawAesKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );

    // Re-join ciphertext and tag for Web Crypto's combined-format decrypt.
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext, 0);
    combined.set(tag, ciphertext.length);

    const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, combined);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('parse') || errorMsg.includes('invalid')) {
      throw new Error('Invalid private key format. Ensure the key is valid PEM format starting with "-----BEGIN PRIVATE KEY-----"');
    }
    throw new Error('Decryption failed. Ensure you are using the correct private key and an unmodified payload produced by encryptLarge.');
  }
}

export async function encryptPrivate(
  _args: parametersOfEncryptPrivate,
): Promise<string> {
  throw new Error(
    'Encrypt with private key is not supported in the browser build. Use encryptStringWithRsaPublicKey for encryption.',
  );
}

export async function decryptPublic(
  _args: parametersOfDecryptPublic,
): Promise<string> {
  throw new Error(
    'Decrypt with public key is not supported in the browser build. Use decryptStringWithRsaPrivateKey for decryption.',
  );
}

export async function createPrivateAndPublicKeys(
  modulusLength: number = 2048,
): Promise<returnCreateKeys> {
  const keyPair = await getCrypto().subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-1',
    },
    true,
    ['encrypt', 'decrypt'],
  );

  const [publicDer, privateDer] = await Promise.all([
    getCrypto().subtle.exportKey('spki', keyPair.publicKey),
    getCrypto().subtle.exportKey('pkcs8', keyPair.privateKey),
  ]);

  const publicKey = binaryToPem(new Uint8Array(publicDer), 'public');
  const privateKey = binaryToPem(new Uint8Array(privateDer), 'private');

  return { publicKey, privateKey };
}
