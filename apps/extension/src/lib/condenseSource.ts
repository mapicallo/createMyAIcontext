/** Local source prep — keep Nano prompts small (long inputs can take minutes). */

/** Above this, we always condense before calling the model. */
export const PREPARE_THRESHOLD_CHARS = 4_500;
/** Target size sent to Gemini Nano for a single compile pass. */
export const PREPARE_TARGET_CHARS = 4_000;

const KEYWORD_RE =
  /\b(experiencia|experience|educaci[oó]n|education|formaci[oó]n|skills?|habilidades|competencias|idiomas?|languages?|certif|empleo|puesto|cargo|role|position|ingenier|engineer|perfil|profile|summary|objetivo|objective|tecnolog|stack|proyecto|project|universidad|university|grado|degree|linkedin|email|tel[eé]fono|phone|java|python|cloud|aws|azure|devops|agile|scrum)\b/i;

function scoreLine(line: string): number {
  const t = line.trim();
  if (t.length < 12 || t.length > 400) return 0;
  let score = 1;
  if (KEYWORD_RE.test(t)) score += 4;
  if (/\d{4}/.test(t)) score += 1; // years
  if (/[@|]/.test(t) || /https?:\/\//i.test(t)) score += 1;
  if (/^[•\-–*]/.test(t) || /\t/.test(t)) score += 1;
  return score;
}

/**
 * Keep CV/doc head (identity + recent roles) plus keyword-rich lines from the rest.
 * Always caps near PREPARE_TARGET_CHARS so on-device compile stays responsive.
 */
export function prepareSourceForCompile(
  sourceText: string,
  targetChars = PREPARE_TARGET_CHARS,
): { text: string; condensed: boolean } {
  const trimmed = sourceText.trim().replace(/\r\n/g, '\n');
  if (trimmed.length <= PREPARE_THRESHOLD_CHARS) {
    return { text: trimmed, condensed: false };
  }

  const headBudget = Math.floor(targetChars * 0.55);
  const tailBudget = targetChars - headBudget;
  const head = trimmed.slice(0, headBudget);

  const rest = trimmed.slice(headBudget);
  const lines = rest.split('\n');
  const scored: Array<{ line: string; score: number; i: number }> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const score = scoreLine(line);
    if (score >= 2) scored.push({ line: line.trim(), score, i });
  }
  scored.sort((a, b) => b.score - a.score || a.i - b.i);

  const picked: string[] = [];
  let used = 0;
  const seen = new Set<string>();
  for (const row of scored) {
    const key = row.line.toLowerCase();
    if (seen.has(key)) continue;
    if (used + row.line.length + 1 > tailBudget) continue;
    seen.add(key);
    picked.push(row.line);
    used += row.line.length + 1;
    if (picked.length >= 40) break;
  }

  picked.sort((a, b) => rest.indexOf(a) - rest.indexOf(b));

  const extras = picked.join('\n');
  const text = extras
    ? `${head.trim()}\n\n[… condensed for on-device compile …]\n\n${extras}`
    : `${head.trim()}\n\n[… source truncated for on-device compile …]`;

  return { text: text.slice(0, targetChars + 80), condensed: true };
}

/** Deterministic pack when Nano returns empty / unusable JSON or times out. */
export function fallbackFactsFromText(source: string): Array<{ key: string; value: string; weight: 'high' | 'medium' | 'low' }> {
  const lines = source
    .split(/\n/)
    .map((l) => l.replace(/^[\s•\-–*]+/, '').trim())
    .filter((l) => l.length >= 12 && l.length <= 280)
    .filter((l) => !/^\[…/.test(l));

  const facts: Array<{ key: string; value: string; weight: 'high' | 'medium' | 'low' }> = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (facts.length >= 16) break;
    const colon = line.search(/[:：]/);
    let key: string;
    let value: string;
    if (colon > 0 && colon <= 48) {
      key = line.slice(0, colon).trim().slice(0, 48);
      value = line.slice(colon + 1).trim();
    } else {
      key = KEYWORD_RE.test(line) ? 'profile_detail' : `note_${facts.length + 1}`;
      value = line;
    }
    if (!value || value.length < 3) continue;
    const dedupe = `${key}|${value}`.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    facts.push({
      key: key.replace(/\s+/g, '_').slice(0, 40) || `note_${facts.length + 1}`,
      value: value.slice(0, 400),
      weight: facts.length < 6 ? 'high' : 'medium',
    });
  }

  return facts;
}

export function fallbackNarrativeFromText(source: string, objective: string): string {
  const clean = source
    .replace(/\[…[^\]]*…\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const body = clean.slice(0, 1_400);
  const obj = objective.trim() || 'professional profile context';
  return `Compiled locally from source material for objective: ${obj}. Key content: ${body}`;
}
