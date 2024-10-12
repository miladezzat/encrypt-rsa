import { encode } from '../utils/helpers';

/**
 * Converts an RSA key to a base64-encoded string.
 *
 * This function removes any leading spaces from each line of the key and then
 * encodes it to base64 format.
 *
 * @param {string} key - The RSA key to be converted to base64. It may contain leading spaces in each line.
 * @returns {string} The base64-encoded version of the RSA key.
 */
export function convertKetToBase64(key: string): string {
  return encode(key.replace(/^ +/gm, ''));
}

export default convertKetToBase64;
