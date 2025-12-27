// Math.tsx
// 2511218 first version

import { CellType, Cell } from './CoreDefinitions';


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
	var difference = values[0].val - values[1].val;
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

