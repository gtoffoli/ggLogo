// Math.tsx
// 2511227 first version

import { CellType, Cell } from './CoreDefinitions';
import { equalNumbers, unEqualNumbers } from './Math';

export function _NOT(values: any[]): Cell {
	return { type: CellType.BOOLEAN, val: (!values[0].val) };
}

export function _EQUALP(values: any[]): Cell {
	var value: boolean;
	var type_1 = values[0].type;
	var type_2 = values[1].type;
	if ((type_1 === CellType.NUMBER) && (type_2 === CellType.NUMBER))
		value = equalNumbers(values[0].val, values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}
export function _NOTEQUALP(values: any[]): Cell {
	var value: boolean;
	var type_1 = values[0].type;
	var type_2 = values[1].type;
	if ((type_1 === CellType.NUMBER) && (type_2 === CellType.NUMBER))
		value = unEqualNumbers(values[0].val, values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}
