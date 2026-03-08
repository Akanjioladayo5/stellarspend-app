"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import commonEn from "@/locales/en/common.json";
import commonEs from "@/locales/es/common.json";

// Initialize i18next
i18next.use(initReactI18next).init({
  resources: {
    en: { translation: commonEn },
    es: { translation: commonEs },
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

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  initialLanguage = "en",
}) => {
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("stellarspend_language") || initialLanguage;
    }
    return initialLanguage;
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await i18next.changeLanguage(language);
      setIsReady(true);
    };

    init();
  }, [language]);

  const changeLanguage = async (lng: string) => {
    await i18next.changeLanguage(lng);
    setLanguage(lng);

    if (typeof window !== "undefined") {
      localStorage.setItem("stellarspend_language", lng);
    }
  };

  const t = (key: string): string => {
    let value: string = i18next.t(key);

    if (value === key && language !== "en") {
      const previousLng = i18next.language;
      i18next.changeLanguage("en");
      value = i18next.t(key);
      i18next.changeLanguage(previousLng);
    }

    return value || key;
  };

  if (!isReady) return null;

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export { i18next };
export default i18next;
