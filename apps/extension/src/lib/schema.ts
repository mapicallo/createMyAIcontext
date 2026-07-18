export const AICONTEXT_FORMAT = 'aicontext' as const;
export const AICONTEXT_VERSION = 1 as const;

export type FactWeight = 'high' | 'medium' | 'low';

export type AiContextFact = {
  key: string;
  value: string;
  weight?: FactWeight;
};

export type AiContextPack = {
  format: typeof AICONTEXT_FORMAT;
  version: typeof AICONTEXT_VERSION;
  meta: {
    title: string;
    objective: string;
    createdAt: string;
    sourceLang: string;
    outputLang: 'en';
    app: string;
    appVersion: string;
  };
  constraints: string[];
  facts: AiContextFact[];
  narrative: string;
  promptBlock: string;
  missingQuestions?: string[];
  stats: {
    inputCharsApprox: number;
    outputChars: number;
    reductionRatioApprox: number;
  };
};

export type CompileInput = {
  title: string;
  objective: string;
  constraintsText: string;
  sourceText: string;
  sourceLang: string;
  appVersion: string;
};

const APP_NAME = 'Create my AI Context';

export function buildPromptBlock(pack: Omit<AiContextPack, 'promptBlock' | 'stats'>): string {
  const lines: string[] = [
    '=== AI CONTEXT PACK ===',
    `Title: ${pack.meta.title}`,
    `Objective: ${pack.meta.objective}`,
    '',
  ];
  if (pack.constraints.length) {
    lines.push('Constraints:');
    for (const c of pack.constraints) lines.push(`- ${c}`);
    lines.push('');
  }
  if (pack.facts.length) {
    lines.push('Facts:');
    for (const f of pack.facts) {
      const w = f.weight ? ` [${f.weight}]` : '';
      lines.push(`- ${f.key}: ${f.value}${w}`);
    }
    lines.push('');
  }
  lines.push('Narrative:');
  lines.push(pack.narrative.trim());
  lines.push('=== END AI CONTEXT PACK ===');
  return lines.join('\n');
}

export function finalizePack(
  partial: {
    title: string;
    objective: string;
    constraints: string[];
    facts: AiContextFact[];
    narrative: string;
    missingQuestions?: string[];
    sourceLang: string;
    appVersion: string;
    inputCharsApprox: number;
  },
): AiContextPack {
  const base = {
    format: AICONTEXT_FORMAT,
    version: AICONTEXT_VERSION,
    meta: {
      title: partial.title.trim() || 'Untitled context',
      objective: partial.objective.trim() || 'General AI context',
      createdAt: new Date().toISOString(),
      sourceLang: partial.sourceLang || 'und',
      outputLang: 'en' as const,
      app: APP_NAME,
      appVersion: partial.appVersion,
    },
    constraints: partial.constraints.filter(Boolean),
    facts: partial.facts.filter((f) => f.key && f.value),
    narrative: partial.narrative.trim(),
    missingQuestions: partial.missingQuestions?.filter(Boolean),
  };

  const promptBlock = buildPromptBlock(base);
  const outputChars = promptBlock.length;
  const input = Math.max(1, partial.inputCharsApprox);
  return {
    ...base,
    promptBlock,
    stats: {
      inputCharsApprox: partial.inputCharsApprox,
      outputChars,
      reductionRatioApprox: Math.round((outputChars / input) * 1000) / 1000,
    },
  };
}

export function isAiContextPack(value: unknown): value is AiContextPack {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.format === AICONTEXT_FORMAT && v.version === AICONTEXT_VERSION && typeof v.promptBlock === 'string';
}

export function slugFromTitle(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return s || 'ai-context';
}
