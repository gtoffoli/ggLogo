// LogoControl.tsx
// 251116 - 1st version: inspired to Ilcontro.cpp of IperLogo
// 251129 - of resolveCommand also to functions calling valuta_token
// 251230 - converted TAB to spaces

import { devType, contextType, Context, Cell, CommandDef, ModParola, ProcedureDef } from './CoreDefinitions';
import { valuta_token, globalVariables, userProcedures } from './Interpreter';
import { ini_streams } from './Streams';

// codifica dei tipi di contesto (id_contesto)
const CT_TOP = 0;      // contesto iniziale (top_level)
const CT_PAUSA = 1;    // contesto attivato da PAUSA
const CT_RECUPERA = 2;  // contesto attivato da RECUPERA
const CT_EVENT = 3;

const ID_RUN = 1;
const ID_RUNRESULT = 2;


export var contesti: Context[] = [];
export var liv_contesto: number = 0; /* livello di nidificazione dei contesti */

var ha_blocco_valore: boolean = false;
var is_ripeti: boolean = false;
var is_funzione: boolean = false;
export var liv_analisi: number; // parentesi non chiuse
var is_nestedExec: boolean;
var n_locali: number = 0;       // numero variabili locali nella procedura
var n_argomenti: number;        // numero argomenti della procedura
var is_vai: boolean = false;    // appena incontrato comando VAI
export var risultato: any;      // risultato della procedura corrente
export var is_stop: boolean;    // incontrata fine di valutazione di procedura (UFUN)
var is_riporta: boolean; // procedura termina con RIPORTA

var c_stack: any[] = [];
export var v_stack: any[] = [];
var stk_funzioni: any[] = [];    // stack di nest procedure attive dur. esecuzione
var stk_livelli: any[] = [];    // stack di camm. att. dur.esecuz. (blocchi) ?? */


export function _NOP(values: any[]): void {
}

export function _ERROR(values: any[]): any[] {
}

export function _STOP(ctx: Context, values: any[]): void {
  console.log('function _STOP', values);
  is_stop = true;
  sf_out(ctx); // anticipo, per non confliggere con uf_ret
}

export function _OUTPUT(ctx: Context, values: any[]): void {
  console.log('function _OUTPUT', values);
  risultato = values[0];
  is_stop = true;
  is_riporta = true;
  sf_out(ctx); // anticipo, per non confliggere con uf_ret
}

export function _REPEAT(ctx: Context, values: any[]): void {
  console.log('function _REPEAT', values[0], values[1]);
  // ctx.conto_esegui = values[0];
  ctx.conto_esegui = values[0].val;
  is_ripeti = true;
  // var block = [values[1]];
  var block = [values[1].val];
  console.log('function _REPEAT', ctx.conto_esegui, block);
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  // _esegui(ctx, block);
  blk_in(ctx, block, 0);
}

export function _TEST(ctx: Context, values: any[]): void {
  console.log('function _TEST', values);
  ctx.val_verifica = values[0].val;
}

export function _IFTRUE(ctx: Context, values: any[]): void {
  console.log('function _IFTRUE', values);
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  if (ctx.val_verifica)
    block_exec(ctx, [values[0].val]);
}
export function _IFFALSE(ctx: Context, values: any[]): void {
  console.log('function _IFFALSE', values);
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  if (! ctx.val_verifica)
    block_exec(ctx, [values[0].val]);
}

export function _IF(ctx: Context, values: any[]): void {
  console.log('function _IF', values);
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  if (values[0].val)
    block_exec(ctx, [values[1].val]);
}
export function _IFELSE(ctx: Context, values: any[]): void {
  console.log('function _IFELSE', values);
  if (values[0].val)
    block_exec(ctx, [values[1].val]);
  else
    block_exec(ctx, [values[2].val]);
}

function block_exec(ctx: Context, block: Cell[][]): void {
  ctx.conto_esegui = 1;
  blk_in(ctx, block, 0);
}

function _esegui(ctx: Context, block: Cell[][]): void {
  console.log('_esegui', liv_contesto, ctx.liv_esecuzione, block);
  push_sc(ctx.i_token);
  push_sc(ctx.block);
  blk_in(ctx, block, 0);
}

export function AssertContesto(ctx: Context): void {
  console.log('AssertContesto', c_stack, v_stack);
  if (! ((ctx.liv_procedura >= 0) && (ctx.liv_funzione >= 0) && (ctx.liv_esecuzione >= 0)
      && (ctx.conto_esegui >= 0) && (ctx.n_arg_attesi >= 0) && (ctx.n_arg_trovati >= 0)
      // && (ctx.liv_procedura < 2) && (ctx.liv_funzione < 3) // solo per test
      )) {
    console.log(ctx);
    throw new Error("INVALID CONTEXT");
  }
}

// push di un valore sullo stack di controllo
function push_sc (val: any): void {
  c_stack.push(val);
}
// pop di un valore dallo stack di controllo
function pop_sc(): any {  
  if (!c_stack.length)
    throw new Error("C STACK UNDERFLOW");  
  return c_stack.pop();
}

//  push di un valore sullo stack dei valori
export function push_sv (val: any): void {
  v_stack.push(val);
}
// pop di un valore dallo stack dei valori
export function pop_sv(): any {
  if (!v_stack.length)
    throw new Error("V STACK UNDERFLOW");  
  return v_stack.pop();
}
// ritorna il valore dell' i-esimo elemento dalla cima dello stack dei valori
function get_sv(i: number): any {
  if (!v_stack.length)
    throw new Error("V STACK UNDERFLOW");  
  return v_stack[i];
}

export function push_arg(ctx: Context, arg: any): void {
    ctx.n_arg_trovati += 1;
    v_stack.push(arg);
  console.log('PUSH_ARG', arg, ctx.n_arg_trovati, v_stack.length, v_stack);
  for (var i=0; i<v_stack.length; ++i)
    console.log('push_arg', i, v_stack[i]);
}

function push_contesto(ctx: Context, id: number): void {
  AssertContesto(ctx);
  ctx.id_contesto = id;
  // contesti[liv_contesto+1] = contesti[0];
  contesti.push(ctx)
  ++liv_contesto;
  ctx = contesti[liv_contesto];
  ctx.funzione = null;
  AssertContesto(ctx);
}

function pop_contesto(ctx: Context) {
  var locale: number;
  AssertContesto(ctx);
  locale = ctx.dev_recupera;
    // trap(liv_contesto > 0);
    --liv_contesto;
  ctx = contesti.pop();
  ctx.id_contesto = (liv_contesto == 0) ?
    0 : (contesti [liv_contesto]).id_contesto;  // contesto 0 e' riservato
  if (locale != devType.NULL_DEV) {
      // ctx.linea_com = [];
      ctx.block = [];
    if (   (locale != ctx.dev_recupera)
        && (! (_fstato [locale] & devType.O_FINESTRA))
       ) f_chiudi (locale);
  }
  AssertContesto(ctx);
}

// salvataggio di parte del contesto sullo stack di controllo
function pushco(ctx: Context): void {
  console.log('pushco', ctx);
  AssertContesto(ctx);
  push_sc(ctx.conto_parentesi);
  push_sc(ctx.n_arg_trovati);
  push_sc(ctx.n_arg_attesi);
  push_sc (ctx.parentesi);
  // push_sc (err_token);
  AssertContesto(ctx);
}
 
// ripristino di parte del contesto dallo stack di controllo
function popco(ctx: Context): void {
  AssertContesto(ctx);
  // err_token = pop_sc ();
  ctx.parentesi = pop_sc();
  ctx.n_arg_attesi = pop_sc();
  ctx.n_arg_trovati = pop_sc();
  ctx.conto_parentesi = pop_sc();
  AssertContesto(ctx);
  console.log('popco', ctx);
}

// azioni comuni al riconoscimento di un token funzione (sfun o ufun)
function f_in(ctx: Context, funzione): void {
  console.log('f_in', ctx);
  AssertContesto(ctx);
  push_sc(ctx.funzione);
  pushco (ctx);
  ctx.funzione = funzione;
  ctx.n_arg_trovati = 0;
  ++ctx.liv_funzione;
  AssertContesto(ctx);
}

// azioni comuni al termine della valutazione di sfun e ufun
function f_out (ctx: Context): void {
  AssertContesto(ctx);
  console.log('f_out -> popco');
  popco(ctx);
  ctx.funzione = pop_sc();
  // if (is_funzione)
  //    push_arg(pop_sv());
  --ctx.liv_funzione;
  //if (ctx.conto_esegui > 0)
  //_esegui ((node) idRun);
  // _esegui (ctx, blocco);
  // idRun = 0;
  AssertContesto(ctx);
  console.log('f_out', ctx);
}

// ingresso nella valutazione di una System Function
export function sf_in(ctx: Context, funzione: SystemFunction): void {
  f_in(ctx, funzione);
/*
  get_sf (funzione);
  if (IS_PR_MM)
    _letterale ();
  else if (   (liv_funzione != stk_livelli [liv_procedura] + 1)
    && (! IS_PR_ESEGUI) 
    && ((! IS_PR_FUNZIONE) || IS_PR_PROC)
  ) errore (19, funzione, NULLP);  // primitiva non riporta !
  n_arg_attesi = N_NOMINALE;
*/
  // ctx.n_arg_attesi = funzione.definition.args.length;
    const args = funzione.definition.args;
    ctx.n_arg_attesi = (args) ? args.length : 0;
  console.log(sf_in, ctx.n_arg_attesi);
}

// uscita della valutazione di una System Function
export function sf_out(ctx: Context): void {
  console.log('sf_out', ctx);
  f_out(ctx);
}

// ingresso nella valutazione di una User Function
export function uf_in(ctx: Context, funzione: UserFunction): void {
  console.log('UF_IN', funzione.definition);
  f_in(ctx, funzione);
  ctx.n_arg_attesi = funzione.definition.parameters.length;
}

// inizia l' esecuzione di una procedura LOGO con push di uno stack-frame
export function uf_call(ctx: Context): void {
  const parameters = ctx.funzione.definition.parameters;
  const body = ctx.funzione.definition.body;
  const n_parameters = parameters.length;
  console.log('uf_call 1', parameters, body, ctx.block, ctx.block.length, ctx.i_line, ctx.i_token);
  AssertContesto(ctx);
  var argomenti: any[] = [];
  // riconosce eventuale ricorsione di coda: 
  // e proc. da attivare coincide con proc.attiva
  push_procedure_context(ctx);
  ctx = contesti[liv_contesto];
  push_sc(n_parameters);
  // svuota stack argomenti e ne copia il valore in locale
  for (var i=0; i<n_parameters; ++i)
    argomenti.push(pop_sv());
  // binding temporaneo degli argomenti con salvataggio vecchio binding
  for (var i=0; i < n_parameters; ++i)
    pushloc(parameters[i], argomenti[n_parameters-i-1]);
  /* this was replaced by push_procedure_context
  ++ctx.liv_procedura;
  stk_funzioni.push(ctx.funzione);
  stk_livelli.push(ctx.funzione);
  */
  is_stop = false;
  risultato = null;
  ctx.n_arg_attesi = ctx.n_arg_trovati = 0;
  block_exec(ctx, body);
  AssertContesto(ctx);
}

// finalizza l' esecuzione di una procedura LOGO con pop di uno stack-frame
export function uf_ret(ctx: Context): void {
  console.log('uf_ret in', ctx.block.length, ctx);
  AssertContesto(ctx);
  is_funzione = is_riporta;
  is_riporta = false;
  /*  this was replaced by pop_procedure_context
  var procedura; // valore attualmente non usato
  procedura = stk_funzioni.pop();
  stk_livelli.pop();
  --ctx.liv_procedura;
  */
  // esce da tutti i blocchi in procedura corrente
  while (ctx.liv_esecuzione > 0) {
    if (ctx.conto_parentesi > 0) break;
    blk_out (ctx);
  };
  // spurga le variabili argomento
  const n_parameters = pop_sc();  // numero delle variabili argomento
  poploc(ctx, n_parameters);      // spurgo delle variabili argomento
  is_stop = false;
  ctx = pop_procedure_context();
  f_out(ctx);
  console.log('uf_ret out', ctx.block.length, ctx);
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
export function parenin(ctx: Context): void {
  console.log('parenin', ctx);
  push_sc(ctx.funzione);
  ctx.funzione = null;
  pushco(ctx);
  ctx.n_arg_attesi = (ctx.n_arg_attesi > 0)? 1: 0;
  ctx.n_arg_trovati = 0;
  ctx.parentesi = -1;
  ++ctx.conto_parentesi;
}

/*-------------------------
  uscita da parentesi tonde
  -------------------------*/
export function parenout(ctx: Context, par_count: number): void {
  var locale: number;
  console.log('parenout, n=', par_count);
  for (var i=0; i<par_count; ++i) {
    if (ctx.n_arg_trovati > 1)
      throw new Error("INVALID CONTEXT", get_sv (1));
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
  AssertContesto(ctx);
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
  AssertContesto(ctx);
}

// azioni comuni all' uscita da un blocco
export function blk_out(ctx: Context): void {
  var OldTotal: number, OldCount: number;
  var locale: number;
  var id: number;
  var block: Cell[][];
  AssertContesto(ctx);
  parenout(ctx, ctx.conto_parentesi);
  n_locali = pop_sc ();
  poploc(ctx, n_locali);
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
/*
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
*/
  AssertContesto(ctx);
}

export function ini_main(): void {
  contesti = [];
  liv_contesto = -1;
}

// inizializzazione quasi totale di Commander
export function ini_exec(): void {
  console.log('ini_exec - 1');
  var ctx: Context = {
    'id_contesto': contextType.CT_TOP,
    // 'dev_recupera': devCode.CONSOLE,
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
    'block': [],
    'i_line': 0,
  };
  ini_valuta(ctx);
  ini_streams(ctx);
  console.log('ini_exec - 2', ctx);
  contesti.push(ctx);
  liv_contesto += 1;
  liv_analisi = 0;
  is_nestedExec = false;
}

// inizializzazione parziale di Commander (NestedExec)
export function ini_valuta(ctx: Context): void {
  ctx.i_line = 0;  
  ctx.i_token = 0;  
  ctx.block = [];  
  ctx.funzione = null;  /* nessuna funzione incontrata */
  ctx.n_arg_attesi = 0;  /* numero di parametri atteso dalla funzione corrente*/
  ctx.n_arg_trovati = 0;  /* numero di oggetti sullo stack per la fun corrente*/
  ctx.conto_parentesi = 0;
  ctx.parentesi = -1;    /* = liv_funzione se sfun corr. e' preceduta da "("*/
  is_stop = false;    /* se vero e' terminata esecuz. procedura corrente */
  v_stack = [];
}

// crea nuovo contesto, che eredita parzialmente dal precedente e lo mette sullo stack
// delega a blk_in (richiamato da block_exec) l'inizializzazione di parecchi elementi
function push_procedure_context(ctx: Context): void {
  contesti.push(Object.assign({}, ctx)); // aggiungo una copia in cima
  liv_contesto += 1;
  var ctx: Context = contesti[liv_contesto]; // prendo riferimento alla copia e lo aggiorno
  ctx.id_contesto = contextType.CT_PROCEDURE;
  ctx.liv_procedura += 1;
  ctx.liv_esecuzione = 0;
  is_nestedExec = false;
}

function pop_procedure_context(): Context {
  var ctx = contesti.pop();
  liv_contesto -= 1;
  return contesti[liv_contesto];  
}
