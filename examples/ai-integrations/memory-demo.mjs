import NodeRSA from '../../build/node/index.mjs';
import { EncryptedMemory, MemoryBackend } from './memory.mjs';

const rsa = new NodeRSA();
const oldKey = await rsa.createPrivateAndPublicKeys();
const newKey = await rsa.createPrivateAndPublicKeys();
const ring = { active: 'key-1', keys: new Map([['key-1', oldKey], ['key-2', newKey]]) };
const backend = new MemoryBackend();
const memory = new EncryptedMemory(backend, new Map([['demo', ring]]));
const context = { tenant: 'demo', subject: 'user-1' }; // From authentication in a real app.
await memory.write(context, 'agent-memory', { notes: ['Use hybrid encryption'], model: 'fixture' }, 0);
console.log('Stored ciphertext only:', [...backend.rows.values()][0].ciphertext.startsWith('encrypt-rsa:v1:RSA-OAEP-SHA256+A256GCM:'));
ring.active = 'key-2';
await memory.rotate(context, 'agent-memory');
console.log('Rotated memory:', await memory.read(context, 'agent-memory'));
console.log('Other user sees:', await memory.read({ ...context, subject: 'user-2' }, 'agent-memory'));
