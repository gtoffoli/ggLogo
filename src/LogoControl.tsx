// LogoControl.tsx
// 251116 - 1st version: inspired to Ilcontro.cpp of IperLogo
// 251129 - of resolveCommand also to functions calling valuta_token

import { devCode, devType, contextType, Context, Cell, CommandDef, ModParola, ProcedureDef } from './CoreDefinitions';
import { valuta_token, globalVariables, userProcedures } from './Interpreter';

// codifica dei tipi di contesto (id_contesto)
const CT_TOP = 0;			// contesto iniziale (top_level)
const CT_PAUSA = 1;		// contesto attivato da PAUSA
const CT_RECUPERA = 2;	// contesto attivato da RECUPERA
const CT_EVENT = 3;

const ID_RUN = 1;
const ID_RUNRESULT = 2;


export var contesti: Context[] = [];
export var liv_contesto: number = 0; /* livello di nidificazione dei contesti */

export var blocco: Cell[] = [];
var ha_blocco_valore: boolean = false;
var is_ripeti: boolean = false;
var is_funzione: boolean = false;
export var liv_analisi: number;		// parentesi non chiuse
var is_nestedExec: boolean;
var	n_locali: number;				// numero variabili locali nella procedura
var n_argomenti: number;			// numero argomenti della procedura
var is_vai: boolean = false;		// appena incontrato comando VAI
var risultato: any;					// risultato della primitiva corrente
var is_riporta: boolean;			// procedura termina con RIPORTA
var is_stop: boolean;				// incontrata fine di valutazione di procedura (UFUN)

var c_stack: any[] = [];
export var v_stack: any[] = [];
var stk_funzioni: any[] = [];		// stack di nest procedure attive dur. esecuzione
var stk_livelli: any[] = [];		// stack di camm. att. dur.esecuz. (blocchi) ?? */


export function _NOP(): void  {
}

export function _REPEAT(ctx: Context, values: any[]): void {
	console.log('function _REPEAT', values[0], values[1]);
	ctx.conto_esegui = values[0];
	is_ripeti = true;
	var block = [values[1]];
	console.log('function _REPEAT', ctx.conto_esegui, block);
	sf_out(ctx); // anticipo, per non confliggere con blk_in
	// _esegui(ctx, block);
	blk_in(ctx, block, 0);
}

function block_exec(ctx: Context, block: Cell[][]): void {
	blk_in(ctx, block, 0);
}

function _esegui(ctx: Context, block: Cell[][]): void {
	console.log('_esegui', liv_contesto, ctx.liv_esecuzione, block);
	push_sc(ctx.i_token);
	push_sc(ctx.block);
	blk_in(ctx, block, 0);
}

function AssertContesto(): void {}

// push di un valore sullo stack di controllo
function push_sc (val: any): void {
	c_stack.push(val);
}
// pop di un valore dallo stack di controllo
function pop_sc(): any {
  return c_stack.pop();
}

//  push di un valore sullo stack dei valori
function push_sv (val: any): void {
	v_stack.push(val);
}
// pop di un valore dallo stack dei valori
function pop_sv(): any {
  return v_stack.pop();
}

export function push_arg(arg: any): void {
	console.log('push_arg', arg);
	const ctx = contesti[liv_contesto];
    ctx.n_arg_trovati += 1;
    v_stack.push(arg);
    ctx.p_sv += 1;
}

function push_contesto(ctx: Context, id: number): void {
	AssertContesto();
	ctx.id_contesto = id;
	// contesti[liv_contesto+1] = contesti[0];
	contesti.push(ctx)
	++liv_contesto;
	ctx = contesti[liv_contesto];
	ctx.funzione = null;
	AssertContesto();
}

function pop_contesto(ctx: Context) {
	var locale: number;
	AssertContesto();
	locale = ctx.dev_recupera;
  	// trap(liv_contesto > 0);
  	--liv_contesto;
	ctx = contesti.pop();
	ctx.id_contesto = (liv_contesto == 0) ?
		0 : (contesti [liv_contesto]).id_contesto;	// contesto 0 e' riservato
	if (locale != devType.NULL_DEV) {
    	ctx.linea_com = [];
    if (   (locale != ctx.dev_recupera)
        && (! (_fstato [locale] & devType.O_FINESTRA))
       ) f_chiudi (locale);
	}
	AssertContesto();
}

// salvataggio di parte del contesto sullo stack di controllo
function pushco(ctx: Context): void {
	console.log('pushco', ctx);
  AssertContesto();
  push_sc(ctx.conto_parentesi);
  push_sc(ctx.n_arg_trovati);
  push_sc(ctx.n_arg_attesi);
  push_sc (ctx.parentesi);
  // push_sc (err_token);
  AssertContesto();
}
 
// ripristino di parte del contesto dallo stack di controllo
function popco(ctx: Context): void {
  AssertContesto();
  // err_token = pop_sc ();
  ctx.parentesi = pop_sc();
  ctx.n_arg_attesi = pop_sc();
  ctx.n_arg_trovati = pop_sc();
  ctx.conto_parentesi = pop_sc();
  AssertContesto();
	console.log('popco', ctx);
}

// azioni comuni al riconoscimento di un token funzione (sfun o ufun)
function f_in(ctx: Context): void {
	console.log('f_in', ctx);
  AssertContesto();
  push_sc(ctx.funzione);
  pushco (ctx);
  // funzione = val_token;
  ctx.n_arg_trovati = 0;
  ++ctx.liv_funzione;
  // err_token = prev_token;
  AssertContesto();
}

// azioni comuni al termine della valutazione di sfun e ufun
function f_out (ctx: Context): void {
  AssertContesto();
	console.log('f_out -> popco');
  popco(ctx);
  ctx.funzione = pop_sc();
  // VALID(funzione);
  // if (is_funzione)
  //		push_arg(pop_sv());
  --ctx.liv_funzione;
  //if (ctx.conto_esegui > 0)
	//_esegui ((node) idRun);
	// _esegui (ctx, blocco);
  // idRun = 0;
  AssertContesto();
	console.log('f_out', ctx);
}

// ingresso nella valutazione di una System Function
export function sf_in(ctx: Context, def: CommandDef): void {
	f_in(ctx);
/*
	get_sf (funzione);
	if (IS_PR_MM)
		_letterale ();
	else if (   (liv_funzione != stk_livelli [liv_procedura] + 1)
		&& (! IS_PR_ESEGUI) 
		&& ((! IS_PR_FUNZIONE) || IS_PR_PROC)
	) errore (19, funzione, NULLP);	// primitiva non riporta !
	n_arg_attesi = N_NOMINALE;
*/
	ctx.n_arg_attesi = def.args.length;
	console.log(sf_in, ctx.n_arg_attesi);
}

// uscita della valutazione di una System Function
export function sf_out(ctx: Context): void {
	console.log('sf_out', ctx);
	f_out(ctx);
}

// ingresso nella valutazione di una User Function
export function uf_in(ctx: Context, definition: ProcedureDef): void {
	console.log('UF_IN', definition);
	f_in(ctx);
	ctx.n_arg_attesi = definition.parameters.length;
}

// inizia l' esecuzione di una procedura LOGO con push di uno stack-frame
export function uf_call(ctx: Context): void {
	const parameters = ctx.funzione.definition.parameters;
	const body = ctx.funzione.definition.body;
	const n_parameters = parameters.length;
	var argomenti: any[] = [];
	/*riconosce eventuale ricorsione di coda :*/
	/* e proc. da attivare coincide con proc.attiva */
    // push_sc (ini_token);
    // push_sc (token);		/* 1" elemento di STACK-FRAME */
    push_sc(ctx.conto_esegui);	/******************************/
	push_sc(ctx.RepCount);
	push_sc(ctx.RepTotal);
    push_sc(ctx.val_verifica);		/* 2 */
    push_sc(ctx.liv_esecuzione);	/* 3 */
    push_sc(n_locali);				/* 4: salva conto esterno variabili locali */
    n_locali = 0;       			/* reinizializza conto variabili locali */
    push_sc(n_parameters);			/* 5: ultimo elemento di STACK-FRAME */
	// svuota stack argomenti e ne copia il valore in locale
    for (var i=0; i<n_parameters; ++i)
		argomenti.push(pop_sv().val);
	// binding temporaneo degli argomenti con salvataggio vecchio binding
    for (var i=0; i < n_parameters; ++i)
		pushloc(parameters[i], argomenti[n_parameters-i-1]);
    // tr_comando();		/* ATTENZIONE : usa oltre top di c_stack */
    stk_funzioni[++ctx.liv_procedura] = ctx.funzione;
    stk_livelli[ctx.liv_procedura] = ctx.liv_funzione;
	// err_token = ini_token =
	// token = corpo; 
	is_stop = false;
	ctx.liv_esecuzione = 0;
	ctx.n_arg_attesi = ctx.n_arg_trovati = 0;
	ctx.parentesi = -1;
	ctx.conto_parentesi = 0;
	ctx.conto_esegui = 0;
	ctx.RepCount = 0;
	ctx.RepTotal = 0;
	ctx.val_verifica = false;
	ctx.funzione = null;
	for (var i=0; i<body.length; i++) {
		console.log('uf_call', i);
		block_exec(ctx, body[i]);
	}
		
}

// finalizza l' esecuzione di una procedura LOGO con pop di uno stack-frame
export function uf_ret(ctx: Context): void {
  var procedura;
  // var loc_1, loc_2;
  // loc_1 = err_token;
  // loc_2 = token;
  is_funzione = is_riporta;
  is_riporta = false;
  procedura = stk_funzioni[ctx.liv_procedura--];
  while (ctx.liv_esecuzione > 0) {
    if (ctx.conto_parentesi > 0) break;
    blk_out(ctx);
  };
  if (ctx.conto_parentesi > 0) {
    // err_token = loc_1;
    // token = loc_2;
    // errore (14, NULLP, NULLP);
	// BreakOnDebug();
    return;
  };
  if (ctx.n_arg_trovati > ((is_funzione) ? 1 : 0)) {
	  ++ctx.liv_procedura;
	  // err2 (12, get_sv (n_arg_trovati));	// va in errore
	  return;
  }
  poploc (ctx, n_locali);			/* spurgo delle variabili locali a procedura */
  poploc(ctx, pop_sc());			/* 5: spurgo delle variabili argomento */
  n_locali = pop_sc();				/* 4: numero variabili locali proc. esterna*/
  ctx.liv_esecuzione = pop_sc();	/* 3 */
  ctx.val_verifica = pop_sc();		/* 2 */
  ctx.RepTotal = pop_sc();
  ctx.RepCount = pop_sc();
  ctx.conto_esegui = pop_sc();		/******************************/
  ctx.i_token = pop_sc();				/* 1" elemento di STACK-FRAME */
  ctx.ini_token = pop_sc();
  is_stop = false;
  f_out(ctx);
}

/*-----------------------------------------------------------------------------
  se nello spazio delle parole non esiste una variabile di nome specificato la
  crea e considera che il suo vecchio valore sia NULLVALUE (valore invalido);
  comunque mette il valore specificato nella variabile e salva su stack dei
  valori la variabile e il vecchio valore
  ---------------------------------------------------------------------------*/
function pushloc(parola: string, nuovo_valore: any): void {
	var vecchio_valore;
	if (Object.keys(globalVariables).includes(parola))
		vecchio_valore = globalVariables[parola];
	else
		vecchio_valore = null;
	globalVariables[parola] = nuovo_valore;
	console.log('PUSHLOC', parola, nuovo_valore, globalVariables);
	push_sv(parola);
	push_sv(vecchio_valore);
}

/*------------------------------------------------------------------------
  ripristina i vecchi valori di n variabili; in cima al vstack si trovano
  n coppie (variabile, vecchio-valore); se il vecchio valore era NULLVALUE
  (valore non assegnato) la variabile NON viene piu' cancellata dallo spazio
  delle parole
  ------------------------------------------------------------------------*/
function poploc(ctx: Context, n: number): void {
	var risultato: any;
	var parola: string;
	var valore: any;

	if (ctx.n_arg_trovati != 0)
		risultato = pop_sv();
	for (var i = 1; i <= n; ++i) {
	    valore = pop_sv();
	    parola = pop_sv();
	    if (valore)
	    	globalVariables[parola] = valore;
		console.log('POPLOC', parola, valore, globalVariables);
	};
	if (ctx.n_arg_trovati != 0)
		push_sv(risultato);
}

/*---------------------------
  ingresso in parentesi tonde
  ---------------------------*/
function parenin(ctx: Context): void {
	console.log('parenin', ctx);
  push_sc(ctx.funzione);
  funzione = null;
  pushco(ctx);
  ctx.n_arg_attesi = (ctx.n_arg_attesi > 0)? 1: 0;
  ctx.n_arg_trovati = 0;
  ctx.parentesi = -1;
  ++ctx.conto_parentesi;
}

/*-------------------------
  uscita da parentesi tonde
  -------------------------*/
function parenout(ctx: Context, n: number): void {
	var locale: number;
	console.log('parenout, n=', n);
	for (var i=0; i<n; ++i) {
		if (ctx.n_arg_trovati > 1) {
			// err2 (12, get_sv (1));
		}
		locale = ctx.n_arg_trovati;
	console.log('parenout -> popco');
		popco(ctx);
		ctx.funzione = pop_sc();
		ctx.n_arg_trovati = ctx.n_arg_trovati + locale;
	}
}

// azioni comuni all' ingresso in un blocco
function blk_in(ctx: Context, block: Cell[][], is_arg_atteso: number): void {
	console.log('blk_in', liv_contesto, ctx.liv_esecuzione, block);
  AssertContesto();
  push_sc(ctx.funzione);
  ctx.funzione = null;
  // err_token = 
  push_sc(ctx.ini_token);
  ctx.ini_token = ctx.i_token;
  push_sc(ctx.block);
  ctx.block = block;
  push_sc(ctx.i_line);
  push_sc(ctx.i_token);
  push_sc(ctx.conto_esegui);
  push_sc(ctx.RepCount);
  push_sc(ctx.RepTotal);
  push_sc(ctx.val_verifica);
  pushco(ctx);
  ctx.conto_parentesi = 0;
  ctx.parentesi = -1;
  ctx.n_arg_attesi = is_arg_atteso;
  push_sc(n_locali);
  n_locali = 0;
  ++ctx.liv_esecuzione;
  if (is_ripeti) {
	is_ripeti = false;
  	ctx.RepTotal = ctx.conto_esegui;
  	ctx.RepCount = 1;
  } else {
  	ctx.RepTotal = 0;
  }
  ctx.conto_esegui = 0;
  ctx.val_verifica = false;
  ctx.n_arg_trovati = 0;
	ctx.i_line = 0;
	ctx.i_token = 0;
  AssertContesto();
}

// azioni comuni all' uscita da un blocco
export function blk_out(ctx: Context): void {
  var OldTotal: number, OldCount: number;
  var locale: number;
  var id: number;
  var block: Cell[][];
  AssertContesto();
  parenout(ctx, ctx.conto_parentesi);
  poploc(ctx, n_locali);
  n_locali = pop_sc ();
  locale = ctx.n_arg_trovati;
	console.log('blk_out -> popco');
  popco(ctx);
  ctx.n_arg_trovati = ctx.n_arg_trovati + locale;
  ctx.val_verifica = pop_sc();
  OldTotal = ctx.RepTotal;
  OldCount = ctx.RepCount;
  ctx.RepTotal = pop_sc();
  ctx.RepCount = pop_sc();
  ctx.conto_esegui = pop_sc();
  console.log('blk_out - conto_esegui', ctx.conto_esegui)
  if (is_vai)
	  ctx.conto_esegui = 1;
  ctx.i_token = pop_sc();
  ctx.i_line = pop_sc();
  block = ctx.block;
  console.log('blk_out - block', ctx.i_token, ctx.i_line, ctx.block)
  ctx.block = pop_sc();
  ctx.ini_token = pop_sc();
  ctx.funzione = pop_sc ();
  --ctx.liv_esecuzione;
  --ctx.conto_esegui;
  if (ctx.conto_esegui > 0) {
  	blk_in(ctx, block, 0);
	if (OldTotal) {
		ctx.RepTotal = OldTotal;
		ctx.RepCount = OldCount + 1;
	}
  }
  else {
    ctx.i_token = pop_sc();
    id = pop_sc();
    if (id === ctx.id_contesto)
    	pop_contesto(ctx);
	else {
		if (id === ID_RUNRESULT) {
			if (ctx.n_arg_trovati == 0) {
				++ctx.n_arg_trovati;
				push_sv([]);
			}
			else push_sv([pop_sv()]); 
		}
	} 
  };
  AssertContesto();
}

export function ini_main(): void {
	contesti = [];
	liv_contesto = -1;
}

// inizializzazione quasi totale di Commander
export function ini_exec(): void {
	var ctx: Context = {
		'id_contesto': contextType.CT_TOP,
		'dev_recupera': devCode.CONSOLE,
		'liv_procedura': 0,
		'in_liv_proc': 0,
		'liv_funzione': 0,
		'in_liv_funzione': 0,
		'funzione': null,
		'liv_esecuzione': 0,
		'val_verifica': null,
		'conto_esegui': 0,
		'RepCount': 0,
		'RepTotal': 0,
		'i_token': 0,
		'ini_token': 0,
		'n_arg_attesi': 0,
		'n_arg_trovati': 0,
		'parentesi': -1,
		'conto_parentesi': 0,
		'p_sc': 0,
		'p_sv': 0,
		'ini_p_sv' : 0,
		'linea_com': [],
		'block': [],
		'i_line': 0,
	};
	ini_valuta(ctx);
	contesti.push(ctx);
	liv_contesto += 1;
	liv_analisi = 0;
	is_nestedExec = false;
}

// inizializzazione parziale di Commander (NestedExec)
function ini_valuta(ctx: Context): void {
	ctx.i_line = 0;	
	ctx.i_token = 0;	
	ctx.funzione = null;	/* nessuna funzione incontrata */
	ctx.n_arg_attesi = 0;	/* numero di parametri atteso dalla funzione corrente*/
	ctx.n_arg_trovati = 0;	/* numero di oggetti sullo stack per la fun corrente*/
	ctx.conto_parentesi = 0;
 	ctx.parentesi = -1;		/* = liv_funzione se sfun corr. e' preceduta da "("*/
	is_stop = false;		/* se vero e' terminata esecuz. procedura corrente */
}
