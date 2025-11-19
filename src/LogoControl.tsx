// LogoControl.tsx
// 251116 - 1st version: inspired to Ilcontro.cpp of IperLogo

import { devCode, devType, contextType, Context, cellType, Cell, CommandDef, ModParola } from './CoreDefinitions';
import { mod_parola, is_stop, is_finito, ini_valuta, valuta_token } from './Interpreter';

// codifica dei tipi di contesto (id_contesto)
const CT_TOP = 0;			// contesto iniziale (top_level)
const CT_PAUSA = 1;		// contesto attivato da PAUSA
const CT_RECUPERA = 2;	// contesto attivato da RECUPERA
const CT_EVENT = 3;

const ID_RUN = 1;
const ID_RUNRESULT = 2;


export var contesti: Context[] = [];
export var liv_contesto: number = 0; /* livello di nidificazione dei contesti */

var blocco: Cell[] = [];
var ha_blocco_valore: boolean = false;
var is_ripeti: boolean = false;
var is_funzione: boolean = false;
export var liv_analisi: number;		// parentesi non chiuse
var is_nestedExec: boolean;
var	n_locali: number;				// numero variabili locali nella procedura
var n_argomenti: number;			// numero argomenti della procedura
var is_vai: boolean = false;		// appena incontrato comando VAI
var risultato: any;					// risultato della primitiva corrente

var c_stack: any[] = [];
export var v_stack: any[] = [];


export function _NOP(): void  {
}

export function _REPEAT(ctx: Context, values: any[]): void {
	console.log('function _REPEAT', values[0],values[1]);
	// ctx.conto_esegui = values[0];
	var n_repeat = values[0];
	var blocco = values[1];
	console.log('function _REPEAT', n_repeat, blocco);
	for (var i=0; i<n_repeat; i++)
		_esegui(ctx, blocco);
	// is_ripeti = true;
}

// function _esegui (node id): void {
function _esegui(ctx: Context, blocco: Cell[]): void {
	// push_sc (id);
	// push_sc (token);
	// token = blocco;
	// blk_in (ha_blocco_valore && (n_arg_attesi > 0));
	push_contesto(ctx, CT_TOP);
	ctx = contesti[liv_contesto];
	ini_valuta(ctx);
	ctx.linea_com = blocco;
  	var i_cell = 0;
	while (! is_finito) {
		console.log('_esegui', i_cell, ctx.linea_com);
		i_cell = valuta_token(ctx, i_cell);	// eseguito per ogni token
	}
  	pop_contesto(ctx);
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

function pop_contesto(ctx: Context): void {
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
}

// azioni comuni al riconoscimento di un token funzione (sfun o ufun)
function f_in(ctx: Context, def: CommandDef): void {
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
  popco(ctx);
  ctx.funzione = pop_sc();
  // VALID(funzione);
  if (is_funzione)
  		push_arg(pop_sv());
  --ctx.liv_funzione;
  if (ctx.conto_esegui > 0)
	//_esegui ((node) idRun);
	_esegui (ctx, blocco);
  // idRun = 0;
  AssertContesto();
}

// ingresso nella valutazione di una System Function
export function sf_in(ctx: Context, def: CommandDef): void {
	f_in (ctx, def);
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
}

// uscita della valutazione di una System Function
export function sf_out(ctx: Context, def: CommandDef): void {
	f_out(ctx);
}

/*------------------------------------------------------------------------
  ripristina i vecchi valori di n variabili; in cima al vstack si trovano
  n coppie (variabile, vecchio-valore); se il vecchio valore era NULLVALUE
  (valore non assegnato) la variabile NON viene piu' cancellata dallo spazio
  delle parole
  ------------------------------------------------------------------------*/
function poploc (ctx: Context, n: number): void {
	var risultato: any;
	var oggetto: any;
	var valore: any;

	if (ctx.n_arg_trovati != 0)
		risultato = pop_sv ();
	for (var i = 1; i <= n; ++i) {
	    valore = pop_sv();
	    oggetto = pop_sv();
	    // putcar (oggetto, valore); ASSEGNAZIONE
	};
	if (ctx.n_arg_trovati != 0)
		push_sv (risultato);
}

/*---------------------------
  ingresso in parentesi tonde
  ---------------------------*/
function parenin(ctx: Context): void {
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
	for (var i = 1; i <= n; ++i) {
		if (ctx.n_arg_trovati > 1) {
			// err2 (12, get_sv (1));
		}
		locale = ctx.n_arg_trovati;
		popco(ctx);
		ctx.funzione = pop_sc();
		ctx.n_arg_trovati = ctx.n_arg_trovati + locale;
	}
}

// azioni comuni all' ingresso in un blocco
function blk_in(ctx: Context, is_arg_atteso: number): void {
  AssertContesto();
  push_sc(ctx.funzione);
  ctx.funzione = null;
  push_sc (ctx.ini_token);
  // err_token = ini_token = token;
  push_sc(ctx.token);
  push_sc(ctx.conto_esegui);
  push_sc(ctx.RepCount);
  push_sc(ctx.RepTotal);
  push_sc (ctx.val_verifica);
  pushco(ctx);
  ctx.conto_parentesi = 0;
  ctx.parentesi = -1;
  ctx.n_arg_attesi = is_arg_atteso;
  push_sc (n_locali);
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
  AssertContesto();
}

// azioni comuni all' uscita da un blocco
function blk_out(ctx: Context): void {
  var OldTotal: number, OldCount: number;
  var locale: number;
  var id: number;
  AssertContesto();
  parenout(ctx, ctx.conto_parentesi);
  poploc(ctx, n_locali);
  n_locali = pop_sc ();
  locale = ctx.n_arg_trovati;
  popco(ctx);
  ctx.n_arg_trovati = ctx.n_arg_trovati + locale;
  ctx.val_verifica = pop_sc();
  OldTotal = ctx.RepTotal;
  OldCount = ctx.RepCount;
  ctx.RepTotal = pop_sc();
  ctx.RepCount = pop_sc();
  ctx.conto_esegui = pop_sc();
  if (is_vai)
	  ctx.conto_esegui = 1;
  ctx.token = pop_sc();
  ctx.ini_token = pop_sc();
  ctx.funzione = pop_sc ();
  --ctx.liv_esecuzione;
  --ctx.conto_esegui;
  if (ctx.conto_esegui > 0) {
  	blk_in(ctx, 0);
	if (OldTotal) {
		ctx.RepTotal = OldTotal;
		ctx.RepCount = OldCount + 1;
	}
  }
  else {
    ctx.token = pop_sc();
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
		'id_contesto': CT_TOP,
		'dev_recupera': 0,
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
		'token': null,
		'ini_token': null,
		'n_arg_attesi': 0,
		'n_arg_trovati': 0,
		'parentesi': -1,
		'conto_parentesi': 0,
		'p_sc': 0,
		'p_sv': 0,
		'ini_p_sv' : 0,
		'linea_com': [],
	};
	ini_valuta (ctx);
	contesti.push(ctx);
	liv_contesto += 1;
	liv_analisi = 0;
	is_nestedExec = false;
}
