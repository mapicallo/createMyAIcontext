import { safeParseJson } from './jsonRepair.js';
import { promptOnce } from './model.js';
import { truncateForModel } from './modelOptions.js';
import {
  asFacts,
  asStringArray,
  packToMergeSnippet,
  parseUserConstraints,
  type ModelCompilePayload,
} from './parseHelpers.js';
import { finalizePack, type AiContextPack } from './schema.js';

export const MAX_MERGE_PACKS = 5;

export type MergeInput = {
  title: string;
  objective: string;
  priorityText: string;
  constraintsText: string;
  packs: AiContextPack[];
  sourceLang: string;
  appVersion: string;
};

const SYSTEM_PROMPT = `You merge several ENGLISH AI context packs into ONE compact ENGLISH pack.
Deduplicate facts. Resolve conflicts using the user's priority rule when given.
Output ONLY valid JSON (no markdown fences):
{
  "constraints": string[],
  "facts": [{"key": string, "value": string, "weight": "high"|"medium"|"low"}],
  "narrative": string,
  "missingQuestions": string[],
  "warnings": string[]
}
Rules:
- All string values MUST be in English.
- facts: 8–25 crisp merged items.
- narrative: 1–3 dense paragraphs covering the unified context.
- warnings: note overlaps, contradictions, or drops (up to 8); else [].
- Do not invent employers, dates, or credentials not present in inputs.
- Keep user constraints.`;

function buildMergedSource(packs: AiContextPack[]): string {
  return packs
    .map((p, i) => `----- PACK ${i + 1} -----\n${packToMergeSnippet(p)}`)
    .join('\n\n');
}

export async function mergePacks(
  input: MergeInput,
  signal?: AbortSignal,
): Promise<{ pack: AiContextPack; truncated: boolean; warnings: string[] }> {
  if (input.packs.length < 2) throw new Error('NEED_TWO_PACKS');
  if (input.packs.length > MAX_MERGE_PACKS) throw new Error('TOO_MANY_PACKS');

  const combined = buildMergedSource(input.packs);
  const { text, truncated } = truncateForModel(combined);
  const userConstraints = parseUserConstraints(input.constraintsText);
  const priority = input.priorityText.trim();

  const userPrompt = [
    `Merged title: ${input.title.trim() || 'Merged context'}`,
    `Merge objective: ${input.objective.trim() || 'Unify selected packs into one reusable AI context'}`,
    priority ? `Conflict priority: ${priority}` : 'Conflict priority: (none — prefer high-weight facts, then newer packs)',
    userConstraints.length ? `Extra constraints:\n- ${userConstraints.join('\n- ')}` : 'Extra constraints: (none)',
    '',
    'INPUT PACKS:',
    text,
  ].join('\n');

  const raw = await promptOnce(SYSTEM_PROMPT, userPrompt, signal);
  let parsed = safeParseJson<ModelCompilePayload>(raw);
  if (!parsed) {
    const retryUser = [
      userPrompt.slice(0, 8_000),
      '',
      'Previous merge attempt failed to return valid JSON. Return ONLY the JSON object now.',
    ].join('\n');
    const retryRaw = await promptOnce(
      `Fix into ONE valid JSON object only (no markdown). Shape: {"constraints":string[],"facts":[{"key":string,"value":string,"weight":"high"|"medium"|"low"}],"narrative":string,"missingQuestions":string[],"warnings":string[]}`,
      retryUser,
      signal,
    );
    parsed = safeParseJson<ModelCompilePayload>(retryRaw);
  }
  if (!parsed) throw new Error('INVALID_MODEL_JSON');

  const constraints = [...userConstraints, ...asStringArray(parsed.constraints)];
  const uniqueConstraints = [...new Set(constraints.map((c) => c.trim()).filter(Boolean))];
  const warnings = asStringArray(parsed.warnings);

  const inputCharsApprox = input.packs.reduce(
    (sum, p) => sum + (p.stats?.outputChars ?? p.promptBlock.length),
    0,
  );

  const pack = finalizePack({
    title: input.title,
    objective: input.objective,
    constraints: uniqueConstraints,
    facts: asFacts(parsed.facts),
    narrative: typeof parsed.narrative === 'string' ? parsed.narrative : '',
    missingQuestions: asStringArray(parsed.missingQuestions),
    sourceLang: input.sourceLang,
    appVersion: input.appVersion,
    inputCharsApprox,
  });

  if (!pack.narrative && pack.facts.length === 0) {
    throw new Error('EMPTY_PACK');
  }

  return { pack, truncated, warnings };
}
