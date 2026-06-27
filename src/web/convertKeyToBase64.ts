import { encode } from '../shared/helpers';

/**
 * Converts an RSA key to a base64-encoded string.
 * Removes leading spaces from each line, then base64-encodes.
 */
export function convertKeyToBase64(key: string): string {
  return encode(key.replace(/^ +/gm, ''));
}

export default convertKeyToBase64;
