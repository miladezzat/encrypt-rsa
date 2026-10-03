import { convertToModelMessages, streamText, toUIMessageStream, readUIMessageStream, validateUIMessages } from 'ai';
import { randomUUID } from 'node:crypto';

// SDK optional object fields can be undefined. Omit only those fields; do not coerce
// numbers, dates, arrays, classes, or tool values into different JSON values.
export function jsonData(value, depth = 0, ancestors = new Set()) {
  if (depth > 128) throw new Error('SDK JSON exceeds maxDepth');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value) && !Object.is(value, -0)) return value;
  if (!value || typeof value !== 'object' || ancestors.has(value)) throw new Error('SDK persistence requires acyclic JSON data');
  const array = Array.isArray(value);
  if (!array && Object.getPrototypeOf(value) !== Object.prototype) throw new Error('SDK persistence requires plain JSON data');
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string')) throw new Error('SDK JSON cannot contain symbol keys');
  ancestors.add(value);
  let result;
  if (array) {
    if (keys.length !== value.length + 1) throw new Error('SDK JSON arrays must be dense');
    result = Array.from({ length: value.length }, (_, index) => {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) throw new Error('SDK JSON requires data properties');
      return jsonData(descriptor.value, depth + 1, ancestors);
    });
  } else {
    result = Object.fromEntries(keys.flatMap(key => {
      const descriptor = descriptors[String(key)];
      if (!descriptor.enumerable || !('value' in descriptor)) throw new Error('SDK JSON requires data properties');
      return descriptor.value === undefined ? [] : [[key, jsonData(descriptor.value, depth + 1, ancestors)]];
    }));
  }
  ancestors.delete(value);
  return result;
}

/** Validate full UIMessage objects with the same schemas/tools used by the app. */
export async function loadMessages(memory, context, id, validation = {}) {
  const record = await memory.read(context, id);
  if (record.revision === 0 || (Array.isArray(record.value) && record.value.length === 0)) {
    return { revision: record.revision, messages: [] }; // SDK validates nonempty arrays only.
  }
  const messages = await validateUIMessages({ ...validation, messages: record.value });
  return { revision: record.revision, messages };
}

/**
 * The server owns stream consumption and persists only completed generations.
 * onSnapshot is an optional UI delivery hook, not the persistence owner. A caller
 * can stop UI delivery on disconnect while this promise continues. Await it with
 * the host's background-task mechanism (e.g. waitUntil), never a fire-and-forget job.
 */
export async function persistConversation({ memory, context, id, messages, revision, model, tools, validation = {}, onSnapshot, abortSignal }) {
  const original = await validateUIMessages({ ...validation, tools, messages: jsonData(messages) });
  const result = streamText({ model, tools, messages: await convertToModelMessages(original), maxRetries: 0, abortSignal, onError: () => {} });
  let outcome;
  const stream = toUIMessageStream({
    stream: result.stream, tools, originalMessages: original, generateMessageId: randomUUID,
    onEnd: (event) => { outcome = event; },
  });
  let deliver = onSnapshot;
  for await (const snapshot of readUIMessageStream({ stream, terminateOnError: true })) {
    if (deliver) {
      try { await deliver(snapshot); } catch { deliver = undefined; }
    }
  }
  if (outcome?.outcome.status !== 'completed') throw new Error('Generation did not complete; history unchanged');
  const completed = await validateUIMessages({ ...validation, tools, messages: jsonData(outcome.messages) });
  const nextRevision = await memory.write(context, id, jsonData(completed), revision);
  return { revision: nextRevision, messages: completed };
}
