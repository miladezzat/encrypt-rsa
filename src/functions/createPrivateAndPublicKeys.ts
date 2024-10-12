import * as crypto from 'crypto';
import { returnCreateKeys } from '../utils/types';

/**
 * Generates a pair of RSA private and public keys with the specified modulus length.
 *
 * If the `crypto.generateKeyPairSync` function is available, it generates the keys using the provided modulus length,
 * otherwise, it returns empty strings for both keys.
 *
 * @param {number} [modulusLength=2048] - The length of the RSA modulus in bits. Defaults to 2048 bits.
 * @returns {returnCreateKeys} An object containing the generated RSA public and private keys in PEM format.
 *
 * @example
 * const { publicKey, privateKey } = createPrivateAndPublicKeys(4096);
 * console.log(publicKey);  // Outputs the public key in PEM format
 * console.log(privateKey); // Outputs the private key in PEM format
 */
export function createPrivateAndPublicKeys(modulusLength: number = 2048): returnCreateKeys {
  if (typeof crypto.generateKeyPairSync === 'function') {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  return { privateKey: '', publicKey: '' };
}

export default createPrivateAndPublicKeys;
