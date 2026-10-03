import NodeRSA, { type JsonValue, type MessageClaims, type JsonLimits } from '../../build/node/index.mjs';
import type { UIMessage } from 'ai';
const rsa = new NodeRSA();
const limits: JsonLimits = { maxBytes: 1024 };
const encrypted: Promise<string> = rsa.encryptJSON({ value: { notes: [] }, limits });
const raw: Promise<JsonValue> = rsa.decryptJSON({ text: '' });
const parsed: Promise<{ notes: string[] }> = rsa.decryptJSON({ text: '', parse: () => ({ notes: ['validated'] }) });
// A type argument alone must never claim that unvalidated decrypted data is safe.
// @ts-expect-error generic JSON decryption requires a parser
rsa.decryptJSON<{ notes: string[] }>({ text: '' });
const messages: UIMessage[] = [{ id: 'a', role: 'assistant', parts: [{ type: 'text', text: 'hello' }] }];
const verified: Promise<MessageClaims<{ answer: string }>> = rsa.verifyMessage({ text: '',
  expected: { issuer: 'a', audience: 'b', purpose: 'result' },
  resolvePublicKey: () => '', consumeNonce: () => true, parse: () => ({ answer: 'validated' }),
});
void [encrypted, raw, parsed, messages, verified];
