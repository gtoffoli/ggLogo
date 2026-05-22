// UseLocalization.tsx
// 251019 - 1st version with Gemini
// 251104 - resolveCommand returns command key in place of command definition
// 260115 - converted resolveCommand and resolveKeyword in external functions

import React, { useState, useMemo } from 'react';
import { isSeparator, CORE_DEFINITIONS, CommandDef, ParamDef } from './CoreDefinitions';
import { LANGUAGE_MAPS, LanguageMap, CoreDefinitionKeys, PROPERTY_MAPS, copyActiveMapItem } from './LocalizationMaps';

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

// export function keywordResolver(keyword: string): string {
// normalizza una stringa in lingua usando la mappa dei nomi di primitiva
export function keywordResolver(keyword: string, letterCase = 'upper'): string {
  const activeMap = LANGUAGE_MAPS[shared_langCode];
  const coreKey: string | undefined = (letterCase === 'lower') ? activeMap[keyword.toLowerCase()] : activeMap[keyword.toUpperCase()];
  console.log('keywordResolver', keyword, coreKey);
  // Se non trovato, potrebbe essere una Keyword non tradotta o non valida
  return (coreKey) ? coreKey : undefined;
}
// riporta una lista di numeri e stringhe, normalizzando le stringhe in base ad una mappa quando possibile
export function keywordsResolver(sequence: any[], letterCase = 'lower'): any[] {
  const activeMap = PROPERTY_MAPS[shared_langCode];
  const results: any[] = sequence.reduce<any[]>((acc, item) => {
    var coreKey: string | undefined;
    if (isNaN(item)) {
      item = (letterCase === 'lower') ? item.toLowerCase() : item.toUpperCase();
      coreKey = activeMap[item];
      acc.push((coreKey) ? coreKey : item);
    }
    else
      acc.push(item);
    return acc;
  }, []);
  return results;
}

export function colorResolver(keyword: string): string {
  // Cerca la keyword all'interno della mappa linguistica attiva
  const activeMap = PROPERTY_MAPS[shared_langCode];
  const coreKey: string | undefined = activeMap[keyword.toLowerCase()];
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

export function getByValue(searchValue:string): string {
  if (isSeparator(searchValue))
    return searchValue;
  const activeMap = LANGUAGE_MAPS[shared_langCode];
  var foundKey = null;
  for (let [key, value] of Object.entries(activeMap)) {
    if (value === searchValue)
      if (!foundKey || (key.length > foundKey.length))
        foundKey = key;
  }
  return foundKey;
}

export function copyActiveMapItem(newName: string, oldName: string, deleteOld: boolean): void {
  const activeMap = LANGUAGE_MAPS[shared_langCode];
  const coreKey: CoreDefinitionKeys = activeMap[oldName.toUpperCase()];
  activeMap[newName.toUpperCase()] = coreKey;
  if (deleteOld) delete activeMap[oldName.toUpperCase()];
}
