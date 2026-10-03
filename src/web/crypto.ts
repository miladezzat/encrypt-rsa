/** Web Crypto implementation, interoperable with the Node build. */
import {
  decode, encode, pemToBinary, binaryToPem, base64ToBytes, bytesToBase64,
  hasPEMEnvelope,
} from '../shared/helpers';
import {
  resolveOaepHash, hybridOptions, serializeHybrid, parseHybrid, requireAes256Key, strictBase64,
} from '../shared/hybrid';
import type {
  parametersOfDecrypt, parametersOfDecryptPublic, parametersOfEncrypt, parametersOfEncryptLarge,
  parametersOfEncryptPrivate, parametersOfSign, parametersOfVerify, returnCreateKeys, OaepHash,
} from '../shared/types';

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) return globalThis.crypto;
  throw new Error('Web Crypto API is not available. Use a modern browser over HTTPS or localhost.');
}

function webHash(hash?: OaepHash): string {
  return resolveOaepHash(hash) === 'sha256' ? 'SHA-256' : 'SHA-1';
}

async function importKey(encoded: string, type: 'public' | 'private', algorithm: string, hash: string): Promise<CryptoKey> {
  let usage: 'encrypt' | 'decrypt' | 'sign' | 'verify' = type === 'public' ? 'encrypt' : 'decrypt';
  if (algorithm === 'RSA-PSS') usage = type === 'public' ? 'verify' : 'sign';
  const { subtle } = getCrypto();
  try {
    return await subtle.importKey(
      type === 'public' ? 'spki' : 'pkcs8',
      pemToBinary(decode(encoded)),
      { name: algorithm, hash },
      false,
      [usage],
    );
  } catch (_) {
    throw new Error(`Invalid ${type} key format. Expected an RSA ${type} key in PEM format.`);
  }
}

function decodeText(bytes: ArrayBuffer): string {
  return new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
}

export async function encryptStringWithRsaPublicKey(args: parametersOfEncrypt): Promise<string> {
  const key = await importKey(args.publicKey as string, 'public', 'RSA-OAEP', webHash(args.oaepHash));
  const encrypted = await getCrypto().subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(args.text));
  return bytesToBase64(new Uint8Array(encrypted));
}

export async function decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): Promise<string> {
  const key = await importKey(args.privateKey as string, 'private', 'RSA-OAEP', webHash(args.oaepHash));
  return decodeText(await getCrypto().subtle.decrypt({ name: 'RSA-OAEP' }, key, base64ToBytes(args.text)));
}

export async function encryptLarge(args: parametersOfEncryptLarge): Promise<string> {
  const { hash, header } = hybridOptions(args);
  const rsaKey = await importKey(args.publicKey as string, 'public', 'RSA-OAEP', webHash(hash));
  const { subtle } = getCrypto();
  const aesKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = getCrypto().getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await subtle.encrypt({
    name: 'AES-GCM',
    iv,
    tagLength: 128,
    ...(header ? { additionalData: new TextEncoder().encode(header) } : {}),
  }, aesKey, new TextEncoder().encode(args.text)));
  const tag = encrypted.slice(encrypted.length - 16);
  const ciphertext = encrypted.slice(0, encrypted.length - 16);
  const rawAesKey = await subtle.exportKey('raw', aesKey);
  const encryptedKey = new Uint8Array(await subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAesKey));
  return serializeHybrid(header, [encryptedKey, iv, tag, ciphertext]);
}

export async function decryptLarge(args: parametersOfDecrypt): Promise<string> {
  const payload = parseHybrid(args.text, args.oaepHash);
  const rsaKey = await importKey(args.privateKey as string, 'private', 'RSA-OAEP', webHash(payload.hash));
  const { subtle } = getCrypto();
  try {
    const rawAesKey = await subtle.decrypt({ name: 'RSA-OAEP' }, rsaKey, payload.encryptedKey);
    requireAes256Key(new Uint8Array(rawAesKey));
    const aesKey = await subtle.importKey('raw', rawAesKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const combined = new Uint8Array(payload.ciphertext.length + payload.tag.length);
    combined.set(payload.ciphertext);
    combined.set(payload.tag, payload.ciphertext.length);
    return decodeText(await subtle.decrypt({
      name: 'AES-GCM',
      iv: payload.iv,
      tagLength: 128,
      ...(payload.header ? { additionalData: new TextEncoder().encode(payload.header) } : {}),
    }, aesKey, combined));
  } catch (_) {
    throw new Error('Decryption failed. Ensure you are using the correct private key and an unmodified payload produced by encryptLarge.');
  }
}

export async function encryptPrivate(_args: parametersOfEncryptPrivate): Promise<string> {
  throw new Error('Encrypt with private key is not supported in the browser build. Use sign for authentication.');
}

export async function decryptPublic(_args: parametersOfDecryptPublic): Promise<string> {
  throw new Error('Decrypt with public key is not supported in the browser build. Use verify for authentication.');
}

export async function sign(args: parametersOfSign): Promise<string> {
  const key = await importKey(args.privateKey as string, 'private', 'RSA-PSS', 'SHA-256');
  return bytesToBase64(new Uint8Array(await getCrypto().subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, key, new TextEncoder().encode(args.text))));
}

export async function verify(args: parametersOfVerify): Promise<boolean> {
  const key = await importKey(args.publicKey as string, 'public', 'RSA-PSS', 'SHA-256');
  let signature: Uint8Array;
  try {
    signature = strictBase64(args.signature);
  } catch (_) {
    return false;
  }
  return getCrypto().subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, key, signature, new TextEncoder().encode(args.text));
}

export async function isValidRSAPublicKey(key: unknown): Promise<boolean> {
  if (!hasPEMEnvelope(key, 'public')) return false;
  try {
    await importKey(encode(key as string), 'public', 'RSA-OAEP', 'SHA-1');
    return true;
  } catch (_) {
    return false;
  }
}

export async function isValidRSAPrivateKey(key: unknown): Promise<boolean> {
  if (!hasPEMEnvelope(key, 'private')) return false;
  try {
    await importKey(encode(key as string), 'private', 'RSA-OAEP', 'SHA-1');
    return true;
  } catch (_) {
    return false;
  }
}

export async function createPrivateAndPublicKeys(modulusLength: number = 2048): Promise<returnCreateKeys> {
  const { subtle } = getCrypto();
  const keyPair = await subtle.generateKey({
    name: 'RSA-OAEP', modulusLength, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-1',
  }, true, ['encrypt', 'decrypt']);
  const [publicDer, privateDer] = await Promise.all([
    subtle.exportKey('spki', keyPair.publicKey), subtle.exportKey('pkcs8', keyPair.privateKey),
  ]);
  return { publicKey: binaryToPem(new Uint8Array(publicDer), 'public'), privateKey: binaryToPem(new Uint8Array(privateDer), 'private') };
}
