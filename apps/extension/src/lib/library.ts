import { isAiContextPack, type AiContextPack } from './schema.js';

const LIBRARY_KEY = 'cmac_library';
export const MAX_LIBRARY_PACKS = 30;

export type LibraryEntry = {
  id: string;
  savedAt: string;
  title: string;
  pack: AiContextPack;
};

function newId(): string {
  return `pack_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listLibrary(): Promise<LibraryEntry[]> {
  try {
    const data = await chrome.storage.local.get(LIBRARY_KEY);
    const raw = data[LIBRARY_KEY];
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (e): e is LibraryEntry =>
        !!e &&
        typeof e === 'object' &&
        typeof (e as LibraryEntry).id === 'string' &&
        typeof (e as LibraryEntry).title === 'string' &&
        isAiContextPack((e as LibraryEntry).pack),
    );
  } catch {
    return [];
  }
}

async function writeLibrary(entries: LibraryEntry[]): Promise<void> {
  await chrome.storage.local.set({ [LIBRARY_KEY]: entries });
}

export async function saveToLibrary(pack: AiContextPack): Promise<LibraryEntry> {
  const entries = await listLibrary();
  const entry: LibraryEntry = {
    id: newId(),
    savedAt: new Date().toISOString(),
    title: pack.meta.title,
    pack,
  };
  const next = [entry, ...entries].slice(0, MAX_LIBRARY_PACKS);
  await writeLibrary(next);
  return entry;
}

export async function getLibraryEntry(id: string): Promise<LibraryEntry | null> {
  const entries = await listLibrary();
  return entries.find((e) => e.id === id) ?? null;
}

export async function deleteFromLibrary(id: string): Promise<void> {
  const entries = await listLibrary();
  await writeLibrary(entries.filter((e) => e.id !== id));
}
