// LocalizationMaps.tsx
// 251019 - 1st version with Gemini

import { CoreDefinitionKeys } from './CoreDefinitions';

// Tipo che definisce la Mappa di una lingua:
// Chiave: Nome visualizzato (es. "AVANTI" o "FORWARD")
// Valore: ID interno (es. "FD")
export type LanguageMap = Record<string, CoreDefinitionKeys>;

// Mappa per l'Italiano
export const IT_MAP: LanguageMap = {
  // Puoi includere sia i nomi abbreviati che quelli completi se vuoi
  "AVANTI": "FD",
  "A": "FD",
  "STAMPA": "PRINT",
  "COLOREPENNA": "PENCOLOR",
  "COLORE": "PENCOLOR",
  "COLPENNA": "PENCOLOR",
  "DIMENSIONETARTARUGA": "TURTLESIZE",
};

// Mappa per l'Inglese
export const EN_MAP: LanguageMap = {
  "FORWARD": "FD",
  "FD": "FD",
  "PRINT": "PRINT",
  "PENCOLOR": "PENCOLOR",
  "TURTLESIZE": "TURTLESIZE",
};

export const LANGUAGE_MAPS: Record<string, LanguageMap> = {
  'it': IT_MAP,
  'en': EN_MAP,
  // ... altre lingue ...
};
