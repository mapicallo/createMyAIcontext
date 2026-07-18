export const MAX_FILE_BYTES = 16 * 1024 * 1024;
export const MAX_EXTRACT_CHARS = 500_000;

export type ExtractFailure =
  | 'too_large'
  | 'unsupported'
  | 'empty'
  | 'pdf_failed'
  | 'pdf_encrypted'
  | 'read_failed';

export type ExtractResult =
  | { ok: true; text: string; truncated: boolean; fileName: string }
  | { ok: false; error: ExtractFailure };

const TEXT_EXT = new Set([
  '.txt',
  '.md',
  '.markdown',
  '.csv',
  '.json',
  '.log',
  '.xml',
  '.html',
  '.htm',
  '.yml',
  '.yaml',
]);

let workerConfigured = false;

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function truncateText(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  return { text: text.slice(0, max), truncated: true };
}

function configurePdfWorker(pdfjs: {
  GlobalWorkerOptions: { workerSrc: string };
}): void {
  if (workerConfigured) return;
  try {
    // Bundled beside the extension root by build-extension.mjs
    pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.min.mjs');
  } catch {
    /* non-extension context */
  }
  workerConfigured = true;
}

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  // Copy bytes — pdf.js may transfer/detach the underlying ArrayBuffer.
  const data = new Uint8Array(buffer.slice(0));

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  configurePdfWorker(pdfjs);

  const loadingTask = pdfjs.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const doc = await loadingTask.promise;

  const parts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) parts.push(pageText);
  }

  try {
    await doc.destroy();
  } catch {
    /* ignore */
  }

  return parts.join('\n\n');
}

function isPdfFile(file: File, ext: string): boolean {
  return ext === '.pdf' || file.type === 'application/pdf';
}

export async function extractDocumentText(file: File): Promise<ExtractResult> {
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'too_large' };

  const ext = extOf(file.name);
  let raw = '';

  try {
    if (isPdfFile(file, ext)) {
      raw = await extractPdfText(file);
    } else if (TEXT_EXT.has(ext) || file.type.startsWith('text/')) {
      raw = await file.text();
    } else {
      return { ok: false, error: 'unsupported' };
    }
  } catch (err) {
    console.error('[CMAC] extractDocumentText', file.name, err);
    const msg = String((err as Error)?.message ?? err).toLowerCase();
    if (isPdfFile(file, ext)) {
      if (msg.includes('password') || msg.includes('encrypted')) {
        return { ok: false, error: 'pdf_encrypted' };
      }
      return { ok: false, error: 'pdf_failed' };
    }
    return { ok: false, error: 'read_failed' };
  }

  raw = raw.replace(/\r\n/g, '\n').trim();
  if (!raw) return { ok: false, error: 'empty' };

  const { text, truncated } = truncateText(raw, MAX_EXTRACT_CHARS);
  return { ok: true, text, truncated, fileName: file.name };
}

export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return base.slice(0, 120) || 'Untitled context';
}
