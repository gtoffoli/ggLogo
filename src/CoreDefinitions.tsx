// CoreDefinitions.tsx
// 251019 - 1st version with Gemini
// 251115 - added FunClass; added ref field to CommandDef


import { _NOP, _ERROR, _TRACK, _UNTRACK, _STOP, _OUTPUT, _REPEAT, _REPCOUNT, _IF, _IFELSE, _TEST, _IFTRUE, _IFFALSE } from './LogoControl';
import { _WORD, _SENTENCE, _LIST, _FPUT, _LPUT, _FIRST, _LAST, _FIRSTS, _LASTS, _BUTFIRST, _BUTLAST, _BUTFIRSTS, _BUTLASTS, _COUNT, _ITEM, _WORDP, _LISTP } from './Structures';
import { _PRIMITIVEP, _DEFINE, _TO, _END, _PROCEDUREP, _TEXT, _MAKE, _THING, _LOCAL } from './LogoDefine';
import { _NOT, _EQUALP, _NOTEQUALP } from './Logic';
import { _ABS, _INT, _ROUND, _SIGN, _MINUS, _SUM, _DIFFERENCE, _PRODUCT, _QUOTIENT, _POWER, _EXP, _SQRT, _LOG10, _LN, _RANDOM, _RERANDOM } from './Math';
import { _NUMBERP, _LESSP, _LESSEQUALP, _GREATERP, _GREATEREQUALP } from './Math';
import { _RAD, _SIN, _COS, _TAN, _ARCTAN, _RADSIN, _RADCOS, _RADTAN, _RADARCTAN } from './Math';
import { _SCREENSIZE, _CANVASSIZE, _SETCANVASSIZE, _BOUNDS, _HOME, _CLEAR, _CS, _WINDOW, _FENCE, _WRAP, _SETSCREEN, _SCREEN, _SETSCALE, _SCALE, _SETBACKGROUNDCOLOR, _BACKGROUNDCOLOR } from './InterpreterCore';
import { _SETPOS, _SETX, _SETY, _SETXY, _TOWARDS, _FD, _BK, _RT, _LT, _XCOR, _YCOR, _POS, _SETHEADING, _HEADING } from './InterpreterCore';
import { _PENUP, _PENDOWN, _PENDOWNP, _PENCOLOR, _SETPENCOLOR, _PENSIZE, _SETPENSIZE, _PENMODE, _SHOWTURTLE, _HIDETURTLE, _SHOWNP } from './InterpreterCore';
import { _PRINT, _TYPE, _SHOW, _WRITECHAR, _READWORD, _READLIST, _READCHAR } from './Communication';
import { _TIME, _SETTIME, _WAIT, _MIDIOPEN, _MIDIMSG } from './TimeMusic';

export const SEPARATORS = {
	// "\t\r\":()+-*/^<=> "
	//  0 0 0 00000223341110}, 
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
	VERB = 1,		  // parola non preceduta da modificatore
	LITERAL = 2,	// parola preceduta da QUOTE
	VARIABLE = 3,	// parola preceduta da COLON
}
export enum CellType {
  LIST = 0,
  QUOTE = 1,
  OPERATOR = 2,// operatore
  NUMBER = 3,  // numero
  WORD = 4,    // parola Logo
  BOOLEAN = 5, // valore logico
  VAR = 6,     // variabile Logo
  SFUN = 7,    // funzione primitiva
  UFUN = 8,    // funzione di utente (procedura)
  BLANK = 9,
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
  CT_TOP = 0,       // contesto iniziale (top_level)
  CT_PAUSA = 1,     // contesto attivato da PAUSA
  CT_RECUPERA = 2,  // contesto attivato da RECUPERA
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
	conto_esegui: number; // contatore delle iterazioni di un blocco
	RepCount: number;
	RepTotal: number;
	n_arg_attesi: number; // numero di parametri atteso dalla funzione corrente
	n_arg_trovati: number; // numero di oggetti sullo stack per la fun corrente
	parentesi: number; // = liv_funzione se sfun corr. e' preceduta da "("
	conto_parentesi: number; // conto algebrico parentesi in valutazione di espressione
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
	ZEROORMORE = 2,	// primitive with zero or more arguments (max number undefined)
  ONEORMORE = 3,  // primitive with one or more arguments (max number undefined)
  TOPLEVEL = 4, // IS_PR_TOP: can be executed only at top level
}

// codifica di classi di primitiva
export enum FunClass {
  CANVAS = 1, // function related to the GraphicWindowState
  TURTLE = 2,	// IS_PR_TARTA: turtle function
  ASYNC = 3,
  TXIN = 4, // IS_PR_SCRIVI: writes on screen or ..
  TXOU = 5,	// IS_PR_SCRIVI: reads from keyboard or ..
  EXEC = 6,	// IS_PR_ESEGUI: execution control
  DEF = 7,	// IS_PR_DEF: Variable or procedure definition
  // PROC = 8, // IS_PR_PROC: can be executed only inside a procedure
  // OPER = 9, // infix operator
}

// codifica di bit in descrittore di argomento a SFUN (from IperLogo)
export enum Arg {
  LISTA = 1, // list
  PAROLA = 2, // word
  VEROFALSO = 4, // boolean
  NUMERO = 8, // number
  LISTAPAR = 16, // list of words
  LISTANUM = 32, // list of numbers
  COLORE = 64, // RGB color
  STRINGA = 128, // string of chars
  NONEMPTY_LIST = 256,
  NONEMPTY_WORD = 512,
  ARRAY  = 1024 , // array
  NOMEARC = 2048, // file name
}

// alias e aggregazioni di bit in descrittore di argomento a SFUN (from IperLogo)
const A_B = Arg.VEROFALSO;
const A_L = Arg.LISTA;
const A_NEL = Arg.NONEMPTY_LIST;
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
const A_NEW = Arg.NONEMPTY_WORD;
const A_W_L = Arg.PAROLA + Arg.LISTA;
const A_NEW_NEL = Arg.NONEMPTY_WORD + Arg.NONEMPTY_LIST;
const A_W_S = Arg.PAROLA + Arg.STRINGA;
const A_W_S_L = Arg.PAROLA + Arg.STRINGA + Arg.LISTA;
const A_W_LW_S_L = Arg.PAROLA + Arg.LISTAPAR + Arg.STRINGA + Arg.LISTA;
const A_F_S = Arg.NOMEARC + Arg.STRINGA;
const A_F_S_L = Arg.NOMEARC + Arg.STRINGA + Arg.LISTA;
const A_F_LW_S_L = Arg.NOMEARC + Arg.LISTAPAR + Arg.STRINGA + Arg.LISTA;

// export const turtleStrokes = ['CS', 'CLEAR', 'SETSCALE', 'FD', 'BK',];
export const turtleStrokes = ['CS', 'CLEAR', 'SETPOS', 'SETXY', 'SETX', 'SETY', 'FD', 'BK',];

// Mappa che contiene tutte le definizioni (la LOGICA del tuo interprete)
export const CORE_DEFINITIONS = {
  // --- Comandi LOGO ---
  SCREENSIZE: {
    signature: [FunSignature.FUNCTION],
    ref: _SCREENSIZE,
  } as CommandDef,
  SETCANVASSIZE: {
    classes: [FunClass.CANVAS],
    args: [{ name: "size", type: A_LN }],
    ref: _SETCANVASSIZE,
  } as CommandDef,
  CANVASSIZE: {
    classes: [FunClass.CANVAS],
    signature: [FunSignature.FUNCTION],
    ref: _CANVASSIZE,
  } as CommandDef,
  BOUNDS: {
    signature: [FunSignature.FUNCTION],
    ref: _BOUNDS,
  } as CommandDef,
  WINDOW: {
    ref: _WINDOW,
  } as CommandDef,
  FENCE: {
    ref: _FENCE,
  } as CommandDef,
  WRAP: {
    ref: _WRAP,
  } as CommandDef,
  SETSCREEN: {
    args: [{ name: "campo", type: A_W_S }],
    ref: _SETSCREEN,
  } as CommandDef,
  SCREEN: {
    signature: [FunSignature.FUNCTION],
    ref: _SCREEN,
  } as CommandDef,
  SETSCALE: {
    classes: [FunClass.CANVAS],
    args: [{ name: "scala", type: A_LN }],
    ref: _SETSCALE,
  } as CommandDef,
  SCALE: {
    classes: [FunClass.CANVAS],
    signature: [FunSignature.FUNCTION],
    ref: _SCALE,
  } as CommandDef,
  HOME: {
    classes: [FunClass.TURTLE],
    ref: _HOME,
  } as CommandDef,
  CLEAR: {
    classes: [FunClass.TURTLE],
    ref: _CLEAR,
  } as CommandDef,
  CS: {
    classes: [FunClass.TURTLE],
    ref: _CS,
  } as CommandDef,
  TOWARDS: {
    classes: [FunClass.TURTLE],
    signature: [FunSignature.FUNCTION],
    args: [{ name: "coordinate", type: A_LN }],
    ref: _TOWARDS,
  } as CommandDef,
  SETPOS: {
    classes: [FunClass.TURTLE],
    args: [{ name: "coordinate", type: A_LN }],
    ref: _SETPOS,
  } as CommandDef,
  SETXY: {
    classes: [FunClass.TURTLE],
    args: [{ name: "x", type: A_N }, { name: "y", type: A_N }],
    ref: _SETXY,
  } as CommandDef,
  SETX: {
    classes: [FunClass.TURTLE],
    args: [{ name: "x", type: A_N }],
    ref: _SETX,
  } as CommandDef,
  SETY: {
    classes: [FunClass.TURTLE],
    args: [{ name: "y", type: A_N }],
    ref: _SETY,
  } as CommandDef,
  FD: {
    classes: [FunClass.TURTLE],
    args: [{ name: "distanza", type: A_N }],
    ref: _FD,
  } as CommandDef,
  BK: {
    classes: [FunClass.TURTLE],
    args: [{ name: "distanza", type: A_N }],
    ref: _BK,
  } as CommandDef,
  RT: {
    classes: [FunClass.TURTLE],
    args: [{ name: "angolo", type: A_N }],
    ref: _RT,
  } as CommandDef,
  LT: {
    classes: [FunClass.TURTLE],
    args: [{ name: "angolo", type: A_N }],
    ref: _LT,
  } as CommandDef,
  BACKGROUNDCOLOR: {
    classes: [FunClass.CANVAS],
    signature: [FunSignature.FUNCTION],
    ref: _BACKGROUNDCOLOR,
  } as CommandDef,
  SETBACKGROUNDCOLOR: {
    classes: [FunClass.CANVAS],
    args: [{ name: "colore", type: Arg.COLORE }],
    ref: _SETBACKGROUNDCOLOR,
  } as CommandDef,
  PENCOLOR: {
    classes: [FunClass.TURTLE],
    signature: [FunSignature.FUNCTION],
    ref: _PENCOLOR,
  } as CommandDef,
  SETPENCOLOR: {
    classes: [FunClass.TURTLE],
    args: [{ name: "colore", type: Arg.COLORE }],
    ref: _SETPENCOLOR,
  } as CommandDef,
  PENUP: {
    classes: [FunClass.TURTLE],
    ref: _PENUP,
  } as CommandDef,
  PENDOWN: {
    classes: [FunClass.TURTLE],
    ref: _PENDOWN,
  } as CommandDef,
  PENDOWNP: {
    classes: [FunClass.TURTLE],
    signature: [FunSignature.FUNCTION],
    ref: _PENDOWNP,
  } as CommandDef,
  PENSIZE: {
    classes: [FunClass.TURTLE],
    signature: [FunSignature.FUNCTION],
    ref: _PENSIZE,
  } as CommandDef,
  SETPENSIZE: {
    classes: [FunClass.TURTLE],
    args: [{ name: "colore", type: A_LN_N_L }],
    ref: _SETPENSIZE,
  } as CommandDef,
  PENMODE: {
    classes: [FunClass.TURTLE],
    signature: [FunSignature.FUNCTION],
    ref: _PENMODE,
  } as CommandDef,
  POS: {
    classes: [FunClass.TURTLE],
    signature: [FunSignature.FUNCTION],
    ref: _POS,
  } as CommandDef,
  XCOR: {
    classes: [FunClass.TURTLE],
    signature: [FunSignature.FUNCTION],
    ref: _XCOR,
  } as CommandDef,
  YCOR: {
    classes: [FunClass.TURTLE],
    signature: [FunSignature.FUNCTION],
    ref: _YCOR,
  } as CommandDef,
  SETHEADING: {
    classes: [FunClass.TURTLE],
    args: [{ name: "angolo", type: A_N }],
    ref: _SETHEADING,
  } as CommandDef,
  HEADING: {
    classes: [FunClass.TURTLE],
    signature: [FunSignature.FUNCTION],
    ref: _HEADING,
  } as CommandDef,
  SHOWTURTLE: {
    classes: [FunClass.TURTLE],
    ref: _SHOWTURTLE,
  } as CommandDef,
  HIDETURTLE: {
    classes: [FunClass.TURTLE],
    ref: _HIDETURTLE,
  } as CommandDef,
  SHOWNP: {
    classes: [FunClass.TURTLE],
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
    args: [{ name: "arg1", type: null }, { name: "arg2", type: A_L}],
    ref: _FPUT,
  } as CommandDef,
  LPUT: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg1", type: null }, { name: "arg2", type: A_L}],
    ref: _LPUT,
  } as CommandDef,
  FIRST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: A_NEW_NEL }],
    ref: _FIRST,
  } as CommandDef,
  LAST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: A_NEW_NEL }],
    ref: _LAST,
  } as CommandDef,
  FIRSTS: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "list_of_words_or_lists", type: A_L }],
    ref: _FIRSTS,
  } as CommandDef,
  LASTS: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "list_of_words_or_lists", type: A_L }],
    ref: _LASTS,
  } as CommandDef,
  BUTFIRST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: A_NEW_NEL }],
    ref: _BUTFIRST,
  } as CommandDef,
  BUTLAST: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "word_or_list", type: A_NEW_NEL }],
    ref: _BUTLAST,
  } as CommandDef,
  BUTFIRSTS: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "list_of_words_or_lists", type: A_L }],
    ref: _BUTFIRSTS,
  } as CommandDef,
  BUTLASTS: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "list_of_words_or_lists", type: A_L }],
    ref: _BUTLASTS,
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
  PROCEDUREP: {
    classes: [FunClass.DEF],
    signature: [FunSignature.FUNCTION],
    args: [{ name: "nome", type: A_W_S }],
    ref: _PROCEDUREP,
  } as CommandDef,
  PRIMITIVEP: {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "nome", type: A_W_S }],
    ref: _PRIMITIVEP,
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
  'ABS': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _ABS,
  } as CommandDef,
  'INT': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _INT,
  } as CommandDef,
  'ROUND': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _ROUND,
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
  'POWER': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "base", type: A_N }, { name: "esponente", type: A_N }],
    ref: _POWER,
  } as CommandDef,
  '^': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "base", type: A_N }, { name: "esponente", type: A_N }],
    ref: _POWER,
  } as CommandDef,
  'EXP': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "esponente", type: A_N }],
    ref: _EXP,
  } as CommandDef,
  'SQRT': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "esponente", type: A_N }],
    ref: _SQRT,
  } as CommandDef,
  'LOG10': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _LOG10,
  } as CommandDef,
  'LN': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _LN,
  } as CommandDef,

  'RAD': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _RAD,
  } as CommandDef,
  'SIN': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _SIN,
  } as CommandDef,
  'COS': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _COS,
  } as CommandDef,
  'TAN': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _TAN,
  } as CommandDef,
  'ARCTAN': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _ARCTAN,
  } as CommandDef,
  'RADSIN': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _RADSIN,
  } as CommandDef,
  'RADCOS': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _RADCOS,
  } as CommandDef,
  'RADTAN': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _RADTAN,
  } as CommandDef,
  'RADARCTAN': {
    signature: [FunSignature.FUNCTION],
    args: [{ name: "arg", type: A_N }],
    ref: _RADARCTAN,
  } as CommandDef,
  'RANDOM': {
    signature: [FunSignature.FUNCTION, FunSignature.ONEORMORE],
    args: [{ name: "range_or_min", type: A_N }],
    ref: _RANDOM,
  } as CommandDef,
  'RERANDOM': {
    signature: [FunSignature.ZEROORMORE],
    args: [{ name: "seed", type: A_N }],
    ref: _RERANDOM,
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
  TRACK: {
    signature: [FunSignature.ZEROORMORE],
    args: [{ name: "time", type: A_W_LW_S_L }],
    ref: _TRACK,
  } as CommandDef,
  UNTRACK: {
    signature: [FunSignature.ZEROORMORE],
    args: [{ name: "time", type: A_W_LW_S_L }],
    ref: _UNTRACK,
  } as CommandDef,
  NOP: {
    args: [],
    ref: _NOP,
  } as CommandDef,
  TIME: {
    signature: [FunSignature.FUNCTION],
    ref: _TIME,
  } as CommandDef,
  SETTIME: {
    args: [{ name: "time", type: A_N }],
    ref: _SETTIME,
  } as CommandDef,
  WAIT: {
    classes: [FunClass.ASYNC],
    args: [{ name: "time", type: A_N }],
    ref: _WAIT,
  } as CommandDef,
  MIDIOPEN: {
    classes: [FunClass.ASYNC],
    ref: _MIDIOPEN,
  } as CommandDef,
  MIDIMSG: {
    args: [{ name: "time", type: A_LN }],
    ref: _MIDIMSG,
  } as CommandDef,
  STOP: {
    classes: [FunClass.EXEC],
    args: [],
    ref: _STOP,
  } as CommandDef,
  OUTPUT: {
    classes: [FunClass.EXEC],
    args: [{ name: "result", type: null }],
    ref: _OUTPUT,
  } as CommandDef,
  REPEAT: {
    classes: [FunClass.EXEC],
    args: [{ name: "times", type: A_N }, { name: "block", type: A_L}],
    ref: _REPEAT,
  } as CommandDef,
  REPCOUNT: {
    classes: [FunClass.EXEC],
    signature: [FunSignature.FUNCTION],
    ref: _REPCOUNT,
  } as CommandDef,
  IF: {
    classes: [FunClass.EXEC],
    args: [{ name: "condition", type: A_B }, { name: "block", type: A_L}],
    ref: _IF,
  } as CommandDef,
  IFELSE: {
    classes: [FunClass.EXEC],
    args: [{ name: "condition", type: A_B }, { name: "block1", type: A_L}, { name: "block2", type: A_L}],
    ref: _IFELSE,
  } as CommandDef,
  TEST: {
    classes: [FunClass.EXEC],
    args: [{ name: "arg", type: A_B }],
    ref: _TEST,
  } as CommandDef,
  IFTRUE: {
    classes: [FunClass.EXEC],
    args: [{ name: "block", type: A_L}],
    ref: _IFTRUE,
  } as CommandDef,
  IFFALSE: {
    classes: [FunClass.EXEC],
    args: [{ name: "block", type: A_L}],
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
