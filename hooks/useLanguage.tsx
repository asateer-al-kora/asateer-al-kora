import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Language } from '@/constants/translations';
import { I18nManager, Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { isWeb, platformStorage } from '@/lib/platformStorage';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANG_KEY = 'asateer_lang';

function applyDirection(lang: Language) {
  const rtl = lang === 'ar';
  if (Platform.OS !== 'web') {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(rtl);
  } else if (typeof document !== 'undefined') {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');

  useEffect(() => {
    let active = true;
    void platformStorage.getItem(LANG_KEY).then((stored) => {
      const initial: Language = stored === 'ar' || stored === 'en' ? stored : 'ar';
      if (active) setLanguageState(initial);
      applyDirection(initial);
    });

    const handler = (event: Event) => {
      const lang = (event as CustomEvent<Language>).detail;
      if (lang === 'ar' || lang === 'en') {
        setLanguageState(lang);
        applyDirection(lang);
      }
    };
    if (isWeb() && typeof window !== 'undefined') {
      window.addEventListener('asateer-lang-sync', handler);
    }
    return () => {
      active = false;
      if (isWeb() && typeof window !== 'undefined') {
        window.removeEventListener('asateer-lang-sync', handler);
      }
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    void platformStorage.setItem(LANG_KEY, lang);
    applyDirection(lang);
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        void supabase.from('profiles').update({ language: lang }).eq('id', data.session.user.id);
      }
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
