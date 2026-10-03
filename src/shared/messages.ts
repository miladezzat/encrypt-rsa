import { checkJsonPayload, parseJson, stringifyJson } from './json';
import { strictBase64 } from './hybrid';
import type {
  JsonValue, MessageClaims, parametersOfSignMessage, parametersOfVerifyMessage,
  parametersOfSign, parametersOfVerify,
} from './types';

const DOMAIN = 'encrypt-rsa:signed-message:v1\n';
const ALGORITHM = 'RSA-PSS-SHA256';
const CLAIM_KEYS = ['audience', 'expiresAt', 'issuedAt', 'issuer', 'keyId', 'nonce', 'payload', 'purpose'];

function exactKeys(value: Record<string, JsonValue>, expected: string[]): void {
  if (Object.keys(value).sort().join(',') !== expected.slice().sort().join(',')) throw new Error('Invalid signed message fields');
}

function record(value: JsonValue): Record<string, JsonValue> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid signed message object');
  return value;
}

function identifier(value: JsonValue): string {
  if (typeof value !== 'string' || !value.length || value.length > 256 || value.trim() !== value
    || Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {
    throw new Error('Invalid signed message identity');
  }
  return value;
}

function timestamp(value: JsonValue): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > Number.MAX_SAFE_INTEGER - 60000) {
    throw new Error('Invalid signed message timestamp');
  }
  return value;
}

function claimsFrom(value: Record<string, JsonValue>): MessageClaims {
  const issuedAt = timestamp(value.issuedAt);
  const expiresAt = timestamp(value.expiresAt);
  if (expiresAt <= issuedAt || expiresAt - issuedAt > 86400000) throw new Error('Invalid signed message lifetime');
  if (typeof value.nonce !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(value.nonce)) throw new Error('Invalid signed message nonce');
  return {
    issuer: identifier(value.issuer),
    audience: identifier(value.audience),
    purpose: identifier(value.purpose),
    keyId: identifier(value.keyId),
    issuedAt,
    expiresAt,
    nonce: value.nonce,
    payload: value.payload,
  };
}

/** Sign a snapshot of all claims using canonical JSON and a distinct signing domain. */
export async function signMessage(
  args: parametersOfSignMessage,
  sign: (parameters: parametersOfSign) => Promise<string>,
): Promise<string> {
  const message = record(parseJson(stringifyJson(args.message, args.limits), args.limits));
  exactKeys(message, CLAIM_KEYS);
  const claims = claimsFrom(message);
  const body = { version: 1, algorithm: ALGORITHM, ...claims };
  const bodyText = stringifyJson(body, args.limits);
  const signature = await sign({ text: DOMAIN + bodyText, privateKey: args.privateKey });
  return stringifyJson({ ...body, signature }, args.limits);
}

function checkTime(claims: MessageClaims, now: number, skew: number, maxLifetime: number): void {
  timestamp(now);
  if (claims.expiresAt - claims.issuedAt > maxLifetime) throw new Error('Signed message lifetime exceeds policy');
  if (claims.issuedAt > now + skew) throw new Error('Signed message was issued in the future');
  if (now >= claims.expiresAt + skew) throw new Error('Signed message has expired');
}

/**
 * Verify the complete canonical envelope, trusted identities/key, time policy, schema, and atomic nonce claim.
 * Replay storage is mandatory and must retain the scoped nonce until validUntil. Failures reject without returning payload data.
 */
export async function verifyMessage<T = JsonValue>(
  args: parametersOfVerifyMessage<T>,
  verify: (parameters: parametersOfVerify) => Promise<boolean>,
): Promise<MessageClaims<T | JsonValue>> {
  if (typeof args.resolvePublicKey !== 'function' || typeof args.consumeNonce !== 'function') {
    throw new Error('Trusted key resolution and atomic nonce consumption are required');
  }
  const skew = args.clockSkewMs ?? 0;
  const maxLifetime = args.maxLifetimeMs ?? 300000;
  if (!Number.isSafeInteger(skew) || skew < 0 || skew > 60000
    || !Number.isSafeInteger(maxLifetime) || maxLifetime < 1 || maxLifetime > 86400000) {
    throw new Error('Invalid signed message time policy');
  }
  const now = args.now ?? Date.now;
  if (typeof now !== 'function') throw new Error('Invalid signed message clock');
  checkJsonPayload(args.text, args.limits);
  const envelope = record(parseJson(args.text, args.limits));
  exactKeys(envelope, [...CLAIM_KEYS, 'version', 'algorithm', 'signature']);
  if (envelope.version !== 1 || envelope.algorithm !== ALGORITHM) throw new Error('Unsupported signed message version or algorithm');
  if (stringifyJson(envelope, args.limits) !== args.text) throw new Error('Signed message must use canonical JSON');
  if (typeof envelope.signature !== 'string' || !strictBase64(envelope.signature).length) throw new Error('Invalid signed message signature');
  const claims = claimsFrom(envelope);
  if (claims.issuer !== identifier(args.expected.issuer) || claims.audience !== identifier(args.expected.audience)
    || claims.purpose !== identifier(args.expected.purpose)) throw new Error('Signed message identity does not match');
  checkTime(claims, now(), skew, maxLifetime);
  const publicKey = await args.resolvePublicKey({ issuer: claims.issuer, keyId: claims.keyId });
  if (typeof publicKey !== 'string' || !publicKey) throw new Error('Signed message key is not trusted');
  const bodyText = stringifyJson({ version: 1, algorithm: ALGORITHM, ...claims }, args.limits);
  if (!await verify({ text: DOMAIN + bodyText, signature: envelope.signature, publicKey })) throw new Error('Invalid signed message signature');
  const payload = args.parse ? await args.parse(claims.payload) : claims.payload;
  checkTime(claims, now(), skew, maxLifetime);
  const consumed = await args.consumeNonce({
    issuer: claims.issuer,
    audience: claims.audience,
    purpose: claims.purpose,
    nonce: claims.nonce,
    validUntil: claims.expiresAt + skew,
  });
  if (consumed !== true) throw new Error('Signed message nonce was already used or could not be claimed');
  checkTime(claims, now(), skew, maxLifetime);
  return { ...claims, payload };
}
