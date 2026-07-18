import { promptOnce } from './model.js';
import { truncateForModel } from './modelOptions.js';
import { packToMergeSnippet } from './parseHelpers.js';
import type { AiContextPack } from './schema.js';
import { localeLanguageName, type Locale } from './i18n/index.js';

export type RefineTurn = {
  role: 'user' | 'assistant';
  content: string;
};

function sourceFromPack(pack: AiContextPack): string {
  return packToMergeSnippet(pack);
}

export function materialFromInput(input: {
  text?: string;
  pack?: AiContextPack | null;
}): string {
  if (input.pack) return sourceFromPack(input.pack);
  return (input.text ?? '').trim();
}

/** Explain what an AI would understand from the supposed context, in the UI language. */
export async function interpretContext(
  sourceMaterial: string,
  locale: Locale,
  signal?: AbortSignal,
): Promise<{ interpretation: string; truncated: boolean }> {
  const { text, truncated } = truncateForModel(sourceMaterial);
  if (!text) throw new Error('EMPTY_SOURCE');

  const language = localeLanguageName(locale);
  const system = `You explain AI context to humans.
Given a supposed context (notes, prompt, or structured pack), describe clearly what a typical LLM would understand and assume.
Write the entire answer in ${language}.
Be honest about ambiguity, missing info, and likely misunderstandings.
Do not output JSON. Use short paragraphs and optional bullets.`;

  const user = [
    'Describe what an AI would understand from this supposed context.',
    'Mention: main identity/topic, goals, constraints, important facts, and gaps.',
    '',
    'SUPPOSED CONTEXT:',
    text,
  ].join('\n');

  const interpretation = (await promptOnce(system, user, signal)).trim();
  if (!interpretation) throw new Error('EMPTY_INTERPRETATION');
  return { interpretation, truncated };
}

/** Apply a natural-language change request to the current interpretation (still in UI language). */
export async function refineInterpretation(
  currentInterpretation: string,
  instruction: string,
  locale: Locale,
  history: RefineTurn[],
  signal?: AbortSignal,
): Promise<{ interpretation: string }> {
  const instr = instruction.trim();
  if (!instr) throw new Error('EMPTY_INSTRUCTION');
  if (!currentInterpretation.trim()) throw new Error('EMPTY_INTERPRETATION');

  const language = localeLanguageName(locale);
  const system = `You refine plain-language descriptions of AI context.
The user wants to adjust what the AI should understand.
Rewrite the FULL updated interpretation in ${language}.
Incorporate the latest instruction. Keep prior refinements unless the user undoes them.
Do not output JSON or an English context pack—only the revised human-readable interpretation.`;

  const recent = history.slice(-6);
  const historyBlock = recent.length
    ? recent.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n\n')
    : '(none)';

  const user = [
    'CURRENT INTERPRETATION:',
    currentInterpretation.trim(),
    '',
    'RECENT DIALOGUE:',
    historyBlock,
    '',
    'LATEST USER INSTRUCTION:',
    instr,
    '',
    `Return the complete updated interpretation in ${language}.`,
  ].join('\n');

  const interpretation = (await promptOnce(system, user, signal)).trim();
  if (!interpretation) throw new Error('EMPTY_INTERPRETATION');
  return { interpretation };
}
