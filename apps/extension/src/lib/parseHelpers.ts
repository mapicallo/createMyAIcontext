import type { AiContextFact, FactWeight } from './schema.js';

export type ModelCompilePayload = {
  constraints?: unknown;
  facts?: unknown;
  narrative?: unknown;
  missingQuestions?: unknown;
  warnings?: unknown;
};

export function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function asFacts(v: unknown): AiContextFact[] {
  if (!Array.isArray(v)) return [];
  const out: AiContextFact[] = [];
  for (const item of v) {
    if (typeof item === 'string') {
      const s = item.trim();
      if (!s) continue;
      const colon = s.indexOf(':');
      if (colon > 0 && colon < 48) {
        out.push({ key: s.slice(0, colon).trim(), value: s.slice(colon + 1).trim(), weight: 'medium' });
      } else {
        out.push({ key: `fact_${out.length + 1}`, value: s, weight: 'medium' });
      }
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const key =
      (typeof o.key === 'string' && o.key.trim()) ||
      (typeof o.name === 'string' && o.name.trim()) ||
      (typeof o.label === 'string' && o.label.trim()) ||
      '';
    const valueRaw = o.value ?? o.text ?? o.content ?? o.val;
    const value =
      typeof valueRaw === 'string'
        ? valueRaw.trim()
        : typeof valueRaw === 'number' || typeof valueRaw === 'boolean'
          ? String(valueRaw)
          : '';
    if (!key || !value) continue;
    let weight: FactWeight | undefined;
    if (o.weight === 'high' || o.weight === 'medium' || o.weight === 'low') weight = o.weight;
    out.push({ key, value, weight });
  }
  return out;
}

export function parseUserConstraints(text: string): string[] {
  return text
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function packToMergeSnippet(pack: {
  meta: { title: string; objective: string };
  constraints: string[];
  facts: AiContextFact[];
  narrative: string;
}): string {
  const facts = pack.facts
    .map((f) => `- ${f.key}: ${f.value}${f.weight ? ` [${f.weight}]` : ''}`)
    .join('\n');
  return [
    `Title: ${pack.meta.title}`,
    `Objective: ${pack.meta.objective}`,
    pack.constraints.length ? `Constraints:\n${pack.constraints.map((c) => `- ${c}`).join('\n')}` : 'Constraints: (none)',
    facts ? `Facts:\n${facts}` : 'Facts: (none)',
    `Narrative:\n${pack.narrative}`,
  ].join('\n');
}
