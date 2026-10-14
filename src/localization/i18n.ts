import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

import { startApiLog } from '@/api/client';

export type LanguageOption = {
  id: number;
  language_name: string;
  language_shortname: string;
};

type TranslationTree = Record<string, unknown>;

type LanguagePack = LanguageOption & {
  data?: TranslationTree;
};

type LanguageApiItem = LanguageOption & {
  data?: TranslationTree | string;
};

type LanguageApiResponse = {
  status?: boolean;
  data?: LanguageApiItem[];
};

const LANGUAGE_API = 'https://app.erpportaal.nl/api/get_language';
const LANGUAGE_STORAGE_KEY = 'userLanguage';
const LANGUAGE_EXPLICIT_KEY = 'userLanguageExplicit';
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

const loadStoredLanguage = () => (canUseStorage() ? AsyncStorage.getItem(LANGUAGE_STORAGE_KEY) : Promise.resolve(null));
const loadExplicitChoice = async () => (canUseStorage() ? (await AsyncStorage.getItem(LANGUAGE_EXPLICIT_KEY)) === 'true' : false);

function resolveLanguage(stored: string | null, userChoseLanguage: boolean, languages: LanguageOption[]) {
  if (userChoseLanguage && stored && languages.some((item) => item.language_shortname === stored)) return stored;
  if (languages.some((item) => item.language_shortname === DEFAULT_LANGUAGE)) return DEFAULT_LANGUAGE;
  return languages[0]?.language_shortname ?? DEFAULT_LANGUAGE;
}

export async function changeAppLanguage(language: string) {
  if (canUseStorage()) {
    await AsyncStorage.multiSet([
      [LANGUAGE_STORAGE_KEY, language],
      [LANGUAGE_EXPLICIT_KEY, 'true'],
    ]);
  }
  await i18n.changeLanguage(language);
}

function asTranslations(data: LanguageApiItem['data']): TranslationTree | undefined {
  if (!data) return undefined;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown;
      if (parsed && typeof parsed === 'object') return parsed as TranslationTree;
    } catch {
      return undefined;
    }
    return undefined;
  }
  return data;
}

async function fetchLanguages(): Promise<LanguagePack[] | null> {
  const logReply = startApiLog(LANGUAGE_API, {});
  let response: Response;
  try {
    response = await fetch(LANGUAGE_API, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch (error) {
    logReply('NETWORK', String(error), true);
    throw error;
  }
  if (!response.ok) {
    logReply(response.status, await response.text(), true);
    return null;
  }
  const payload = (await response.json()) as LanguageApiResponse;
  const usable = !!payload.status && Array.isArray(payload.data) && payload.data.length > 0;
  logReply(
    response.status,
    {
      status: payload.status,
      languages: payload.data?.map((item) => ({
        id: item.id,
        code: item.language_shortname,
        name: item.language_name,
        keys: typeof item.data === 'object' && item.data ? Object.keys(item.data).length : 0,
      })),
    },
    !usable,
  );
  if (!usable || !payload.data) return null;
  return payload.data.map((item) => ({
    id: item.id,
    language_name: item.language_name,
    language_shortname: item.language_shortname,
    data: asTranslations(item.data),
  }));
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
  try {
    const remote = await fetchLanguages();
    if (remote) {
      availableLanguages = remote;
      for (const language of remote) {
        if (!language.data) continue;
        i18n.addResourceBundle(language.language_shortname, 'translation', language.data, true, true);
      }
    }
  } catch {
    availableLanguages = FALLBACK_LANGUAGES;
  }
  const [stored, userChoseLanguage] = await Promise.all([loadStoredLanguage(), loadExplicitChoice()]);
  const lng = resolveLanguage(stored, userChoseLanguage, getSelectableLanguages());
  await i18n.changeLanguage(lng);
}

initPromise = initI18n();
export const waitForI18n = () => initPromise ?? initI18n();

export default i18n;
