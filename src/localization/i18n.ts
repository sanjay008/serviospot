import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

export type LanguageOption = {
  id: number;
  language_name: string;
  language_shortname: string;
};

const LANGUAGE_STORAGE_KEY = 'userLanguage';
const DROPDOWN_EXCLUDED = new Set(['ar']);

export const DEFAULT_LANGUAGE = 'en';

const FALLBACK_LANGUAGES: LanguageOption[] = [
  { id: 1, language_name: 'Nederlands', language_shortname: 'nl' },
  { id: 2, language_name: 'English', language_shortname: 'en' },
];

let availableLanguages: LanguageOption[] = FALLBACK_LANGUAGES;

export const getSelectableLanguages = (): LanguageOption[] =>
  availableLanguages.filter((item) => !DROPDOWN_EXCLUDED.has(item.language_shortname.trim().toLowerCase()));

const canUseStorage = () => Platform.OS !== 'web' || typeof window !== 'undefined';

export async function changeAppLanguage(language: string) {
  if (canUseStorage()) {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
  await i18n.changeLanguage(language);
}

const ready = i18n.use(initReactI18next).init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  resources: {},
  interpolation: { escapeValue: false },
});

let initPromise: Promise<void> | null = null;

export async function initI18n() {
  await ready;
  // Remote language API is paused; language options use the bundled fallback list.
  availableLanguages = FALLBACK_LANGUAGES;
  await i18n.changeLanguage(DEFAULT_LANGUAGE);
}

initPromise = initI18n();
export const waitForI18n = () => initPromise ?? initI18n();

export default i18n;
