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
  "A": "FD",
  "AS": "MAKE",
  "ASCOLPENNA": "SETPENCOLOR",
  "ASSEGNA": "MAKE",
  "AVANTI": "FD",
  "COLORE": "PENCOLOR",
  "COLOREPENNA": "PENCOLOR",
  "COLPENNA": "PENCOLOR",
  "COSA": "THING",
  "D": "RT",
  "DACHELEGGI": "READER",
  "DESTRA": "RT",
  "DEFINISCI": "DEFINE",
  "DIMENSIONETARTARUGA": "TURTLESIZE",
  "FINE": "END",
  "GIU": "PENDOWN",
  "I": "BK",
  "INDIETRO": "BK",
  "LISTA": "LIST",
  "PAROLA": "WORD",
  "PER": "TO",
  "PRI": "FIRST",
  "PRIMO": "FIRST",
  "PS": "CS",
  "PULISCISCHERMO": "CS",
  "RIPETI": "REPEAT",
  "STAMPA": "PRINT",
  "ULT": "LAST",
  "ULTIMO": "LAST",
  "SU": "PENUP",
  "SINISTRA": "LT",
  "S": "LT",
  "TANA": "HOME",
  "TESTO": "TEXT",
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
  "MAKE": "MAKE",
  "THING": "THING",
  "DEFINE": "DEFINE",
  "TO": "TO",
  "END": "END",
  "TEXT": "TEXT",
  "REPEAT": "REPEAT",
  "PRINT": "PRINT",
  "PENCOLOR": "PENCOLOR",
  "SETPENCOLOR": "SETPENCOLOR",
  "READER": "READER",
  "TURTLESIZE": "TURTLESIZE",
  "FIRST": "FIRST",
  "LAST": "LAST",
  "LIST": "LIST",
  "WORD": "WORD",
};

export const LANGUAGE_MAPS: Record<string, LanguageMap> = {
  'it': IT_MAP,
  'en': EN_MAP,
  // ... altre lingue ...
};
