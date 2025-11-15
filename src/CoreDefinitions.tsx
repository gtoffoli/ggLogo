// CoreDefinitions.tsx
// 251019 - 1st version with Gemini
// 251115 - added FunClass; added ref field to CommandDef

import { _CS, _FD, _BK, _RT, _LT, _NOP} from './InterpreterCore';

export enum ModParola {
	VERBO = 1,		// parola non preceduta da modificatore
	LETTERALE = 2,	// parola non preceduta da QUOTE
	VALORE = 3,		// parola non preceduta da COLON
}
export enum CellType {
	LIST = 0,
	OPERATOR = 1, // operatore
	NUMBER = 2, // numero
	WORD = 3, // parola Logo
	VAR = 4, // variabile Logo
	SFUN = 5, // funzione primitiva
	UFUN = 6, // funzione di utente (procedura)
}

// typed token in the Parser output
export type Cell = {
  type: number;
  val: any;
} | null;

// see contesti in Contesti.h of il32
export type Context = {
	id_contesto: number; // contesto "top_level"
	dev_recupera: number;
	liv_procedura: number; // nest globale delle procedure utente
	in_liv_proc: number; // val. in. liv_procedura in PAUSA/RECUPERA
	liv_funzione: number; // nest globale delle funzioni
	in_liv_funzione: number; // val. in. liv_funzione in PAUSA/RECUPERA
	funzione: SystemFunction; // command key + command definition
	liv_esecuzione: number; // nest dei blocchi in proc. corrente
	val_verifica: boolean | null; // valore ultima condizione verificata
	conto_esegui: number;
	RepCount: number;
	RepTotal: number;
	token: Cell | null;
	ini_token: number;
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
  description: string;
  syntax: string;
  args: { name: string; type: 'number' | 'string' | 'boolean' }[];
  semantics: (args: any[]) => any; // La funzione che esegue il comando
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

/* codifica di classi di primitiva */
export enum FunClass {
	TURT = 1,	// IS_PR_TARTA: turtle function
	EDIT = 2,	// IS_PR_FOGLIO: edit function
	TOPL = 4,	// IS_PR_TOP: can be executed only at top level
	PROC = 8,	// IS_PR_PROC: can be executed only inside a procedure
	TXOU = 16,	// IS_PR_SCRIVI: writes on screen
	EXEC = 32,	// IS_PR_ESEGUI: execution control
	PGUI = 64,	// IS_PR_GUI: graphic UI building
	PMCI = 128	// IS_PR_MM: not used?
}

// Mappa che contiene tutte le definizioni (la LOGICA del tuo interprete)
export const CORE_DEFINITIONS = {
  // --- Comandi LOGO ---
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
  CS: {
    classes: FunClass.TURT,
    description: "Pulisce lo schermo.",
    syntax: "CS",
    args: [],
    semantics: () => console.log(`CS: Pulisci lo schermo.`),
    ref: _CS,
  } as CommandDef,
  SET: {
    classes: 0,
    description: "Assegna valore a nome.",
    syntax: "SET <nome> <valore>",
    args: [{ name: "nome", type: 'string' }, { name: "valore", type: 'any'}],
    semantics: (args) => console.log(`SET: Assegna il valore ${args[1]} a ${args[0]}.`),
    ref: _NOP,
  } as CommandDef,
  REPEAT: {
    classes: FunClass.EXEC,
    description: "Ripete una lista di comandi.",
    syntax: "REPEAT <volte> <comandi>",
    args: [{ name: "volte", type: 'number' }, { name: "comandi", type: 'list'}],
    semantics: (args) => console.log(`SET: Assegna il valore ${args[1]} a ${args[0]}.`),
    ref: _NOP,
  } as CommandDef,
  PRINT: {
    classes: FunClass.TXOU,
    description: "Visualizza un valore nella console.",
    syntax: "PRINT <valore>",
    args: [{ name: "valore", type: 'string' }],
    semantics: (args) => console.log(`Output: ${args[0]}`),
    ref: _NOP,
  } as CommandDef,

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
};

// Tipo di supporto per le definizioni (per inferenza)
export type CoreDefinitionKeys = keyof typeof CORE_DEFINITIONS;
