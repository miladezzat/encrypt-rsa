import { ToolLoopAgent, Output, jsonSchema, isStepCount, gateway } from 'ai';
import { pathToFileURL } from 'node:url';
import { fixtureModel } from './fixtures.mjs';

const templates = {
  'node-json': {
    code: `import NodeRSA from 'encrypt-rsa';\nconst rsa = new NodeRSA();\nconst text = await rsa.encryptJSON({ value: { note: 'Hello' }, publicKey });\nconst value = await rsa.decryptJSON({ text, privateKey, parse: validateNote });`,
    guide: 'https://github.com/miladezzat/encrypt-rsa/blob/master/documentation/json.md',
  },
  'browser-json': {
    code: `// Bundlers resolve the browser entry. Serve over HTTPS or localhost.\nimport NodeRSA from 'encrypt-rsa';\nconst rsa = new NodeRSA();\nconst text = await rsa.encryptJSON({ value: { note: 'Hello' }, publicKey });\n// Decrypt only where the application can safely hold the private key.\nconst value = await rsa.decryptJSON({ text, privateKey, parse: validateNote });`,
    guide: 'https://github.com/miladezzat/encrypt-rsa/blob/master/documentation/json.md',
  },
  'node-message': {
    code: `import NodeRSA from 'encrypt-rsa';\nimport { randomBytes } from 'node:crypto';\nconst rsa = new NodeRSA();\nconst issuedAt = Date.now();\nconst text = await rsa.signMessage({ privateKey: signingPrivateKey, message: {\n  purpose: 'agent-result', issuer: 'agent-a', audience: 'service-b', keyId: 'signing-2026',\n  issuedAt, expiresAt: issuedAt + 60000, nonce: randomBytes(24).toString('base64url'),\n  payload: { result: 'Hello' }\n} });\nconst message = await rsa.verifyMessage({ text,\n  expected: { purpose: 'agent-result', issuer: 'agent-a', audience: 'service-b' },\n  resolvePublicKey: trustedKeyResolver, consumeNonce: atomicReplayStore, parse: validateResult\n});`,
    guide: 'https://github.com/miladezzat/encrypt-rsa/blob/master/documentation/signed-messages.md',
  },
  'browser-message': {
    code: `import NodeRSA from 'encrypt-rsa';\nconst rsa = new NodeRSA();\n// Sign on a trusted server with a separate signing key.\nconst message = await rsa.verifyMessage({ text: signedText,\n  expected: { purpose: 'agent-result', issuer: 'agent-a', audience: 'web-app' },\n  resolvePublicKey: trustedKeyResolver, consumeNonce: atomicReplayStore, parse: validateResult\n});`,
    guide: 'https://github.com/miladezzat/encrypt-rsa/blob/master/documentation/signed-messages.md',
  },
};

export function validateRequirements(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join(',') !== 'operation,runtime' ||
      !['node', 'browser'].includes(value.runtime) || !['encrypt-json', 'sign-message'].includes(value.operation)) {
    throw new Error('Choose only runtime and operation; do not submit keys, secrets, or free-form prompts');
  }
  return value;
}
const expectedTemplate = (requirements) => `${requirements.runtime}-${requirements.operation === 'encrypt-json' ? 'json' : 'message'}`;
const schema = jsonSchema({
  type: 'object', properties: { templateId: { type: 'string', enum: Object.keys(templates) } },
  required: ['templateId'], additionalProperties: false,
}, { validate: (value) => {
  if (value && typeof value === 'object' && Object.keys(value).join(',') === 'templateId' && 'templateId' in value && typeof value.templateId === 'string' && Object.hasOwn(templates, value.templateId)) {
    return { success: true, value: { templateId: value.templateId } };
  }
  return { success: false, error: new Error('Invalid template choice') };
} });

/** Only public enum requirements are sent to a model. Generated code is never run. */
export async function recommend(requirements, model) {
  const validated = validateRequirements(requirements);
  const expected = expectedTemplate(validated);
  const agent = new ToolLoopAgent({
    model: model ?? fixtureModel(JSON.stringify({ templateId: expected })),
    instructions: 'You are a documentation assistant for encrypt-rsa. Select the template ID matching runtime and operation. IDs: node-json, browser-json for encrypt-json; node-message, browser-message for sign-message. Output only the schema. Never request keys or secrets. JSON uses AES-256-GCM and RSA-OAEP-SHA256. Messages use RSA-PSS-SHA256 with trusted key resolution and atomic replay prevention.',
    output: Output.object({ schema }), stopWhen: isStepCount(1), maxOutputTokens: 256, maxRetries: 0,
  });
  const result = await agent.generate({ prompt: JSON.stringify(validated) });
  if (result.output.templateId !== expected) throw new Error('Model selected an incompatible template');
  return { templateId: expected, ...templates[expected],
    notice: 'Review placeholders before use. Encryption does not hide plaintext from a model that receives it. Signatures do not establish truth or prevent prompt injection.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const live = process.argv.includes('--live');
  if (live && !process.env.AI_GATEWAY_API_KEY) throw new Error('--live requires AI_GATEWAY_API_KEY and may incur provider charges');
  const model = live ? gateway(process.env.AI_MODEL ?? 'openai/gpt-6.1-sol') : undefined;
  console.log(JSON.stringify(await recommend({ runtime: 'node', operation: 'encrypt-json' }, model), null, 2));
}
