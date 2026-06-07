// LogoDefine.tsx
// 2511120 - 1st version: inspired to Ildef.cpp of IperLogo

import { CellType, Cell, contextType, Context, ProcedureDef } from './CoreDefinitions';
import { Parse, unParse } from './Parser';
import { userProcedures, propLists, throwError } from './Interpreter';
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
  var level = liv_contesto;
  while (level > 0) {
    if (contesti[level].id_contesto === contextType.CT_PROCEDURE)
      return contesti[level];
    --level;
  }
  return null;
}

// cerca un nome di variabile a ritroso nello stack dei contesti, a partire dal livello specificato;
// gli associa il valore se lo trova o al livello 0
function _make(level: number, name: string, value: any): void {
  var ctx: Context;
  var id: number;
  while (level > 0) {
    ctx = contesti[level];
    id = ctx.id_contesto;
    if (id === contextType.CT_PROCEDURE)
      if (name in ctx.variables)
        break;
    --level;
  }
  contesti[level].variables[name] = value;
}

// cerca un nome di variabile a ritroso nello stack dei contesti, a partire dal livello specificato;
// riporta il valore corrispondente, se lo trova; altrimenti undefined
export function _thing(level: number, name: string): any {
  var ctx: Context;
  var id: number;
  while (level > 0) {
    ctx = contesti[level];
    id = ctx.id_contesto;
    if (id === contextType.CT_PROCEDURE)
      if (name in ctx.variables)
        return ctx.variables[name];
    --level;
  }
  ctx = contesti[level];
  if (name in ctx.variables)
    return ctx.variables[name];
  else
    return undefined;
}

export function _MAKE(args: any[]): void {
  const name = args[0].val;
  const value = args[1];
  _make(liv_contesto, name, value);
}

export function _THING(args: any[]): Cell {
  const name = args[0].val;
  const value = _thing(liv_contesto, name);
  if (value === undefined)
    throwError('e01', null, args[0]);
  else
    return value;
}

function _local(ctx: Context, name: string): void {
  if (!(name in ctx.variables))
    ctx.variables[name] = undefined;
}

export function _localMake(ctx: Context, name: string, value: any): void {
  if (!(name in ctx.variables))
    ctx.variables[name] = value;
}

export function _LOCALMAKE(args: any[]): void {
  _localMake(contesti[liv_contesto], args[0].val, args[1]);
}

// un numero indefinito di parole, eventualmente tra parentesi
// oppure una lista di parole (non standard)
export function _LOCAL(args: any[]): void {
  var [head, ...tail] = args; // the original arguments destructured
  if ((args.length === 1) && (head.type === CellType.LIST))
    args = head.val; // only 1 arg whose value is a cell list
  const ctx = getProcedureCtx();
  if (ctx)
    for (var i=0; i<args.length; i++)
      _local(ctx, args[i].val);
  else
    throwError('e03', null, null);
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
  // var list: string[] = Object.keys(globalVariables);
  var list: string[] = Object.keys(contesti[0].variables);
  return { type: CellType.LIST, val: list.map((s: string) => wordCell(s)) }; 
}
