import convertKetToBase64 from './functions/convertKetToBase64';
import createPrivateAndPublicKeys from './functions/createPrivateAndPublicKeys';
import decrypt from './functions/decrypt';
import decryptStringWithRsaPrivateKey from './functions/decryptStringWithRsaPrivateKey';
import encrypt from './functions/encrypt';
import encryptStringWithRsaPublicKey from './functions/encryptStringWithRsaPublicKey';
import {
  parametersOfDecrypt, parametersOfDecryptPublic, parametersOfEncrypt, parametersOfEncryptPrivate,
  returnCreateKeys,
} from './utils/types';

class NodeRSA {
  private publicKey: string | undefined;

  private privateKey: string | undefined;

  private modulusLength: number;

  private keyBase64: string;

  constructor(publicKey?: string, privateKey?: string, modulusLength?: number) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.modulusLength = modulusLength || 2048;
    this.keyBase64 = 'base64';
  }

  public encryptStringWithRsaPublicKey(args: parametersOfEncrypt): string {
    const { publicKey = this.publicKey } = args;
    return encryptStringWithRsaPublicKey({ ...args, publicKey: convertKetToBase64(publicKey as string) });
  }

  public decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): string {
    const { privateKey = this.privateKey } = args;
    return decryptStringWithRsaPrivateKey({ ...args, privateKey: convertKetToBase64(privateKey as string) });
  }

  public encrypt(args: parametersOfEncryptPrivate): string {
    const { privateKey = this.privateKey } = args;
    return encrypt({ ...args, privateKey: convertKetToBase64(privateKey as string) });
  }

  public decrypt(args: parametersOfDecryptPublic): string {
    const { publicKey = this.publicKey } = args;
    return decrypt({ ...args, publicKey: convertKetToBase64(publicKey as string) });
  }

  public createPrivateAndPublicKeys(modulusLength: number = this.modulusLength): returnCreateKeys {
    return createPrivateAndPublicKeys(modulusLength);
  }
}

export default NodeRSA;
