import * as crypto from 'crypto';
import { parametersOfEncryptPrivate } from '../utils/types';
import { decode } from '../utils/helpers';

/**
 * Encrypts a string using an RSA private key.
 *
 * This function encodes the provided RSA private key, converts the input text to a buffer,
 * and encrypts it using the private key. The result is returned as a base64-encoded string.
 *
 * @param {parametersOfEncryptPrivate} args - An object containing the text to encrypt and the RSA private key.
 * @param {string} args.text - The plain text to be encrypted.
 * @param {string} [args.privateKey] - The RSA private key to use for encryption. If not provided, a default key may be used.
 * @returns {string} The encrypted string in base64 format.
 * @throws {Error} If encryption fails due to invalid key or input.
 *
 * @example
 * const encryptedText = encrypt({ text: 'Hello, World!', privateKey: 'privateKeyString' });
 * console.log(encryptedText); // Outputs the encrypted string in base64 format
 */
export function encrypt(args: parametersOfEncryptPrivate): string {
  const { text, privateKey } = args;
  const privateKeyDecoded: string = decode(privateKey as string);

  const buffer: Buffer = Buffer.from(text);
  const encrypted: Buffer = crypto.privateEncrypt(privateKeyDecoded, buffer);

  return encrypted.toString('base64');
}

export default encrypt;
