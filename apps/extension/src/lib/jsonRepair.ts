/** Light JSON cleanup for Gemini Nano outputs that are almost-valid. */
export function extractJsonPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    const inner = fence[1].trim();
    if (inner.startsWith('{')) return inner;
  }

  const objStart = trimmed.indexOf('{');
  const objEnd = trimmed.lastIndexOf('}');
  if (objStart >= 0 && objEnd > objStart) {
    return trimmed.slice(objStart, objEnd + 1);
  }

  return null;
}

function repairCommonIssues(payload: string): string {
  return payload
    // trailing commas before } or ]
    .replace(/,\s*([}\]])/g, '$1')
    // smart quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

export function safeParseJson<T = unknown>(raw: string): T | null {
  const payload = extractJsonPayload(raw);
  if (!payload) return null;

  const attempts = [payload, repairCommonIssues(payload)];
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      /* try next */
    }
  }
  return null;
}
