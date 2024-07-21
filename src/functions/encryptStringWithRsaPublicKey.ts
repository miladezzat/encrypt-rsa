import * as crypto from 'crypto';
import { decode } from '../utils/helpers';
import { parametersOfEncrypt } from '../utils/types';

export function encryptStringWithRsaPublicKey(args: parametersOfEncrypt): string {
  const { text, publicKey } = args;

  const publicKeyDecoded: string = decode(publicKey as string);

  const buffer: Buffer = Buffer?.from(text);
  const encrypted: Buffer = crypto?.publicEncrypt(publicKeyDecoded, buffer);

  return encrypted.toString('base64');
}

export default encryptStringWithRsaPublicKey;
