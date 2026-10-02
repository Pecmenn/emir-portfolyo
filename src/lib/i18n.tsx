import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang, Text } from '../content';

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (text: Text) => string;
};

const LangContext = createContext<LangContextValue | null>(null);
const STORAGE_KEY = 'lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'tr' || saved === 'en') return saved;
  } catch {
    // Depolama kapalıysa varsayılan dile düş
  }
  return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Tercih kaydedilemezse yalnızca bu oturumda geçerli olur
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang, t: (text: Text) => text[lang] }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
