// UseLocalization.tsx
// 251019 - 1st version with Gemini

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
  // Funzione per risolvere un comando
  resolveCommand: (commandName: string) => CommandDef | ParamDef | undefined;
};

export const useLocalization = (initialLang: LanguageCode = 'it'): InterpreterContext => {
  const [activeLang, setActiveLang] = useState<LanguageCode>(initialLang);
  
  // 1. Mappa Attiva: si aggiorna quando cambia activeLang
  const activeMap = useMemo(() => {
    return LANGUAGE_MAPS[activeLang];
  }, [activeLang]);

  // 2. Funzione di Risoluzione del Comando
  // Questa è la chiave per l'interprete dei comandi.
  const resolveCommand = (commandName: string): CommandDef | ParamDef | undefined => {
    const canonicalName = commandName.toUpperCase(); // Prepara il nome per la ricerca

    // 1. Cerca il nome utente all'interno della mappa linguistica attiva
    const coreKey: CoreDefinitionKeys | undefined = activeMap[canonicalName];

    if (coreKey && CORE_DEFINITIONS[coreKey]) {
        // 2. Se trovato, ritorna la definizione funzionale
        return CORE_DEFINITIONS[coreKey];
    }
    
    // Se non trovato, potrebbe essere un comando non tradotto o non valido
    return undefined;
  };
  
  // 3. Funzione per la commutazione dinamica
  const setLanguage = (lang: LanguageCode) => {
    if (LANGUAGE_MAPS[lang]) {
      setActiveLang(lang);
      console.log(`Lingua commutata a: ${lang}`);
    } else {
      console.error(`Lingua non supportata: ${lang}`);
    }
  };

  return {
    activeLang,
    activeMap,
    setLanguage,
    resolveCommand,
  };
};
