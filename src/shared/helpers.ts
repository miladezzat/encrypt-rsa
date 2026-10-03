/**
 * Shared helpers that work in both Node and browser (no Buffer or Node crypto).
 * Uses atob/btoa (Node 16+ and browser) and TextEncoder/TextDecoder.
 */

/**
 * Encodes a UTF-8 string to base64 (environment-agnostic).
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  // Bound each call's argument count and avoid one string allocation per byte.
  for (let i = 0; i < bytes.length; i += 8192) {
    chunks.push(String.fromCharCode(...Array.from(bytes.subarray(i, i + 8192))));
  }
  return btoa(chunks.join(''));
}

/**
 * Decodes base64 to Uint8Array (environment-agnostic).
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const PEM_PUBLIC_HEADER = '-----BEGIN PUBLIC KEY-----';
const PEM_PUBLIC_FOOTER = '-----END PUBLIC KEY-----';
const PEM_PRIVATE_HEADER = '-----BEGIN PRIVATE KEY-----';
const PEM_PRIVATE_FOOTER = '-----END PRIVATE KEY-----';

/**
 * Extracts base64 body from a PEM string (removes headers and newlines).
 */
function pemToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s/g, '');
}

/**
 * Converts PEM string to binary (Uint8Array) for Web Crypto importKey.
 */
export function pemToBinary(pem: string): Uint8Array {
  return base64ToBytes(pemToBase64(pem));
}

/**
 * Wraps binary in PEM headers (SPKI for public, PKCS#8 for private).
 */
export function binaryToPem(
  binary: Uint8Array,
  type: 'public' | 'private',
): string {
  const base64 = bytesToBase64(binary);
  const header = type === 'public' ? PEM_PUBLIC_HEADER : PEM_PRIVATE_HEADER;
  const footer = type === 'public' ? PEM_PUBLIC_FOOTER : PEM_PRIVATE_FOOTER;
  const lines: string[] = [];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  return `${header}\n${lines.join('\n')}\n${footer}`;
}

/**
 * Decodes a base64-encoded string into a UTF-8 string.
 *
 * @param {string} str - The base64-encoded string to decode.
 * @returns {string} The decoded UTF-8 string.
 * @throws {Error} If the input string cannot be decoded.
 */
export const decode = (str: string): string => {
  try {
    const bytes = base64ToBytes(str);
    return new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
  } catch (error) {
    throw new Error('Failed to decode base64 string');
  }
};

/**
 * Encodes a UTF-8 string into a base64-encoded string.
 *
 * @param {string} str - The UTF-8 string to encode.
 * @returns {string} The base64-encoded string.
 * @throws {Error} If the input string cannot be encoded.
 */
export const encode = (str: string): string => {
  try {
    const bytes = new TextEncoder().encode(str);
    return bytesToBase64(bytes);
  } catch (error) {
    throw new Error('Failed to encode string to base64');
  }
};

/**
 * Checks headers/footers only; does not parse or validate key material. Checks a PEM-formatted public key.
 *
 * @param {string} key - The key string to validate.
 * @returns {boolean} True if the key has PEM public key, false otherwise.
 */
export function isValidPEMPublicKey(key: unknown): boolean {
  if (typeof key !== 'string') {
    return false;
  }
  return key.includes(PEM_PUBLIC_HEADER) && key.includes(PEM_PUBLIC_FOOTER);
}

/**
 * Checks headers/footers only; does not parse or validate key material. Checks a PEM-formatted private key.
 *
 * @param {string} key - The key string to validate.
 * @returns {boolean} True if the key has PEM private key, false otherwise.
 */
export function isValidPEMPrivateKey(key: unknown): boolean {
  if (typeof key !== 'string') {
    return false;
  }
  return key.includes(PEM_PRIVATE_HEADER) && key.includes(PEM_PRIVATE_FOOTER);
}

/** Checks a complete SPKI/PKCS#8 PEM envelope before native key parsing. */
export function hasPEMEnvelope(key: unknown, type: 'public' | 'private'): key is string {
  if (typeof key !== 'string') return false;
  const header = type === 'public' ? PEM_PUBLIC_HEADER : PEM_PRIVATE_HEADER;
  const footer = type === 'public' ? PEM_PUBLIC_FOOTER : PEM_PRIVATE_FOOTER;
  return new RegExp(`^\\s*${header}\\s*([A-Za-z0-9+/=\\s]+)${footer}\\s*$`).test(key);
}

/**
 * Validates if a string is a valid PEM key (either public or private).
 *
 * @param {string} key - The key string to validate.
 * @returns {boolean} True if the key has PEM key, false otherwise.
 */
export function isValidPEMKey(key: unknown): boolean {
  return isValidPEMPublicKey(key) || isValidPEMPrivateKey(key);
}

/**
 * Splits a string into chunks for encryption.
 * RSA can only encrypt data smaller than the key modulus minus padding.
 * For RSA-OAEP with SHA-1 and a 2048-bit key, this is 214 bytes.
 *
 * @param {string} text - The text to split into chunks.
 * @param {number} chunkSize - The size of each chunk in bytes (default 214 for 2048-bit RSA-OAEP/SHA-1).
 * @returns {string[]} Array of text chunks.
 */
export function splitIntoChunks(text: string, chunkSize: number = 214): string[] {
  if (!text) {
    return [''];
  }

  const chunks: string[] = [];
  let current = '';
  let currentLength = 0;

  const chars = Array.from(text);
  const encoder = new TextEncoder();

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const charLength = encoder.encode(char).length;
    if (current && currentLength + charLength > chunkSize) {
      chunks.push(current);
      current = '';
      currentLength = 0;
    }

    current += char;
    currentLength += charLength;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

/**
 * Joins chunks back into a single string.
 *
 * @param {string[]} chunks - Array of text chunks.
 * @returns {string} The combined text.
 */
export function joinChunks(chunks: string[]): string {
  return chunks.join('');
}
