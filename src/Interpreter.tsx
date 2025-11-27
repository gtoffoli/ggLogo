// Interpreter.tsx
// 251024 - 1st version: extracted logoInterpreter function from LogoShell.tsx
// 251025 - as proposed by Gemini on 251024
// 251104 - logoInterpreter gets command definitions (not used yet) and localization thanks to additional arguments 
// 251107 - started extension of Parser
// 251114 - dry command execution in auxiliary functions of Intepreter
// 251115 - integration of command execution with CommandDef (added the ref field)
// 251116 - imported some shared values retrieved by LogoShell through React-specific functions


import { ModParola, CellType, Cell, Context, ParamDef } from './CoreDefinitions';
import { SystemFunction, CORE_DEFINITIONS, CommandDef, CoreDefinitionKeys, FunClass, FunSignature, turtleStrokes } from './CoreDefinitions';
import { UserFunction, ProcedureDef } from './CoreDefinitions';
import { LANGUAGE_MAPS } from './LocalizationMaps';
import { LanguageCode } from './UseLocalization';
import { LogoGlobalState, TurtleState, DrawingCommand } from './LogoState';
import { shared_globalState, shared_dispatch } from './LogoShell';
import { Parse, getCharClass, CharClass } from './Parser';
import { contesti, liv_contesto, liv_analisi, v_stack, push_arg, ini_exec, sf_in, sf_out, uf_in, uf_call, uf_ret } from './LogoControl';
import { isProcedureDefinition } from './LogoDefine';

export var mod_parola: ModParola;// modalita' di esecuzione di una parola LOGO
var is_riporta: boolean;		// procedura termina con RIPORTA
var is_interprete: boolean;		/* input e' richiesto da interprete dei comandi */
var is_analisi: boolean;		/* input e' richiesto tramite analisi */
var is_prima_linea: boolean;	/* e' prima linea di input */
var is_errore: boolean;			/* incontrato e ancora non gestito errore */
var is_ciao: boolean;			/* eseguito comando "ciao" */

// var tipo_token: number;	// tipo del token corrente
// var val_token: any; 	//
// var prev_token: Cell;	// eventuale token precedente
// var next_token: Cell;	// eventuale token successivo
// var	next_val: any;		// valore di eventuale token succesivo

export var globalVariables: Record<string, any> = {
//	'colore': 'red',
};
export var userProcedures: Record<string, ProcedureDef> = {
//	'quadrato': { parameters: ['lato'], 'body': [Parse('ripeti 4 [a :lato d 90]')]}
};

// Presupponiamo di avere accesso allo stato globale (GET) e al dispatcher (SET)
interface InterpreterProps {
    // globalState: LogoGlobalState;
    // dispatch: (action: any) => void;
    // activeLang: LanguageCode;
    resolveCommand: (commandName: string) => CoreDefinitionKeys | undefined;
}

// L'interprete riceve la riga e lo stato/dispatcher
// export function logoInterpreter(line: string, { globalState, dispatch, activeLang, resolveCommand }: InterpreterProps): string | any[]
export function logoInterpreter(line: string, { resolveCommand }: InterpreterProps): string | any[]
{
	console.log('logoInterpreter', resolveCommand);
	// from Ilmain.execute()
	if (liv_analisi > 0) {
		ini_exec ();
		mod_parola = ModParola.VERB;		/* parola non preceduta da modificatore*/
		return 'parentesi non chiuse';
	}

	const ctx: Context = contesti[liv_contesto];

    // 1. Tokenizzazione
    const cells = Parse(line); // La tua funzione di tokenizzazione e analisi
	const l_linea = cells.length;
    console.log('cells:', cells);
    if (cells.length === 0) return "";
	ctx.linea_com = cells;

	var i_cell = 0;
	mod_parola = ModParola.VERB;		// parola non preceduta da modificatore
	while ((i_cell < l_linea) && (!isProcedureDefinition)) {
		// i_cell = valuta_token(ctx, i_cell);	// eseguito per ogni token
		i_cell = valuta_token(ctx, ctx.linea_com, i_cell);	// eseguito per ogni token
	}

	if (v_stack.length)
		return v_stack;
	else
    	return `OK: Eseguito riga di comando.`;
}

export function valuta_token(ctx: Context, block: Cell[], i_cell: number): number {
	console.log('valuta_token', i_cell);
	// const l_linea: number = ctx.linea_com.length;
	const l_linea: number = block.length;
	var locale: number;
	var numeric: number;
	var values: any[] = [];
    var coreKey: CoreDefinitionKeys;
    var definition: CommandDef | ProcedureDef;
    var signature: number;
    var result = null;
    var cell;

	// if (i_cell >= l_linea) {
	//	is_finito = true;
	// } else {
		// cell = ctx.linea_com[i_cell];
		cell = block[i_cell];
		i_cell+= 1;
	    switch (cell.type) {
			case CellType.QUOTE:
				if (cell.val === '"')
					mod_parola = ModParola.LITERAL;
				else // cell.val === ':'
					mod_parola = ModParola.VARIABLE;
				break;
			case CellType.WORD:
				if (mod_parola === ModParola.LITERAL) {
					push_arg(cell);
				}
				else if (mod_parola === ModParola.VARIABLE) {
					cell = {type: CellType.WORD, val: globalVariables[cell.val]};
					console.log('VARIABILE', cell);
					push_arg(cell);
				}
				else if (mod_parola === ModParola.VERB) {
					numeric = parseFloat(cell.val);
					if (! isNaN(numeric)) {
						push_arg({type: CellType.NUMBER, val: numeric});
					}
					else {
						var verb = cell.val;
						coreKey = resolveCommand(verb);
					    if (coreKey) {
					        definition = CORE_DEFINITIONS[coreKey];
					        ctx.funzione = { type: CellType.SFUN, coreKey: coreKey, definition: definition};
					        console.log('SFUN', coreKey, definition);
					        // ctx.liv_funzione += 1;
					        // ctx.n_arg_attesi = definition.args.length;
							sf_in(ctx, definition);
    					}
    					else if (Object.keys(userProcedures).includes(verb)) {
							var definition: ProcedureDef = userProcedures[verb];
							ctx.funzione = { type: CellType.UFUN, name: verb, definition: definition}; 
					        console.log('UFUN', verb, definition);
							uf_in(ctx, definition);
						}
					} 
				}
				locale = mod_parola;
				mod_parola = ModParola.VERB;
				break;
			case CellType.LIST:
				push_arg(cell);
				break;
		}
		console.log(ctx.parentesi, ctx.liv_funzione, ctx.n_arg_trovati, ctx.n_arg_attesi);
		if ((ctx.funzione) && (ctx.parentesi < ctx.liv_funzione) && (ctx.n_arg_trovati === ctx.n_arg_attesi))
		  if (ctx.funzione.type === CellType.SFUN) {
			console.log('eseguo FUNZIONE', ctx.funzione);
			for (var i=0; i<ctx.n_arg_trovati; i++) {
				values.push(v_stack.pop().val);
				values.reverse();
			}
			console.log('VALUES', values);
			definition = ctx.funzione.definition;
			signature = definition.signature;
			var is_function = ((signature !== undefined) && (signature || FunSignature.FUNCT));
			if (ctx.funzione.coreKey === 'TO') {
				definition.ref(ctx, values, i_cell-1);
				//is_finito = true;
				// i_cell = 100;
				return 1000;	// a number bigger than any command length
			}
			else if ((definition.classes & FunClass.EXEC) || (definition.classes & FunClass.DEF)) {
				definition.ref(ctx, values);
			}
			else if (definition.classes & FunClass.TURT) {
			    const activeWin = shared_globalState.windows[shared_globalState.activeWindowId];
			    if (!activeWin)
					console.log("ERRORE: Nessuna finestra grafica attiva.");

				let turtleStroke: boolean = (turtleStrokes.includes(ctx.funzione.coreKey));
				var newTurtleState: TurtleState;
				var drawingCommand: DrawingCommand;

				if (turtleStroke) {
					[ newTurtleState, drawingCommand ] = definition.ref(definition, values, activeWin.turtleState);
					console.log('turtleStroke', newTurtleState, drawingCommand);
				} else {
					if (is_function) {
						result = definition.ref(values, activeWin.turtleState);
					}
					else {
						newTurtleState = definition.ref(definition, values, activeWin.turtleState);
						console.log('No turtleStroke', newTurtleState);
					}
				}

			    // 3. Dispatch (Aggiornamento dello Stato Globale)
			    if (newTurtleState !== undefined) {
					console.log('NEWSTATE', newTurtleState);
				    shared_dispatch({ 
				        type: 'UPDATE_TURTLE_STATE', 
				        windowId: shared_globalState.activeWindowId,
				        newState: newTurtleState 
				    });
				}
			    
			    if (turtleStroke) {
					 console.log('drawingCommand', drawingCommand);
			         shared_dispatch({ 
			            type: 'ADD_DRAWING_COMMAND', 
			            windowId: shared_globalState.activeWindowId,
			            command: drawingCommand 
			        });
			    }
				activeWin.turtleState = newTurtleState;

			}
			else {
				if (is_function)
					result = definition.ref(values);
				else
					definition.ref(values);
			}
			if (!isProcedureDefinition)
				sf_out(ctx);
			if (result !== null) {
				push_arg(result);
				ctx.n_arg_trovati += 1;
			}
		}
		else if (ctx.funzione.type === CellType.UFUN) {
			console.log('valuta_token UFUN', ctx.n_arg_trovati, ctx.n_arg_attesi);
			uf_call(ctx);
			uf_ret(ctx);
		}
	// }
	return i_cell;
}

// questa funzione duplica una funzione interna a UseLocalization.useLocalization
function resolveCommand(commandName: string): CoreDefinitionKeys | undefined {
    const canonicalName = commandName.toUpperCase(); // Prepara il nome per la ricerca

    // 1. Cerca il nome utente all'interno della mappa linguistica attiva
    const coreKey: CoreDefinitionKeys | undefined = LANGUAGE_MAPS["it"][canonicalName];

    if (coreKey && CORE_DEFINITIONS[coreKey]) {
        return coreKey;
    }
    // Se non trovato, potrebbe essere un comando non tradotto o non valido
    return undefined;
}
