import * as crypto from 'crypto';
import { parametersOfDecrypt } from '../utils/types';
import { decode } from '../utils/helpers';

export function decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): string {
  const { text, privateKey } = args;

  const privateKeyDecoded: string = decode(privateKey as string);

  const buffer: Buffer = Buffer.from(text, 'base64');
  const decrypted: Buffer = crypto.privateDecrypt(privateKeyDecoded as string, buffer);

  return decrypted.toString('utf8');
}

export default decryptStringWithRsaPrivateKey;
