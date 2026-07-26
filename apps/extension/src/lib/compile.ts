import {
  fallbackFactsFromText,
  fallbackNarrativeFromText,
  prepareSourceForCompile,
} from './condenseSource.js';
import { safeParseJson } from './jsonRepair.js';
import { promptOnce } from './model.js';
import { truncateForModel } from './modelOptions.js';
import {
  asFacts,
  asStringArray,
  parseUserConstraints,
  type ModelCompilePayload,
} from './parseHelpers.js';
import {
  finalizePack,
  type AiContextPack,
  type AiContextFact,
  type CompileInput,
} from './schema.js';

/** Gemini Nano often stalls on long prompts; abort and use local draft. */
const NANO_COMPILE_TIMEOUT_MS = 75_000;

const SYSTEM_PROMPT = `Compile SOURCE into compact ENGLISH context JSON only (no markdown):
{"constraints":string[],"facts":[{"key":string,"value":string,"weight":"high"|"medium"|"low"}],"narrative":string,"missingQuestions":string[]}
Rules: 8–14 facts from SOURCE; 1–2 dense narrative paragraphs; English; no invented employers/dates; never empty facts/narrative.`;

function buildUserPrompt(
  input: CompileInput,
  sourceBody: string,
  userConstraints: string[],
): string {
  return [
    `Title: ${input.title.trim() || 'Untitled'}`,
    `Objective: ${input.objective.trim() || 'General reusable AI context'}`,
    `Source language: ${input.sourceLang}`,
    userConstraints.length ? `Constraints:\n- ${userConstraints.join('\n- ')}` : 'Constraints: (none)',
    '',
    'SOURCE:',
    sourceBody,
  ].join('\n');
}

function payloadUsable(parsed: ModelCompilePayload): boolean {
  const facts = asFacts(parsed.facts);
  const narrative = typeof parsed.narrative === 'string' ? parsed.narrative.trim() : '';
  return facts.length >= 3 || narrative.length >= 80;
}

function mergeAbortSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;
  if (typeof AbortSignal !== 'undefined' && 'any' in AbortSignal && typeof AbortSignal.any === 'function') {
    return AbortSignal.any([a, b]);
  }
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (a.aborted || b.aborted) {
    ctrl.abort();
    return ctrl.signal;
  }
  a.addEventListener('abort', onAbort, { once: true });
  b.addEventListener('abort', onAbort, { once: true });
  return ctrl.signal;
}

async function askCompileJson(
  system: string,
  user: string,
  signal?: AbortSignal,
): Promise<ModelCompilePayload | null> {
  const timeout = AbortSignal.timeout(NANO_COMPILE_TIMEOUT_MS);
  const combined = mergeAbortSignals(signal, timeout);
  const started = performance.now();
  try {
    const raw = await promptOnce(system, user, combined);
    console.info(`[CMAC] compile Nano ok in ${Math.round(performance.now() - started)}ms, out=${raw.length}`);
    const parsed = safeParseJson<ModelCompilePayload>(raw);
    if (!parsed) {
      console.warn('[CMAC] compile: unparseable model output', raw.slice(0, 400));
      return null;
    }
    if (!payloadUsable(parsed)) {
      console.warn('[CMAC] compile: empty/thin pack from model');
      return null;
    }
    return parsed;
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[CMAC] compile Nano failed after ${Math.round(performance.now() - started)}ms: ${name} ${msg}`);
    return null;
  }
}

function packFromPayload(
  input: CompileInput,
  parsed: ModelCompilePayload,
  userConstraints: string[],
): AiContextPack {
  const constraints = [...userConstraints, ...asStringArray(parsed.constraints)];
  const uniqueConstraints = [...new Set(constraints.map((c) => c.trim()).filter(Boolean))];
  return finalizePack({
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
}

function localFallbackPack(
  input: CompileInput,
  sourceBody: string,
  userConstraints: string[],
): AiContextPack {
  let facts: AiContextFact[] = fallbackFactsFromText(sourceBody);
  if (facts.length === 0) {
    facts = [
      {
        key: 'source_excerpt',
        value: sourceBody.replace(/\s+/g, ' ').trim().slice(0, 500),
        weight: 'high',
      },
    ];
  }
  const narrative = fallbackNarrativeFromText(sourceBody, input.objective);
  return finalizePack({
    title: input.title,
    objective: input.objective,
    constraints: userConstraints,
    facts,
    narrative,
    missingQuestions: [
      'Which current role and seniority should be emphasized?',
      'Which skills or domains are highest priority for new opportunities?',
    ],
    sourceLang: input.sourceLang,
    appVersion: input.appVersion,
    inputCharsApprox: input.sourceText.trim().length,
  });
}

export type CompileStatus = 'condense' | 'compile' | 'retry';

export async function compileFromText(
  input: CompileInput,
  signal?: AbortSignal,
  onStatus?: (phase: CompileStatus) => void,
): Promise<{ pack: AiContextPack; truncated: boolean; condensed: boolean; usedFallback: boolean }> {
  const { text: truncatedSource, truncated } = truncateForModel(input.sourceText);
  if (!truncatedSource) throw new Error('EMPTY_SOURCE');

  const userConstraints = parseUserConstraints(input.constraintsText);

  onStatus?.('condense');
  const prepared = prepareSourceForCompile(truncatedSource);
  const { text: compileBody } = truncateForModel(prepared.text);

  console.info(
    `[CMAC] compile prep: source=${truncatedSource.length} → nano=${compileBody.length} condensed=${prepared.condensed}`,
  );

  onStatus?.('compile');
  const userPrompt = buildUserPrompt(input, compileBody, userConstraints);
  const parsed = await askCompileJson(SYSTEM_PROMPT, userPrompt, signal);

  if (parsed) {
    const pack = packFromPayload(input, parsed, userConstraints);
    if (pack.narrative || pack.facts.length > 0) {
      return {
        pack,
        truncated,
        condensed: prepared.condensed,
        usedFallback: false,
      };
    }
  }

  // No second Nano pass (was doubling wait to several minutes). Local draft instead.
  console.warn('[CMAC] compile: using local fallback pack');
  onStatus?.('retry');
  const pack = localFallbackPack(input, compileBody, userConstraints);
  return {
    pack,
    truncated,
    condensed: prepared.condensed,
    usedFallback: true,
  };
}
