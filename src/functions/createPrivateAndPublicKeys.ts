import * as crypto from 'crypto';
import { returnCreateKeys } from '../utils/types';

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
