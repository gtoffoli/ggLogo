// Interpreter.tsx
// 251024 - 1st version: extracted logoInterpreter function from LogoShell.tsx
// 251025 - as proposed by Gemini on 251024
// 251104 - logoInterpreter gets command definitions (not used yet) and localization thanks to additional arguments 
// 251107 - started extension of Parser


// Usiamo i tipi di risoluzione comando definiti in precedenza
import { ModParola, CellType, Cell, Context, CORE_DEFINITIONS, CommandDef, ParamDef, CoreDefinitionKeys } from './CoreDefinitions';
import { LanguageCode, resolveCommand } from './UseLocalization';
import { LogoGlobalState, TurtleState, DrawingCommand } from './LogoState';
import { initialTurtleState } from './logoReducer';
import { calculateForward, calculateRight } from './InterpreterCore'; 
import { Parse } from './Parser';

// Presupponiamo di avere accesso allo stato globale (GET) e al dispatcher (SET)
interface InterpreterProps {
    globalState: LogoGlobalState;
    dispatch: (action: any) => void;
    activeLang: LanguageCode;
    // Funzione per risolvere un comando
    resolveCommand: (commandName: string) => CoreDefinitionKeys| undefined;
}

// L'interprete riceve la riga e lo stato/dispatcher
// export function logoInterpreter(line: string, { globalState, dispatch }: InterpreterProps): string
export function logoInterpreter(line: string, { globalState, dispatch, activeLang, resolveCommand }: InterpreterProps): string | any[]
{
    // 1. Tokenizzazione
    const tokens = Parse(line); // La tua funzione di tokenizzazione e analisi
    console.log('tokens:', tokens);
    
    if (tokens.length === 0) return "";

    else if (tokens.length === 1) {
	    if (Array.isArray(tokens[0]))
		    return tokens[0];
		else (tokens[0].type === CellType.WORD)
		    return tokens[0].val;
	}

    const commandName = tokens[0].val;
    const args = tokens.slice(1);

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

var contesti: Context[];
var liv_contesto: number;/* livello di nidificazione dei contesti */

export function ini_main (): void {
	contesti = [];
	liv_contesto = -1;
}

var	mod_parola: ModParola;		/* modalita' di esecuzione di una parola LOGO */
var	is_interprete: boolean;		/* input e' richiesto da interprete dei comandi */
var is_analisi: boolean;		/* input e' richiesto tramite analisi */
var	is_prima_linea: boolean;	/* e' prima linea di input */
var liv_analisi: number;		/* parentesi non chiuse */
var is_stop: boolean;			/* incontrata fine di procedura */
var is_finito: boolean;			/* finito esecuzione di lista di istruzioni */
var	is_nestedExec: boolean;

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

function valuta_token(initialContextLevel: number) {
}

function evaluationLoop(): void {
}
