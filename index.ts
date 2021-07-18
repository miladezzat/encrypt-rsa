import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

class NodeRSA {
  public encryptStringWithRsaPublicKey(toEncrypt: string, relativeOrAbsolutePathToPublicKey: string): string {
    const absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);

    const publicKey = fs.readFileSync(absolutePath, "utf8");
    const buffer = Buffer.from(toEncrypt);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);

    return encrypted.toString("base64");
  };

  public decryptStringWithRsaPrivateKey(toDecrypt: string, relativeOrAbsolutePathtoPrivateKey: string): string {
    const absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey);

    const privateKey = fs.readFileSync(absolutePath, "utf8");
    const buffer = Buffer.from(toDecrypt, "base64");
    const decrypted = crypto.privateDecrypt(privateKey, buffer);

    return decrypted.toString("utf8");
  };
}


export default NodeRSA;


