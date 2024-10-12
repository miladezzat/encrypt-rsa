import * as crypto from 'crypto';
import { decode } from '../utils/helpers';
import { parametersOfDecryptPublic } from '../utils/types';

/**
 * Decrypts a base64-encoded string using an RSA public key.
 *
 * The function first decodes the provided RSA public key and the base64-encoded text,
 * then decrypts the text using the RSA public key.
 *
 * @param {parametersOfDecryptPublic} args - An object containing the text to decrypt and the RSA public key.
 * @param {string} args.text - The base64-encoded string to be decrypted.
 * @param {string} [args.publicKey] - The RSA public key to use for decryption. If not provided, a default key may be used.
 * @returns {string} The decrypted string in UTF-8 format.
 * @throws {Error} If decryption fails due to invalid key or input.
 *
 * @example
 * const decryptedText = decrypt({ text: 'base64EncryptedText', publicKey: 'publicKeyString' });
 * console.log(decryptedText); // Outputs the decrypted string in UTF-8 format
 */
export function decrypt(args: parametersOfDecryptPublic): string {
  const { text, publicKey } = args;

  const publicKeyDecoded: string = decode(publicKey as string);

  const buffer: Buffer = Buffer.from(text, 'base64');
  const decrypted: Buffer = crypto.publicDecrypt(publicKeyDecoded as string, buffer);

  return decrypted.toString('utf8');
}

export default decrypt;
