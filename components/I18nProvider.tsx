"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from '@/locales/en/common.json';
import commonEs from '@/locales/es/common.json';
import commonFr from '@/locales/fr/common.json';
import commonSw from '@/locales/sw/common.json';
import commonPt from '@/locales/pt/common.json';
import commonAr from '@/locales/ar/common.json';
import { isRTL as computeIsRTL, getIntlLocale, SUPPORTED_LANGUAGES } from '@/lib/i18n-locale';

// Initialize i18next
i18next.use(initReactI18next).init({
  resources: {
    en: { translation: commonEn },
    es: { translation: commonEs },
    fr: { translation: commonFr },
    sw: { translation: commonSw },
    pt: { translation: commonPt },
    ar: { translation: commonAr },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

interface I18nContextType {
  language: string;
  changeLanguage: (lng: string) => Promise<void>;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
  isRTL: boolean;
  intlLocale: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: string;
}

function applyDocumentDirection(lng: string) {
  if (typeof document === "undefined") return;
  const rtl = computeIsRTL(lng);
  document.documentElement.dir = rtl ? "rtl" : "ltr";
  document.documentElement.lang = lng;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  initialLanguage = "en",
}) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("stellarspend_language");
      if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
        startTransition(() => setLanguage(stored));
        return;
      }
    }

    startTransition(() => setLanguage(initialLanguage));
  }, [initialLanguage]);

  useEffect(() => {
    // Set i18next language when language changes
    void i18next.changeLanguage(language);
    applyDocumentDirection(language);
  }, [language]);

  const changeLanguage = async (lng: string) => {
    await i18next.changeLanguage(lng);
    setLanguage(lng);
    applyDocumentDirection(lng);

    if (typeof window !== "undefined") {
      localStorage.setItem("stellarspend_language", lng);
    }
  };

  const t = (key: string): string => {
    let value: string = i18next.t(key);

    // Fallback to English if translation not found
    if (value === key && language !== 'en') {
      const savedLng = i18next.language;
      i18next.language = 'en';
      value = i18next.t(key);
      i18next.changeLanguage(savedLng);
    }

    return value || key;
  };

  const rtl = computeIsRTL(language);

  return (
    <I18nContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        dir: rtl ? "rtl" : "ltr",
        isRTL: rtl,
        intlLocale: getIntlLocale(language),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export { i18next };
export default i18next;