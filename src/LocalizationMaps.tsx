// LocalizationMaps.tsx
// 251019 - 1st version with Gemini

import { CoreDefinitionKeys } from './CoreDefinitions';

export const languageVoc = {
	'en': 'english',
	'it': 'italiano',
}

// Tipo che definisce la Mappa di una lingua:
// Chiave: Nome visualizzato (es. "AVANTI" o "FORWARD")
// Valore: ID interno (es. "FD")
export type LanguageMap = Record<string, CoreDefinitionKeys>;

// Mappa per l'Italiano
export const IT_MAP: LanguageMap = {
  // Puoi includere sia i nomi abbreviati che quelli completi se vuoi
  "PULISCISCHERMO": "CS",
  "PS": "CS",
  "TANA": "HOME",
  "SU": "PENUP",
  "GIU": "PENDOWN",
  "AVANTI": "FD",
  "A": "FD",
  "INDIETRO": "BK",
  "I": "BK",
  "DESTRA": "RT",
  "D": "RT",
  "SINISTRA": "LT",
  "S": "LT",
  "ASSEGNA": "SET",
  "AS": "SET",
  "DEFINISCI": "DEFINE",
  "PER": "TO",
  "FINE": "END",
  "TESTO": "TEXT",
  "RIPETI": "REPEAT",
  "STAMPA": "PRINT",
  "COLOREPENNA": "PENCOLOR",
  "COLORE": "PENCOLOR",
  "COLPENNA": "PENCOLOR",
  "ASCOLPENNA": "SETPENCOLOR",
  "DIMENSIONETARTARUGA": "TURTLESIZE",
};

// Mappa per l'Inglese
export const EN_MAP: LanguageMap = {
  "CLEARSCREEN": "CS",
  "CS": "CS",
  "HOME": "HOME",
  "PENUP": "PENUP",
  "PU": "PENUP",
  "PENDOWN": "PENDOWN",
  "PD": "PENDOWN",
  "FORWARD": "FD",
  "FD": "FD",
  "BACK": "BK",
  "BK": "BK",
  "RIGHT": "RT",
  "RT": "RT",
  "LEFT": "LT",
  "LT": "LT",
  "SET": "SET",
  "DEFINE": "DEFINE",
  "TO": "TO",
  "END": "END",
  "TEXT": "TEXT",
  "REPEAT": "REPEAT",
  "PRINT": "PRINT",
  "PENCOLOR": "PENCOLOR",
  "TURTLESIZE": "TURTLESIZE",
};

export const LANGUAGE_MAPS: Record<string, LanguageMap> = {
  'it': IT_MAP,
  'en': EN_MAP,
  // ... altre lingue ...
};
