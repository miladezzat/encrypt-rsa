import { MockLanguageModelV4 } from 'ai/test';
import { simulateReadableStream } from 'ai';

export const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};
export function fixtureModel(text = 'Use encryptJSON to store validated JSON.') {
  return new MockLanguageModelV4({
    doGenerate: { content: [{ type: 'text', text }], finishReason: { unified: 'stop', raw: undefined }, usage, warnings: [] },
    doStream: { stream: simulateReadableStream({ chunks: [
      { type: 'text-start', id: 'text-1' },
      { type: 'text-delta', id: 'text-1', delta: text },
      { type: 'text-end', id: 'text-1' },
      { type: 'finish', finishReason: { unified: 'stop', raw: undefined }, usage },
    ] }) },
  });
}
