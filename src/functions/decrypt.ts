import * as crypto from 'crypto';
import { decode } from '../utils/helpers';
import { parametersOfDecryptPublic } from '../utils/types';

export function decrypt(args: parametersOfDecryptPublic): string {
  const { text, publicKey } = args;

  const publicKeyDecoded: string = decode(publicKey as string);

  const buffer: Buffer = Buffer.from(text, 'base64');
  const decrypted: Buffer = crypto.publicDecrypt(publicKeyDecoded as string, buffer);

  return decrypted.toString('utf8');
}

export default decrypt;
