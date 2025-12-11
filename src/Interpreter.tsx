// Interpreter.tsx
// 251024 - 1st version: extracted logoInterpreter function from LogoShell.tsx
// 251025 - as proposed by Gemini on 251024
// 251104 - logoInterpreter gets command definitions (not used yet) and localization thanks to additional arguments 
// 251107 - started extension of Parser
// 251114 - dry command execution in auxiliary functions of Intepreter
// 251115 - integration of command execution with CommandDef (added the ref field)
// 251116 - imported some shared values retrieved by LogoShell through React-specific functions
// 251129 - propagation downward of resolveCommand also to functions in LogoControl module


import { ModParola, CellType, Cell, Context, ParamDef } from './CoreDefinitions';
import { SystemFunction, CORE_DEFINITIONS, CommandDef, CoreDefinitionKeys, FunClass, FunSignature, turtleStrokes } from './CoreDefinitions';
import { UserFunction, ProcedureDef } from './CoreDefinitions';
import { LANGUAGE_MAPS } from './LocalizationMaps';
import { LanguageCode } from './UseLocalization';
import { LogoGlobalState, TurtleState, DrawingCommand } from './LogoState';
import { shared_globalState, shared_dispatch } from './LogoShell';
import { Parse, getCharClass, CharClass } from './Parser';
import { contesti, liv_contesto, liv_analisi, v_stack, blocco, is_stop } from './LogoControl';
import { ini_valuta, push_arg, ini_exec, sf_in, sf_out, uf_in, uf_call, uf_ret, blk_out } from './LogoControl';
import { isProcedureDefinition } from './LogoDefine';

export var globalVariables: Record<string, any> = {};
export var userProcedures: Record<string, ProcedureDef> = {};
export var mod_parola: ModParola;// modalita' di esecuzione di una parola LOGO

// Presupponiamo di avere accesso allo stato globale (GET) e al dispatcher (SET)
interface InterpreterProps {
    // globalState: LogoGlobalState;
    // dispatch: (action: any) => void;
    // activeLang: LanguageCode;
    resolveCommand: (commandName: string) => CoreDefinitionKeys | undefined;
}

// L'interprete riceve la riga e lo stato/dispatcher
export function logoInterpreter(activeLang: LanguageCode, lines: string[], { resolveCommand }: InterpreterProps): string | any[]
{
	console.log('logoInterpreter', activeLang, lines.length);
	// from Ilmain.execute()
	if (liv_analisi > 0) {
		ini_exec ();
		mod_parola = ModParola.VERB;		// parola non preceduta da modificatore
		return 'parentesi non chiuse';
	}

	const ctx: Context = contesti[liv_contesto];

    // 1. Tokenizzazione
	mod_parola = ModParola.VERB;		// parola non preceduta da modificatore
	for (var i_line=0; i_line<lines.length; i_line++)
		ctx.block.push(Parse(lines[i_line]));

	valuta_token(resolveCommand);

	if (v_stack.length)
	return v_stack;
	else
	return `OK: Eseguito riga di comando.`;
}

export function valuta_token(resolveCommand) {
	var ctx: Context;

	var locale: number;
	var numeric: number;
    var coreKey: CoreDefinitionKeys;
    var definition: CommandDef | ProcedureDef;
    var signature: number;
    var result = null;
     
    while (true) {
		ctx = contesti[liv_contesto];
console.log('valuta_token', ctx.i_line, ctx.i_token, ctx.block);
console.log('- conto_esegui', ctx.conto_esegui);
console.log('-- conto_parentesi', ctx.conto_parentesi);

		while (true) {
			ctx = contesti[liv_contesto];
			if (ctx.i_line >= ctx.block.length) {
				ini_valuta(ctx);
				return;
			}
			console.log('?????', ctx.block.length, ctx.block, ctx.i_line, ctx.i_token, ctx.liv_esecuzione, ctx.liv_procedura);
			if (ctx.i_token >= ctx.block[ctx.i_line].length) {
				ctx.i_line += 1;
				if (ctx.i_line >= ctx.block.length) {
					if (ctx.liv_esecuzione > 0) { // prima chiudo i blocchi interni
						blk_out(ctx);
						continue;
					}
					else if (ctx.liv_procedura > 0) { // poi chiudo le procedure
						uf_ret(ctx);
						continue;
					}
					else {
						ini_valuta(ctx);
						return;
					}
				}
				else {
					ctx.i_token = 0;
					break;
				}
			}
			else break;
		}

		var cell = ctx.block[ctx.i_line][ctx.i_token];
	  	if (ctx.i_token === 0)
	  		mod_parola = ModParola.VERB;		// parola non preceduta da modificatore
		console.log('token', liv_contesto, ctx.block, ctx.i_line, ctx.i_token, cell, mod_parola);
		console.log('token', ctx);
		switch (cell.type) {
			case CellType.QUOTE:
				if (cell.val === '"')
					mod_parola = ModParola.LITERAL;
				else // cell.val === ':'
					mod_parola = ModParola.VARIABLE;
				break;
			case CellType.WORD:
				if (mod_parola === ModParola.LITERAL) {
					push_arg(ctx, cell);
				}
				else if (mod_parola === ModParola.VARIABLE) {
					cell = {type: CellType.WORD, val: globalVariables[cell.val]};
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
						coreKey = resolveCommand(verb);
					    if (coreKey) {
					        definition = CORE_DEFINITIONS[coreKey];
					        funzione = { type: CellType.SFUN, coreKey: coreKey, definition: definition};
					        console.log('SFUN', coreKey, definition);
							sf_in(ctx, funzione);
    					}
    					else if (Object.keys(userProcedures).includes(verb)) {
							var definition: ProcedureDef = userProcedures[verb];
							funzione = { type: CellType.UFUN, name: verb, definition: definition}; 
					        console.log('UFUN', verb, definition);
							uf_in(ctx, funzione);
						}
					} 
				}
				locale = mod_parola;
				mod_parola = ModParola.VERB;
				break;
			case CellType.LIST:
				push_arg(ctx, cell);
				break;
		}
		ctx.i_token += 1;
		console.log('funzione?', ctx.funzione, ctx.liv_funzione, ctx.parentesi, ctx.n_arg_trovati, ctx.n_arg_attesi);
		// if ((ctx.funzione) && (ctx.parentesi < ctx.liv_funzione) && (ctx.n_arg_trovati === ctx.n_arg_attesi))
		if ((ctx.funzione) && (ctx.n_arg_trovati === ctx.n_arg_attesi))
		  if (ctx.funzione.type === CellType.SFUN) {
			console.log('eseguo FUNZIONE', ctx.funzione);
			var values: any[] = [];
			for (var i=0; i<ctx.n_arg_trovati; i++) {
				values.push(v_stack.pop().val);
				values.reverse();
			}
			console.log('VALUES', values);
			definition = ctx.funzione.definition;
			signature = definition.signature;
			var is_function = ((signature !== undefined) && (signature || FunSignature.FUNCT));
			var is_exec = false;
			if (ctx.funzione.coreKey === 'TO') {
				ctx.i_token -= 1;
				definition.ref(ctx, values, ctx.i_token);
				ctx.i_token = 1000;
			}
			else if (definition.classes & FunClass.DEF) {
				definition.ref(ctx, values);
			}
			else if (definition.classes & FunClass.EXEC) {
				definition.ref(ctx, values);
				is_exec = true;
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
			// if (!isProcedureDefinition)
			// if ((!isProcedureDefinition) && (!is_exec)) // in alcuni casi, come REPEAT, sf_out viene anticipato
			if (!is_exec)	 // in alcuni casi, come REPEAT, sf_out viene anticipato
				sf_out(ctx);
			if (result !== null) {
				push_arg(ctx, result);
				ctx.n_arg_trovati += 1;
			}
		}
		else if (ctx.funzione.type === CellType.UFUN) {
			console.log('valuta_token UFUN', ctx.n_arg_trovati, ctx.n_arg_attesi);
			uf_call(ctx, resolveCommand);
		}
	}
}
