import { translations, type Language, type TranslationKey } from '@/constants/translations';

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || translations.en[key] || key;
}

export function getTranslation(lang: Language) {
  return translations[lang];
}

export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}
