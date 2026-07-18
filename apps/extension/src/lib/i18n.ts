export type Locale = 'en' | 'es';

const LOCALE_KEY = 'cmac_locale';

export async function loadLocale(): Promise<Locale> {
  try {
    const data = await chrome.storage.local.get(LOCALE_KEY);
    const v = data[LOCALE_KEY];
    if (v === 'es' || v === 'en') return v;
  } catch {
    /* ignore */
  }
  const nav = navigator.language?.toLowerCase() ?? 'en';
  return nav.startsWith('es') ? 'es' : 'en';
}

export async function saveLocale(locale: Locale): Promise<void> {
  await chrome.storage.local.set({ [LOCALE_KEY]: locale });
}

export type MessageKey =
  | 'appName'
  | 'tagline'
  | 'stateChecking'
  | 'stateCheckingDetail'
  | 'stateReady'
  | 'stateReadyDetail'
  | 'stateDownloadable'
  | 'stateDownloadableDetail'
  | 'stateDownloading'
  | 'stateDownloadingDetail'
  | 'stateUnavailable'
  | 'stateUnavailableDetail'
  | 'stateNoApi'
  | 'stateNoApiDetail'
  | 'retry'
  | 'privacy'
  | 'homeTitle'
  | 'fromText'
  | 'fromTextDesc'
  | 'fromFile'
  | 'fromFileDesc'
  | 'mergeSoon'
  | 'interpretSoon'
  | 'libraryTitle'
  | 'libraryEmpty'
  | 'libraryOpen'
  | 'libraryDelete'
  | 'back'
  | 'fieldTitle'
  | 'fieldTitlePh'
  | 'fieldObjective'
  | 'fieldObjectivePh'
  | 'fieldConstraints'
  | 'fieldConstraintsPh'
  | 'fieldSource'
  | 'fieldSourcePh'
  | 'fieldFile'
  | 'fieldFileHint'
  | 'fileSelected'
  | 'fileReading'
  | 'compile'
  | 'compiling'
  | 'cancel'
  | 'resultTitle'
  | 'copyPrompt'
  | 'downloadJson'
  | 'saveLibrary'
  | 'savedLibrary'
  | 'newCompile'
  | 'tabPrompt'
  | 'tabJson'
  | 'tabFacts'
  | 'truncated'
  | 'fileTruncated'
  | 'missingQ'
  | 'errorEmpty'
  | 'errorNoFile'
  | 'errorModel'
  | 'errorGeneric'
  | 'errorTooLarge'
  | 'errorUnsupported'
  | 'errorEmptyFile'
  | 'errorPdf'
  | 'errorRead'
  | 'copied'
  | 'statsInput'
  | 'statsOutput'
  | 'statsRatio';

const en: Record<MessageKey, string> = {
  appName: 'Create my AI Context',
  tagline: 'Compact English context packs — on your device',
  stateChecking: 'Checking Chrome AI…',
  stateCheckingDetail: 'Looking for Gemini Nano (Prompt API).',
  stateReady: 'Chrome AI ready',
  stateReadyDetail: 'You can compile context packs locally.',
  stateDownloadable: 'Model download needed',
  stateDownloadableDetail: 'Chrome can download Gemini Nano. Continue when ready.',
  stateDownloading: 'Downloading model…',
  stateDownloadingDetail: 'Keep this window open until the download finishes.',
  stateUnavailable: 'Chrome AI unavailable',
  stateUnavailableDetail:
    'Requires Chrome 138+ desktop with Gemini Nano. Enable on-device AI in chrome://settings if needed.',
  stateNoApi: 'Prompt API not found',
  stateNoApiDetail: 'This build of Chrome does not expose the language model API.',
  retry: 'Retry',
  privacy: 'Privacy',
  homeTitle: 'What do you want to do?',
  fromText: 'From text',
  fromTextDesc: 'Paste notes and compile an efficient English context pack.',
  fromFile: 'From file',
  fromFileDesc: 'Upload TXT, MD, or PDF and compile a portable context pack.',
  mergeSoon: 'Merge packs — soon',
  interpretSoon: 'Interpret & refine — soon',
  libraryTitle: 'Saved packs',
  libraryEmpty: 'No packs saved yet. Compile one and tap Save to library.',
  libraryOpen: 'Open',
  libraryDelete: 'Delete',
  back: 'Back',
  fieldTitle: 'Context title',
  fieldTitlePh: 'e.g. Professional CV',
  fieldObjective: 'Objective',
  fieldObjectivePh: 'What will this context be used for?',
  fieldConstraints: 'Constraints (optional)',
  fieldConstraintsPh: 'One per line, e.g. Do not invent dates',
  fieldSource: 'Source text',
  fieldSourcePh: 'Paste your notes, bio, or draft context…',
  fieldFile: 'Source file',
  fieldFileHint: 'Accepted: .txt, .md, .pdf (and other plain text)',
  fileSelected: 'Selected',
  fileReading: 'Reading file…',
  compile: 'Create context pack',
  compiling: 'Compiling…',
  cancel: 'Cancel',
  resultTitle: 'Your context pack',
  copyPrompt: 'Copy prompt block',
  downloadJson: 'Download .aicontext.json',
  saveLibrary: 'Save to library',
  savedLibrary: 'Saved',
  newCompile: 'Create another',
  tabPrompt: 'Prompt',
  tabJson: 'JSON',
  tabFacts: 'Facts',
  truncated: 'Source was truncated to fit the on-device model limit.',
  fileTruncated: 'File text was truncated before compiling.',
  missingQ: 'Suggested questions to improve this pack',
  errorEmpty: 'Please paste some source text.',
  errorNoFile: 'Please choose a file first.',
  errorModel: 'The model did not return a usable pack. Try shorter text or clearer objective.',
  errorGeneric: 'Something went wrong. Try again.',
  errorTooLarge: 'File is too large (max 16 MB).',
  errorUnsupported: 'Unsupported file type. Use TXT, MD, or PDF.',
  errorEmptyFile: 'No text could be extracted from this file.',
  errorPdf: 'Could not read this PDF.',
  errorRead: 'Could not read this file.',
  copied: 'Copied',
  statsInput: 'Input',
  statsOutput: 'Output',
  statsRatio: 'Size vs input',
};

const es: Record<MessageKey, string> = {
  appName: 'Create my AI Context',
  tagline: 'Packs de contexto compactos en inglés — en tu dispositivo',
  stateChecking: 'Comprobando Chrome AI…',
  stateCheckingDetail: 'Buscando Gemini Nano (Prompt API).',
  stateReady: 'Chrome AI listo',
  stateReadyDetail: 'Puedes compilar packs de contexto en local.',
  stateDownloadable: 'Hay que descargar el modelo',
  stateDownloadableDetail: 'Chrome puede descargar Gemini Nano. Continúa cuando esté listo.',
  stateDownloading: 'Descargando modelo…',
  stateDownloadingDetail: 'Mantén esta ventana abierta hasta que termine.',
  stateUnavailable: 'Chrome AI no disponible',
  stateUnavailableDetail:
    'Requiere Chrome 138+ de escritorio con Gemini Nano. Activa la IA en el dispositivo en chrome://settings si hace falta.',
  stateNoApi: 'No hay Prompt API',
  stateNoApiDetail: 'Esta versión de Chrome no expone la API del modelo de lenguaje.',
  retry: 'Reintentar',
  privacy: 'Privacidad',
  homeTitle: '¿Qué quieres hacer?',
  fromText: 'Desde texto',
  fromTextDesc: 'Pega notas y genera un pack de contexto eficiente en inglés.',
  fromFile: 'Desde archivo',
  fromFileDesc: 'Sube TXT, MD o PDF y genera un pack de contexto portable.',
  mergeSoon: 'Fusionar packs — pronto',
  interpretSoon: 'Interpretar y ajustar — pronto',
  libraryTitle: 'Packs guardados',
  libraryEmpty: 'Aún no hay packs. Compila uno y pulsa Guardar en biblioteca.',
  libraryOpen: 'Abrir',
  libraryDelete: 'Eliminar',
  back: 'Atrás',
  fieldTitle: 'Título del contexto',
  fieldTitlePh: 'p. ej. CV profesional',
  fieldObjective: 'Objetivo',
  fieldObjectivePh: '¿Para qué se usará este contexto?',
  fieldConstraints: 'Restricciones (opcional)',
  fieldConstraintsPh: 'Una por línea, p. ej. No inventes fechas',
  fieldSource: 'Texto fuente',
  fieldSourcePh: 'Pega tus notas, bio o borrador de contexto…',
  fieldFile: 'Archivo fuente',
  fieldFileHint: 'Aceptados: .txt, .md, .pdf (y otro texto plano)',
  fileSelected: 'Seleccionado',
  fileReading: 'Leyendo archivo…',
  compile: 'Crear pack de contexto',
  compiling: 'Compilando…',
  cancel: 'Cancelar',
  resultTitle: 'Tu pack de contexto',
  copyPrompt: 'Copiar bloque prompt',
  downloadJson: 'Descargar .aicontext.json',
  saveLibrary: 'Guardar en biblioteca',
  savedLibrary: 'Guardado',
  newCompile: 'Crear otro',
  tabPrompt: 'Prompt',
  tabJson: 'JSON',
  tabFacts: 'Hechos',
  truncated: 'El texto se truncó para el límite del modelo en el dispositivo.',
  fileTruncated: 'El texto del archivo se truncó antes de compilar.',
  missingQ: 'Preguntas sugeridas para mejorar este pack',
  errorEmpty: 'Pega algún texto fuente.',
  errorNoFile: 'Elige un archivo primero.',
  errorModel: 'El modelo no devolvió un pack usable. Prueba un texto más corto o un objetivo más claro.',
  errorGeneric: 'Algo falló. Inténtalo de nuevo.',
  errorTooLarge: 'El archivo es demasiado grande (máx. 16 MB).',
  errorUnsupported: 'Tipo no soportado. Usa TXT, MD o PDF.',
  errorEmptyFile: 'No se pudo extraer texto de este archivo.',
  errorPdf: 'No se pudo leer este PDF.',
  errorRead: 'No se pudo leer este archivo.',
  copied: 'Copiado',
  statsInput: 'Entrada',
  statsOutput: 'Salida',
  statsRatio: 'Tamaño vs entrada',
};

const tables: Record<Locale, Record<MessageKey, string>> = { en, es };

let current: Locale = 'en';

export function getLocale(): Locale {
  return current;
}

export function t(key: MessageKey): string {
  return tables[current][key] ?? tables.en[key] ?? key;
}

export async function initI18n(): Promise<Locale> {
  current = await loadLocale();
  return current;
}

export async function setLocale(locale: Locale): Promise<void> {
  current = locale;
  await saveLocale(locale);
  applyStaticTranslations();
}

export function applyStaticTranslations(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n') as MessageKey | null;
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder') as MessageKey | null;
    if (key && 'placeholder' in el) (el as HTMLInputElement).placeholder = t(key);
  });
  document.title = t('appName');
}
