import { de } from './de.js';
import { en } from './en.js';
import { es } from './es.js';
import { fr } from './fr.js';
import { pt } from './pt.js';
import {
  detectLocaleFromNavigator,
  isLocale,
  type Locale,
  type MessageKey,
  type Messages,
} from './types.js';

export type { Locale, MessageKey, Messages };
export {
  LOCALES,
  detectLocaleFromNavigator,
  isLocale,
  localeBcp47,
  localeLanguageName,
} from './types.js';

const LOCALE_KEY = 'cmac_locale';

const tables: Record<Locale, Messages> = { en, es, pt, fr, de };

let current: Locale = 'en';

export async function loadLocale(): Promise<Locale> {
  try {
    const data = await chrome.storage.local.get(LOCALE_KEY);
    if (isLocale(data[LOCALE_KEY])) return data[LOCALE_KEY];
  } catch {
    /* ignore */
  }
  return detectLocaleFromNavigator();
}

export async function saveLocale(locale: Locale): Promise<void> {
  await chrome.storage.local.set({ [LOCALE_KEY]: locale });
}

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
  document.documentElement.lang = current === 'pt' ? 'pt-BR' : current;
  document.title = t('appName');
}
