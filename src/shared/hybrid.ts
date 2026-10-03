import { base64ToBytes, bytesToBase64 } from './helpers';
import type { OaepHash, parametersOfEncryptLarge } from './types';

export const INVALID_PAYLOAD = 'Invalid payload format. Expected a payload produced by encryptLarge.';

export function resolveOaepHash(hash: OaepHash = 'sha1'): OaepHash {
  if (hash !== 'sha1' && hash !== 'sha256') {
    throw new Error('Unsupported OAEP hash. Use sha1 or sha256.');
  }
  return hash;
}

export function strictBase64(value: string): Uint8Array {
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error(INVALID_PAYLOAD);
  }
  const bytes = base64ToBytes(value);
  if (bytesToBase64(bytes) !== value) {
    throw new Error(INVALID_PAYLOAD);
  }
  return bytes;
}

function headerFor(hash: OaepHash): string {
  return `encrypt-rsa:v1:RSA-OAEP-${hash === 'sha256' ? 'SHA256' : 'SHA1'}+A256GCM`;
}

export function hybridOptions(args: parametersOfEncryptLarge): { hash: OaepHash; header: string } {
  const hash = resolveOaepHash(args.oaepHash);
  const version = args.payloadVersion ?? (hash === 'sha256' ? 'v1' : 'legacy');
  if (version !== 'legacy' && version !== 'v1') {
    throw new Error('Unsupported payload version. Use legacy or v1.');
  }
  if (version === 'legacy' && hash !== 'sha1') {
    throw new Error('SHA-256 hybrid encryption requires payloadVersion v1.');
  }
  return { hash, header: version === 'v1' ? headerFor(hash) : '' };
}

export function serializeHybrid(header: string, fields: Uint8Array[]): string {
  const body = fields.map(bytesToBase64).join(':');
  return header ? `${header}:${body}` : body;
}

export function parseHybrid(text: string, requestedHash?: OaepHash): {
  hash: OaepHash;
  header: string;
  encryptedKey: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
  ciphertext: Uint8Array;
} {
  const parts = text.split(':');
  let hash: OaepHash = 'sha1';
  let header = '';
  let fields = parts;
  if (parts.length === 7 && parts[0] === 'encrypt-rsa' && parts[1] === 'v1') {
    if (parts[2] === 'RSA-OAEP-SHA256+A256GCM') {
      hash = 'sha256';
    } else if (parts[2] !== 'RSA-OAEP-SHA1+A256GCM') {
      throw new Error(INVALID_PAYLOAD);
    }
    header = parts.slice(0, 3).join(':');
    fields = parts.slice(3);
  } else if (parts.length !== 4) {
    throw new Error(INVALID_PAYLOAD);
  }
  if (requestedHash !== undefined && resolveOaepHash(requestedHash) !== hash) {
    throw new Error('OAEP hash does not match the payload algorithm.');
  }
  const [encryptedKey, iv, tag, ciphertext] = fields.map((field) => {
    // Legacy readers accepted whitespace and unpadded standard base64.
    const normalized = header ? field : field.replace(/\s/g, '');
    const padded = !header && !normalized.includes('=')
      ? normalized + '='.repeat((4 - (normalized.length % 4)) % 4) : normalized;
    return strictBase64(padded);
  });
  if (!encryptedKey.length || iv.length !== 12 || tag.length !== 16) {
    throw new Error(INVALID_PAYLOAD);
  }
  return {
    hash, header, encryptedKey, iv, tag, ciphertext,
  };
}

export function requireAes256Key(key: Uint8Array): void {
  if (key.length !== 32) {
    throw new Error('Decryption failed. Expected a 32-byte AES-256 key.');
  }
}
