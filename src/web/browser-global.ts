import NodeRSA from './index';
import type {
  parametersOfDecrypt,
  parametersOfEncrypt,
  parametersOfEncryptLarge,
  parametersOfSign,
  parametersOfVerify,
  returnCreateKeys,
} from '../shared/types';

const defaultInstance = new NodeRSA();

export { NodeRSA };
export { isValidRSAPublicKey, isValidRSAPrivateKey } from './crypto';
export default NodeRSA;

export function createPrivateAndPublicKeys(modulusLength?: number): Promise<returnCreateKeys> {
  return defaultInstance.createPrivateAndPublicKeys(modulusLength);
}

export function encryptStringWithRsaPublicKey(args: parametersOfEncrypt): Promise<string> {
  return defaultInstance.encryptStringWithRsaPublicKey(args);
}

export function decryptStringWithRsaPrivateKey(args: parametersOfDecrypt): Promise<string> {
  return defaultInstance.decryptStringWithRsaPrivateKey(args);
}

export function encryptLarge(args: parametersOfEncryptLarge): Promise<string> {
  return defaultInstance.encryptLarge(args);
}

export function decryptLarge(args: parametersOfDecrypt): Promise<string> {
  return defaultInstance.decryptLarge(args);
}

export function sign(args: parametersOfSign): Promise<string> {
  return defaultInstance.sign(args);
}

export function verify(args: parametersOfVerify): Promise<boolean> {
  return defaultInstance.verify(args);
}
