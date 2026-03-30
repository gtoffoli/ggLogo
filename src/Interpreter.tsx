// Interpreter.tsx
// 251024 - 1st version: extracted logoInterpreter function from LogoShell.tsx

import i18n from './i18n';
import { ModParola, CellType, Delimiter, Cell, Context, ParamDef } from './CoreDefinitions';
import { SEPARATORS, isSeparator, SystemFunction, CORE_DEFINITIONS, CommandDef, CoreDefinitionKeys, FunClass, FunSignature, turtleStrokes } from './CoreDefinitions';
import { UserFunction, ProcedureDef, Arg } from './CoreDefinitions';
import { getByValue } from './UseLocalization';
import { LogoGlobalState, TurtleState, DrawingCommand } from './LogoState';
import { Parse, infix_operators, BLANK, unParse, nodeToString } from './Parser';
import { contesti, liv_contesto, liv_analisi, v_stack, is_stop, is_traccia, risultato, stopAsynchronousActivities } from './LogoControl';
import { push_sv, pop_sv,  push_arg, sf_in, sf_out, uf_in, uf_call, uf_ret, blk_out, parenin, parenout } from './LogoControl';
import { ini_main,ini_exec, ini_valuta, AssertContesto } from './LogoControl';
import { isProcedureDefinition, iniDefine, pushProcedureLine } from './LogoDefine';
import { localizedTruthValues, normalizeBoolean } from './Logic';
import { InputSource, OutputChannel } from './Streams';
import { ShellSource, ShellOutput, InteractiveData } from './Streams';
import { keywordResolver, commandResolver } from './UseLocalization';
import { checkFormatColor } from './TurtleGraphics';

export var globalVariables: Record<string, any> = {};
export var userProcedures: Record<string, ProcedureDef> = {};
export var mod_parola: ModParola;// modalita' di esecuzione di una parola LOGO
var next_type: CellType | null;
var next_val: any;
export var function_key = null;
var definition: CommandDef | ProcedureDef | null = null;  // definition of system function (primitive) or of user function (procedure)
var arg_definitions: any[] = [];
var classes = [];    // info related to primitive classificaztion
var signature = [];    // info  related to arguments and result of primitive
var oneormore = false;  // true if primitive accepts an indefinite number of arguments
var zeroormore = false;  // true if primitive accepts an indefinite number of arguments, even zero
var is_function = false;// true if primitive returns a result

const N_MINIMO = 1; // minimo numero di argomenti per la funzione corrente

var isInterrupting: boolean = false;
export function setInterruption(value: boolean) { isInterrupting = value; }

export class LogoError extends Error {
  constructor(public message: string, public code?: string) {
    super(message);
    this.name = "LogoError";
  }
}

export function throwError(key: string, fun?: any, arg?: string) {
  console.log('throwError', key, fun, function_key, (fun === null));
  var msg = i18n.t('err.' + key) + '\n';
  if (fun === null) msg = msg.replace('$1', getByValue(function_key));
  else if (fun) msg = msg.replace('$1', getByValue(fun));
  // if (arg != undefined) msg = msg.replace('$2', arg);
  if (arg != undefined) msg = msg.replace('$2', nodeToString(arg, true));
  throw new LogoError(msg);
}

function intToBitArray(integer: number, nbits?: number): number[] {
  if (!nbits)
    nbits = 32; // 32 bit è standard per interi in JS
  let weights = [];
  let weight = 1;
  // Itera su 32 bit (standard per interi in JS)
  for (let i = 0; i < nbits; i++) {
    // Estrae il bit e lo inserisce nell'array
    if ((integer >>> i) & 1)
      weights.push(weight);
    weight = weight * 2;
  }
  return weights;
}

export class AsynchronousLogoInterpreter {
  private sourceStack: InputSource[] = [];
  private outputStack: OutputChannel[] = [];
  private getState: () => LogoGlobalState; // Il tipo della funzione
  private dispatch: React.Dispatch<any>;
  private source: ShellSource;
  private dataSource: InteractiveData;
  private currentCommand: string | null; 

  constructor(getState: () => LogoGlobalState, dispatch: React.Dispatch<any>) {
    this.getState = getState;
    // this.source = source;
    this.source = new ShellSource();
    this.dataSource = new InteractiveData();
    this.dispatch = dispatch;
    // this.sourceStack.push(source);
    this.sourceStack.push(this.source);
    this.outputStack.push(new ShellOutput(dispatch));
    this.currentCommand = null;
    console.log('AsynchronousLogoInterpreter CREATED');
    ini_main();
    ini_exec();
    this.run();
  }

  // Metodo per cambiare canale (es. comando "CARICA" o "LEGGI")
  public pushSource(source: InputSource) {
    this.sourceStack.push(source);
    console.log('pushSource', this.sourceStack);
  }

  public popSource() {
    console.log('popSource', this.sourceStack);
    this.sourceStack.pop();
  }

  // Ciclo principale di esecuzione
  public async run() {
    console.log('AsynchronousLogoInterpreter - Ciclo principale di esecuzione');
    setInterruption(false);
    while (this.sourceStack.length > 0) {
      try {
        console.log('AsynchronousLogoInterpreter WAITING:');
        // Check-point critico
        if (isInterrupting) {
          setInterruption(false);
          throw new Error("USER_INTERRUPT");
        }
        // const currentSource = this.sourceStack[this.sourceStack.length - 1];
        const line = await this.getCurrentSource().getLine();
  
        if (line === null) {
          if (this.getCurrentSource().type !== 'SHELL') {
            // La sorgente attuale è finita
            console.log('La sorgente attuale è finita');
            this.sourceStack.pop();
            continue;
          }
          else {
            // break; // O resta in attesa sulla Shell
          }
        }
  
        if (line.trim() === "") continue;
  
        // ESECUZIONE DEL COMANDO
        await this.executeLine(line.trim());
      } catch (error: any) {
        // console.error("Errore durante l'esecuzione:", error.message);
        if ((error as Error).message === "USER_INTERRUPT") {
          console.log("Esecuzione interrotta dall'utente.");
          // Qui gestiamo la pulizia
          await stopAsynchronousActivities();
          this.resetExecutionState();
        }
        // 1. Gestione del feedback all'utente
        else if (error instanceof LogoError) {
          // this.output.error(error.message); // Usa il canale d'errore della Shell
          this.reportError(error);
        } else {
          // Questo è un errore di sistema (bug nel TS)
          console.error("Errore di sistema:", error.message);
        }
        // In caso di errore critico potresti voler svuotare la pila per tornare alla Shell
        // 2. REINIZIALIZZAZIONE (Il "Reset")
        this.resetExecutionState();
      }
    }
  }

  private async executeLine(line: string) {
    // Qui invochi il tuo "parser sintattico avanzato"
    console.log(`Eseguo da ${this.sourceStack[this.sourceStack.length-1].name}: ${line}`);
    // Se il comando è "LEGGI", chiamerai this.pushSource(...)
    const ctx: Context = contesti[liv_contesto];
    if (this.getState().echoInput)
      this.getCurrentOutput().writeLine(line, 'input');
    const parsedLine = Parse(line);
    if (isProcedureDefinition && (keywordResolver(line) !== 'END')) {
      pushProcedureLine(parsedLine);
    }
    else {
      ini_valuta(ctx);
      ctx.block.push(parsedLine);
      await this.evaluateToken();
      console.log('VALORI:', v_stack)
      if (v_stack.length) {
        v_stack.reverse();
        this.getCurrentOutput().writeLine(unParse(v_stack));
      }
    }
  }

  private resetExecutionState() {
    // Chiamare // ini_valuta(); ?
    // Svuota lo stack delle sorgenti tranne la Shell
    while (this.sourceStack.length > 1) {
      this.sourceStack.pop();
    }
    ini_main();
    ini_exec();
    // Qui potresti voler svuotare anche lo stack delle variabili locali 
    // o degli stati pendenti (es. cicli REPEAT interrotti)
    console.log("Interprete resettato dopo errore o interruzione.");
  }

  public getCurrentSource(): InputSource {
    console.log(`getCurrentSource`, this.sourceStack.length);
    return this.sourceStack[this.sourceStack.length - 1];
  }

  public getDataSource(): InteractiveData {
    console.log(`getDataSource`);
    return this.dataSource;
  }

  public getCurrentOutput(): OutputChannel {
    return this.outputStack[this.outputStack.length - 1];
  }

  // Esempio d'uso nell'esecuzione
  public print(text: string) {
    this.getCurrentOutput().writeLine(text);
  }

  public reportError(error: Error) {
    // Usa il canale d'errore della Shell
    this.getCurrentOutput().error(error.message);
  }
  
  // Primitiva SCRIVISU "FILE.TXT
  public pushOutput(channel: OutputChannel) {
    this.outputStack.push(channel);
  }

  // utility to collect in global variables some info related to the token following the one being processed
  private get_token(ctx: Context): void {
    var next_token: Cell | null;
    if (ctx.i_token >= ctx.block[ctx.i_line].length)
      next_token = next_type = next_val = null;
    else {
      next_token = ctx.block[ctx.i_line][ctx.i_token];
      next_type = next_token.type;
      next_val = next_token.val;
    }
    // console.log('>>> get_token >>>', next_token, next_type, next_val);
  }

  // utility to collect in global variables some info related to primitive definition
  private get_function(ctx: Context): void {
    // console.log('get_function', ctx.funzione);
    is_function = false;
    zeroormore = false;
    oneormore = false;
    definition = ctx.funzione.definition;
    arg_definitions = definition.args;
    if (ctx.funzione.type === CellType.SFUN) {
      function_key = ctx.funzione.coreKey;
      classes = definition.classes || [];
      signature = definition.signature;
      if (signature) {
        is_function = (signature.includes(FunSignature.FUNCTION));
        zeroormore =  (signature.includes(FunSignature.ZEROORMORE));
        oneormore =  (signature.includes(FunSignature.ONEORMORE));
      }
    }
    else { // UFUN
      function_key = ctx.funzione.name;
    }
  }

  // controlla la validità del valore di un argomento di funzione
  // se necessario e possibile ne converte il tipo
  private check_arg(arg: Cell, argDefinition): any | boolean {
    const arg_type = arg.type;
    if (!argDefinition.type) // è ammesso qualsiasi tipo
      return arg;
    const bits = intToBitArray(argDefinition.type, 12);
    console.log('check_arg', arg, definition, bits);
    for (let i = 0; i < bits.length; i++) {
      switch (bits[i]) {
        case Arg.NUMERO:
          if (arg_type === CellType.NUMBER)
            return arg;
          if ((arg_type === CellType.WORD) && (! isNaN(arg.val)))
            return { type: CellType.NUMBER, val: parseFloat(arg.val) }
          break;
        case Arg.VEROFALSO:
          if (arg_type === CellType.BOOLEAN)
            return arg;
          break;
        case Arg.COLORE:
            return checkFormatColor(arg, function_key);
          break;
        case Arg.PAROLA:
        case Arg.STRINGA:
        case Arg.NOMEARC:
          if (arg_type === CellType.WORD)
            return arg;
          return false;
          break;
        case Arg.LISTANUM:
          if (arg_type === CellType.LIST) {
            var numList = [];
            var cell;
            for (var j=0; j<arg.val.length; j++) {
              cell = arg.val[j];
              if (cell.type === CellType.NUMBER)
                numList.push(cell);
              else if ((cell.type === CellType.WORD) && (! isNaN(cell.val)))
                numList.push({ type: CellType.NUMBER, val: Number(cell.val)});
              else return false;
            }
            return { type: CellType.LIST, val: numList };
          }
          return false;
          break;
        case Arg.LISTAPAR:
        case Arg.LISTA:
          if (arg_type === CellType.LIST)
            return arg;
          break;
        case Arg.NONEMPTY_WORD:
          if ((arg_type === CellType.WORD) && (arg.val.length > 0))
            return arg;
          break;
        case Arg.NONEMPTY_LIST:
          if ((arg_type === CellType.LIST) && (arg.val.length > 0))
            return arg;
          break;
      }
    }
    return false;
  }

  // prende gli argomenti dallo stack dei valori e ne controlla la validità
  // function_key e arg_definitions sono variabili globali assegnate da get_function
  private get_values(ctx: Context, raw?: boolean): any[] {
    const n = ctx.n_arg_trovati;
    if (!n)
      return [];
    var raw_values: Cell[] = [];
    for (var i=0; i<n; i++) { // svuota la cima dello stack dei valori
      raw_values.push(v_stack.pop());
    }
    raw_values.reverse(); // e rimette gli argomenti nell'odrdine giusto
    if (raw)
      return raw_values;
    var values: Cell[] = [];
    var arg: Cell;
    var checked_arg: Cell;
    var definition; // vincoli sul valore di un argomento, dalla definizione della funzione
    for (var i=0; i<n; i++) { // controlla la validità di ogni argomento
      arg = raw_values[i];
      // definition = arg_definitions[Math.min(i, n-1)]; // tiene conto di argomenti in numero indefinito
      definition = arg_definitions[Math.min(i, arg_definitions.length-1)]; // tiene conto di argomenti in numero indefinito
      console.log('get_values', n, i, n-1);
      checked_arg = this.check_arg(arg, definition);
      if (checked_arg)
        values.push(checked_arg);
      else
        // throwError('e05', function_key, arg.val);
        throwError('e05', function_key, arg);
    }
    return values;
  }

  private traceFunction(key: string, liv_procedura: number, args?: any[]): void {
    var line = getByValue(key)
    if (args) {
      // line = line + ' ' + nodeToString(args, false);
      line = line + ' ' + nodeToString(args, true);
    }
    // line = line + ' ' + liv_procedura + ' ' + liv_contesto + ' ' + contesti.length; 
    this.getCurrentOutput().writeLine(line, 'system');
  }

  private traceReturn(cause: string): void {
    var line = 'procedura termina ' + cause;
    this.getCurrentOutput().writeLine(line, 'system');
  }

  private async executeFunction(ctx) {
    // Check-point critico
    if (isInterrupting) {
      setInterruption(false);
      throw new Error("USER_INTERRUPT");
    }
    var result = null;
    if (ctx.funzione.type === CellType.SFUN) {
      // console.log('eseguo FUNZIONE', ctx.funzione);
      var values = this.get_values(ctx);
      // console.log('VALUES', values);
      if (is_traccia)
        this.traceFunction(function_key, ctx.liv_procedura, values);
        // this.traceFunction(function_key, values);
      var is_exec = false;
      if (ctx.funzione.coreKey === 'TO') {
        ctx.i_token -= 1;
        definition.ref(values);
        ctx.i_token = 1000;
      }
      else if (classes.includes(FunClass.EXEC)) {
        if (is_function)
          result = definition.ref(ctx, values);
        else
          definition.ref(ctx, values);
        is_exec = true;
      }
      else if (classes.includes(FunClass.TXIN)) {
        this.dispatch({ type: 'SET_KEYBOARD_TARGET', target: 'data' });
        result = await definition.ref(this.getDataSource());
        this.dispatch({ type: 'SET_KEYBOARD_TARGET', target: 'commands' });
      }
      else if (classes.includes(FunClass.TXOU)) {
        definition.ref(this.getCurrentOutput(), values);
      }
      else if (classes.includes(FunClass.CANVAS)) {
        const activeWin = this.getState().windows[this.getState().activeWindowId];
        var newWindowState: GraphicWindowState;
        // var drawingCommand: DrawingCommand;
        var drawingCommands: DrawingCommand[];
        if (is_function)
          result = definition.ref(values, activeWin);
        else
          // [ newWindowState, drawingCommand ] = definition.ref(values, activeWin);
          [ newWindowState, drawingCommands ] = definition.ref(values, activeWin);
        // Dispatch (Aggiornamento dello Stato Globale)
        if (newWindowState !== undefined) { // è stato calcolato un nuovo windowState: va comunicato
          console.log('NEWSTATE', newWindowState);
          this.dispatch({ 
              type: 'UPDATE_WINDOW_STATE', 
              windowId: this.getState().activeWindowId,
              newState: newWindowState 
          });
          this.getState().windows[this.getState().activeWindowId] = newWindowState;
        }
        // if (drawingCommand !== undefined) { // è stato preparato un nuovo comando
        if (drawingCommands !== undefined) { // è stato preparato un nuovo comando
          this.dispatch({ 
            // type: 'ADD_DRAWING_COMMAND', 
            type: 'ADD_DRAWING_COMMANDS', 
            windowId: this.getState().activeWindowId,
            // command: drawingCommand 
            commands: drawingCommands
          });
        }
      }
      else if (classes.includes(FunClass.TURTLE)) {
        const activeWin = this.getState().windows[this.getState().activeWindowId];
        if (!activeWin)
          console.log("ERRORE: Nessuna finestra grafica attiva.");
        let turtleStroke: boolean = (turtleStrokes.includes(ctx.funzione.coreKey));
        var newTurtleState: TurtleState;
        // var drawingCommand: DrawingCommand;
        var drawingCommands: DrawingCommand[];
        if (turtleStroke) {
          // [ newTurtleState, drawingCommand ] = definition.ref(values, activeWin.turtleState);
          [ newTurtleState, drawingCommands ] = definition.ref(values, activeWin.turtleState);
        } else {
          if (is_function) {
            result = definition.ref(values, activeWin.turtleState);
          }
          else {
            newTurtleState = definition.ref(values, activeWin.turtleState);
          }
        }
        // è da aggiungere un'operazione sul canvas
        // if (turtleStroke) {  // è stato preparato un nuovo comando
        // if (drawingCommand !== undefined) {
        if (drawingCommands !== undefined) {
          this.dispatch({ 
            // type: 'ADD_DRAWING_COMMAND', 
            type: 'ADD_DRAWING_COMMANDS', 
            windowId: this.getState().activeWindowId,
            // command: drawingCommand 
            commands: drawingCommands
          });
        }
        if (newTurtleState !== undefined) { // è stato calcolato un nuovo turtleState: va comunicato
          this.dispatch({ 
              type: 'UPDATE_TURTLE_STATE', 
              windowId: this.getState().activeWindowId,
              newState: newTurtleState 
          });
          activeWin.turtleState = newTurtleState;
        }
      }
      else {
        if (is_function) {
          console.log('sf_call - from interpreter:', function_key);
          result = definition.ref(values);
        }
        else {
          console.log('sf_call - from interpreter:', function_key);
          if (classes.includes(FunClass.ASYNC))
            await definition.ref(values);
          else
            definition.ref(values);
        }
      }
      if (!is_exec) {   // in alcuni casi, come REPEAT, sf_out viene anticipato
        sf_out(ctx);
      }
      if (result !== null) {
        push_arg(ctx, result);
      }
    }
    else if (ctx.funzione.type === CellType.UFUN) {
      // console.log('evaluateToken UFUN', ctx.n_arg_trovati, ctx.n_arg_attesi);
      if (is_traccia)
        this.getCurrentOutput().writeLine(function_key, 'system');
      uf_call(ctx);
      ctx = contesti[liv_contesto];
    }
    return result;
  }

  // si entra dopo ini_valuta: ctx.i_line = 0 , ctx.i_token = 0
  private async evaluateToken() {
    var ctx: Context;
    var numeric: number;
    var coreKey: CoreDefinitionKeys;
    var result = null;
    var cell: Cell;
     
    while (true) {
      ctx = contesti[liv_contesto];
      while (true) {
        ctx = contesti[liv_contesto];
        // prima di iniziare l'esecuzione del body, una procedura ha blocco vuoto
        if ((ctx.liv_procedura > 0) && (ctx.block.length === 0)) {
          if (is_traccia)
            this.traceReturn('dalla fine');
          uf_ret(ctx);
          console.log('dopo uf_ret dalla fine', liv_contesto, contesti[liv_contesto]);
          continue; // ricadiamo dentro al blocco da cui è stata eseguita la procedura
        }
        // vedo se devo uscire da un blocco
        else if (ctx.i_line >= ctx.block.length) {
          if (ctx.liv_esecuzione > 0) { // prima chiudo eventuale bloccho interno
            blk_out(ctx);
            continue; // potrebbe esserci qualche altro blocco da cui uscire
          }
          else if ((liv_contesto > 0) && (typeof contesti[liv_contesto-1].id_contesto === 'string')) { // contesto creato con CATCH?
            pop_contesto();
            continue;
          }
          else {
            return; // non c'è altro da fare; è richiesto un nuovo input
          }
        }
        else if (ctx.i_token >= ctx.block[ctx.i_line].length) {
          ctx.i_line += 1;
          ctx.i_token = 0; // 260131
          continue; // proviamo a vedere se c'è una linea successiva
        }
        AssertContesto(ctx);
        break; // esce dal ciclo di uscita da blocchi e procedure per consumare nuovo token
      }
  
      cell = ctx.block[ctx.i_line][ctx.i_token];
      if (ctx.i_token === 0)
        mod_parola = ModParola.VERB;    // parola non preceduta da modificatore
      // console.log('token-0', mod_parola);
      // console.log('token-1', liv_contesto, ctx.block, ctx.i_line, ctx.i_token, cell, mod_parola);
      // console.log('token-2', ctx);
      ctx.i_token += 1; // next token!!! (quello in corso di valutazione è già in cell)
      coreKey = null;
      switch (cell.type) {
        case CellType.LIST:
          push_arg(ctx, cell);
          break;
        case CellType.QUOTE:
          if (cell.val === '"')
            mod_parola = ModParola.LITERAL;
          else // cell.val === ':'
            mod_parola = ModParola.VARIABLE;
          break;
        case CellType.NUMBER: // può derivare solo dal riconoscimento lessicale di un '-' unario
          push_arg(ctx, cell);
          break;
        case CellType.WORD:
          if (mod_parola === ModParola.LITERAL) {
            if (localizedTruthValues.includes(cell.val))
              cell = {type: CellType.BOOLEAN, val: (normalizeBoolean(cell.val) === 'TRUE') ? true : false };
            push_arg(ctx, cell);
          }
          else if (mod_parola === ModParola.VARIABLE) {
            cell = globalVariables[cell.val];
            // console.log('VARIABILE', cell);
            push_arg(ctx, cell);
          }
          else if (mod_parola === ModParola.VERB) {
            numeric = parseFloat(cell.val);
            if (! isNaN(numeric)) {
              push_arg(ctx, {type: CellType.NUMBER, val: numeric});
            }
            else {
              var verb = cell.val;
              var funzione;
              coreKey = commandResolver(verb);
              if (coreKey) {
                definition = CORE_DEFINITIONS[coreKey];
                funzione = { type: CellType.SFUN, coreKey: coreKey, definition: definition};
                // console.log('SFUN', coreKey, definition);
                sf_in(ctx, funzione);
                this.currentCommand = coreKey;
              }
              else if (Object.keys(userProcedures).includes(verb)) {
                definition = userProcedures[verb];
                funzione = { type: CellType.UFUN, name: verb, definition: definition}; 
                // console.log('UFUN', verb, definition);
                uf_in(ctx, funzione);
              }
              else
                throwError('e02', null, verb);
            }
          }
          // la keyword TO quota il nome di procedura
          if (coreKey && (coreKey === 'TO'))
            mod_parola = ModParola.LITERAL;
          else
            mod_parola = ModParola.VERB;
          break;
        case CellType.OPERATOR:
          // console.log('OPERATOR-1', cell.val);
          switch (cell.val) {
            case Delimiter.DEL_PARSINISTRA:
              parenin(ctx);
              this.get_token(ctx);
              // console.log('DEL_PARSINISTRA', next_type, next_val);
              if (   (next_type === CellType.WORD)
                && (commandResolver(next_val))
                ) ctx.parentesi = ctx.liv_funzione + 1;
              break;
            case Delimiter.DEL_PARDESTRA:
              // parenout(ctx, 1);
              if (ctx.conto_parentesi == 0) {
                throwError('e14', function_key);
              }
              else if (ctx.parentesi === ctx.liv_funzione) {
                this.get_function(ctx);
                // if (ctx.n_arg_trovati < N_MINIMO) {
                if ((!zeroormore) && (ctx.n_arg_trovati < N_MINIMO)) {
                  throwError('e11', function_key);
                }
                else if ((!oneormore) && (ctx.n_arg_trovati > /*N_MASSIMO*/ ctx.n_arg_attesi)) {
                  throwError('e11', function_key);
                }
                else {
                  var values = this.get_values(ctx);
                  var result = null;
                  if (is_function) {
                    result = definition.ref(values);
                    // console.log('+++ IS_FUNCTION', values, result);
                  }
                  else {
                    definition.ref(values);
                    // console.log('--- NOT IS_FUNCTION', values);
                  }
                  sf_out(ctx);
                  if (result !== null) {
                    push_arg(ctx, result);
                  }
                  this.currentCommand = null;
                  parenout(ctx, 1);
                };
              }
              else
                parenout (ctx, 1);
              break;
            case CellType.BLANK:
              mod_parola = ModParola.VERB;
              break;
            default: // infix operator: + - * / ^  = < >
              const n_arg_attesi = ctx.n_arg_attesi;
              coreKey = cell.val;
              definition = CORE_DEFINITIONS[coreKey];
              funzione = { type: CellType.SFUN, coreKey: coreKey, definition: definition};
              sf_in(ctx, funzione); // come gestire operando precedente? come gestire +/- prefissi?
              // cerca di riconoscere il meno unario non lessicale
              if ((coreKey === '-') &&
                  // preceduto da altro operatore infisso ?
                  (((ctx.i_token > 1) &&
                   (infix_operators.includes(ctx.block[ctx.i_line][ctx.i_token-2].val))) ||
                  (n_arg_attesi === 0)
                )) {
                  console.log('MENO UNARIO');
                  ctx.n_arg_attesi -= 1; // si tratta di meno unario
                }
              break;
          }
      }
  
      // questo ciclo serve per eseguire le funzioni attivabili,
      // consumando gli eventuali argomenti e valutando le espressioni;
      // termina se non vengono generati risultati (che potrebbero aggiornare le condizioni di attivazione)
      // avanza nella scansione dell'input solo come eventuale risultato di look-ahead
      do {
        result = null;
        ctx = contesti[liv_contesto]; // aggiunto 260329
        this.get_token(ctx); // => next_type, next_val
        // console.log('funzione?', ctx.funzione, ctx.liv_funzione, ctx.parentesi, ctx.n_arg_trovati, ctx.n_arg_attesi, next_val);
        var precedence = ((ctx.funzione) && (ctx.funzione.type === CellType.SFUN) && (isSeparator(ctx.funzione.coreKey))) ?
                         SEPARATORS[ctx.funzione.coreKey].precedence : 0;
        var top_value = (v_stack.length) ? v_stack[v_stack.length-1] : null;
        // console.log('PRECEDENCE', precedence, next_val, top_value, ctx.funzione);
        if (   (ctx.n_arg_trovati>0)
          && (next_type === CellType.OPERATOR)
          && (isSeparator(next_val))
          && (SEPARATORS[next_val].precedence > precedence)
          )  { // look ahead in case of value followed by an infix operator
          console.log('LOOK-AHEAD', next_val, CORE_DEFINITIONS[next_val]);
          --ctx.n_arg_trovati;
          sf_in(ctx, { type: CellType.SFUN, coreKey: next_val, definition: CORE_DEFINITIONS[next_val]});
          ++ctx.n_arg_trovati;
          // if (ctx.parentesi == ctx.liv_funzione) ctx.parentesi = -1;  // coordinato con ...
          ctx.i_token += 1;
        }
        if (ctx.funzione) {
          this.get_function(ctx);
          // console.log('CTX.FUNZIONE', oneormore, ctx.parentesi, ctx.liv_funzione);
        }
        if (   (ctx.funzione)
              && (   (ctx.n_arg_trovati === ctx.n_arg_attesi)
                  && ((!oneormore) || (ctx.parentesi != ctx.liv_funzione))
                 )
             ) {
          result = await this.executeFunction(ctx);
          if (is_stop) {
            if (is_traccia)
              this.traceReturn('per stop o output');
            uf_ret(ctx);
            ctx = contesti[liv_contesto];
            if (risultato) {
              push_arg(ctx, risultato);
            }
          }
        }
      } while (result);
    }
  }
}

