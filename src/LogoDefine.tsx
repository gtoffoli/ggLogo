// LogoDefine.tsx
// 2511120 - 1st version: inspired to Ildef.cpp of IperLogo

import { shared_globalState, shared_dispatch } from './LogoShell';
import { CellType, Cell, Context, ProcedureDef } from './CoreDefinitions';
import { Parse, unParse } from './Parser';
import { globalVariables, userProcedures } from './Interpreter';
import { getLine } from './InterpreterCore';
import { contesti, liv_contesto, sf_out } from './LogoControl';


export var isProcedureDefinition: boolean;	/* in corso definizione di procedura */


export function _SET(values: any[]): void {
	console.log('function _SET', values[0],values[1]);
	var name = values[0];
	var value = values[1];
	globalVariables[name] = value;
}

export function _DEFINE(values: any[]): void {
	console.log('function _DEFINE', values[0],values[1]);
	var name = values[0];
	var value = values[1];
	userProcedures[name] = value;
}

// La funzione getLine sarà accessibile solo se forniamo un dispatcher
interface InterpreterDispatch {
    dispatch: (action: any) => void;
}

export async function _TO(values: any[]): void {
	const procedureName = values[0]; // procedure name
	console.log('async function _TO', procedureName, values);
	var ctx = contesti[liv_contesto];
	var declaration = ctx.block[0];
	var cell: Cell;
	var parameter_expected: boolean = false;
	var parameters: string[] = []; 		// list of parameter names
	var s: string = ''; 				// input string for procedure body
	var procedureBody: Cell[][] = [];  // list of parsed input strings for procedure body
	var parsedLine: Cell[] = []

	// check that name is not a reserved string
	// ..
	// look for the parameters in the already parsed command line
	while (ctx.i_token < declaration.length) {
		cell = declaration[ctx.i_token];
		ctx.i_token += 1;
		if ((!parameter_expected) && (cell.type === CellType.QUOTE) && (cell.val === ':')) {
			parameter_expected = true;
		}
		else if ((parameter_expected) && (cell.type === CellType.WORD)) {
			parameter_expected = false;
			parameters.push(cell.val);
		}
	}
	if (parameter_expected)
		console.log('procedure declaration error');

	isProcedureDefinition = true;
    // Entra nel loop di lettura asincrona del procedure body
    do {
        // La chiamata ASINCRONA SOSPENDE l'esecuzione qui
        s = await getLine('TO> ', shared_dispatch); 
        if (s !== 'END') {
			parsedLine = Parse(s);
            procedureBody.push(parsedLine);
        }
    } while (s !== 'END');
    var procedureDef = {parameters: parameters, body: procedureBody};
	userProcedures[procedureName] = procedureDef;
	console.log('_TO - userProcedures:', userProcedures, Object.keys(userProcedures));
	isProcedureDefinition = false;
	// sf_out(ctx);    
	console.log(`Procedura ${procedureName} definita come`, procedureDef);
    
    // Una volta usciti dal loop (trovato END), la Promise è finita.
    // L'azione CLEAR_WAITER è stata gestita nel CommandInterpreter per END.
}

export function _END(values: any[]): void {
	console.log('function _END');
	if (isProcedureDefinition)
		console.log('procedure declaration error');
	isProcedureDefinition = false;
}

export function _TEXT(values: any[]): Cell {
	const procedureName = values[0];
	const procedureDef = userProcedures[procedureName];
	console.log('TESTO DI', procedureName, ' : ', procedureDef);
	// return { type: CellType.LIST, val: procedureDef };
	// var text = [procedureDef.parameters, procedureDef.body];
	// var text = [procedureDef.parameters, unParse(procedureDef.body)];
	var text = unParse([[procedureDef.parameters, procedureDef.body]]);
	return { type: CellType.WORD, val: text };
}
