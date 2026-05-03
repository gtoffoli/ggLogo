// LogoControl.tsx
// 251116 - 1st version: inspired to Ilcontro.cpp of IperLogo

import { contextType, Context, initialContext, CellType, Cell, CommandDef, ModParola, ProcedureDef } from './CoreDefinitions';
import { throwError, globalVariables, userProcedures } from './Interpreter';
import { resetActivePath } from './TurtleGraphics';
import { resetMidiChannels } from './TimeMusic';

const ID_RUN = 1;
const ID_RUNRESULT = 2;

export var contesti: Context[] = [];
export var liv_contesto: number = 0; /* livello di nidificazione dei contesti */

export var is_traccia: boolean = false; // tracciare l'esecuzione di tutte le primitive e procedure
var ha_blocco_valore: boolean = false;
var is_funzione: boolean = false;
export var liv_analisi: number; // parentesi non chiuse
export var is_nestedExec: boolean;
var n_locali: number = 0;       // numero variabili locali nella procedura
var n_argomenti: number;        // numero argomenti della procedura
export var risultato: any;      // risultato della procedura corrente
export var is_stop: boolean;    // incontrata fine di valutazione di procedura (UFUN)
var is_riporta: boolean;        // procedura termina con RIPORTA

var tracked_functions: string[] = [];
var c_stack: any[] = [];
export var v_stack: any[] = [];
var stk_funzioni: any[] = [];   // stack di nest procedure attive dur. esecuzione
var stk_livelli: any[] = [];    // stack di camm. att. dur.esecuz. (blocchi) ?? */

// primitiva Logo dummy
export function _NOP(values: any[]): void {
}

// primitiva Logo ERROR
export function _ERROR(values: any[]):void {
}

export function cancelNestedExec() {
  is_nestedExec = false;
}

export async function stopAsynchronousActivities(): Promise<void> {
  // Grafica: se c'è un INIZIARIEMPIMENTO attivo, resettare il path temporaneo
  resetActivePath();
  // Audio: Fermare immediatamente tutti i suoni attivi
  // Es. Tone.Transport.stop(), polySynth.releaseAll() e il corrispettivo per i Sampler
  await resetMidiChannels();
}

// interrupt di utente da console Logo
export async function _BYE(values: any[]): Promise<void> {
  await stopAsynchronousActivities();
  // reload the current page
  window.location.reload();
}

function track(s: string) {
  if (tracked_functions.includes(s))
    return false;
  else {
    tracked_functions.push(s);
    return true;
  }
}
function untrack(s: string) {
  var index = tracked_functions.indexOf(s);
  if (index !== -1) {
    tracked_functions.splice(index, 1);
    return true;
  }
  else
    return false;
}

// tracciamento a livello Logo
export function _TRACK(args: any[]): void {
  is_traccia = true;
  for (var i=0; i<args.length; i++)
    if (!track(args[i].val))
       throwError('e06', null, args[i].val);
}
export function _UNTRACK(args: any[]): void {
  is_traccia = false;
  for (var i=0; i<args.length; i++)
    if (!untrack(args[i].val))
       throwError('e06', null, args[i].val);
}

export function _PAUSE(ctx: Context, values: any[]): void {
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  push_contesto(ctx); // conviene fare il push del contesto iniziale?
  ctx = contesti[liv_contesto];
  ctx.id_contesto = contextType.CT_PAUSA;
  ini_valuta(ctx);
  ctx.liv_procedura = 0;
}
// CONTINUE ripristina il contesto subito al di sotto di quello creato con PAUSE
export function _CONTINUE(ctx: Context, values: any[]): void {
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  var pause_level;
  for (var i = liv_contesto; i > 0; i--)
    if ((contesti[i]).id_contesto === contextType.CT_PAUSA) {  // contesto 0 è riservato
      pause_level = i;
      break;
    };
  if (pause_level == undefined)
    throwError('e15', null);
  for (var j = liv_contesto; j >= pause_level; j--) {
      pop_contesto();
  };
}

export function _CATCH(ctx: Context, values: any[]): void {
  const label = (values[0].val);
  const block = [values[1].val];
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  push_contesto(ctx);
  var ctx = contesti[liv_contesto];
  ctx.id_contesto = label;
  block_exec(ctx, block);
}
// THROW ripristina il contesto subito al di sotto di quello creato con CATCH di stesso label
export function _THROW(ctx: Context, values: any[]): void {
  const label = (values[0].val);
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  var catch_level;
  for (var i = liv_contesto; i > 0; i--)
    if ((contesti[i]).id_contesto === label) {
      catch_level = i;
      break;
    };
  if (catch_level == undefined)
    throwError('e15', null);
  for (var j = liv_contesto; j >= catch_level; j--) {
      pop_contesto();
  };
}

export function _STOP(ctx: Context, values: any[]): void {
  is_stop = true;
  sf_out(ctx); // anticipo, per non confliggere con uf_ret
}
export function _OUTPUT(ctx: Context, values: any[]): void {
  risultato = values[0];
  is_stop = true;
  is_riporta = true;
  sf_out(ctx); // anticipo, per non confliggere con uf_ret
}

export function _RUN(ctx: Context, args: any[]): void {
  sf_out(ctx);
  push_nestedExecution_context(ctx, [args[0].val]);
}
export function _REPEAT(ctx: Context, args: any[]): void {
  sf_out(ctx);
  push_nestedExecution_context(ctx, [args[1].val]);
  ctx = contesti[liv_contesto];
  ctx.nestedExecSpecs = { execNumber: args[0].val };
}
export function _REPCOUNT(ctx: Context, values: any[]): Cell {
  sf_out(ctx);
  return { type: CellType.NUMBER, val: ctx.nestedExecCount };
}

export function _TEST(ctx: Context, values: any[]): void {
  ctx.val_verifica = values[0].val;
}

export function _IFTRUE(ctx: Context, values: any[]): void {
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  if (ctx.val_verifica)
    block_exec(ctx, [values[0].val]);
}
export function _IFFALSE(ctx: Context, values: any[]): void {
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  if (! ctx.val_verifica)
    block_exec(ctx, [values[0].val]);
}

export function _IF(ctx: Context, values: any[]): void {
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  if (values[0].val)
    block_exec(ctx, [values[1].val]);
}
export function _IFELSE(ctx: Context, values: any[]): void {
  sf_out(ctx); // anticipo, per non confliggere con blk_in
  if (values[0].val)
    block_exec(ctx, [values[1].val]);
  else
    block_exec(ctx, [values[2].val]);
}

export function _FOREVER(ctx: Context, args: any[]): void {
  sf_out(ctx);
  push_nestedExecution_context(ctx, [args[0].val])
}
export function _WHILE(ctx: Context, args: any[]): void {
  sf_out(ctx);
  push_nestedExecution_context(ctx, [args[1].val])
  ctx = contesti[liv_contesto];
  ctx.nestedExecTest = [args[0].val];
  ctx.nestedExecSpecs = { testWhen: 'before', testHow: true }
}
export function _UNTIL(ctx: Context, args: any[]): void {
  sf_out(ctx);
  push_nestedExecution_context(ctx, [args[1].val]);
  ctx = contesti[liv_contesto];
  ctx.nestedExecTest = [args[0].val];
  ctx.nestedExecSpecs = { testWhen: 'before', testHow: false };
}
export function _DO_WHILE(ctx: Context, args: any[]): void {
  sf_out(ctx);
  push_nestedExecution_context(ctx, [args[0].val]);
  ctx = contesti[liv_contesto];
  ctx.nestedExecTest = [args[1].val];
  ctx.nestedExecSpecs = { testWhen: 'after', testHow: true };
}
export function _DO_UNTIL(ctx: Context, args: any[]): void {
  sf_out(ctx);
  push_nestedExecution_context(ctx, [args[0].val]);
  ctx = contesti[liv_contesto];
  ctx.nestedExecTest = [args[1].val];
  ctx.nestedExecSpecs = { testWhen: 'after', testHow: false };
}

function block_exec(ctx: Context, block: Cell[][]): void {
  ctx.conto_esegui = 1;
  blk_in(ctx, block, 0);
}

function _esegui(ctx: Context, block: Cell[][]): void {
  push_sc(ctx.i_token);
  push_sc(ctx.block);
  blk_in(ctx, block, 0);
}

export function AssertContesto(ctx: Context): void {
  if (! ((ctx.liv_procedura >= 0) && (ctx.liv_funzione >= 0) && (ctx.liv_esecuzione >= 0)
      && (ctx.conto_esegui >= 0) && (ctx.n_arg_attesi >= 0) && (ctx.n_arg_trovati >= 0)
      )) {
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
}

// salvataggio di parte del contesto sullo stack di controllo
function pushco(ctx: Context): void {
  AssertContesto(ctx);
  push_sc(ctx.conto_parentesi);
  push_sc(ctx.n_arg_trovati);
  push_sc(ctx.n_arg_attesi);
  push_sc (ctx.parentesi);
  AssertContesto(ctx);
}
 
// ripristino di parte del contesto dallo stack di controllo
function popco(ctx: Context): void {
  AssertContesto(ctx);
  ctx.parentesi = pop_sc();
  ctx.n_arg_attesi = pop_sc();
  ctx.n_arg_trovati = pop_sc();
  ctx.conto_parentesi = pop_sc();
  AssertContesto(ctx);
}

// azioni comuni al riconoscimento di un token funzione (sfun o ufun)
function f_in(ctx: Context, funzione): void {
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
  --ctx.liv_funzione;
  popco(ctx);
  ctx.funzione = pop_sc();
  AssertContesto(ctx);
}

export function minArgsNumber(definition: CommandDef): number {
  const arg_definitions = definition.args;
  var min_args = 0;
  if (arg_definitions) {
    const max_args = arg_definitions.length;
    min_args = max_args;
    for (let i = 0; i < max_args; i++)
      if (arg_definitions[i].optional === true) min_args -= 1;
  }
  return min_args;
}

// ingresso nella valutazione di una System Function
export function sf_in(ctx: Context, funzione: SystemFunction): void {
  console.log('sf_in', funzione.coreKey);
  f_in(ctx, funzione);
  ctx.n_arg_attesi = minArgsNumber(funzione.definition);
}

// uscita della valutazione di una System Function
export function sf_out(ctx: Context): void {
  f_out(ctx);
}

// ingresso nella valutazione di una User Function
export function uf_in(ctx: Context, funzione: UserFunction): void {
  f_in(ctx, funzione);
  ctx.n_arg_attesi = funzione.definition.parameters.length;
}

// inizia l' esecuzione di una procedura LOGO con push di uno stack-frame
export function uf_call(ctx: Context): void {
  const parameters = ctx.funzione.definition.parameters;
  const body = ctx.funzione.definition.body;
  const n_parameters = parameters.length;
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
  is_stop = false;
  risultato = null;
  ctx.n_arg_attesi = ctx.n_arg_trovati = 0;
  ctx.block = []; // delego a block_exec la creazione di un blocco = body

  ctx.val_verifica = null;
  ctx.conto_esegui = 0;
  ctx.funzione = null;
  ctx.parentesi = -1;
  ctx.conto_parentesi = 0;

  block_exec(ctx, body);
  AssertContesto(ctx);
}

// finalizza l' esecuzione di una procedura LOGO con pop di uno stack-frame
export function uf_ret(ctx: Context): void {
  AssertContesto(ctx);
  is_funzione = is_riporta;
  is_riporta = false;
  // esce da tutti i blocchi in procedura corrente
  if (is_stop)
    while (ctx.liv_esecuzione > 0) {
      if (ctx.conto_parentesi > 0) break;
      blk_out (ctx);
    };
  // spurga le variabili argomento
  const n_parameters = pop_sc();  // numero delle variabili argomento
  poploc(ctx, n_parameters);      // spurgo delle variabili argomento
  is_stop = false;
  pop_procedure_context();
  ctx = contesti[liv_contesto];
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
  // console.log('PUSHLOC', parola, nuovo_valore, globalVariables);
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
    // console.log('POPLOC', parola, valore, globalVariables);
  };
  if (ctx.n_arg_trovati != 0)
    push_sv(risultato);
}

/*---------------------------
  ingresso in parentesi tonde
  ---------------------------*/
export function parenin(ctx: Context): void {
  // console.log('parenin', ctx);
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
  for (var i=0; i<par_count; ++i) {
    if (ctx.n_arg_trovati > 1)
      throw new Error("INVALID CONTEXT", get_sv (1));
    locale = ctx.n_arg_trovati;
    popco(ctx);
    ctx.funzione = pop_sc();
    ctx.n_arg_trovati = ctx.n_arg_trovati + locale;
  }
}

export function blk_ini(ctx): void {
  ctx.funzione = null;
  ctx.conto_parentesi = 0;
  ctx.parentesi = -1;
  ctx.n_arg_attesi = 0;
  ctx.conto_esegui = 0;
  ctx.val_verifica = false;
  ctx.n_arg_trovati = 0;
  ctx.i_line = 0;
  ctx.i_token = 0;
}

// azioni comuni all' ingresso in un blocco
function blk_in(ctx: Context, block: Cell[][], is_arg_atteso: number): void {
  console.log('blk_in', liv_contesto, ctx.liv_esecuzione, block, ctx);
  AssertContesto(ctx);
  push_sc(ctx.funzione);
  ctx.funzione = null;
  push_sc(ctx.ini_token);
  ctx.ini_token = ctx.i_token;
  push_sc(ctx.block);
  ctx.block = block;
  push_sc(ctx.i_line);
  push_sc(ctx.i_token);
  push_sc(ctx.conto_esegui);
  push_sc(ctx.val_verifica);
  pushco(ctx);
  ctx.conto_parentesi = 0;
  ctx.parentesi = -1;
  ctx.n_arg_attesi = is_arg_atteso;
  push_sc(n_locali);
  n_locali = 0;
  ++ctx.liv_esecuzione;
  ctx.conto_esegui = 0;
  ctx.val_verifica = false;
  ctx.n_arg_trovati = 0;
  ctx.i_line = 0;
  ctx.i_token = 0;
  AssertContesto(ctx);
}

// azioni comuni all' uscita da un blocco
export function blk_out(ctx: Context): void {
  var locale: number;
  var id: number;
  var block: Cell[][];
  AssertContesto(ctx);
  parenout(ctx, ctx.conto_parentesi);
  n_locali = pop_sc ();
  poploc(ctx, n_locali);
  locale = ctx.n_arg_trovati;
  // console.log('blk_out -> popco');
  popco(ctx);
  ctx.n_arg_trovati = ctx.n_arg_trovati + locale;
  ctx.val_verifica = pop_sc();
  ctx.conto_esegui = pop_sc();
  // console.log('blk_out - conto_esegui', ctx.conto_esegui)
  ctx.i_token = pop_sc();
  ctx.i_line = pop_sc();
  block = ctx.block;
  // console.log('blk_out - block', ctx.i_token, ctx.i_line, ctx.block)
  ctx.block = pop_sc();
  ctx.ini_token = pop_sc();
  ctx.funzione = pop_sc ();

  --ctx.liv_esecuzione;
  --ctx.conto_esegui;
  if (ctx.conto_esegui > 0) {
    blk_in(ctx, block, 0);
  }
  console.log('blk_out', liv_contesto, ctx);
  AssertContesto(ctx);
}

export function ini_main(): void {
  contesti = [];
  liv_contesto = -1;
}

// inizializzazione quasi totale di Commander
export function ini_exec(): void {
  push_contesto(initialContext);
  liv_analisi = 0;
  is_nestedExec = false;
  is_stop = false;    /* se vero e' terminata esecuz. procedura corrente */
  v_stack = [];
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

// crea nuovo contesto, che eredita dal precedente e lo mette sullo stack
function push_contesto(ctx: Context): void {
  console.log('push_contesto');
  AssertContesto(ctx);
  contesti.push({ ...ctx }); // aggiungo una copia in cima
  liv_contesto += 1;
}

// recuperare da Iperlogo l'eventuale gestione del canale di lettura dei comandi
export function pop_contesto(): void {
  console.log('pop_contesto');
  var ctx = contesti.pop();
  liv_contesto -= 1;
}

// crea nuovo contesto, che eredita parzialmente dal precedente e lo mette sullo stack
// delega a blk_in (richiamato da block_exec) l'inizializzazione di parecchi elementi
function push_procedure_context(ctx: Context): void {
  console.log('push_procedure_context');
  contesti.push({ ...ctx }); // aggiungo una copia in cima
  liv_contesto += 1;
  ctx = contesti[liv_contesto]; // prendo riferimento alla copia e lo aggiorno
  ctx.id_contesto = contextType.CT_PROCEDURE;
  ctx.liv_procedura += 1;
  ctx.liv_esecuzione = 0;
  is_nestedExec = false;
  ctx.funzione = null;
}

function pop_procedure_context(): void {
  var ctx = contesti.pop();
  liv_contesto -= 1;
}

// crea nuovo contesto, che eredita parzialmente dal precedente e lo mette sullo stack
// delega a ...
function push_nestedExecution_context(ctx: Context, block: Cell[][]): void {
  console.log('push_nestedExecution_context');
  contesti.push({ ...ctx }); // aggiungo una copia in cima
  liv_contesto += 1;
  ctx = contesti[liv_contesto]; // prendo riferimento alla copia e lo aggiorno
  ctx.id_contesto = contextType.CT_NESTED_EXEC;
  ctx.block = block
  is_nestedExec = true;
}

export function pop_nestedExecution_context(): void {
  console.log('pop_nestedExecution_context');
  var ctx = contesti.pop();
  liv_contesto -= 1;
}
