import './panel.css';
import { compileFromText } from './lib/compile.js';
import { copyText, downloadPack, readPackFromFile } from './lib/exportImport.js';
import {
  extractDocumentText,
  titleFromFileName,
  type ExtractFailure,
} from './lib/fileExtract.js';
import {
  applyStaticTranslations,
  getLocale,
  initI18n,
  setLocale,
  t,
  type Locale,
  type MessageKey,
} from './lib/i18n.js';
import {
  deleteFromLibrary,
  listLibrary,
  saveToLibrary,
  type LibraryEntry,
} from './lib/library.js';
import { MAX_MERGE_PACKS, mergePacks } from './lib/merge.js';
import {
  hasLanguageModelApi,
  queryAvailability,
  warmUpModel,
  type ModelUiState,
} from './lib/model.js';
import type { AiContextPack } from './lib/schema.js';

const APP_VERSION = '0.2.0';

const statusSection = document.getElementById('model-status') as HTMLElement;
const statusTitle = document.getElementById('status-title')!;
const statusDetail = document.getElementById('status-detail')!;
const progressWrap = document.getElementById('progress-wrap')!;
const progressBar = document.getElementById('download-progress') as HTMLProgressElement;
const retryBtn = document.getElementById('retry-btn') as HTMLButtonElement;
const main = document.getElementById('main')!;
const viewHome = document.getElementById('view-home')!;
const viewCompile = document.getElementById('view-compile')!;
const viewMerge = document.getElementById('view-merge')!;
const viewResult = document.getElementById('view-result')!;
const formError = document.getElementById('form-error')!;
const mergeError = document.getElementById('merge-error')!;
const compileBtn = document.getElementById('compile-btn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
const mergeBtn = document.getElementById('merge-btn') as HTMLButtonElement;
const mergeCancelBtn = document.getElementById('merge-cancel-btn') as HTMLButtonElement;
const resultBody = document.getElementById('result-body')!;
const truncNote = document.getElementById('trunc-note')!;
const statsEl = document.getElementById('stats')!;
const missingWrap = document.getElementById('missing-wrap')!;
const missingList = document.getElementById('missing-list')!;
const warningsWrap = document.getElementById('warnings-wrap')!;
const warningsList = document.getElementById('warnings-list')!;
const copyToast = document.getElementById('copy-toast')!;
const localeSelect = document.getElementById('locale-select') as HTMLSelectElement;
const versionStrip = document.getElementById('version-strip')!;
const sourceTextWrap = document.getElementById('source-text-wrap')!;
const sourceFileWrap = document.getElementById('source-file-wrap')!;
const fieldSource = document.getElementById('field-source') as HTMLTextAreaElement;
const fieldFile = document.getElementById('field-file') as HTMLInputElement;
const fieldTitle = document.getElementById('field-title') as HTMLInputElement;
const fileStatus = document.getElementById('file-status')!;
const libraryEmpty = document.getElementById('library-empty')!;
const libraryList = document.getElementById('library-list')!;
const saveLibBtn = document.getElementById('save-lib-btn') as HTMLButtonElement;
const mergePackList = document.getElementById('merge-pack-list')!;
const mergeEmpty = document.getElementById('merge-empty')!;
const mergeImport = document.getElementById('merge-import') as HTMLInputElement;
const mergeImportStatus = document.getElementById('merge-import-status')!;
const mergeTitle = document.getElementById('merge-title') as HTMLInputElement;

type CompileMode = 'text' | 'file';
type ResultOrigin = 'compile' | 'merge' | 'library';

type MergeCandidate = {
  id: string;
  title: string;
  pack: AiContextPack;
  source: 'library' | 'import';
};

let compileMode: CompileMode = 'text';
let resultOrigin: ResultOrigin = 'compile';
let currentPack: AiContextPack | null = null;
let currentWarnings: string[] = [];
let fileSourceText = '';
let fileExtractTruncated = false;
let resultTab: 'prompt' | 'json' | 'facts' = 'prompt';
let abort: AbortController | null = null;
let runningAvail = false;
let lastTruncKind: 'model' | 'file' | 'merge' | 'both' | null = null;
let mergeCandidates: MergeCandidate[] = [];
let selectedMergeIds = new Set<string>();

function setUiState(state: ModelUiState): void {
  statusSection.setAttribute('data-state', state);
  statusSection.setAttribute('aria-busy', state === 'checking' || state === 'downloading' ? 'true' : 'false');
  progressWrap.hidden = state !== 'downloading';
  retryBtn.hidden = state !== 'unavailable' && state !== 'no-api';
  statusDetail.hidden = state === 'ready';
}

function setStatus(titleKey: MessageKey, detailKey: MessageKey): void {
  statusTitle.textContent = t(titleKey);
  statusDetail.textContent = t(detailKey);
}

function showView(which: 'home' | 'compile' | 'merge' | 'result'): void {
  viewHome.hidden = which !== 'home';
  viewCompile.hidden = which !== 'compile';
  viewMerge.hidden = which !== 'merge';
  viewResult.hidden = which !== 'result';
  if (which === 'home') void refreshLibrary();
  if (which === 'merge') void prepareMergeView();
}

function setProgress(ratio: number): void {
  const pct = Math.round(ratio * 100);
  progressBar.value = pct;
  progressBar.textContent = `${pct}%`;
}

function setCompileMode(mode: CompileMode): void {
  compileMode = mode;
  sourceTextWrap.hidden = mode !== 'text';
  sourceFileWrap.hidden = mode !== 'file';
  formError.hidden = true;
}

function extractErrorKey(error: ExtractFailure): MessageKey {
  switch (error) {
    case 'too_large':
      return 'errorTooLarge';
    case 'unsupported':
      return 'errorUnsupported';
    case 'empty':
      return 'errorEmptyFile';
    case 'pdf_failed':
      return 'errorPdf';
    default:
      return 'errorRead';
  }
}

async function runAvailabilityFlow(): Promise<void> {
  if (runningAvail) return;
  runningAvail = true;
  main.hidden = true;
  setUiState('checking');
  setStatus('stateChecking', 'stateCheckingDetail');

  try {
    if (!hasLanguageModelApi()) {
      setUiState('no-api');
      setStatus('stateNoApi', 'stateNoApiDetail');
      return;
    }

    let avail = await queryAvailability();
    if (avail === 'downloadable' || avail === 'downloading') {
      setUiState(avail === 'downloading' ? 'downloading' : 'downloadable');
      setStatus(
        avail === 'downloading' ? 'stateDownloading' : 'stateDownloadable',
        avail === 'downloading' ? 'stateDownloadingDetail' : 'stateDownloadableDetail',
      );
      await warmUpModel((r) => {
        setUiState('downloading');
        setStatus('stateDownloading', 'stateDownloadingDetail');
        setProgress(r);
      });
      avail = await queryAvailability();
    }

    if (avail !== 'available') {
      setUiState('unavailable');
      setStatus('stateUnavailable', 'stateUnavailableDetail');
      return;
    }

    setUiState('ready');
    setStatus('stateReady', 'stateReadyDetail');
    main.hidden = false;
    showView('home');
  } catch (e) {
    console.error('[CMAC] availability', e);
    setUiState('unavailable');
    setStatus('stateUnavailable', 'stateUnavailableDetail');
  } finally {
    runningAvail = false;
  }
}

function renderResult(): void {
  if (!currentPack) return;
  if (resultTab === 'prompt') {
    resultBody.textContent = currentPack.promptBlock;
  } else if (resultTab === 'json') {
    resultBody.textContent = JSON.stringify(currentPack, null, 2);
  } else {
    resultBody.textContent = currentPack.facts
      .map((f) => `${f.key}: ${f.value}${f.weight ? ` (${f.weight})` : ''}`)
      .join('\n');
  }

  const pct = Math.round(currentPack.stats.reductionRatioApprox * 100);
  statsEl.innerHTML = [
    `<span>${t('statsInput')}: ${currentPack.stats.inputCharsApprox}</span>`,
    `<span>${t('statsOutput')}: ${currentPack.stats.outputChars}</span>`,
    `<span>${t('statsRatio')}: ${pct}%</span>`,
  ].join('');

  if (lastTruncKind === 'both') {
    truncNote.hidden = false;
    truncNote.textContent = `${t('fileTruncated')} ${t('truncated')}`;
  } else if (lastTruncKind === 'file') {
    truncNote.hidden = false;
    truncNote.textContent = t('fileTruncated');
  } else if (lastTruncKind === 'merge') {
    truncNote.hidden = false;
    truncNote.textContent = t('mergeTruncated');
  } else if (lastTruncKind === 'model') {
    truncNote.hidden = false;
    truncNote.textContent = t('truncated');
  } else {
    truncNote.hidden = true;
  }

  const qs = currentPack.missingQuestions ?? [];
  if (qs.length) {
    missingWrap.hidden = false;
    missingList.innerHTML = qs.map((q) => `<li>${escapeHtml(q)}</li>`).join('');
  } else {
    missingWrap.hidden = true;
    missingList.innerHTML = '';
  }

  if (currentWarnings.length) {
    warningsWrap.hidden = false;
    warningsList.innerHTML = currentWarnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('');
  } else {
    warningsWrap.hidden = true;
    warningsList.innerHTML = '';
  }

  saveLibBtn.disabled = false;
  saveLibBtn.textContent = t('saveLibrary');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(getLocale() === 'es' ? 'es' : 'en', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

async function refreshLibrary(): Promise<void> {
  const entries = await listLibrary();
  if (!entries.length) {
    libraryEmpty.hidden = false;
    libraryList.hidden = true;
    libraryList.innerHTML = '';
    return;
  }

  libraryEmpty.hidden = true;
  libraryList.hidden = false;
  libraryList.innerHTML = entries
    .map(
      (e) => `
      <li class="library-item" data-id="${escapeHtml(e.id)}">
        <div class="meta">
          <strong>${escapeHtml(e.title)}</strong>
          <small>${escapeHtml(formatSavedAt(e.savedAt))}</small>
        </div>
        <div class="actions">
          <button type="button" data-action="open">${t('libraryOpen')}</button>
          <button type="button" data-action="delete">${t('libraryDelete')}</button>
        </div>
      </li>`,
    )
    .join('');
}

function openLibraryEntry(entry: LibraryEntry): void {
  currentPack = entry.pack;
  currentWarnings = [];
  lastTruncKind = null;
  resultOrigin = 'library';
  resultTab = 'prompt';
  document.querySelectorAll('.tab').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-tab') === 'prompt');
  });
  renderResult();
  showView('result');
}

function renderMergeCandidates(): void {
  mergeEmpty.hidden = mergeCandidates.length > 0;

  mergePackList.innerHTML = mergeCandidates
    .map((c) => {
      const checked = selectedMergeIds.has(c.id) ? 'checked' : '';
      const badge = c.source === 'import' ? ` · ${t('mergeImported')}` : '';
      return `
        <li class="merge-item">
          <label>
            <input type="checkbox" data-merge-id="${escapeHtml(c.id)}" ${checked} />
            <span>
              <strong>${escapeHtml(c.title)}</strong>
              <small>${escapeHtml(c.pack.meta.objective || '')}${badge}</small>
            </span>
          </label>
        </li>`;
    })
    .join('');
}

async function prepareMergeView(): Promise<void> {
  const entries = await listLibrary();
  const imported = mergeCandidates.filter((c) => c.source === 'import');
  mergeCandidates = [
    ...entries.map((e) => ({
      id: e.id,
      title: e.title,
      pack: e.pack,
      source: 'library' as const,
    })),
    ...imported,
  ];
  selectedMergeIds = new Set([...selectedMergeIds].filter((id) => mergeCandidates.some((c) => c.id === id)));
  mergeError.hidden = true;
  mergeImportStatus.hidden = true;
  renderMergeCandidates();
}

async function onCompile(ev: Event): Promise<void> {
  ev.preventDefault();
  formError.hidden = true;
  const title = fieldTitle.value;
  const objective = (document.getElementById('field-objective') as HTMLTextAreaElement).value;
  const constraintsText = (document.getElementById('field-constraints') as HTMLTextAreaElement).value;

  let sourceText = '';
  let extractTrunc = false;

  if (compileMode === 'file') {
    if (!fileSourceText.trim()) {
      formError.hidden = false;
      formError.textContent = t('errorNoFile');
      return;
    }
    sourceText = fileSourceText;
    extractTrunc = fileExtractTruncated;
  } else {
    sourceText = fieldSource.value;
    if (!sourceText.trim()) {
      formError.hidden = false;
      formError.textContent = t('errorEmpty');
      return;
    }
  }

  abort?.abort();
  abort = new AbortController();
  compileBtn.disabled = true;
  compileBtn.textContent = t('compiling');
  cancelBtn.hidden = false;

  try {
    const { pack, truncated } = await compileFromText(
      {
        title,
        objective,
        constraintsText,
        sourceText,
        sourceLang: getLocale(),
        appVersion: APP_VERSION,
      },
      abort.signal,
    );
    currentPack = pack;
    currentWarnings = [];
    resultOrigin = 'compile';
    if (extractTrunc && truncated) lastTruncKind = 'both';
    else if (extractTrunc) lastTruncKind = 'file';
    else if (truncated) lastTruncKind = 'model';
    else lastTruncKind = null;

    resultTab = 'prompt';
    document.querySelectorAll('.tab').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-tab') === 'prompt');
    });
    renderResult();
    showView('result');
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return;
    console.error('[CMAC] compile', e);
    formError.hidden = false;
    const msg = (e as Error)?.message;
    formError.textContent =
      msg === 'INVALID_MODEL_JSON' || msg === 'EMPTY_PACK' ? t('errorModel') : t('errorGeneric');
  } finally {
    compileBtn.disabled = false;
    compileBtn.textContent = t('compile');
    cancelBtn.hidden = true;
    abort = null;
  }
}

async function onMerge(ev: Event): Promise<void> {
  ev.preventDefault();
  mergeError.hidden = true;

  const selected = mergeCandidates.filter((c) => selectedMergeIds.has(c.id));
  if (selected.length < 2) {
    mergeError.hidden = false;
    mergeError.textContent = t('errorNeedTwo');
    return;
  }
  if (selected.length > MAX_MERGE_PACKS) {
    mergeError.hidden = false;
    mergeError.textContent = t('errorTooMany');
    return;
  }

  abort?.abort();
  abort = new AbortController();
  mergeBtn.disabled = true;
  mergeBtn.textContent = t('merging');
  mergeCancelBtn.hidden = false;

  try {
    const { pack, truncated, warnings } = await mergePacks(
      {
        title: mergeTitle.value,
        objective: (document.getElementById('merge-objective') as HTMLTextAreaElement).value,
        priorityText: (document.getElementById('merge-priority') as HTMLTextAreaElement).value,
        constraintsText: (document.getElementById('merge-constraints') as HTMLTextAreaElement).value,
        packs: selected.map((s) => s.pack),
        sourceLang: getLocale(),
        appVersion: APP_VERSION,
      },
      abort.signal,
    );
    currentPack = pack;
    currentWarnings = warnings;
    resultOrigin = 'merge';
    lastTruncKind = truncated ? 'merge' : null;
    resultTab = 'prompt';
    document.querySelectorAll('.tab').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-tab') === 'prompt');
    });
    renderResult();
    showView('result');
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return;
    console.error('[CMAC] merge', e);
    mergeError.hidden = false;
    const msg = (e as Error)?.message;
    if (msg === 'NEED_TWO_PACKS') mergeError.textContent = t('errorNeedTwo');
    else if (msg === 'TOO_MANY_PACKS') mergeError.textContent = t('errorTooMany');
    else if (msg === 'INVALID_MODEL_JSON' || msg === 'EMPTY_PACK') mergeError.textContent = t('errorModel');
    else mergeError.textContent = t('errorGeneric');
  } finally {
    mergeBtn.disabled = false;
    mergeBtn.textContent = t('mergeAction');
    mergeCancelBtn.hidden = true;
    abort = null;
  }
}

async function onFilePicked(): Promise<void> {
  const file = fieldFile.files?.[0];
  fileSourceText = '';
  fileExtractTruncated = false;
  fileStatus.hidden = true;
  formError.hidden = true;
  if (!file) return;

  fileStatus.hidden = false;
  fileStatus.textContent = t('fileReading');

  const result = await extractDocumentText(file);
  if (!result.ok) {
    fileStatus.hidden = true;
    formError.hidden = false;
    formError.textContent = t(extractErrorKey(result.error));
    fieldFile.value = '';
    return;
  }

  fileSourceText = result.text;
  fileExtractTruncated = result.truncated;
  fileStatus.textContent = `${t('fileSelected')}: ${result.fileName} (${result.text.length} chars)`;
  if (!fieldTitle.value.trim()) {
    fieldTitle.value = titleFromFileName(result.fileName);
  }
}

async function onMergeImport(): Promise<void> {
  const files = [...(mergeImport.files ?? [])];
  mergeImport.value = '';
  if (!files.length) return;

  const added: string[] = [];
  for (const file of files) {
    try {
      const pack = await readPackFromFile(file);
      const id = `import_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      mergeCandidates.push({
        id,
        title: pack.meta.title || file.name,
        pack,
        source: 'import',
      });
      selectedMergeIds.add(id);
      added.push(pack.meta.title || file.name);
    } catch {
      mergeError.hidden = false;
      mergeError.textContent = t('errorInvalidPack');
    }
  }

  if (added.length) {
    mergeImportStatus.hidden = false;
    mergeImportStatus.textContent = `${t('mergeImported')}: ${added.join(', ')}`;
    if (!mergeTitle.value.trim() && added.length >= 2) {
      mergeTitle.value = `Merged — ${added.slice(0, 2).join(' + ')}`;
    }
  }
  renderMergeCandidates();
}

function bindUi(): void {
  versionStrip.textContent = `v${APP_VERSION}`;

  document.getElementById('btn-from-text')!.addEventListener('click', () => {
    setCompileMode('text');
    showView('compile');
  });
  document.getElementById('btn-from-file')!.addEventListener('click', () => {
    setCompileMode('file');
    showView('compile');
  });
  document.getElementById('btn-merge')!.addEventListener('click', () => showView('merge'));
  document.getElementById('back-home')!.addEventListener('click', () => showView('home'));
  document.getElementById('back-home-merge')!.addEventListener('click', () => showView('home'));
  document.getElementById('back-compile')!.addEventListener('click', () => {
    if (resultOrigin === 'merge') showView('merge');
    else if (resultOrigin === 'library') showView('home');
    else showView('compile');
  });
  document.getElementById('new-btn')!.addEventListener('click', () => {
    currentPack = null;
    currentWarnings = [];
    if (resultOrigin === 'merge') showView('merge');
    else showView('compile');
  });

  document.getElementById('compile-form')!.addEventListener('submit', (e) => void onCompile(e));
  document.getElementById('merge-form')!.addEventListener('submit', (e) => void onMerge(e));
  cancelBtn.addEventListener('click', () => abort?.abort());
  mergeCancelBtn.addEventListener('click', () => abort?.abort());
  fieldFile.addEventListener('change', () => void onFilePicked());
  mergeImport.addEventListener('change', () => void onMergeImport());

  mergePackList.addEventListener('change', (ev) => {
    const input = ev.target as HTMLInputElement;
    if (input.type !== 'checkbox') return;
    const id = input.getAttribute('data-merge-id');
    if (!id) return;
    if (input.checked) {
      if (selectedMergeIds.size >= MAX_MERGE_PACKS && !selectedMergeIds.has(id)) {
        input.checked = false;
        mergeError.hidden = false;
        mergeError.textContent = t('errorTooMany');
        return;
      }
      selectedMergeIds.add(id);
    } else {
      selectedMergeIds.delete(id);
    }
    mergeError.hidden = true;
  });

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.getAttribute('data-tab') as 'prompt' | 'json' | 'facts';
      resultTab = id;
      document.querySelectorAll('.tab').forEach((el) => el.classList.toggle('active', el === tab));
      renderResult();
    });
  });

  document.getElementById('copy-btn')!.addEventListener('click', async () => {
    if (!currentPack) return;
    await copyText(currentPack.promptBlock);
    copyToast.hidden = false;
    copyToast.textContent = t('copied');
    setTimeout(() => {
      copyToast.hidden = true;
    }, 1500);
  });

  document.getElementById('download-btn')!.addEventListener('click', () => {
    if (currentPack) downloadPack(currentPack);
  });

  saveLibBtn.addEventListener('click', async () => {
    if (!currentPack) return;
    saveLibBtn.disabled = true;
    try {
      await saveToLibrary(currentPack);
      saveLibBtn.textContent = t('savedLibrary');
      copyToast.hidden = false;
      copyToast.textContent = t('savedLibrary');
      setTimeout(() => {
        copyToast.hidden = true;
      }, 1500);
    } catch (e) {
      console.error('[CMAC] save library', e);
      saveLibBtn.disabled = false;
      saveLibBtn.textContent = t('saveLibrary');
    }
  });

  libraryList.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest('button[data-action]') as HTMLButtonElement | null;
    if (!btn) return;
    const item = btn.closest('.library-item') as HTMLElement | null;
    const id = item?.getAttribute('data-id');
    if (!id) return;
    const action = btn.getAttribute('data-action');
    void (async () => {
      if (action === 'delete') {
        await deleteFromLibrary(id);
        await refreshLibrary();
        return;
      }
      if (action === 'open') {
        const entries = await listLibrary();
        const entry = entries.find((e) => e.id === id);
        if (entry) openLibraryEntry(entry);
      }
    })();
  });

  retryBtn.addEventListener('click', () => void runAvailabilityFlow());

  localeSelect.value = getLocale();
  localeSelect.addEventListener('change', async () => {
    await setLocale(localeSelect.value as Locale);
    if (statusSection.getAttribute('data-state') === 'ready') {
      setStatus('stateReady', 'stateReadyDetail');
    }
    if (currentPack) renderResult();
    await refreshLibrary();
    if (!viewMerge.hidden) renderMergeCandidates();
  });

  document.getElementById('privacy-link')!.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(chrome.runtime.getURL('privacy.html'), '_blank', 'noopener,noreferrer');
  });
}

async function boot(): Promise<void> {
  await initI18n();
  localeSelect.value = getLocale();
  applyStaticTranslations();
  bindUi();
  await runAvailabilityFlow();
}

void boot();
