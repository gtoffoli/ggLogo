// CoreDefinitions.tsx
// 251019 - 1st version with Gemini
// 251115 - added FunClass; added ref field to CommandDef


import { _NOP, _REPEAT } from './LogoControl';
import { _MAKE, _DEFINE, _TO, _END, _TEXT } from './LogoDefine';
import { _SUM, _DIFFERENCE, _PRODUCT, _QUOTIENT } from './Math';
import { _READER } from './LogoDevices';
import { _HOME, _CS, _FD, _BK, _RT, _LT, _PENUP, _PENDOWN, _PENCOLOR, _SETPENCOLOR } from './InterpreterCore';

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
	'^': { precedence: 4},
}

export function isSeparator(s: string): boolean {
	return Object.keys(SEPARATORS).includes(s);
}

// codifica dei device MLOGO
export enum devCode {
	CONSOLE = 0,	// codice di console
	STAMPANTE = 1,	// codice di stampante
	FOGLIO = 2,		// codice di device del foglio di editor
	TARTALFA = 3,	// codice di schermo TARTA usato per output alfanum.
	COM1 = 4,		// codice di porta comunicazione n. 1
	MIN_DEV = 6, 	// minimo codice di device non preallocato
}

// codifica dei bit di stato MLOGO (_stato) per file C
export enum devType {
	NULL_DEV = -1,
	O_BINARIO = 1,	// file aperto in modalita' binario
					// 2 riservato futuri usi per file 
					// 4 riservato futuri usi per file
	O_FINESTRA = 8,	// device corrispondente a viewport del GFX
	O_TARTA = 16,	// finestra di tipo tarta
	O_FOGLIO = 32,	// finestra di tipo foglio
	O_ARCHIVIO = 64,// device di tipo archivio
	O_PLAYER = 128,	// player MCI
	O_BROWSER = 256,// browser HTML
}

export enum ModParola {
	VERB = 1,		// parola non preceduta da modificatore
	LITERAL = 2,	// parola non preceduta da QUOTE
	VARIABLE = 3,	// parola non preceduta da COLON
}
export enum CellType {
	LIST = 0,
	QUOTE = 1,
	OPERATOR = 2,	// operatore
	NUMBER = 3, 	// numero
	WORD = 4,		// parola Logo
	VAR = 5, 		// variabile Logo
	SFUN = 6,		// funzione primitiva
	UFUN = 7,		// funzione di utente (procedura)
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
	CT_EVENT = 3,
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
	FUNCT = 1,
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
    signature: FunSignature.FUNCT,
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
  MAKE: {
    classes: [FunClass.DEF],
    // description: "Assegna valore a nome.",
    args: [{ name: "nome", type: 'string' }, { name: "valore", type: 'any'}],
    ref: _MAKE,
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
    signature: FunSignature.FUNCT,
    // description: "Riporta la definizione di una procedura.",
    args: [{ name: "nome", type: 'string' }],
    ref: _TEXT,
  } as CommandDef,
  REPEAT: {
    classes: [FunClass.EXEC],
    // description: "Ripete una lista di comandi.",
    args: [{ name: "volte", type: 'number' }, { name: "comandi", type: 'list'}],
    ref: _REPEAT,
  } as CommandDef,
  PRINT: {
    classes: [FunClass.TXOU],
    // description: "Visualizza un valore nella console.",
    args: [{ name: "valore", type: 'string' }],
    ref: _NOP,
  } as CommandDef,
  READER: {
    signature: FunSignature.FUNCT,
    // description: "Riporta il device di lettura dei comandi.",
    ref: _READER,
  } as CommandDef,
  '+': {
    signature: FunSignature.FUNCT,
    // description: "Riporta la somma di 2 o più numeri.",
    args: [{ name: "addendo_1", type: 'number' }, { name: "addendo_2", type: 'number' }],
    ref: _SUM,
  } as CommandDef,
  '-': {
    signature: FunSignature.FUNCT,
    // description: "Riporta la somma di 2 o più numeri.",
    args: [{ name: "minuendo", type: 'number' }, { name: "sottraendo", type: 'number' }],
    ref: _DIFFERENCE,
  } as CommandDef,
  '*': {
    signature: FunSignature.FUNCT,
    // description: "Riporta la somma di 2 o più numeri.",
    args: [{ name: "fattore_1", type: 'number' }, { name: "fattore_2", type: 'number' }],
    ref: _PRODUCT,
  } as CommandDef,
  '/': {
    signature: FunSignature.FUNCT,
    // description: "Riporta la somma di 2 o più numeri.",
    args: [{ name: "dividendo", type: 'number' }, { name: "divisore", type: 'number' }],
    ref: _QUOTIENT,
  } as CommandDef,
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
