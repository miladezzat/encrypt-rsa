import { createHash } from 'node:crypto';
import NodeRSA from '../../build/node/index.mjs';

/** Example backend only. Replace with a database transaction/CAS in a service. */
export class MemoryBackend {
  rows = new Map();
  async get(key) { return this.rows.get(key) ?? null; }
  async compareAndSet(key, revision, row) {
    if ((this.rows.get(key)?.revision ?? 0) !== revision) return false;
    this.rows.set(key, structuredClone(row));
    return true;
  }
}

const identifier = (value) => {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(value)) throw new Error('Invalid memory identifier');
  return value;
};

/** Context comes from server authentication, never request JSON or a model. */
const scope = (context, id) => {
  const tenant = identifier(context.tenant);
  const subject = identifier(context.subject);
  identifier(id);
  return { tenant, subject, id, key: createHash('sha256').update(JSON.stringify([tenant, subject, id])).digest('hex') };
};

/** Tenant keyrings are trusted server configuration; clients cannot choose keys. */
export class EncryptedMemory {
  rsa = new NodeRSA();
  constructor(backend, keyrings) { this.backend = backend; this.keyrings = keyrings; }
  keys(tenant) {
    const ring = this.keyrings.get(tenant);
    if (!ring || !ring.keys.has(ring.active)) throw new Error('Unknown tenant/key');
    return ring;
  }
  async read(context, id) {
    const identity = scope(context, id);
    const ring = this.keys(identity.tenant);
    const row = await this.backend.get(identity.key);
    if (!row) return { revision: 0, value: null };
    const key = ring.keys.get(row.keyId);
    if (!key || !Number.isSafeInteger(row.revision) || row.revision < 1) throw new Error('Unknown key or invalid revision');
    const record = await this.rsa.decryptJSON({ text: row.ciphertext, privateKey: key.privateKey });
    if (!record || Array.isArray(record) || typeof record !== 'object' || record.version !== 1 ||
        record.tenant !== identity.tenant || record.subject !== identity.subject || record.id !== id ||
        record.revision !== row.revision || record.keyId !== row.keyId || !Object.hasOwn(record, 'value')) {
      throw new Error('Memory scope/record mismatch');
    }
    return { revision: row.revision, value: record.value };
  }
  async write(context, id, value, expectedRevision) {
    const identity = scope(context, id);
    const ring = this.keys(identity.tenant);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || expectedRevision >= Number.MAX_SAFE_INTEGER) {
      throw new Error('Invalid expected revision');
    }
    const revision = expectedRevision + 1;
    const keyId = ring.active;
    const ciphertext = await this.rsa.encryptJSON({ publicKey: ring.keys.get(keyId).publicKey, value: {
      version: 1, tenant: identity.tenant, subject: identity.subject, id,
      revision, keyId, value,
    } });
    if (!await this.backend.compareAndSet(identity.key, expectedRevision, { revision, keyId, ciphertext })) {
      throw new Error('Memory write conflict');
    }
    return revision;
  }
  async rotate(context, id) {
    const record = await this.read(context, id);
    if (record.revision === 0) throw new Error('Missing memory');
    return this.write(context, id, record.value, record.revision);
  }
}
