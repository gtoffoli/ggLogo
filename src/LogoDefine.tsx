// LogoDefine.tsx
// 2511120 - 1st version: inspired to Ildef.cpp of IperLogo

import { cellType, Cell, Context } from './CoreDefinitions';
import { VarVoc, ProcVoc, is_proc_def } from './Interpreter';


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

// 
export function _TO(ctx: Context, values: any[], i_cell: number): void {
	console.log('function _TO', values[0]);
	const name = values[0]; // procedure name
	const linea_com = ctx.linea_com;
	const l_linea: number = linea_com.length;
	var cell: Cell;
	var parameter_expected: boolean = false;
	var parameters: string[] = []; // list of parameter names
	var s: string = ''; // input string for procedure body
	var body_lines: Cell[][] = [];  // list of parsed input strings for procedure body
	var parsed_line: Cell[] = []

	// check that name is not a reserved string
	// ..
	// look for the parameters in the already parsed command line
	while (i_cell < l_linea) {
		cell = linea_com[i_cell];
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
	var is_end = false;
	while (!is_end) {
		// s = ...
		parsed_line = Parse(s);
		is_end = ((parsed_line.length === 1) && (parsed_line[0].type === CellType.WORD) && (parsed_line[0].val === 'END'))
		if (!is_end)
			body_lines.push(parsed_line);
	}
}

export function _END(ctx: Context, values: any[]): void {
	console.log('function _END');
	if (isProcedureDefinition)
		console.log('procedure declaration error');
	isProcedureDefinition = false;
}
