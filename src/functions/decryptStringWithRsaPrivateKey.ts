import * as crypto from 'crypto';
import { parametersOfDecrypt } from '../utils/types';
import { decode } from '../utils/helpers';

/**
 * Decrypts a base64-encoded string using an RSA private key.
 *
 * This function decodes the provided RSA private key, then uses it to decrypt the base64-encoded string.
 *
 * @param {parametersOfDecrypt} args - An object containing the text to decrypt and the RSA private key.
 * @param {string} args.text - The base64-encoded string to be decrypted.
 * @param {string} [args.privateKey] - The RSA private key to use for decryption. If not provided, a default key may be used.
 * @returns {string} The decrypted string in UTF-8 format.
 * @throws {Error} If decryption fails due to invalid key or input.
 *
 * @example
 * const decryptedText = decryptStringWithRsaPrivateKey({ text: 'base64EncryptedText', privateKey: 'privateKeyString' });
 * console.log(decryptedText); // Outputs the decrypted string in UTF-8 format
 */
export function decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): string {
  const { text, privateKey } = args;

  const privateKeyDecoded: string = decode(privateKey as string);

  const buffer: Buffer = Buffer.from(text, 'base64');
  const decrypted: Buffer = crypto.privateDecrypt(privateKeyDecoded as string, buffer);

  return decrypted.toString('utf8');
}

export default decryptStringWithRsaPrivateKey;
