import { ar } from './translations/ar';
import { en } from './translations/en';
import type { ArTranslation } from './translations/ar';

export type Language = 'ar' | 'en';

export const translations: Record<Language, ArTranslation> = { ar, en };

export type TranslationKey = keyof ArTranslation;

export const availableLanguages: { code: Language; label: string; rtl: boolean }[] = [
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'en', label: 'English', rtl: false },
];
