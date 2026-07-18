import { slugFromTitle, isAiContextPack, type AiContextPack } from './schema.js';
import { safeParseJson } from './jsonRepair.js';

export function downloadPack(pack: AiContextPack): void {
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugFromTitle(pack.meta.title)}.aicontext.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function readPackFromFile(file: File): Promise<AiContextPack> {
  const text = await file.text();
  const parsed = safeParseJson<unknown>(text) ?? (() => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  })();
  if (!isAiContextPack(parsed)) throw new Error('INVALID_PACK_FILE');
  return parsed;
}
