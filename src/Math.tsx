// Math.tsx
// 2511218 first version

import { CellType, Cell } from './CoreDefinitions';
import { throwError, function_key } from './Interpreter';

function numberp(cell: Cell): boolean {
  return ((cell.type === CellType.NUMBER) || ((cell.type === CellType.WORD) && (! isNaN(parseFloat(cell.val)))))
}
export function _NUMBERP(args: any[]): Cell {
  return { type: CellType.BOOLEAN, val: numberp(args[0]) };
}

export function _ABS(values: any[]): Cell {
  return { type: CellType.NUMBER, val: Math.abs(values[0].val) };
}

export function _INT(values: any[]): Cell {
  return { type: CellType.NUMBER, val: Math.trunc(values[0].val) };
}

export function _ROUND(values: any[]): Cell {
  return { type: CellType.NUMBER, val: Math.round(values[0].val) };
}

export function _SIGN(values: any[]): Cell {
	var sign = 0;
	if (values[0].val < 0) sign = -1;
	else if (values[0].val > 0) sign = 1;
	return { type: CellType.NUMBER, val: sign };
}
export function _MINUS(values: any[]): Cell {
	return { type: CellType.NUMBER, val: -values[0].val };
}

export function _SUM(values: any[]): Cell {
	var sum = 0;
	for (var i=0; i<values.length; i++)
		sum += values[i].val;
	return { type: CellType.NUMBER, val: sum };
}

export function _DIFFERENCE(values: any[]): Cell {
//	var difference = values[0].val - values[1].val;
  var difference = values[0].val;
  if (values.length === 1)
    difference = -difference; // meno unario
  else
    difference = difference - values[1].val; // meno ubiario
	return { type: CellType.NUMBER, val: difference };
}

export function _PRODUCT(values: any[]): Cell {
	var product = 1;
	for (var i=0; i<values.length; i++)
		product *= values[i].val;
	return { type: CellType.NUMBER, val: product };
}

export function _QUOTIENT(values: any[]): Cell {
	var quotient = values[0].val / values[1].val;
	return { type: CellType.NUMBER, val: quotient };
}

export function _POWER(values: any[]): Cell {
  const base = values[0].val;
  const exp = values[1].val;
  if (((base === 0) && (exp <= 0)) || ((base < 0) && (!Number.isInteger(exp))))
    throwError('e05', function_key, exp);
  return { type: CellType.NUMBER, val: Math.pow(base, exp) };
}
export function _EXP(values: any[]): Cell {
  return { type: CellType.NUMBER, val: Math.exp(values[0].val) };
}
export function _SQRT(values: any[]): Cell {
  const arg = values[0].val;
  if (arg < 0) throwError('e05', function_key, arg);
  return { type: CellType.NUMBER, val: Math.sqrt(arg) };
}

export function _LOG10(values: any[]): Cell {
  const arg = values[0].val;
  if (arg <= 0) throwError('e05', function_key, arg);
  return { type: CellType.NUMBER, val: Math.log10(arg) };
}
export function _LN(values: any[]): Cell {
  const arg = values[0].val;
  if (arg <= 0) throwError('e05', function_key, arg);
  return { type: CellType.NUMBER, val: Math.log(arg) };
}

export function _RAD(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: arg * Math.PI/180};
}
export function _RADSIN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.sin(arg) };
}
export function _RADCOS(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.cos(arg) };
}
export function _RADTAN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.tan(arg) };
}
export function _RADARCTAN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.atan(arg) };
}
export function _SIN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.sin(arg * Math.PI/180) };
}
export function _COS(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.cos(arg * Math.PI/180) };
}
export function _TAN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.tan(arg * Math.PI/180) };
}
export function _ARCTAN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.atan(arg * 180 / Math.PI) };
}

export function _LESSP(values: any[]): Cell {
	var value = (values[0].val < values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}
export function _LESSEQUALP(values: any[]): Cell {
	var value = (values[0].val <= values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}

export function _GREATERP(values: any[]): Cell {
	var value = (values[0].val > values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}
export function _GREATEREQUALP(values: any[]): Cell {
	var value = (values[0].val >= values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}

export function equalNumbers(n1: number, n2: number): boolean {
	return (n1 === n2) ? true : false;
}
export function unEqualNumbers(n1: number, n2: number): boolean {
	return (n1 === n2) ? false : true;
}

