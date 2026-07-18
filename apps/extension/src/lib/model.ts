/**
 * Prompt API / Gemini Nano — availability and one-shot prompts.
 */
import { MODEL_LANG_OPTIONS } from './modelOptions.js';

export type ModelUiState =
  | 'checking'
  | 'unavailable'
  | 'no-api'
  | 'downloadable'
  | 'downloading'
  | 'ready';

export type AvailabilityKind = 'available' | 'downloadable' | 'downloading' | 'unavailable';

export type DownloadProgressHandler = (loadedRatio: number) => void;

type Session = {
  prompt: (input: string, options?: { signal?: AbortSignal }) => Promise<string>;
  destroy?: () => void;
};

type CreateOptions = {
  monitor?: (m: {
    addEventListener: (type: 'downloadprogress', fn: (e: { loaded: number }) => void) => void;
  }) => void;
  signal?: AbortSignal;
  systemPrompt?: string;
  initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
};

type LanguageModelGlobal = {
  availability?: (options?: typeof MODEL_LANG_OPTIONS) => Promise<string>;
  create?: (options?: CreateOptions) => Promise<Session>;
};

function languageModelGlobal(): LanguageModelGlobal | undefined {
  return (globalThis as unknown as { LanguageModel?: LanguageModelGlobal }).LanguageModel;
}

function aiLanguageModelFactory():
  | {
      capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
      create: (options?: CreateOptions) => Promise<Session>;
    }
  | undefined {
  const ai = (globalThis as unknown as { ai?: { languageModel?: unknown } }).ai;
  return ai?.languageModel as ReturnType<typeof aiLanguageModelFactory>;
}

function mapLanguageModelStatus(status: string): AvailabilityKind {
  if (status === 'available' || status === 'readily') return 'available';
  if (status === 'downloadable' || status === 'after-download') return 'downloadable';
  if (status === 'downloading') return 'downloading';
  return 'unavailable';
}

function buildMonitor(onProgress?: DownloadProgressHandler) {
  return (m: {
    addEventListener: (type: 'downloadprogress', fn: (e: { loaded: number }) => void) => void;
  }) => {
    m.addEventListener('downloadprogress', (e) => {
      const ratio = typeof e.loaded === 'number' ? Math.min(1, Math.max(0, e.loaded)) : 0;
      onProgress?.(ratio);
    });
  };
}

async function createSession(options: CreateOptions = {}): Promise<Session> {
  const merged = { ...MODEL_LANG_OPTIONS, ...options };
  const LM = languageModelGlobal();
  if (LM?.create) return LM.create(merged);

  const factory = aiLanguageModelFactory();
  if (factory?.create) return factory.create(merged);

  throw new Error('NO_LANGUAGE_MODEL_API');
}

export function hasLanguageModelApi(): boolean {
  return Boolean(languageModelGlobal()?.availability ?? aiLanguageModelFactory()?.capabilities);
}

export async function queryAvailability(): Promise<AvailabilityKind> {
  const LM = languageModelGlobal();
  if (LM?.availability) {
    const status = await LM.availability(MODEL_LANG_OPTIONS);
    return mapLanguageModelStatus(status);
  }

  const factory = aiLanguageModelFactory();
  if (factory?.capabilities) {
    const caps = await factory.capabilities();
    return mapLanguageModelStatus(caps.available);
  }

  return 'unavailable';
}

export async function warmUpModel(onProgress?: DownloadProgressHandler): Promise<void> {
  const session = await createSession({
    monitor: buildMonitor(onProgress),
    systemPrompt: 'You compact natural-language context into efficient English AI context packs.',
  });
  session.destroy?.();
}

export async function promptOnce(
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const session = await createSession({ systemPrompt, signal });
  try {
    return await session.prompt(userPrompt, { signal });
  } finally {
    session.destroy?.();
  }
}
