import NodeRSA from './index';
import type {
  parametersOfDecrypt,
  parametersOfEncrypt,
  parametersOfEncryptLarge,
  parametersOfSign,
  parametersOfVerify,
  returnCreateKeys,
  JsonValue,
  JsonParser,
  MessageClaims,
  parametersOfEncryptJSON,
  parametersOfDecryptJSON,
  parametersOfSignMessage,
  parametersOfVerifyMessage,
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

export function encryptJSON(args: parametersOfEncryptJSON): Promise<string> {
  return defaultInstance.encryptJSON(args);
}

export function decryptJSON<T>(args: parametersOfDecryptJSON<T> & { parse: JsonParser<T> }): Promise<T>;
export function decryptJSON(args: parametersOfDecryptJSON): Promise<JsonValue>;
export async function decryptJSON<T = JsonValue>(args: parametersOfDecryptJSON<T>): Promise<JsonValue | T> {
  if (args.parse) return defaultInstance.decryptJSON({ ...args, parse: args.parse });
  return defaultInstance.decryptJSON({ text: args.text, privateKey: args.privateKey, limits: args.limits });
}

export function signMessage(args: parametersOfSignMessage): Promise<string> {
  return defaultInstance.signMessage(args);
}

export function verifyMessage<T>(args: parametersOfVerifyMessage<T> & { parse: JsonParser<T> }): Promise<MessageClaims<T>>;
export function verifyMessage(args: parametersOfVerifyMessage): Promise<MessageClaims>;
export async function verifyMessage<T = JsonValue>(args: parametersOfVerifyMessage<T>): Promise<MessageClaims<JsonValue | T>> {
  if (args.parse) return defaultInstance.verifyMessage({ ...args, parse: args.parse });
  return defaultInstance.verifyMessage({ ...args, parse: undefined });
}
