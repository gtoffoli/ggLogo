// CoreDefinitions.tsx
// 251019 - 1st version with Gemini
// 251115 - added FunClass; added ref field to CommandDef


import { _NOP, _ERROR, _STOP, _OUTPUT, _REPEAT, _IF, _IFELSE, _TEST, _IFTRUE, _IFFALSE } from './LogoControl';
import { _WORD, _SENTENCE, _LIST, _FPUT, _LPUT, _FIRST, _LAST, _BUTFIRST, _BUTLAST, _COUNT, _ITEM, _WORDP, _LISTP } from './Structures';
import { _DEFINE, _TO, _END, _TEXT, _MAKE, _THING, _LOCAL } from './LogoDefine';
import { _NOT, _EQUALP, _NOTEQUALP } from './Logic';
import { _NUMBERP, _SIGN, _MINUS, _SUM, _DIFFERENCE, _PRODUCT, _QUOTIENT, _LESSP, _LESSEQUALP, _GREATERP, _GREATEREQUALP } from './Math';
import { _HOME, _CS, _FD, _BK, _RT, _LT, _XCOR, _YCOR, _POS } from './InterpreterCore';
import { _PENUP, _PENDOWN, _PENDOWNP, _PENCOLOR, _SETPENCOLOR, _PENMODE, _SHOWTURTLE, _HIDETURTLE, _SHOWNP } from './InterpreterCore';
import { _PRINT, _TYPE, _SHOW, _WRITECHAR, _READWORD, _READLIST, _READCHAR } from './Communication';

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
  '<=': { precedence: 1},
  '>=': { precedence: 1},
  '<>': { precedence: 6},
	'+': { precedence: 2},
	'-': { precedence: 2},
	'*': { precedence: 3},
	'/': { precedence: 3},
	'%': { precedence: 4},
	'^': { precedence: 5},
	'=': { precedence: 6},
	'<': { precedence: 6},
	'>': { precedence: 6},
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
  TOPLEVEL = 3, // IS_PR_TOP: can be executed only at top level
}

// codifica di classi di primitiva
export enum FunClass {
	TURT = 1,	// IS_PR_TARTA: turtle function
	EDIT = 2,	// IS_PR_FOGLIO: edit function
	PROC = 3,	// IS_PR_PROC: can be executed only inside a procedure
  TXIN = 4, // IS_PR_SCRIVI: writes on screen or ..
	TXOU = 5,	// IS_PR_SCRIVI: reads from keyboard or ..
	EXEC = 6,	// IS_PR_ESEGUI: execution control
	DEF = 7,	// IS_PR_DEF: Variable or procedure definition
	OPER = 8, // infix operator
}

// codifica di bit in descrittore di argomento a SFUN (from IperLogo)
export enum Arg {
  LISTA = 1, // list
  PAROLA = 2, // word
  VEROFALSO = 4, // boolean
  NUMERO = 8, // number
  LISTAPAR = 16, // list of words
  LISTANUM = 32, // list of numbers
  STRINGA = 64, // string of chars
  ARRAY  = 128 , // array
  NOMEARC = 256, // file name
}

// alias e aggregazioni di bit in descrittore di argomento a SFUN (from IperLogo)
const A_B = Arg.VEROFALSO;
const A_L = Arg.LISTA;
const A_N = Arg.NUMERO;
const A_S = Arg.STRINGA;
const A_S_L = Arg.STRINGA + Arg.LISTA;
const A_S_L_A = Arg.STRINGA + Arg.LISTA + Arg.ARRAY;
const A_LW = Arg.LISTAPAR;
const A_LW_L = Arg.LISTAPAR + Arg.LISTA;
const A_LW_S = Arg.LISTAPAR + Arg.STRINGA;
const A_LW_S_L = Arg.LISTAPAR + Arg.STRINGA + Arg.LISTA;
const A_LN = Arg.LISTANUM;
const A_LN_L = Arg.LISTANUM + Arg.LISTA;
const A_LN_N_L = Arg.LISTANUM + Arg.NUMERO + Arg.LISTA;
const A_LN_LW_L = Arg.LISTANUM + Arg.LISTAPAR + Arg.LISTA;
const A_W = Arg.PAROLA;
const A_W_L = Arg.PAROLA + Arg.LISTA;
const A_W_S = Arg.PAROLA + Arg.STRINGA;
const A_W_S_L = Arg.PAROLA + Arg.STRINGA + Arg.LISTA;
const A_W_LW_S_L = Arg.PAROLA + Arg.LISTAPAR + Arg.STRINGA + Arg.LISTA;
const A_F_S = Arg.NOMEARC + Arg.STRINGA;
const A_F_S_L = Arg.NOMEARC + Arg.STRINGA + Arg.LISTA;
const A_F_LW_S_L = Arg.NOMEARC + Arg.LISTAPAR + Arg.STRINGA + Arg.LISTA;

export const turtleStrokes = ['CS', 'FD', 'BK',];

// Mappa che contiene tutte le definizioni (la LOGICA del tuo interprete)
export const CORE_DEFINITIONS = {
  // --- Comandi LOGO ---
  HOME: {
    classes: [FunClass.TURT],
    ref: _HOME,
  } as CommandDef,
  CS: {
    classes: [FunClass.TURT],
    ref: _CS,
  } as CommandDef,
  FD: {
    classes: [FunClass.TURT],
    args: [{ name: "distanza", type: A_N }],
    ref: _FD,
  } as CommandDef,
  BK: {
    classes: [FunClass.TURT],
    args: [{ name: "distanza", type: A_N }],
    ref: _BK,
  } as CommandDef,
  RT: {
    classes: [FunClass.TURT],
    args: [{ name: "angolo", type: A_N }],
    ref: _RT,
  } as CommandDef,
  LT: {
    classes: [FunClass.TURT],
    args: [{ name: "angolo", type: A_N }],
    ref: _LT,
  } as CommandDef,
  PENCOLOR: {
    classes: [FunClass.TURT],
    signature: [FunSignature.FUNCTION],
    ref: _PENCOLOR,
  } as CommandDef,
  SETPENCOLOR: {
    classes: [FunClass.TURT],
    args: [{ name: "colore", type: A_W_S }],
    ref: _SETPENCOLOR,
  } as CommandDef,
  PENUP: {
    classes: [FunClass.TURT],
    ref: _PENUP,
  } as CommandDef,
  PENDOWN: {
    classes: [FunClass.TURT],
    ref: _PENDOWN,
  } as CommandDef,
  PENDOWNP: {
    classes: [FunClass.TURT],
    signature: [FunSignature.FUNCTION],
    ref: _PENDOWNP,
  } as CommandDef,
  PENMODE: {
    classes: [FunClass.TURT],
    signature: [FunSignature.FUNCTION],
    ref: _PENMODE,
  } as CommandDef,
  POS: {
    classes: [FunClass.TURT],
    signature: [FunSignature.FUNCTION],
    ref: _POS,
  } as CommandDef,
  XCOR: {
    classes: [FunClass.TURT],
    signature: [FunSignature.FUNCTION],
    ref: _XCOR,
  } as CommandDef,
  YCOR: {
    classes: [FunClass.TURT],
    signature: [FunSignature.FUNCTION],
    ref: _YCOR,
  } as CommandDef,
  SHOWTURTLE: {
    classes: [FunClass.TURT],
    ref: _SHOWTURTLE,
  } as CommandDef,
  HIDETURTLE: {
    classes: [FunClass.TURT],
    ref: _HIDETURTLE,
  } as CommandDef,
  SHOWNP: {
    classes: [FunClass.TURT],
    signature: [FunSignature.FUNCTION],
    ref: _SHOWNP,
  } as CommandDef,
  WORD: {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    args: [{ name: "arg1", type: A_S_L }, { name: "arg2", type: null}],
    ref: _WORD,
  } as CommandDef,
  LIST: {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null}],
    ref: _LIST,
  } as CommandDef,
  SENTENCE: {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null}],
    ref: _SENTENCE,
  } as CommandDef,
  COUNT: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "sequence", type: A_S_L }],
    ref: _COUNT,
  } as CommandDef,
  FPUT: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: A_S_L}],
    ref: _FPUT,
  } as CommandDef,
  LPUT: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: A_S_L}],
    ref: _LPUT,
  } as CommandDef,
  FIRST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: A_S_L }],
    ref: _FIRST,
  } as CommandDef,
  LAST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: A_S_L }],
    ref: _LAST,
  } as CommandDef,
  BUTFIRST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: A_S_L }],
    ref: _BUTFIRST,
  } as CommandDef,
  BUTLAST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: A_S_L }],
    ref: _BUTLAST,
  } as CommandDef,
  ITEM: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "index", type:  A_N }, { name: "sequence", type: A_S_L_A}],
    ref: _ITEM,
  } as CommandDef,
  WORDP: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: null }],
    ref: _WORDP,
  } as CommandDef,
  LISTP: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: null }],
    ref: _LISTP,
  } as CommandDef,
  MAKE: {
    args: [{ name: "nome", type: A_W_S }, { name: "valore", type: null}],
    ref: _MAKE,
  } as CommandDef,
  THING: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "nome", type: A_W_S }],
    ref: _THING,
  } as CommandDef,
  DEFINE: {
    classes: [FunClass.DEF],
    args: [{ name: "nome", type: A_W_S }, { name: "valore", type: A_L}],
    ref: _DEFINE,
  } as CommandDef,
  TO: {
    classes: [FunClass.DEF],
    // description: "Inizializza la definizione di una procedura.",
    args: [{ name: "nome", type: A_W_S }],
    ref: _TO,
  } as CommandDef,
  END: {
    classes: [FunClass.DEF],
    ref: _END,
  } as CommandDef,
  TEXT: {
    classes: [FunClass.DEF],
    signature: [FunSignature.FUNCTION],
    args: [{ name: "nome", type: A_W_S }],
    ref: _TEXT,
  } as CommandDef,
  LOCAL: {
    classes: [FunSignature.ONEORMORE],
    args: [{ name: "valore", type: A_W_LW_S_L }],
    ref: _LOCAL,
  } as CommandDef,
  PRINT: {
    classes: [FunClass.TXOU, FunSignature.ONEORMORE],
    args: [{ name: "valore", type: null }],
    ref: _PRINT,
  } as CommandDef,
  TYPE: {
    classes: [FunClass.TXOU, FunSignature.ONEORMORE],
    args: [{ name: "valore", type: null }],
    ref: _TYPE,
  } as CommandDef,
  SHOW: {
    classes: [FunClass.TXOU, FunSignature.ONEORMORE],
    args: [{ name: "valore", type: null }],
    ref: _SHOW,
  } as CommandDef,
  WRITECHAR: {
    classes: [FunClass.TXOU],
    args: [{ name: "valore", type: A_S }],
    ref: _WRITECHAR,
  } as CommandDef,
  READCHAR: {
    classes: [FunClass.TXIN, FunSignature.FUNCTION],
    ref: _READCHAR,
  } as CommandDef,
  READWORD: {
    classes: [FunClass.TXIN, FunSignature.FUNCTION],
    ref: _READWORD,
  } as CommandDef,
  READLIST: {
    classes: [FunClass.TXIN, FunSignature.FUNCTION],
    ref: _READLIST,
  } as CommandDef,

  NUMBERP: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: null }],
    ref: _NUMBERP,
  } as CommandDef,
  'SIGN': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _SUM,
  } as CommandDef,
  'MINUS': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _MINUS,
  } as CommandDef,
  'SUM': {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    args: [{ name: "addendo_1", type: A_N }, { name: "addendo_2", type: A_N }],
    ref: _SUM,
  } as CommandDef,
  '+': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "addendo_1", type: A_N }, { name: "addendo_2", type: A_N }],
    ref: _SUM,
  } as CommandDef,
  'DIFFERENCE': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "minuendo", type: A_N }, { name: "sottraendo", type: A_N }],
    ref: _DIFFERENCE,
  } as CommandDef,
  '-': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "minuendo", type: A_N }, { name: "sottraendo", type: A_N }],
    ref: _DIFFERENCE,
  } as CommandDef,
  'PRODUCT': {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    args: [{ name: "fattore_1", type: A_N }, { name: "fattore_2", type: A_N }],
    ref: _PRODUCT,
  } as CommandDef,
  '*': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "fattore_1", type: A_N }, { name: "fattore_2", type: A_N }],
    ref: _PRODUCT,
  } as CommandDef,
  'QUOTIENT': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "dividendo", type: A_N }, { name: "divisore", type: A_N }],
    ref: _QUOTIENT,
  } as CommandDef,
  '/': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "dividendo", type: A_N }, { name: "divisore", type: A_N }],
    ref: _QUOTIENT,
  } as CommandDef,
  'NOT': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_B }],
    ref: _NOT,
  } as CommandDef,
  'EQUALP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _EQUALP,
  } as CommandDef,
  '=': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _EQUALP,
  } as CommandDef,
  'NOTEQUALP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _NOTEQUALP,
  } as CommandDef,
  '<>': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _NOTEQUALP,
  } as CommandDef,
  'LESSP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _LESSP,
  } as CommandDef,
  '<': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _LESSP,
  } as CommandDef,
  'LESSEQUALP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _LESSEQUALP,
  } as CommandDef,
  '<=': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _LESSEQUALP,
  } as CommandDef,
  'GREATERP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null}, { name: "arg2", type: null }],
    ref: _GREATERP,
  } as CommandDef,
  '>': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _GREATERP,
  } as CommandDef,
  'GREATEREQUALP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
    ref: _GREATEREQUALP,
  } as CommandDef,
  '>=': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: null }],
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
    classes: [FunClass.EXEC],
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
