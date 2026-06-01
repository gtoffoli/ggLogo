// LogoDefine.tsx
// 2511120 - 1st version: inspired to Ildef.cpp of IperLogo

import { CellType, Cell, contextType, Context, ProcedureDef } from './CoreDefinitions';
import { Parse, unParse } from './Parser';
import { userProcedures, globalVariables, propLists, throwError } from './Interpreter';
import { contesti, liv_contesto, sf_out } from './LogoControl';
import { commandResolver, copyActiveMapItem } from './UseLocalization';
import { wordCell } from './Structures';

export var isProcedureDefinition: boolean = false;
export var procedureName: string | null;
export var procedureParameters: string[] | null;
export var procedureBody: Cell[][] | null;

export function _PRIMITIVEP(values: any[]): Cell {
  const coreKey = commandResolver(values[0].val);
  return { type: CellType.BOOLEAN, val: (coreKey) ? true : false };
}

export function _DEFINE(values: any[]): void {
	var name = values[0].val;
	var value = values[1].val;
	userProcedures[name] = value;
}
export function _COPYDEF(values: any[]): void {
  const oldName = values[1].val;
  const newName = values[0].val;
  if (userProcedures.hasOwnProperty(oldName))
    userProcedures[newName] = userProcedures[oldName];
  else {
    const coreKey = commandResolver(oldName);
    if (coreKey) copyActiveMapItem(newName, oldName, false);
    else throwError('e02', '', oldName);
  }
}
export function _RENAME(values: any[]): void {
  const oldName = values[1].val;
  const newName = values[0].val;
  if (userProcedures.hasOwnProperty(oldName)) {
    userProcedures[newName] = userProcedures[oldName];
    delete userProcedures[oldName];
  }
  else {
    const coreKey = commandResolver(oldName);
    if (coreKey) copyActiveMapItem(newName, oldName, true);
    else throwError('e02', '', oldName);
  }
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
 
export function _TO(values: any[]): void {
  iniDefine();
  procedureName = values[0].val; // procedure name
  procedureParameters = [];    // list of parameter names
  procedureBody = [];  // list of parsed input strings for procedure body
	console.log('function _TO - 1', procedureName, values);
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
		// if ((!parameter_expected) && (cell.type === CellType.QUOTE) && (cell.val === ':')) {
    if ((!parameter_expected) && (cell.type === CellType.COLON)) {
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
	if (!isProcedureDefinition)
		console.log('procedure declaration error');
  userProcedures[procedureName] = {parameters: procedureParameters, body: procedureBody};
	iniDefine();
}

export function _PROCEDUREP(values: any[]): Cell {
	return { type: CellType.BOOLEAN, val: (values[0].val in userProcedures) };
}

export function _TEXT(values: any[]): Cell {
  const procedureName = values[0].val;
  const procedureDef = userProcedures[procedureName];
  if (!procedureDef)
    throwError('e50', '', procedureName.toString());
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
  const name = args[0].val;
  const value = args[1];
  const localCtx = getProcedureCtx();
  if (localCtx && typeof localCtx.localVariables[name] !== "undefined")
    localCtx.localVariables[name] = value;
  else
    globalVariables[name] = value;
}

export function _THING(args: any[]): Cell {
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

export function _PPROP(args: any[]): void {
  const name = args[0].val;
  const prop = args[1].val;
  const value = args[2];
  var plist = propLists[name];
  if (plist === undefined) propLists[name] = {};
  propLists[name][prop] = value;
}
export function _GPROP(args: any[]): Cell {
  const name = args[0].val;
  const prop = args[1].val;
  const plist = propLists[name] || {};
  var value = plist[prop];
  if (value !== undefined)
    return value
  else return { type: CellType.LIST, val: [] };
}
export function _REMPROP(args: any[]): void {
  const name = args[0].val;
  const prop = args[1].val;
  var plist = propLists[name];
  if (plist !== undefined) {
    delete (propLists[name])[prop];
  }
}
export function _PLIST(args: any[]): Cell {
  const name = args[0].val;
  const plist = propLists[name] || {};
  const keys = Object.keys(plist);
  var list = [];
  keys.forEach((key) => { list.push({ type: CellType.WORD, val: key }); list.push(plist[key]); });
  return { type: CellType.LIST, val: list }; 
}

export function _PROCEDURES(args: any[]): Cell {
  var list: string[] = Object.keys(userProcedures);
  return { type: CellType.LIST, val: list.map((s: string) => wordCell(s)) }; 
}
export function _GLOBALS(args: any[]): Cell {
  var list: string[] = Object.keys(globalVariables);
  return { type: CellType.LIST, val: list.map((s: string) => wordCell(s)) }; 
}
