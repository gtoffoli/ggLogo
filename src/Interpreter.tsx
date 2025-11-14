// Interpreter.tsx
// 251024 - 1st version: extracted logoInterpreter function from LogoShell.tsx
// 251025 - as proposed by Gemini on 251024
// 251104 - logoInterpreter gets command definitions (not used yet) and localization thanks to additional arguments 
// 251107 - started extension of Parser
// 251114 - dry command execution in auxiliary functions of Intepreter


// Usiamo i tipi di risoluzione comando definiti in precedenza
import { ModParola, CellType, Cell, Context, CORE_DEFINITIONS, CommandDef, ParamDef, CoreDefinitionKeys, SystemFunction } from './CoreDefinitions';
import { LANGUAGE_MAPS } from './LocalizationMaps';
import { LogoGlobalState, TurtleState, DrawingCommand } from './LogoState';
import { initialTurtleState } from './logoReducer';
import { calculateForward, calculateRight } from './InterpreterCore'; 
import { Parse, getCharClass, CharClass } from './Parser';

var contesti: Context[];
var liv_contesto: number; /* livello di nidificazione dei contesti */
var mod_parola: ModParola;		/* modalita' di esecuzione di una parola LOGO */
var is_interprete: boolean;		/* input e' richiesto da interprete dei comandi */
var is_analisi: boolean;		/* input e' richiesto tramite analisi */
var is_prima_linea: boolean;	/* e' prima linea di input */
var liv_analisi: number;		/* parentesi non chiuse */
var is_stop: boolean;			/* incontrata fine di procedura */
var is_finito: boolean;			/* finito esecuzione di lista di istruzioni */
var is_nestedExec: boolean;
var is_errore: boolean;					/* incontrato e ancora non gestito errore */
var is_ciao: boolean;						/* eseguito comando "ciao" */

var tipo_token: number;	// tipo del token corrente
var val_token: any; 	//
var prev_token: Cell;	// eventuale token precedente
var next_token: Cell;	// eventuale token successivo
// var	next_val: any;		// valore di eventuale token succesivo

var p_stack: any[] = [];
var v_stack: any[] = [];

// Presupponiamo di avere accesso allo stato globale (GET) e al dispatcher (SET)
interface InterpreterProps {
    globalState: LogoGlobalState;
    dispatch: (action: any) => void;
    activeLang: LanguageCode;
    // Funzione per risolvere un comando
    resolveCommand: (commandName: string) => CoreDefinitionKeys | undefined;
}

// L'interprete riceve la riga e lo stato/dispatcher
// export function logoInterpreter(line: string, { globalState, dispatch }: InterpreterProps): string
export function logoInterpreter(line: string, { globalState, dispatch, activeLang, resolveCommand }: InterpreterProps): string | any[]
{
	console.log('logoInterpreter', activeLang, resolveCommand); 
	// from Ilmain.execute()
	if (liv_analisi > 0) {
		ini_exec ();
		return 'parentesi non chiuse';
	}

    // 1. Tokenizzazione
    const cells = Parse(line); // La tua funzione di tokenizzazione e analisi
    console.log('cells:', cells);
    
    if (cells.length === 0) return "";

    if (cells.length === 1) {
	    if (Array.isArray(cells[0]))
		    return cells[0];
		else (cells[0].type === CellType.WORD)
		    return cells[0].val;
	}

	contesti[liv_contesto].linea_com = cells;
	console.log('CALL main_loop', contesti[liv_contesto].linea_com.length);
	if (contesti[liv_contesto].linea_com.length > 0) {
		console.log('CALL main_loop');
		main_loop();
	}

    const commandName = cells[0].val;
    const args = cells.slice(1);

    // Risolvi il comando nella lingua attiva
    // const coreKey: CoreDefinitionKeys = resolveCommand(commandName);
    const coreKey = resolveCommand(commandName);
    if (!coreKey) {
        return `ERRORE: Comando non riconosciuto: ${commandName}`;
    }
    const definition = CORE_DEFINITIONS[coreKey];
    console.log(coreKey, definition);
 
    // Estrazione e validazione dell'argomento numerico
    const numericArg = parseFloat(args[0].val);
    if (isNaN(numericArg)) {
        return `ERRORE: ${commandName} richiede un argomento numerico valido.`;
    }

    const activeWin = globalState.windows[globalState.activeWindowId];
    if (!activeWin) return "ERRORE: Nessuna finestra grafica attiva.";

    let newTurtleState: TurtleState = activeWin.turtleState;
    let drawingCommand: DrawingCommand | null = null;
    
    // 2. Esecuzione del Comando Core
    switch (coreKey) {
        case "FD": // AVANTI
            const { newState: fdState, command: fdCmd } = calculateForward(activeWin.turtleState, numericArg);
            newTurtleState = fdState;
            drawingCommand = fdCmd;
            break;
        case "RT": // DESTRA
            newTurtleState = calculateRight(activeWin.turtleState, numericArg);
            break;
        case "CS": // PULISCISCHERMO
            newTurtleState = initialTurtleState;
            break;
        default:
            return `LOG: Comando ${commandName} riconosciuto ma non ancora implementato.`;
    }

    // 3. Dispatch (Aggiornamento dello Stato Globale)
    dispatch({ 
        type: 'UPDATE_TURTLE_STATE', 
        windowId: globalState.activeWindowId,
        newState: newTurtleState 
    });
    
    if (drawingCommand) {
         dispatch({ 
            type: 'ADD_DRAWING_COMMAND', 
            windowId: globalState.activeWindowId,
            command: drawingCommand 
        });
    }

    return `OK: Eseguito ${commandName} ${numericArg}.`;
}

// inizializzazione parziale di Commander (NestedExec)
function ini_valuta (ctx: Context): void {			
	ctx.funzione = null;	/* nessuna funzione incontrata */
	ctx.n_arg_attesi = 0;	/* numero di parametri atteso dalla funzione corrente*/
	ctx.n_arg_trovati = 0;	/* numero di oggetti sullo stack per la fun corrente*/
	ctx.conto_parentesi = 0;
 	ctx.parentesi = -1;		/* = liv_funzione se sfun corr. e' preceduta da "("*/

	is_stop = false;		/* se vero e' terminata esecuz. procedura corrente */
	mod_parola = ModParola.VERBO;		/* parola non preceduta da modificatore*/
	is_finito = false;		/* se vero ritorna al toploop */
}

export function ini_main (): void {
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

function main_loop(): void {
	console.log('main_loop'); 
	const ini_liv_contesto = liv_contesto;// locale a min_loop
	const ctx: Context = contesti[liv_contesto];
	const l_linea: number = ctx.linea_com.length
	var i_cell = 0;
	i_cell = valuta_token (ctx, i_cell);
	while (! is_ciao) {					// finche' non esegue il comando "ciao"
    	mod_parola = ModParola.VERBO;		// parola non preceduta da modificatore
    	is_finito = false;					// se vero ritorna al toploop
		while (! is_finito) {
			i_cell = valuta_token (ctx, i_cell);	// eseguito per ogni token
			if (is_errore)
				return;
		}
		contesti[liv_contesto].linea_com = [];
		// leggi nuova linea di comando
		return;
	}
}

function valuta_token(ctx: Context, i_cell: number): number {
	console.log('valuta_token', i_cell);
	const l_linea: number = ctx.linea_com.length;
	var locale: number;
	var numeric: number;
	var values: any[] = [];
    var coreKey: CoreDefinitionKeys;
    var definition: CommandDef;
    var definition_args: any[];

	if (i_cell >= l_linea) {
		is_finito = true;
	} else {
		gettok(i_cell, l_linea);
		i_cell+= 1;
	    switch (tipo_token) {
			case CellType.WORD:
				if (mod_parola === ModParola.VERBO) {
					numeric = parseFloat(val_token);
					if (! isNaN(numeric)) {
						push_arg({type: CellType.NUMBER, val: numeric});
					}
					else {
						coreKey = resolveCommand(val_token);
					    if (coreKey) {
					        definition = CORE_DEFINITIONS[coreKey];
					        ctx.funzione = { coreKey: coreKey, definition: definition};
					        ctx.liv_funzione += 1;
					        console.log(coreKey, definition);
					        ctx.n_arg_attesi = definition.args.length;
    					}
					}
				}
				locale = mod_parola;
				mod_parola = ModParola.VERBO;
				break;
			case CellType.LIST:
				break;
		}
		if ((ctx.parentesi < ctx.liv_funzione) && (ctx.n_arg_trovati === ctx.n_arg_attesi)) {
			// console.log('eseguo FUNZIONE', ctx.funzione);
			for (var i=0; i<ctx.n_arg_trovati; i++) {
				values.push(v_stack.pop().val);
				values.reverse();
			}
			console.log('VALUES', values);
			ctx.funzione.definition.semantics(values);
			ctx.liv_funzione -= 1;
			ctx.n_arg_trovati = 0;
		}
	}
	return i_cell;
}

// analizza un token ed il token successivo; non modifica il token corrente ma ne estrae il contenuto
// e punta al token successivo (se esiste, scavalcando eventuale finelinea? NO)
function gettok(i_cell: number): void {
	var token = contesti[liv_contesto].linea_com[i_cell];
	console.log('gettok', token);
	if (Array.isArray(token))
		tipo_token = CellType.LIST;
	else
		tipo_token = token.type;
		val_token = token.val;
}

function push_arg(arg: any): void {
	const ctx = contesti[liv_contesto];
    ctx.n_arg_trovati += 1;
    v_stack.push(arg);
    ctx.p_sv += 1;
}

// questa funzione duplica una funzione interna a UseLocalization.useLocalization
function resolveCommand(commandName: string): CoreDefinitionKeys | undefined {
    const canonicalName = commandName.toUpperCase(); // Prepara il nome per la ricerca

    // 1. Cerca il nome utente all'interno della mappa linguistica attiva
    const coreKey: CoreDefinitionKeys | undefined = LANGUAGE_MAPS["it"][canonicalName];

    if (coreKey && CORE_DEFINITIONS[coreKey]) {
        // 2. Se trovato, ritorna la definizione funzionale
        // return CORE_DEFINITIONS[coreKey];
        return coreKey;
    }
    
    // Se non trovato, potrebbe essere un comando non tradotto o non valido
    return undefined;
}
