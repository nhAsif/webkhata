import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations } from '../utils/translations';
import api from '../api/client';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem('language');
      if (stored === 'bn' || stored === 'en') {
        return stored;
      }
      const systemLang = navigator.language || navigator.userLanguage;
      if (systemLang && systemLang.toLowerCase().startsWith('bn')) {
        return 'bn';
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((lang) => {
    const validLang = lang === 'bn' ? 'bn' : 'en';
    localStorage.setItem('language', validLang);
    setLanguageState(validLang);
    
    // Update backend settings
    api.put('/settings/language', { language: validLang })
      .catch((err) => {
        console.error('Failed to update system language on backend:', err);
      });
  }, []);

  useEffect(() => {
    // Fetch global system settings on mount
    api.get('/settings/language')
      .then((res) => {
        const backendLang = res.data?.language;
        if (backendLang === 'bn' || backendLang === 'en') {
          setLanguageState(backendLang);
          localStorage.setItem('language', backendLang);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch system language from backend:', err);
      });
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'language') {
        const lang = e.newValue === 'bn' ? 'bn' : 'en';
        setLanguageState(lang);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = useCallback((text) => {
    if (language === 'bn') {
      const translatedText = translations.bn[text];
      return translatedText !== undefined ? translatedText : text;
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}
