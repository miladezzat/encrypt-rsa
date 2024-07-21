import * as crypto from 'crypto';
import { parametersOfEncryptPrivate } from '../utils/types';
import { decode } from '../utils/helpers';

export function encrypt(args: parametersOfEncryptPrivate): string {
  const { text, privateKey } = args;
  const privateKeyDecoded: string = decode(privateKey as string);

  const buffer: Buffer = Buffer.from(text);
  const encrypted: Buffer = crypto.privateEncrypt(privateKeyDecoded, buffer);

  return encrypted.toString('base64');
}

export default encrypt;
