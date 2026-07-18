/** Extract first JSON object from model output. */
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

export function safeParseJson<T = unknown>(raw: string): T | null {
  const payload = extractJsonPayload(raw);
  if (!payload) return null;
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}
