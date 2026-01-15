// LogoDefine.tsx
// 2511120 - 1st version: inspired to Ildef.cpp of IperLogo

import { CellType, Cell, contextType, Context, ProcedureDef } from './CoreDefinitions';
import { Parse, unParse } from './Parser';
import { userProcedures, globalVariables } from './Interpreter';
import { getConsoleLine } from './Streams';
import { contesti, liv_contesto, sf_out } from './LogoControl';


export var isProcedureDefinition: boolean = false;
export var procedureName: string | null;
export var procedureParameters: string[] | null;
export var procedureBody: Cell[][] | null;


export function _DEFINE(values: any[]): void {
	console.log('function _DEFINE', values[0],values[1]);
	var name = values[0].val;
	var value = values[1].val;
	userProcedures[name] = value;
}

export function iniDefine() {
  isProcedureDefinition = false;
  procedureName = '';
  procedureParameters = [];
  procedureBody = [];
}

export function pushProcedureLine(line) {
  procedureBody.push(line);
}
 
// export async function _TO(values: any[]): void {
export function _TO(values: any[]): void {
  procedureName = values[0].val; // procedure name
  procedureParameters = [];    // list of parameter names
  procedureBody = [];  // list of parsed input strings for procedure body
	console.log('async function _TO - 1', procedureName, values);
	var ctx = contesti[liv_contesto];
	var declaration = ctx.block[0];
	var cell: Cell;
	var parameter_expected: boolean = false;
	var s: string = ''; 				// input string for procedure body

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
			procedureParameters.push(cell.val);
		}
	}
	if (parameter_expected)
		console.log('procedure declaration error');
	isProcedureDefinition = true;
}

export function _END(values: any[]): void {
	console.log('function _END');
	if (!isProcedureDefinition)
		console.log('procedure declaration error');
  userProcedures[procedureName] = {parameters: procedureParameters, body: procedureBody};
	iniDefine();
}

export function _TEXT(values: any[]): Cell {
	const procedureName = values[0].val;
	const procedureDef = userProcedures[procedureName];
	console.log('TESTO DI', procedureName, ' : ', procedureDef);
	var text = unParse([[procedureDef.parameters, procedureDef.body]]);
	return { type: CellType.WORD, val: text };
}

function getProcedureCtx(): Context | null {
  var liv = liv_contesto;
  while (liv > 0) {
    if (contesti[liv].id === contextType.CT_PROCEDURE)
      return contesti[liv];
    --liv;
  }
  return null;
}

export function _MAKE(args: any[]): void {
  console.log('function _SET', args[0],args[1]);
  const name = args[0].val;
  const value = args[1];
  const localCtx = getProcedureCtx();
  if (localCtx && typeof localCtx.localVariables[name] !== "undefined")
    localCtx.localVariables[name] = value;
  else
    globalVariables[name] = value;
}

export function _THING(args: any[]): Cell {
  console.log('function _THING', args[0]);
  const name = args[0].val;
  const localCtx = getProcedureCtx();
  if (localCtx && typeof localCtx.localVariables[name] !== "undefined")
    return localCtx.localVariables[name];
  else
    return globalVariables[name];
}

export function _LOCAL(args: any[]): Cell {
  const localCtx = getProcedureCtx();
  var localName;
  if (localCtx)
    for (var i=0; i<values.length; i++) {
      localName = values[i].val;
      localCtx.localVariables[localName] = null;
    }
  else {
    console.log('non siamo dentro una procedura')
  }
}
