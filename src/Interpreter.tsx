// Interpreter.tsx
// 251024 - 1st version: extracted logoInterpreter function from LogoShell.tsx
// 251025 - as proposed by Gemini on 251024
// 251104 - logoInterpreter gets command definitions (not used yet) and localization thanks to additional arguments 
// 251107 - started extension of Parser
// 251114 - dry command execution in auxiliary functions of Intepreter
// 251115 - integration of command execution with CommandDef (added the ref field)
// 251129 - propagation downward of resolveCommand also to functions in LogoControl module
// 251230 - converted TAB to spaces and revised the indentation 



import i18n from './i18n';
import { ModParola, CellType, Delimiter, Cell, Context, ParamDef } from './CoreDefinitions';
import { SEPARATORS, isSeparator, SystemFunction, CORE_DEFINITIONS, CommandDef, CoreDefinitionKeys, FunClass, FunSignature, turtleStrokes } from './CoreDefinitions';
import { UserFunction, ProcedureDef, Arg } from './CoreDefinitions';
import { getByValue } from './UseLocalization';
import { LogoGlobalState, TurtleState, DrawingCommand } from './LogoState';
import { Parse, infix_operators, unParse } from './Parser';
import { contesti, liv_contesto, liv_analisi, v_stack, is_stop, risultato } from './LogoControl';
import { push_sv, pop_sv,  push_arg, sf_in, sf_out, uf_in, uf_call, uf_ret, blk_out, parenin, parenout } from './LogoControl';
import { ini_main,ini_exec, ini_valuta, AssertContesto } from './LogoControl';
import { isProcedureDefinition, iniDefine, pushProcedureLine } from './LogoDefine';
import { localizedTruthValues, normalizeBoolean } from './Logic';
import { InputSource, OutputChannel } from './Streams';
import { ShellSource, ShellOutput, InteractiveData } from './Streams';
import { keywordResolver, commandResolver } from './UseLocalization';

export var globalVariables: Record<string, any> = {};
export var userProcedures: Record<string, ProcedureDef> = {};
export var mod_parola: ModParola;// modalita' di esecuzione di una parola LOGO
var next_type: CellType | null;
var next_val: any;
var function_key = null;
var definition: CommandDef | ProcedureDef | null = null;  // definition of system function (primitive) or of user function (procedure)
var classes = [];    // info related to primitive classificaztion
var signature = [];    // info  related to arguments and result of primitive
var oneormore = false;  // true if primitive accepts an indefinite number of arguments 
var is_function = false;// true if primitive returns a result

const N_MINIMO = 1; // minimo numero di argomenti per la funzione corrente

export class LogoError extends Error {
  constructor(public message: string, public code?: string) {
    super(message);
    this.name = "LogoError";
  }
}

export function throwError(key: string, fun?: string, arg?: string) {
  var msg = i18n.t('err.' + key) + '\n';
  if (fun) msg = msg.replace('$1', getByValue(fun));
  if (arg) msg = msg.replace('$2', arg);
  throw new LogoError(msg);
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
    while (this.sourceStack.length > 0) {
      try {
        console.log('AsynchronousLogoInterpreter WAITING:');
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
        console.error("Errore durante l'esecuzione:", error.message);
        // 1. Gestione del feedback all'utente
        if (error instanceof LogoError) {
          // this.output.error(error.message); // Usa il canale d'errore della Shell
          this.reportError(error);
        } else {
          // Questo è un errore di sistema (bug nel TS)
          console.error("Errore di sistema:", error.message);
          // this.output.error("ERRORE INTERNO: " + error.message);
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
    // Svuota lo stack delle sorgenti tranne la Shell
    while (this.sourceStack.length > 1) {
      this.sourceStack.pop();
    }
    // Qui potresti voler svuotare anche lo stack delle variabili locali 
    // o degli stati pendenti (es. cicli REPEAT interrotti)
    console.log("Interprete resettato dopo l'errore.");
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
    console.log('>>> get_token >>>', next_token, next_type, next_val);
  }

  // utility to collect in global variables some info related to primitive definition
  private get_function(ctx: Context): void {
    function_key = ctx.funzione.coreKey;
    definition = ctx.funzione.definition;
    signature = definition.signature;
    classes = definition.classes || [];
    if (signature) {
      is_function = (signature.includes(FunSignature.FUNCTION));
      oneormore =  (signature.includes(FunSignature.ONEORMORE));
    } else {
      is_function = false;
      oneormore = false;
    }
  }

  private get_values(ctx: Context): any[] {
    var values: any[] = [];
    console.log('GET_VALUES-1', v_stack)
    for (var i=0; i<ctx.n_arg_trovati; i++) {
      values.push(v_stack.pop());
    }
    values.reverse();
    console.log('GET_VALUES-2', values)
    return values;
  }

  private async evaluateToken() {
    var ctx: Context;
    var numeric: number;
    var coreKey: CoreDefinitionKeys;
    var result = null;
    var cell: Cell;
     
    while (true) {
      ctx = contesti[liv_contesto];
      console.log('evaluateToken', ctx.i_line, ctx.i_token, ctx.block);
      console.log('- conto_esegui', ctx.conto_esegui);
      console.log('-- conto_parentesi', ctx.conto_parentesi);
  
      while (true) {
        ctx = contesti[liv_contesto];
        if (ctx.i_line >= ctx.block.length) {
          return;
        }
        console.log('?????', ctx.block.length, ctx.block, ctx.i_line, ctx.i_token, ctx.liv_esecuzione, ctx.liv_procedura);
        if (ctx.i_token >= ctx.block[ctx.i_line].length) {
          ctx.i_line += 1;
          ctx.i_token = 0; // 260131
          if (ctx.i_line >= ctx.block.length) {
            if (ctx.liv_esecuzione > 0) { // prima chiudo i blocchi interni
              blk_out(ctx);
              continue;
            }
            else if (ctx.liv_procedura > 0) { // poi chiudo le procedure
              uf_ret(ctx);
              ctx = contesti[liv_contesto];
              continue;
            }
            else {
              return;
            }
          }
          else {
            ctx.i_token = 0;
            break;
          }
        }
        else
          break;
        AssertContesto(ctx);
      }
  
      cell = ctx.block[ctx.i_line][ctx.i_token];
      if (ctx.i_token === 0)
        mod_parola = ModParola.VERB;    // parola non preceduta da modificatore
      console.log('token-0', mod_parola);
      console.log('token-1', liv_contesto, ctx.block, ctx.i_line, ctx.i_token, cell, mod_parola);
      console.log('token-2', ctx);
      ctx.i_token += 1; // next token!!!
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
        case CellType.WORD:
          if (mod_parola === ModParola.LITERAL) {
            if (localizedTruthValues.includes(cell.val))
              cell = {type: CellType.BOOLEAN, val: (normalizeBoolean(cell.val) === 'TRUE') ? true : false };
            push_arg(ctx, cell);
          }
          else if (mod_parola === ModParola.VARIABLE) {
            // cell = {type: CellType.WORD, val: globalVariables[cell.val]};
            cell = globalVariables[cell.val];
            console.log('VARIABILE', cell);
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
                console.log('SFUN', coreKey, definition);
                sf_in(ctx, funzione);
                this.currentCommand = coreKey;
              }
              else if (Object.keys(userProcedures).includes(verb)) {
                definition = userProcedures[verb];
                funzione = { type: CellType.UFUN, name: verb, definition: definition}; 
                console.log('UFUN', verb, definition);
                uf_in(ctx, funzione);
              }
            }
          }
          // la keyword TO quota il nome di procedura
          if (coreKey && (coreKey === 'TO'))
            mod_parola = ModParola.LITERAL;
          else
            mod_parola = ModParola.VERB;
          break;
        case CellType.OPERATOR:
          console.log('OPERATOR-1', cell.val);
          switch (cell.val) {
            case Delimiter.DEL_PARSINISTRA:
              parenin(ctx);
              this.get_token(ctx);
              console.log('DEL_PARSINISTRA', next_type, next_val);
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
                if (ctx.n_arg_trovati < N_MINIMO) {
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
                    console.log('+++ IS_FUNCTION', values, result);
                  }
                  else {
                    definition.ref(values);
                    console.log('--- NOT IS_FUNCTION', values);
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
            default: // infix operator: + - * / ^  = < >
              console.log('DEFAULT', cell.val);
              coreKey = cell.val;
              definition = CORE_DEFINITIONS[coreKey];
              funzione = { type: CellType.SFUN, coreKey: coreKey, definition: definition};
              console.log('OPERATOR-2', cell.val, coreKey, definition);
              sf_in(ctx, funzione); // come gestire operando precedente? come gestire +/- prefissi?
              break;
          }
      }
  
      // questo ciclo serve per eseguire le funzioni attivabili,
      // consumando gli eventuali argomenti e valutando le espressioni;
      // termina se non vengono generati risultati (che potrebbero aggiornare le condizioni di attivazione)
      // avanza nella scansione dell'input solo come eventuale risultato di look-ahead
      do {
        result = null;
        this.get_token(ctx); // => next_type, next_val
        console.log('funzione?', ctx.funzione, ctx.liv_funzione, ctx.parentesi, ctx.n_arg_trovati, ctx.n_arg_attesi, next_val);
        var precedence = ((ctx.funzione) && (ctx.funzione.type === CellType.SFUN) && (isSeparator(ctx.funzione.coreKey))) ?
                         SEPARATORS[ctx.funzione.coreKey].precedence : 0;
        var top_value = (v_stack.length) ? v_stack[v_stack.length-1] : null;
        console.log('PRECEDENCE', precedence, next_val, top_value, ctx.funzione);
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
          console.log('CTX.FUNZIONE', oneormore, ctx.parentesi, ctx.liv_funzione);
        }
        if (   (ctx.funzione)
              && (   (ctx.n_arg_trovati === ctx.n_arg_attesi)
                  && ((!oneormore) || (ctx.parentesi != ctx.liv_funzione))
                 )
             ) {
  
          if (ctx.funzione.type === CellType.SFUN) {
            console.log('eseguo FUNZIONE', ctx.funzione);
            var values = this.get_values(ctx);
            console.log('VALUES', values);
            var is_exec = false;
            if (ctx.funzione.coreKey === 'TO') {
              ctx.i_token -= 1;
              definition.ref(values);
              ctx.i_token = 1000;
            }
            else if (classes.includes(FunClass.EXEC)) {
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
            else if (classes.includes(FunClass.TURT)) {
              // const activeWin = this.state.windows[this.state.activeWindowId];
              const activeWin = this.getState().windows[this.getState().activeWindowId];
              if (!activeWin)
              console.log("ERRORE: Nessuna finestra grafica attiva.");
              let turtleStroke: boolean = (turtleStrokes.includes(ctx.funzione.coreKey));
              var newTurtleState: TurtleState;
              var drawingCommand: DrawingCommand;
              if (turtleStroke) {
                [ newTurtleState, drawingCommand ] = definition.ref(values, activeWin.turtleState);
                console.log('turtleStroke', newTurtleState, drawingCommand);
              } else {
                if (is_function) {
                  result = definition.ref(values, activeWin.turtleState);
                }
                else {
                  newTurtleState = definition.ref(values, activeWin.turtleState);
                  console.log('No turtleStroke', newTurtleState);
                }
              }
      
              // Dispatch (Aggiornamento dello Stato Globale)
              if (newTurtleState !== undefined) { // è stato calcolato un nuovo turtleState: va comunicato
                console.log('NEWSTATE', newTurtleState);
                this.dispatch({ 
                    type: 'UPDATE_TURTLE_STATE', 
                    windowId: this.getState().activeWindowId,
                    newState: newTurtleState 
                });
                activeWin.turtleState = newTurtleState;
              }
              if (turtleStroke) { // è (anche) da aggiungere un'operazione sul canvas
                console.log('drawingCommand', drawingCommand);
                this.dispatch({ 
                  type: 'ADD_DRAWING_COMMAND', 
                  windowId: this.getState().activeWindowId,
                  command: drawingCommand 
                });
              }
              // activeWin.turtleState = newTurtleState;
            }
            else {
              if (is_function) {
                result = definition.ref(values);
                console.log('+++ IS_FUNCTION', values, result);
              }
              else {
                definition.ref(values);
                console.log('--- NOT IS_FUNCTION', values);
              }
            }
            if (!is_exec)   // in alcuni casi, come REPEAT, sf_out viene anticipato
              sf_out(ctx);
            if (result !== null) {
              push_arg(ctx, result);
            }
            console.log('USCITO DA SFUN - ctx:', ctx);
          }
          else if (ctx.funzione.type === CellType.UFUN) {
            console.log('evaluateToken UFUN', ctx.n_arg_trovati, ctx.n_arg_attesi);
            uf_call(ctx);
            ctx = contesti[liv_contesto];
          }
          if (is_stop) {
            console.log('is_stop');
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

