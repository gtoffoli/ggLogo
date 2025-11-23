// LogoDefine.tsx
// 2511120 - 1st version: inspired to Ildef.cpp of IperLogo

import { shared_globalState, shared_dispatch } from './LogoShell';
import { CellType, Cell, Context } from './CoreDefinitions';
import { Parse } from './Parser';
import { VarVoc, ProcVoc } from './Interpreter';
import { getLine } from './InterpreterCore';


export var isProcedureDefinition: boolean;	/* in corso definizione di procedura */


export function _SET(ctx: Context, values: any[]): void {
	console.log('function _SET', values[0],values[1]);
	var name = values[0];
	var value = values[1];
	VarVoc[name] = value;
}

export function _DEFINE(ctx: Context, values: any[]): void {
	console.log('function _DEFINE', values[0],values[1]);
	var name = values[0];
	var value = values[1];
	ProcVoc[name] = value;
}

// La funzione getLine sarà accessibile solo se forniamo un dispatcher
interface InterpreterDispatch {
    dispatch: (action: any) => void;
}

// 
export async function _TO(ctx: Context, values: any[], i_cell: number): void {
	console.log('function _TO', values[0]);

	const procedureName = values[0]; // procedure name
	const lineaCom = ctx.linea_com;
	const l_linea: number = lineaCom.length;
	var cell: Cell;
	var parameter_expected: boolean = false;
	var parameters: string[] = []; 		// list of parameter names
	var s: string = ''; 				// input string for procedure body
	var procedureBody: Cell[][] = [];  // list of parsed input strings for procedure body
	var parsedLine: Cell[] = []

	// check that name is not a reserved string
	// ..
	// look for the parameters in the already parsed command line
	while (i_cell < l_linea) {
		cell = lineaCom[i_cell];
		i_cell+= 1;
		if ((!parameter_expected) && (cell.type === CellType.QUOTE) && (cell.val === ':')) {
			parameter_expected = true;
		}
		else if ((parameter_expected) && (cell.type === CellType.WORD)) {
			parameter_expected = false;
			parameters.push(cell.value);
		}
	}
	if (parameter_expected)
		console.log('procedure declaration error');

	isProcedureDefinition = true;
    // Entra nel loop di lettura asincrona del procedure body
    do {
        // La chiamata ASINCRONA SOSPENDE l'esecuzione qui
        s = await getLine('TO> ', shared_dispatch); 
        if (s.toUpperCase() !== 'END') {
			parsedLine = Parse(s);
            procedureBody.push(parsedLine);
        }

    } while (s.toUpperCase() !== 'END');
	isProcedureDefinition = false;
    
    // Una volta usciti dal loop (trovato END), la Promise è finita.
    
    // Procedi con l'analisi lessicale/sintattica del corpo (procedureBody)
    // e memorizza la procedura (nome, parametri, body) in globalState.userProcedures
    console.log(`Procedura ${procedureName} definita con corpo:`, procedureBody);
    
    // L'azione CLEAR_WAITER è stata gestita nel CommandInterpreter per END.
}

export function _END(ctx: Context, values: any[]): void {
	console.log('function _END');
	if (isProcedureDefinition)
		console.log('procedure declaration error');
	isProcedureDefinition = false;
}
