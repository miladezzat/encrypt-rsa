import type { JsonLimits, JsonValue, ResolvedJsonLimits } from './types';

const encoder = new TextEncoder();

/** Resolve bounded JSON limits; bytes count UTF-8, and depth starts at zero for the root. */
export function jsonLimits(options: JsonLimits = {}): ResolvedJsonLimits {
  const limits = {
    maxBytes: options.maxBytes ?? 1024 * 1024,
    maxPayloadBytes: options.maxPayloadBytes ?? 2 * 1024 * 1024,
    maxDepth: options.maxDepth ?? 128,
  };
  const ceilings = { maxBytes: 64 * 1024 * 1024, maxPayloadBytes: 128 * 1024 * 1024, maxDepth: 256 };
  (Object.keys(limits) as Array<keyof ResolvedJsonLimits>).forEach((name) => {
    if (!Number.isSafeInteger(limits[name]) || limits[name] < 1 || limits[name] > ceilings[name]) {
      throw new Error(`Invalid JSON limit: ${name}`);
    }
  });
  return limits;
}

function validString(value: string, maxBytes: number): void {
  if (value.length > maxBytes) throw new Error('JSON exceeds maxBytes');
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error('JSON contains an unpaired Unicode surrogate');
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new Error('JSON contains an unpaired Unicode surrogate');
    }
  }
}

/**
 * Serialize the supported JSON subset in canonical UTF-16 property order.
 * Rejects lossy values, sparse arrays, hidden properties, getters, custom prototypes, and cycles.
 * Never calls toJSON. Number/string encoding follows JSON.stringify (RFC 8785); negative zero is rejected.
 */
export function stringifyJson(value: unknown, options: JsonLimits = {}): string {
  const limits = jsonLimits(options);
  const ancestors = new Set<object>();
  const chunks: string[] = [];
  let bytes = 0;
  const append = (text: string): void => {
    bytes += encoder.encode(text).length;
    if (bytes > limits.maxBytes) throw new Error('JSON exceeds maxBytes');
    chunks.push(text);
  };
  const visit = (item: unknown, depth: number): void => {
    if (depth > limits.maxDepth) throw new Error('JSON exceeds maxDepth');
    if (item === null || typeof item === 'boolean') {
      append(JSON.stringify(item));
    } else if (typeof item === 'number') {
      if (!Number.isFinite(item) || Object.is(item, -0)) throw new Error('JSON requires finite numbers other than negative zero');
      append(JSON.stringify(item));
    } else if (typeof item === 'string') {
      validString(item, limits.maxBytes);
      append(JSON.stringify(item));
    } else if (typeof item === 'object') {
      if (ancestors.has(item)) throw new Error('JSON contains a cycle');
      const array = Array.isArray(item);
      if (!array && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) {
        throw new Error('JSON requires plain objects');
      }
      ancestors.add(item);
      const descriptors = Object.getOwnPropertyDescriptors(item);
      const keys = Reflect.ownKeys(item);
      if (keys.some((key) => typeof key !== 'string')) throw new Error('JSON cannot contain symbol properties');
      if (array) {
        if (keys.length !== item.length + 1) throw new Error('JSON cannot contain sparse arrays or extra array properties');
        append('[');
        for (let i = 0; i < item.length; i++) {
          const descriptor = descriptors[String(i)];
          if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) throw new Error('JSON requires array data properties');
          if (i) append(',');
          visit(descriptor.value, depth + 1);
        }
        append(']');
      } else {
        append('{');
        (keys as string[]).sort().forEach((key, index) => {
          const descriptor = descriptors[key];
          if (!descriptor.enumerable || !('value' in descriptor)) throw new Error('JSON requires enumerable data properties');
          validString(key, limits.maxBytes);
          if (index) append(',');
          append(`${JSON.stringify(key)}:`);
          visit(descriptor.value, depth + 1);
        });
        append('}');
      }
      ancestors.delete(item);
    } else {
      throw new Error('Unsupported JSON value');
    }
  };
  visit(value, 0);
  return chunks.join('');
}

/** Check encrypted input before decoding or RSA processing. */
export function checkJsonPayload(text: string, options: JsonLimits = {}): void {
  const limits = jsonLimits(options);
  if (typeof text !== 'string' || text.length > limits.maxPayloadBytes || encoder.encode(text).length > limits.maxPayloadBytes) {
    throw new Error('JSON payload exceeds maxPayloadBytes or is not a string');
  }
}

/** Parse bounded JSON and validate its supported value/depth/Unicode contract. */
export function parseJson(text: string, options: JsonLimits = {}): JsonValue {
  const limits = jsonLimits(options);
  if (text.length > limits.maxBytes || encoder.encode(text).length > limits.maxBytes) throw new Error('JSON exceeds maxBytes');
  let value: JsonValue;
  try {
    value = JSON.parse(text);
  } catch (_error) {
    throw new Error('Decrypted text is not valid JSON');
  }
  stringifyJson(value, options);
  return value;
}
