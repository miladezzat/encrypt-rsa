/**
 * Decodes a base64-encoded string into a UTF-8 string.
 *
 * @param {string} str - The base64-encoded string to decode.
 * @returns {string} The decoded UTF-8 string.
 * @throws {Error} If the input string cannot be decoded.
 */
export const decode = (str: string): string => {
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
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
    return Buffer.from(str, 'utf-8').toString('base64');
  } catch (error) {
    throw new Error('Failed to encode string to base64');
  }
};
