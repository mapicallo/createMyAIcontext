export type Locale = 'en' | 'es' | 'pt' | 'fr' | 'de';

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
  | 'mergePacks'
  | 'mergePacksDesc'
  | 'interpretRefine'
  | 'interpretRefineDesc'
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
  | 'fieldPriority'
  | 'fieldPriorityPh'
  | 'mergeSelect'
  | 'mergeSelectHint'
  | 'mergeImport'
  | 'mergeImported'
  | 'mergeEmptyLib'
  | 'compile'
  | 'compiling'
  | 'mergeAction'
  | 'merging'
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
  | 'mergeTruncated'
  | 'missingQ'
  | 'warningsTitle'
  | 'errorEmpty'
  | 'errorNoFile'
  | 'errorModel'
  | 'errorGeneric'
  | 'errorTooLarge'
  | 'errorUnsupported'
  | 'errorEmptyFile'
  | 'errorPdf'
  | 'errorPdfEncrypted'
  | 'errorOffice'
  | 'errorRead'
  | 'errorNeedTwo'
  | 'errorTooMany'
  | 'errorInvalidPack'
  | 'errorEmptyInstruction'
  | 'copied'
  | 'statsInput'
  | 'statsOutput'
  | 'statsRatio'
  | 'interpSource'
  | 'interpSourcePh'
  | 'interpImport'
  | 'interpFromLib'
  | 'interpLibNone'
  | 'interpLibPlaceholder'
  | 'interpAction'
  | 'interpreting'
  | 'interpResultTitle'
  | 'interpWhatAiSees'
  | 'interpRefineLabel'
  | 'interpRefinePh'
  | 'interpSend'
  | 'interpRefining'
  | 'interpBuildPack'
  | 'interpBuilding'
  | 'interpHistory'
  | 'interpLoadedPack'
  | 'interpLoadedLib'
  | 'busyWorking'
  | 'reqTitle'
  | 'reqChrome'
  | 'reqRam'
  | 'reqStorage'
  | 'reqFlags'
  | 'reqAiSettings'
  | 'docsLink';

export type Messages = Record<MessageKey, string>;

export const LOCALES: Locale[] = ['en', 'es', 'pt', 'fr', 'de'];

export function detectLocaleFromNavigator(): Locale {
  const nav = (navigator.language ?? 'en').toLowerCase();
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('pt')) return 'pt';
  if (nav.startsWith('fr')) return 'fr';
  if (nav.startsWith('de')) return 'de';
  return 'en';
}

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as string[]).includes(v);
}

export function localeBcp47(locale: Locale): string {
  switch (locale) {
    case 'pt':
      return 'pt-BR';
    case 'es':
      return 'es';
    case 'fr':
      return 'fr';
    case 'de':
      return 'de';
    default:
      return 'en';
  }
}

export function localeLanguageName(locale: Locale): string {
  switch (locale) {
    case 'es':
      return 'Spanish';
    case 'pt':
      return 'Portuguese';
    case 'fr':
      return 'French';
    case 'de':
      return 'German';
    default:
      return 'English';
  }
}
