import { safeParseJson } from './jsonRepair.js';
import { promptOnce } from './model.js';
import { truncateForModel } from './modelOptions.js';
import {
  finalizePack,
  type AiContextFact,
  type AiContextPack,
  type CompileInput,
  type FactWeight,
} from './schema.js';

const SYSTEM_PROMPT = `You are a context compiler for LLM prompts.
Convert noisy natural-language source material into a compact ENGLISH context pack.
Remove fluff. Keep only facts and constraints that help an AI answer correctly for the stated objective.
Output ONLY valid JSON (no markdown fences) with this shape:
{
  "constraints": string[],
  "facts": [{"key": string, "value": string, "weight": "high"|"medium"|"low"}],
  "narrative": string,
  "missingQuestions": string[]
}
Rules:
- All string values MUST be in English.
- facts: 5–20 crisp items; weight high for identity/role/must-know.
- narrative: 1–3 dense paragraphs, no ornamental prose.
- missingQuestions: up to 5 questions if critical gaps remain for the objective; else [].
- Merge user-provided constraints; do not invent employers, dates, or credentials.`;

type ModelCompilePayload = {
  constraints?: unknown;
  facts?: unknown;
  narrative?: unknown;
  missingQuestions?: unknown;
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
}

function asFacts(v: unknown): AiContextFact[] {
  if (!Array.isArray(v)) return [];
  const out: AiContextFact[] = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const key = typeof o.key === 'string' ? o.key.trim() : '';
    const value = typeof o.value === 'string' ? o.value.trim() : '';
    if (!key || !value) continue;
    let weight: FactWeight | undefined;
    if (o.weight === 'high' || o.weight === 'medium' || o.weight === 'low') weight = o.weight;
    out.push({ key, value, weight });
  }
  return out;
}

function parseUserConstraints(text: string): string[] {
  return text
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function compileFromText(
  input: CompileInput,
  signal?: AbortSignal,
): Promise<{ pack: AiContextPack; truncated: boolean }> {
  const { text, truncated } = truncateForModel(input.sourceText);
  if (!text) throw new Error('EMPTY_SOURCE');

  const userConstraints = parseUserConstraints(input.constraintsText);

  const userPrompt = [
    `Title: ${input.title.trim() || 'Untitled'}`,
    `Objective: ${input.objective.trim() || 'General reusable AI context'}`,
    `Source language hint: ${input.sourceLang}`,
    userConstraints.length ? `User constraints:\n- ${userConstraints.join('\n- ')}` : 'User constraints: (none)',
    '',
    'SOURCE MATERIAL:',
    text,
  ].join('\n');

  const raw = await promptOnce(SYSTEM_PROMPT, userPrompt, signal);
  const parsed = safeParseJson<ModelCompilePayload>(raw);
  if (!parsed) throw new Error('INVALID_MODEL_JSON');

  const constraints = [...userConstraints, ...asStringArray(parsed.constraints)];
  const uniqueConstraints = [...new Set(constraints.map((c) => c.trim()).filter(Boolean))];

  const pack = finalizePack({
    title: input.title,
    objective: input.objective,
    constraints: uniqueConstraints,
    facts: asFacts(parsed.facts),
    narrative: typeof parsed.narrative === 'string' ? parsed.narrative : '',
    missingQuestions: asStringArray(parsed.missingQuestions),
    sourceLang: input.sourceLang,
    appVersion: input.appVersion,
    inputCharsApprox: input.sourceText.trim().length,
  });

  if (!pack.narrative && pack.facts.length === 0) {
    throw new Error('EMPTY_PACK');
  }

  return { pack, truncated };
}
