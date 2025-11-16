// LogoControl.tsx
// 251116 - 1st version: inspired to Ilcontro.cpp of IperLogo

import { Context, Cell, CommandDef, ModParola } from './CoreDefinitions';
import { mod_parola, is_stop, is_finito, ini_valuta, valuta_token } from './Interpreter';

export var contesti: Context[] = [];
export var liv_contesto: number = 0; /* livello di nidificazione dei contesti */

var blocco: Cell[] = [];
var ha_blocco_valore: boolean = false;
var is_ripeti: boolean = false;
var is_funzione: boolean = false;
export var liv_analisi: number;		/* parentesi non chiuse */
var is_nestedExec: boolean;

var c_stack: any[] = [];
export var v_stack: any[] = [];


export function _NOP(): void  {
}

export function _REPEAT(ctx: Context, values: any[]): void {
	console.log('function _REPEAT');
	// ctx.conto_esegui = values[0];
	blocco = values[1];
	for (var i=0; i< values[0]; i++)
		_esegui(ctx, blocco);
	// is_ripeti = true;
}

// function _esegui (node id): void {
function _esegui(ctx: Context, blocco: Cell[]): void {
   // push_sc (id);
   // push_sc (token);
	ctx.linea_com = blocco;
  	var i_cell = 0;
	ini_valuta(ctx);
	while (! is_finito) {
		i_cell = valuta_token(ctx, i_cell);	// eseguito per ogni token
	}
	// blk_in (ha_blocco_valore && (n_arg_attesi > 0));
  	// blk_in(0);
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
  push_sc (ctx.funzione);
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

export function ini_main(): void {
	contesti = [];
	liv_contesto = -1;
}

// inizializzazione quasi totale di Commander
export function ini_exec(): void {
	var ctx: Context = {
		'id_contesto': 0,
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
		'ini_token': 0,
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
