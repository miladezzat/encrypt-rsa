import { randomBytes } from 'node:crypto';
import NodeRSA from '../../build/node/index.mjs';

const rsa = new NodeRSA();
const signingKeys = await rsa.createPrivateAndPublicKeys(); // Separate from encryption keys.
const issuedAt = Date.now();
const text = await rsa.signMessage({ privateKey: signingKeys.privateKey, message: {
  issuer: 'agent-a', audience: 'service-b', purpose: 'agent-result', keyId: 'signing-1',
  issuedAt, expiresAt: issuedAt + 60000, nonce: randomBytes(24).toString('base64url'), payload: { answer: 'Hello' },
} });
const nonces = new Map();
const verify = () => rsa.verifyMessage({ text,
  expected: { issuer: 'agent-a', audience: 'service-b', purpose: 'agent-result' },
  resolvePublicKey: ({ issuer, keyId }) => {
    if (issuer !== 'agent-a' || keyId !== 'signing-1') throw new Error('Untrusted signer');
    return signingKeys.publicKey;
  },
  consumeNonce: ({ issuer, audience, purpose, nonce, validUntil }) => {
    // Atomic within this process only. Use unique DB insertion or Redis SET NX PX
    // in a service; retain the claim until validUntil, including clock skew.
    const now = Date.now();
    for (const [key, expiry] of nonces) if (expiry <= now) nonces.delete(key);
    const key = JSON.stringify([issuer, audience, purpose, nonce]);
    if (nonces.has(key)) return false;
    nonces.set(key, validUntil); return true;
  },
  parse: value => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.answer !== 'string') throw new Error('Invalid agent result');
    return { answer: value.answer };
  },
});
console.log('Verified result:', (await verify()).payload);
try { await verify(); throw new Error('Replay accepted'); } catch (error) {
  if (!(error instanceof Error) || !error.message.includes('already used')) throw error;
  console.log('Replay rejected');
}
