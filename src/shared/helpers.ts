/**
 * Shared helpers that work in both Node and browser (no Buffer or Node crypto).
 * Uses atob/btoa (Node 16+ and browser) and TextEncoder/TextDecoder.
 */

/**
 * Encodes a UTF-8 string to base64 (environment-agnostic).
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
  type: 'public' | 'private'
): string {
  let b64 = '';
  for (let i = 0; i < binary.length; i++) {
    b64 += String.fromCharCode(binary[i]);
  }
  const base64 = btoa(b64);
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
    return new TextDecoder().decode(bytes);
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
