// CoreDefinitions.tsx
// 251019 - 1st version with Gemini
// 251115 - added FunClass; added ref field to CommandDef


import { _SET, _DEFINE, _TO, _END } from './LogoDefine';
import { _NOP, _REPEAT } from './LogoControl';
import { _HOME, _CS, _FD, _BK, _RT, _LT, _PENUP, _PENDOWN, _PENCOLOR, _SETPENCOLOR } from './InterpreterCore';


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
	WORD = 4, 		// parola Logo
	VAR = 5, 		// variabile Logo
	SFUN = 6,		// funzione primitiva
	UFUN = 7,		// funzione di utente (procedura)
}

// typed token in the Parser output
export type Cell = {
  type: CellType;
  val: any;
} // | null;

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
	funzione: SystemFunction | null; // command key + command definition
	liv_esecuzione: number; // nest dei blocchi in proc. corrente
	val_verifica: boolean | null; // valore ultima condizione verificata
	conto_esegui: number;
	RepCount: number;
	RepTotal: number;
	// token: Cell | null;
	// ini_token:  Cell | null;
	token: number | null;
	ini_token:  number | null;
	n_arg_attesi: number; // numero di parametri atteso dalla funzione corrente
	n_arg_trovati: number; // numero di oggetti sullo stack per la fun corrente
	parentesi: number; // = liv_funzione se sfun corr. e' preceduta da "("
	conto_parentesi: number;
	p_sc: number;
	p_sv: number;
	ini_p_sv: number;
	linea_com: Cell[];
};

// Tipi per i comandi
export type SystemFunction = {
  coreKey: CoreDefinitionKeys;
  definition: CommandDef;
};

// Tipi per i comandi
export type CommandDef = {
  classes: number;
  signature?: number;
  description?: string;
  syntax?: string;
  args: { name: string; type: 'number' | 'string' | 'boolean' }[];
  semantics?: (args: any[]) => any; // La funzione che esegue il comando
  ref: (args: any) => any; // La funzione che esegue il comando
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
	FUNCT = 1,
}

/* codifica di classi di primitiva */
export enum FunClass {
	TURT = 1,	// IS_PR_TARTA: turtle function
	EDIT = 2,	// IS_PR_FOGLIO: edit function
	TOPL = 4,	// IS_PR_TOP: can be executed only at top level
	PROC = 8,	// IS_PR_PROC: can be executed only inside a procedure
	TXOU = 16,	// IS_PR_SCRIVI: writes on screen
	EXEC = 32,	// IS_PR_ESEGUI: execution control
	DEF = 64,	// IS_PR_DEF: Variable or ptocedure definition
	PGUI = 128,	// IS_PR_GUI: graphic UI building
	PMCI = 256	// IS_PR_MM: not used?
}

export const turtleStrokes = ['CS', 'FD', 'BK',];

// Mappa che contiene tutte le definizioni (la LOGICA del tuo interprete)
export const CORE_DEFINITIONS = {
  // --- Comandi LOGO ---
  HOME: {
    classes: FunClass.TURT,
    description: "Resetta posizione e direzione della tartaruga.",
    syntax: "HOME",
    args: [],
    semantics: () => console.log(`HOME: Reseta posizione e direzione della tartaruga.`),
    ref: _HOME,
  } as CommandDef,
  CS: {
    classes: FunClass.TURT,
    description: "Pulisce lo schermo.",
    syntax: "CS",
    args: [],
    semantics: () => console.log(`CS: Pulisci lo schermo.`),
    ref: _CS,
  } as CommandDef,
  FD: {
    classes: FunClass.TURT,
    description: "Muove la tartaruga in avanti.",
    syntax: "FD <distanza>",
    args: [{ name: "distanza", type: 'number' }],
    semantics: (args) => console.log(`FD: Muovi ${args[0]} unità.`),
    ref: _FD,
  } as CommandDef,
  BK: {
    classes: FunClass.TURT,
    description: "Muove la tartaruga all'indietro (back).",
    syntax: "BK <distanza>",
    args: [{ name: "distanza", type: 'number' }],
    semantics: (args) => console.log(`BK: Muovi ${args[0]} unità.`),
    ref: _BK,
  } as CommandDef,
  RT: {
    classes: FunClass.TURT,
    description: "Ruota la tartaruga a destra.",
    syntax: "RT <angolo>",
    args: [{ name: "angolo", type: 'number' }],
    semantics: (args) => console.log(`RT: Ruota di ${args[0]} radianti.`),
    ref: _RT,
  } as CommandDef,
  LT: {
    classes: FunClass.TURT,
    description: "Ruota la tartaruga a sinistra.",
    syntax: "LT <angolo>",
    args: [{ name: "angolo", type: 'number' }],
    semantics: (args) => console.log(`LT: Ruota di ${args[0]} radianti.`),
    ref: _LT,
  } as CommandDef,
  PENCOLOR: {
    classes: FunClass.TURT,
    signature: FunSignature.FUNCT,
    description: "Riporta il colore della penna.",
    syntax: "PENCOLOR",
    args: [],
    semantics: () => console.log(`PENCOLOR: Riporta il colore della penna.`),
    ref: _PENCOLOR,
  } as CommandDef,
  SETPENCOLOR: {
    classes: FunClass.TURT,
    description: "Assegna il colore della penna.",
    syntax: "SETPENCOLOR <colore>",
    args: [{ name: "colore", type: 'string' }],
    semantics: (args) => console.log(`SETPENCOLOR: Assegna alla penna il colore ${args[0]}.`),
    ref: _SETPENCOLOR,
  } as CommandDef,
  PENUP: {
    classes: FunClass.TURT,
    description: "Solleva la penna.",
    syntax: "PENUP",
    args: [],
    semantics: () => console.log(`PENUP: Solleva la penna.`),
    ref: _PENUP,
  } as CommandDef,
  PENDOWN: {
    classes: FunClass.TURT,
    description: "Abbassa la penna.",
    syntax: "_PENDOWN",
    args: [],
    semantics: () => console.log(`PENDOWN: Abbassa la penna.`),
    ref: _PENDOWN,
  } as CommandDef,
  SET: {
    classes: FunClass.DEF,
    description: "Assegna valore a nome.",
    syntax: "SET <nome> <valore>",
    args: [{ name: "nome", type: 'string' }, { name: "valore", type: 'any'}],
    semantics: (args) => console.log(`SET: Assegna il valore ${args[1]} a ${args[0]}.`),
    ref: _SET,
  } as CommandDef,
  DEFINE: {
    classes: FunClass.DEF,
    description: "Assegna valore a nome di procedura.",
    syntax: "DEFINE <nome> <valore>",
    args: [{ name: "nome", type: 'string' }, { name: "valore", type: 'any'}],
    semantics: (args) => console.log(`DEFINE: Assegna il valore ${args[1]} a ${args[0]}.`),
    ref: _DEFINE,
  } as CommandDef,
  TO: {
    classes: FunClass.DEF,
    description: "Inizializza la definizione di una procedura.",
    syntax: "TO <nome>",
    args: [{ name: "nome", type: 'string' }],
    semantics: (args) => console.log(`TO: Inizializza la definizione della procedura ${args[0]}.`),
    ref: _TO,
  } as CommandDef,
  END: {
    classes: FunClass.DEF,
    description: "Termina la definizione di una procedura.",
    syntax: "END",
    args: [],
    semantics: () => console.log(`END: Termina la definizione di una procedura.`),
    ref: _END,
  } as CommandDef,
  REPEAT: {
    classes: FunClass.EXEC,
    description: "Ripete una lista di comandi.",
    syntax: "REPEAT <volte> <comandi>",
    args: [{ name: "volte", type: 'number' }, { name: "comandi", type: 'list'}],
    semantics: (args) => console.log(`_REPEAT: Ripete ${args[0]} volte una lista di comandi.`),
    ref: _REPEAT,
  } as CommandDef,
  PRINT: {
    classes: FunClass.TXOU,
    description: "Visualizza un valore nella console.",
    syntax: "PRINT <valore>",
    args: [{ name: "valore", type: 'string' }],
    semantics: (args) => console.log(`Output: ${args[0]}`),
    ref: _NOP,
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
