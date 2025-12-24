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
  "FRASE": "SENTENCE",
  "GIU": "PENDOWN",
  "I": "BK",
  "INDIETRO": "BK",
  "INPRI": "FPUT",
  "INULT": "LPUT",
  "LISTA": "LIST",
  "LISTA?": "LISTP",
  "NUMERO?": "NUMBERP",
  "PAROLA": "WORD",
  "PAROLA?": "WORDP",
  "PER": "TO",
  "POTENZA": "POWER",
  "PRI": "FIRST",
  "PRIMO": "FIRST",
  "PS": "CS",
  "PULISCISCHERMO": "CS",
  "QUOTO": "INTEGER_QUOTIENT",
  "RESTO": "REMAINDER",
  "RIPETI": "REPEAT",
  "STAMPA": "PRINT",
  "ULT": "LAST",
  "ULTIMO": "LAST",
  "SU": "PENUP",
  "SINISTRA": "LT",
  "S": "LT",
  "TANA": "HOME",
  "TESTO": "TEXT",

  "FALSO": "FALSE",
  "VERO": "TRUE",
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
  "FPUT": "FPUT",
  "INTEGER_QUOTIENT": "INTEGER_QUOTIENT",
  "LAST": "LAST",
  "LIST": "LIST",
  "LISTP": "LISTP",
  "LIST?": "LISTP",
  "LPUT": "LPUT",
  "NUMBERP": "NUMBERP",
  "NUMBER?": "NUMBERP",
  "POWER": "POWER",
  "REMAINDER": "REMAINDER",
  "SENTENCE": "SENTENCE",
  "WORD": "WORD",
  "WORDP": "WORDP",
  "WORD?": "WORDP",

  "FALSE": "FALSE",
  "TRUE": "TRUE",
};

export const LANGUAGE_MAPS: Record<string, LanguageMap> = {
  'it': IT_MAP,
  'en': EN_MAP,
  // ... altre lingue ...
};
