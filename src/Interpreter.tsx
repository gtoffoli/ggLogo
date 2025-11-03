// Interpreter.tsx
// 251024 - 1st version: extracted logoInterpreter function from LogoShell.tsx
// 251025 - as proposed by Gemini on 251024


// Usiamo i tipi di risoluzione comando definiti in precedenza
import { CORE_DEFINITIONS, CommandDef, CoreDefinitionKeys } from './CoreDefinitions';
// import { useLocalization } from './useLocalization';
import { LogoGlobalState, TurtleState, DrawingCommand } from './LogoState';
import { initialTurtleState } from './logoReducer';
import { calculateForward, calculateRight } from './InterpreterCore'; 
import { logoTokenizerFSM } from './Parser';

// Presupponiamo di avere accesso allo stato globale (GET) e al dispatcher (SET)
interface InterpreterProps {
    globalState: LogoGlobalState;
    dispatch: (action: any) => void; 
}

// L'interprete riceve la riga e lo stato/dispatcher
export function logoInterpreter(line: string, { globalState, dispatch }: InterpreterProps): string
{

    // 1. Tokenizzazione (Qui userai la tua FSM aggiornata)
    // Per ora, simuliamo il tokenizzatore semplice per testare
    // const tokens = line.trim().toUpperCase().split(/\s+/).filter(t => t.length > 0); 
    const tokens = logoTokenizerFSM(line); // La tua funzione FSM
    
    if (tokens.length === 0) return "";

    const commandName = tokens[0];
    const args = tokens.slice(1);
   
    // Per un'implementazione reale, dovresti usare useLocalization e CORE_DEFINITIONS
    // Qui simuliamo la risoluzione interna per AVANTI/DESTRA
    const commandMap: Record<string, CoreDefinitionKeys> = { 
        "FORWARD": "FD",
        "FD": "FD",
        "AVANTI": "FD",
        "A": "FD",
        "RIGHT": "RT",
        "RT": "RT",
        "DESTRA": "RT", 
        "D": "RT",
        "CLEARSCREEN": "CS",
        "CS": "CS",
        "PULISCISCHERMO": "CS",
        "PS": "CS"
    };
    const coreKey = commandMap[commandName];

    if (!coreKey) {
        return `ERRORE: Comando non riconosciuto: ${commandName}`;
    }

    // Estrazione e validazione dell'argomento numerico
    const numericArg = parseFloat(args[0]);
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

/*
export function logoInterpreter (line: string): string
{
    const tokens = logoTokenizerFSM(line.trim()); // La tua funzione FSM
    return { output: tokens.toString() };
}
*/
