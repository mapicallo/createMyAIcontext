import './panel.css';
import { compileFromText } from './lib/compile.js';
import { copyText, downloadPack } from './lib/exportImport.js';
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
  hasLanguageModelApi,
  queryAvailability,
  warmUpModel,
  type ModelUiState,
} from './lib/model.js';
import type { AiContextPack } from './lib/schema.js';

const APP_VERSION = '0.0.1';

const statusSection = document.getElementById('model-status') as HTMLElement;
const statusTitle = document.getElementById('status-title')!;
const statusDetail = document.getElementById('status-detail')!;
const progressWrap = document.getElementById('progress-wrap')!;
const progressBar = document.getElementById('download-progress') as HTMLProgressElement;
const retryBtn = document.getElementById('retry-btn') as HTMLButtonElement;
const main = document.getElementById('main')!;
const viewHome = document.getElementById('view-home')!;
const viewCompile = document.getElementById('view-compile')!;
const viewResult = document.getElementById('view-result')!;
const formError = document.getElementById('form-error')!;
const compileBtn = document.getElementById('compile-btn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
const resultBody = document.getElementById('result-body')!;
const truncNote = document.getElementById('trunc-note')!;
const statsEl = document.getElementById('stats')!;
const missingWrap = document.getElementById('missing-wrap')!;
const missingList = document.getElementById('missing-list')!;
const copyToast = document.getElementById('copy-toast')!;
const localeSelect = document.getElementById('locale-select') as HTMLSelectElement;
const versionStrip = document.getElementById('version-strip')!;

let currentPack: AiContextPack | null = null;
let resultTab: 'prompt' | 'json' | 'facts' = 'prompt';
let abort: AbortController | null = null;
let runningAvail = false;

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

function showView(which: 'home' | 'compile' | 'result'): void {
  viewHome.hidden = which !== 'home';
  viewCompile.hidden = which !== 'compile';
  viewResult.hidden = which !== 'result';
}

function setProgress(ratio: number): void {
  const pct = Math.round(ratio * 100);
  progressBar.value = pct;
  progressBar.textContent = `${pct}%`;
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

  const qs = currentPack.missingQuestions ?? [];
  if (qs.length) {
    missingWrap.hidden = false;
    missingList.innerHTML = qs.map((q) => `<li>${escapeHtml(q)}</li>`).join('');
  } else {
    missingWrap.hidden = true;
    missingList.innerHTML = '';
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function onCompile(ev: Event): Promise<void> {
  ev.preventDefault();
  formError.hidden = true;
  const title = (document.getElementById('field-title') as HTMLInputElement).value;
  const objective = (document.getElementById('field-objective') as HTMLTextAreaElement).value;
  const constraintsText = (document.getElementById('field-constraints') as HTMLTextAreaElement).value;
  const sourceText = (document.getElementById('field-source') as HTMLTextAreaElement).value;

  if (!sourceText.trim()) {
    formError.hidden = false;
    formError.textContent = t('errorEmpty');
    return;
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
    truncNote.hidden = !truncated;
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

function bindUi(): void {
  versionStrip.textContent = `v${APP_VERSION}`;

  document.getElementById('btn-from-text')!.addEventListener('click', () => showView('compile'));
  document.getElementById('back-home')!.addEventListener('click', () => showView('home'));
  document.getElementById('back-compile')!.addEventListener('click', () => showView('compile'));
  document.getElementById('new-btn')!.addEventListener('click', () => {
    currentPack = null;
    showView('compile');
  });

  document.getElementById('compile-form')!.addEventListener('submit', (e) => void onCompile(e));
  cancelBtn.addEventListener('click', () => abort?.abort());

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
    setTimeout(() => {
      copyToast.hidden = true;
    }, 1500);
  });

  document.getElementById('download-btn')!.addEventListener('click', () => {
    if (currentPack) downloadPack(currentPack);
  });

  retryBtn.addEventListener('click', () => void runAvailabilityFlow());

  localeSelect.value = getLocale();
  localeSelect.addEventListener('change', async () => {
    await setLocale(localeSelect.value as Locale);
    if (statusSection.getAttribute('data-state') === 'ready') {
      setStatus('stateReady', 'stateReadyDetail');
    }
    if (currentPack) renderResult();
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
