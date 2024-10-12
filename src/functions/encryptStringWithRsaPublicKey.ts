import * as crypto from 'crypto';
import { decode } from '../utils/helpers';
import { parametersOfEncrypt } from '../utils/types';

/**
 * Encrypts a string using an RSA public key.
 *
 * This function decodes the provided RSA public key, converts the input text into a buffer,
 * and encrypts it using the public key. The encrypted result is returned as a base64-encoded string.
 *
 * @param {parametersOfEncrypt} args - An object containing the text to encrypt and the RSA public key.
 * @param {string} args.text - The plain text to be encrypted.
 * @param {string} [args.publicKey] - The RSA public key to use for encryption. If not provided, a default key may be used.
 * @returns {string} The encrypted string in base64 format.
 * @throws {Error} If encryption fails due to invalid key or input.
 *
 * @example
 * const encryptedText = encryptStringWithRsaPublicKey({ text: 'Hello, World!', publicKey: 'publicKeyString' });
 * console.log(encryptedText); // Outputs the encrypted string in base64 format
 */
export function encryptStringWithRsaPublicKey(args: parametersOfEncrypt): string {
  const { text, publicKey } = args;

  const publicKeyDecoded: string = decode(publicKey as string);

  const buffer: Buffer = Buffer?.from(text);
  const encrypted: Buffer = crypto?.publicEncrypt(publicKeyDecoded, buffer);

  return encrypted.toString('base64');
}

export default encryptStringWithRsaPublicKey;
