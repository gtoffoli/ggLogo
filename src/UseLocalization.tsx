// UseLocalization.tsx
// 251019 - 1st version with Gemini
// 251104 - resolveCommand returns command key in place of command definition
// 260115 - converted resolveCommand and resolveKeyword in external functions

import React, { useState, useMemo } from 'react';
import { CORE_DEFINITIONS, CommandDef, ParamDef } from './CoreDefinitions';
import { LANGUAGE_MAPS, LanguageMap, CoreDefinitionKeys } from './LocalizationMaps';

export type LanguageCode = keyof typeof LANGUAGE_MAPS;

// Definisce l'interfaccia dell'interprete nel suo stato attuale
type InterpreterContext = {
  activeLang: LanguageCode;
  // Mappa di traduzione attiva (es. IT_MAP)
  activeMap: LanguageMap; 
  // Funzione per commutare la lingua
  setLanguage: (lang: LanguageCode) => void;
};

export const useLocalization = (initialLang: LanguageCode = 'it'): InterpreterContext => {
  const [activeLang, setActiveLang] = useState<LanguageCode>(initialLang);
  
  // 1. Mappa Attiva: si aggiorna quando cambia activeLang
  const activeMap = useMemo(() => {
    return LANGUAGE_MAPS[activeLang];
  }, [activeLang]);
  // 2. Funzione per la commutazione dinamica
  const setLanguage = (lang: LanguageCode) => {
    if (LANGUAGE_MAPS[lang]) {
      setActiveLang(lang);
      console.log(`Lingua commutata a: ${lang}`);
    } else {
      console.error(`Lingua non supportata: ${lang}`);
    }
  }
  return {
    activeLang,
    activeMap,
    setLanguage,
  };
}

import { shared_langCode } from './LogoShell';

export function keywordResolver(keyword: string): string {
  // Cerca la keyword all'interno della mappa linguistica attiva
  const activeMap = LANGUAGE_MAPS[shared_langCode];
  const coreKey: string | undefined = activeMap[keyword.toUpperCase()];
  console.log('keywordResolver', keyword, coreKey);
  // Se non trovato, potrebbe essere una Keyword non tradotta o non valida
  return (coreKey) ? coreKey : keyword;
}

export function commandResolver(commandName: string): CoreDefinitionKeys {
  // Cerca il nome del comando all'interno della mappa linguistica attiva
  const activeMap = LANGUAGE_MAPS[shared_langCode];
  const coreKey: CoreDefinitionKeys | undefined = activeMap[commandName.toUpperCase()];
  // Riporta il nome del comando risolto solo se è una keyword in CORE_DEFINITIONS
  if (coreKey && CORE_DEFINITIONS[coreKey])
      return coreKey;
  // Se non trovato, potrebbe essere un comando non tradotto o non valido
  return undefined;
}
