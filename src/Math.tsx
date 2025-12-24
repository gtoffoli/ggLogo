// Math.tsx
// 2511218 first version

import { CellType, Cell } from './CoreDefinitions';

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
