// CoreDefinitions.tsx
// 251019 - 1st version with Gemini
// 251115 - added FunClass; added ref field to CommandDef


import { _NOP, _ERROR, _STOP, _OUTPUT, _REPEAT, _IF, _IFELSE, _TEST, _IFTRUE, _IFFALSE } from './LogoControl';
import { _WORD, _SENTENCE, _LIST, _FPUT, _LPUT, _FIRST, _LAST, _BUTFIRST, _BUTLAST, _COUNT, _ITEM, _WORDP, _LISTP } from './Structures';
import { _DEFINE, _TO, _END, _TEXT, _MAKE, _THING, _LOCAL } from './LogoDefine';
import { _NOT, _EQUALP, _NOTEQUALP } from './Logic';
import { _SIGN, _MINUS, _SUM, _DIFFERENCE, _PRODUCT, _QUOTIENT, _LESSP, _LESSEQUALP, _GREATERP, _GREATEREQUALP } from './Math';
import { _HOME, _CS, _FD, _BK, _RT, _LT, _PENUP, _PENDOWN, _PENCOLOR, _SETPENCOLOR } from './InterpreterCore';
import { _PRINT, _TYPE, _SHOW, _WRITECHAR } from './Communication';

export const SEPARATORS = {
	// "\t\r\":()+-*/^<=> "
	//  0 0 0 00000223341110}
	'\r': { precedence: 0},
	'\b': { precedence: 0},
	'\"': { precedence: 0},
	':': { precedence: 0},
	'(': { precedence: 0},
	')': { precedence: 0},
	'<': { precedence: 1},
	'=': { precedence: 1},
	'>': { precedence: 1},
	'+': { precedence: 2},
	'-': { precedence: 2},
	'*': { precedence: 3},
	'/': { precedence: 3},
	'%': { precedence: 4},
	'^': { precedence: 5},
	'=': { precedence: 6},
	'<': { precedence: 6},
	'>': { precedence: 6},
	'<=': { precedence: 6},
	'>=': { precedence: 6},
	'<>': { precedence: 6},
}

export function isSeparator(s: string): boolean {
	return Object.keys(SEPARATORS).includes(s);
}

export enum ModParola {
	VERB = 1,		// parola non preceduta da modificatore
	LITERAL = 2,	// parola preceduta da QUOTE
	VARIABLE = 3,	// parola preceduta da COLON
}
export enum CellType {
	LIST = 0,
	QUOTE = 1,
	OPERATOR = 2,	// operatore
	NUMBER = 3, 	// numero
	WORD = 4,		// parola Logo
	BOOLEAN = 5,	// valore logico
	VAR = 6, 		// variabile Logo
	SFUN = 7,		// funzione primitiva
	UFUN = 8,		// funzione di utente (procedura)
}

// typed token in the Parser output
export type Cell = {
  type: CellType;
  val: any;
} // | null;

export enum Delimiter {
	DEL_PARSINISTRA = '(',
	DEL_PARDESTRA = ')',
}

// codifica dei tipi di contesto (id_contesto)
export enum contextType {
	CT_TOP = 0,			// contesto iniziale (top_level)
	CT_PAUSA = 1,		// contesto attivato da PAUSA
	CT_RECUPERA = 2,	// contesto attivato da RECUPERA
	CT_PROCEDURE = 3, // procedura di utente
	CT_EVENT = 4,
}

// see contesti in Contesti.h of il32
export type Context = {
	id_contesto: number; // contesto "top_level"
	dev_recupera: number;
	liv_procedura: number; // nest globale delle procedure utente
	in_liv_proc: number; // val. in. liv_procedura in PAUSA/RECUPERA
	liv_funzione: number; // nest globale delle funzioni
	in_liv_funzione: number; // val. in. liv_funzione in PAUSA/RECUPERA
	funzione: SystemFunction | UserFunction | null; // command key + command definition
	liv_esecuzione: number; // nest dei blocchi in proc. corrente
	val_verifica: boolean | null; // valore ultima condizione verificata
	conto_esegui: number;
	RepCount: number;
	RepTotal: number;
	n_arg_attesi: number; // numero di parametri atteso dalla funzione corrente
	n_arg_trovati: number; // numero di oggetti sullo stack per la fun corrente
	parentesi: number; // = liv_funzione se sfun corr. e' preceduta da "("
	conto_parentesi: number;
	block: Cell[][];
	i_line: number;
	i_token: number;
	ini_token:  number | null;
  localVariables: Record<string, any>;
};

// Tipi per i comandi
export type SystemFunction = {
	type: CellType;
	coreKey: CoreDefinitionKeys;
	definition: CommandDef;
};

export type UserFunction = {
	type: CellType;
	name: string;
	definition: ProcedureDef;
};

// Tipi per i comandi
export type CommandDef = {
  classes: number[];
  signature?: number;
  description?: string;
  // syntax?: string;
  args: { name: string; type: 'number' | 'string' | 'boolean' }[];
  semantics?: (args: any[]) => any; // La funzione che esegue il comando
  ref: (args: any) => any; // La funzione che esegue il comando
};

export type ProcedureDef = {
	parameters: string[];
	body: any[][];
}

export enum keywordType {
	BOOLEAN = 0,
	PARAMETER = 1,
}
// Tipi per le Costanti
export type Constant = {
  type: keywordType;
  value: any;
};

// Tipi per i parametri di configurazione
export type ParamDef = {
  type: 'number' | 'string' | 'color';
  defaultValue: any;
  validator: (value: any) => boolean;
  min?: number;
  max?: number;
};

/*
#define N_NOMINALE	(descr_sf.descr & 0x0F)
#define N_MINIMO	((descr_sf.descr >> 4) & 0x0F)
#define N_MASSIMO	((descr_sf.descr >> 8) & 0x0F)	// 980709
// #define N_ILLIMITATO	(descr_sf.classi & 0x40)
// #define IS_PR_FUNZIONE	(descr_sf.classi & 0x80)
#define N_ILLIMITATO	(descr_sf.descr & 0x1000)
#define IS_PR_FUNZIONE	(descr_sf.descr & 0x2000)
*/
export enum FunSignature {
	FUNCTION = 1,	// primitive that outputs a result
	ONEORMORE = 2,	// primitive with one or more arguments (max number undefined)
}

// codifica di classi di primitiva
export enum FunClass {
	TURT = 1,	// IS_PR_TARTA: turtle function
	EDIT = 2,	// IS_PR_FOGLIO: edit function
	TOPL = 3,	// IS_PR_TOP: can be executed only at top level
	PROC = 4,	// IS_PR_PROC: can be executed only inside a procedure
	TXOU = 5,	// IS_PR_SCRIVI: writes on screen
	EXEC = 6,	// IS_PR_ESEGUI: execution control
	DEF = 7,	// IS_PR_DEF: Variable or procedure definition
	OPER = 8, // infix operator
	PGUI = 9,	// IS_PR_GUI: graphic UI building
	PMCI = 10,	// IS_PR_MM: not used?
	BOUNDLESS = 11	// no bound for # of arguments inside parentheses
}

export const turtleStrokes = ['CS', 'FD', 'BK',];

// Mappa che contiene tutte le definizioni (la LOGICA del tuo interprete)
export const CORE_DEFINITIONS = {
  // --- Comandi LOGO ---
  HOME: {
    classes: [FunClass.TURT],
    // description: "Resetta posizione e direzione della tartaruga.",
    ref: _HOME,
  } as CommandDef,
  CS: {
    classes: [FunClass.TURT],
    // description: "Pulisce lo schermo.",
    ref: _CS,
  } as CommandDef,
  FD: {
    classes: [FunClass.TURT],
    // description: "Muove la tartaruga in avanti.",
    args: [{ name: "distanza", type: 'number' }],
    ref: _FD,
  } as CommandDef,
  BK: {
    classes: [FunClass.TURT],
    // description: "Muove la tartaruga all'indietro (back).",
    args: [{ name: "distanza", type: 'number' }],
    ref: _BK,
  } as CommandDef,
  RT: {
    classes: [FunClass.TURT],
    // description: "Ruota la tartaruga a destra.",
    args: [{ name: "angolo", type: 'number' }],
    ref: _RT,
  } as CommandDef,
  LT: {
    classes: [FunClass.TURT],
    // description: "Ruota la tartaruga a sinistra.",
    args: [{ name: "angolo", type: 'number' }],
    ref: _LT,
  } as CommandDef,
  PENCOLOR: {
    classes: [FunClass.TURT],
    signature: [FunSignature.FUNCTION],
    // description: "Riporta il colore della penna.",
    ref: _PENCOLOR,
  } as CommandDef,
  SETPENCOLOR: {
    classes: [FunClass.TURT],
    // description: "Assegna il colore della penna.",
    args: [{ name: "colore", type: 'string' }],
    ref: _SETPENCOLOR,
  } as CommandDef,
  PENUP: {
    classes: [FunClass.TURT],
    // description: "Solleva la penna.",
    ref: _PENUP,
  } as CommandDef,
  PENDOWN: {
    classes: [FunClass.TURT],
    // description: "Abbassa la penna.",
    ref: _PENDOWN,
  } as CommandDef,
  WORD: {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    args: [{ name: "arg1", type: 'string' }, { name: "arg2", type: 'any'}],
    ref: _WORD,
  } as CommandDef,
  LIST: {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    args: [{ name: "arg1", type: 'string' }, { name: "arg2", type: 'any'}],
    ref: _LIST,
  } as CommandDef,
  SENTENCE: {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    args: [{ name: "arg1", type: 'string' }, { name: "arg2", type: 'any'}],
    ref: _SENTENCE,
  } as CommandDef,
  COUNT: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "sequence", type: 'any' }],
    ref: _COUNT,
  } as CommandDef,
  FPUT: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'any' }, { name: "arg2", type: 'any'}],
    ref: _FPUT,
  } as CommandDef,
  LPUT: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'any' }, { name: "arg2", type: 'any'}],
    ref: _LPUT,
  } as CommandDef,
  FIRST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: 'any' }],
    ref: _FIRST,
  } as CommandDef,
  LAST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: 'any' }],
    ref: _LAST,
  } as CommandDef,
  BUTFIRST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: 'any' }],
    ref: _BUTFIRST,
  } as CommandDef,
  BUTLAST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: 'any' }],
    ref: _BUTLAST,
  } as CommandDef,
  ITEM: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "index", type: 'any' }, { name: "sequence", type: 'any'}],
    ref: _ITEM,
  } as CommandDef,
  WORDP: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: 'any' }],
    ref: _WORDP,
  } as CommandDef,
  LISTP: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: 'any' }],
    ref: _LISTP,
  } as CommandDef,
  MAKE: {
    // classes: [FunClass.DEF],
    // description: "Assegna valore a nome.",
    args: [{ name: "nome", type: 'string' }, { name: "valore", type: 'any'}],
    ref: _MAKE,
  } as CommandDef,
  THING: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "nome", type: 'string' }],
    ref: _THING,
  } as CommandDef,
  DEFINE: {
    classes: [FunClass.DEF],
    // description: "Assegna valore a nome di procedura.",
    args: [{ name: "nome", type: 'string' }, { name: "valore", type: 'any'}],
    ref: _DEFINE,
  } as CommandDef,
  TO: {
    classes: [FunClass.DEF],
    // description: "Inizializza la definizione di una procedura.",
    args: [{ name: "nome", type: 'string' }],
    ref: _TO,
  } as CommandDef,
  END: {
    classes: [FunClass.DEF],
    // description: "Termina la definizione di una procedura.",
    ref: _END,
  } as CommandDef,
  TEXT: {
    classes: [FunClass.DEF],
    signature: [FunSignature.FUNCTION],
    // description: "Riporta la definizione di una procedura.",
    args: [{ name: "nome", type: 'string' }],
    ref: _TEXT,
  } as CommandDef,
  LOCAL: {
    classes: [FunSignature.ONEORMORE],
    args: [{ name: "valore", type: 'string' }],
    ref: _LOCAL,
  } as CommandDef,
  PRINT: {
    classes: [FunClass.TXOU, FunSignature.ONEORMORE],
    args: [{ name: "valore", type: 'any' }],
    ref: _PRINT,
  } as CommandDef,
  TYPE: {
    classes: [FunClass.TXOU, FunSignature.ONEORMORE],
    args: [{ name: "valore", type: 'any' }],
    ref: _TYPE,
  } as CommandDef,
  SHOW: {
    classes: [FunClass.TXOU, FunSignature.ONEORMORE],
    args: [{ name: "valore", type: 'any' }],
    ref: _SHOW,
  } as CommandDef,
  WRITECHAR: {
    classes: [FunClass.TXOU],
    args: [{ name: "valore", type: 'string' }],
    ref: _WRITECHAR,
  } as CommandDef,

  'SIGN': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: 'number' }],
    ref: _SUM,
  } as CommandDef,
  'MINUS': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: 'number' }],
    ref: _MINUS,
  } as CommandDef,
  'SUM': {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    // description: "Riporta la somma di 2 o più numeri.",
    args: [{ name: "addendo_1", type: 'number' }, { name: "addendo_2", type: 'number' }],
    ref: _SUM,
  } as CommandDef,
  '+': {
    signature: [FunSignature.FUNCTION],
    // description: "Riporta la somma di 2 numeri.",
    args: [{ name: "addendo_1", type: 'number' }, { name: "addendo_2", type: 'number' }],
    ref: _SUM,
  } as CommandDef,
  'DIFFERENCE': {
    signature: [FunSignature.FUNCTION],
    // description: "Riporta la differenza di 2 numeri.",
    args: [{ name: "minuendo", type: 'number' }, { name: "sottraendo", type: 'number' }],
    ref: _DIFFERENCE,
  } as CommandDef,
  '-': {
    signature: [FunSignature.FUNCTION],
    // description: "Riporta la differenza di 2 numeri.",
    args: [{ name: "minuendo", type: 'number' }, { name: "sottraendo", type: 'number' }],
    ref: _DIFFERENCE,
  } as CommandDef,
  'PRODUCT': {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    // description: "Riporta la somma di 2 o più numeri.",
    args: [{ name: "fattore_1", type: 'number' }, { name: "fattore_2", type: 'number' }],
    ref: _PRODUCT,
  } as CommandDef,
  '*': {
    signature: [FunSignature.FUNCTION],
    // description: "Riporta la somma di 2 numeri.",
    args: [{ name: "fattore_1", type: 'number' }, { name: "fattore_2", type: 'number' }],
    ref: _PRODUCT,
  } as CommandDef,
  'QUOTIENT': {
    signature: [FunSignature.FUNCTION],
    // description: "Riporta il rapporto di 2 più numeri.",
    args: [{ name: "dividendo", type: 'number' }, { name: "divisore", type: 'number' }],
    ref: _QUOTIENT,
  } as CommandDef,
  '/': {
    signature: [FunSignature.FUNCTION],
    // description: "Riporta il rapporto di 2 più numeri.",
    args: [{ name: "dividendo", type: 'number' }, { name: "divisore", type: 'number' }],
    ref: _QUOTIENT,
  } as CommandDef,

  'NOT': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: 'boolean' }],
    ref: _NOT,
  } as CommandDef,
  'EQUALP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _EQUALP,
  } as CommandDef,
  '=': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _EQUALP,
  } as CommandDef,
  'NOTEQUALP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _NOTEQUALP,
  } as CommandDef,
  '<>': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _NOTEQUALP,
  } as CommandDef,
  'LESSP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _LESSP,
  } as CommandDef,
  '<': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _LESSP,
  } as CommandDef,
  'LESSEQUALP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _LESSEQUALP,
  } as CommandDef,
  '<=': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _LESSEQUALP,
  } as CommandDef,
  'GREATERP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _GREATERP,
  } as CommandDef,
  '>': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _GREATERP,
  } as CommandDef,
  'GREATEREQUALP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _GREATEREQUALP,
  } as CommandDef,
  '>=': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: 'number' }, { name: "arg2", type: 'number' }],
    ref: _GREATEREQUALP,
  } as CommandDef,

  ERROR: {
    signature: [FunSignature.FUNCTION],
    args: [],
    ref: _ERROR,
  } as CommandDef,
  NOP: {
    args: [],
    ref: _NOP,
  } as CommandDef,
  STOP: {
    classes: [FunClass.EXEC],
    args: [],
    ref: _STOP,
  } as CommandDef,
  OUTPUT: {
    classes: [FunClass.EXEC],
    args: [{ name: "result", type: 'any' }],
    ref: _OUTPUT,
  } as CommandDef,
  REPEAT: {
    classes: [FunClass.EXEC],
    args: [{ name: "times", type: 'number' }, { name: "block", type: 'list'}],
    ref: _REPEAT,
  } as CommandDef,
  IF: {
    classes: [FunClass.EXEC],
    args: [{ name: "condition", type: 'booleean' }, { name: "block", type: 'list'}],
    ref: _IF,
  } as CommandDef,
  IFELSE: {
    classes: [FunClass.EXEC],
    args: [{ name: "condition", type: 'booleean' }, { name: "block1", type: 'list'}, { name: "block2", type: 'list'}],
    ref: _IFELSE,
  } as CommandDef,
  TEST: {
    args: [{ name: "arg", type: 'boolean' }],
    ref: _TEST,
  } as CommandDef,
  IFTRUE: {
    classes: [FunClass.EXEC],
    args: [{ name: "block", type: 'list'}],
    ref: _IFTRUE,
  } as CommandDef,
  IFFALSE: {
    classes: [FunClass.EXEC],
    args: [{ name: "block", type: 'list'}],
    ref: _IFFALSE,
  } as CommandDef,

  'FALSE': {
	type: keywordType.BOOLEAN,
    value: false,
  } as Constant,
  'TRUE': {
	type: keywordType.BOOLEAN,
    value: true,
  } as Constant,
/*
  // --- Parametri di Configurazione ---
  PENCOLOR: {
    type: 'color',
    defaultValue: '#000000',
    validator: (v) => typeof v === 'string' && v.startsWith('#'),
  } as ParamDef,
  TURTLESIZE: {
    type: 'number',
    defaultValue: 10,
    validator: (v) => v > 0,
    min: 5,
    max: 50,
  } as ParamDef,
*/
};

// Tipo di supporto per le definizioni (per inferenza)
export type CoreDefinitionKeys = keyof typeof CORE_DEFINITIONS;
