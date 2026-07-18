/** Shared Prompt API language options. */
export const MODEL_LANG_OPTIONS = {
  expectedInputs: [{ type: 'text' as const, languages: ['en', 'es'] as string[] }],
  expectedOutputs: [{ type: 'text' as const, languages: ['en', 'es'] as string[] }],
};

/** Practical limit for a single compile pass on-device. */
export const MAX_INPUT_CHARS = 40_000;

export function truncateForModel(text: string): { text: string; truncated: boolean } {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_INPUT_CHARS) {
    return { text: trimmed, truncated: false };
  }
  return { text: trimmed.slice(0, MAX_INPUT_CHARS), truncated: true };
}
