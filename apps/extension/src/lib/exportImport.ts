import { slugFromTitle, type AiContextPack } from './schema.js';

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
