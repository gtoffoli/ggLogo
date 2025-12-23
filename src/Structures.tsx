// Structures.tsx
// 251222 - 1st version: inspired to Ilparlis.cpp of IperLogo

import { CellType, Cell } from './CoreDefinitions';
import { globalVariables, err_arg1 } from './Interpreter';

export function _MAKE(values: any[]): void {
	console.log('function _SET', values[0],values[1]);
	const name = values[0].val;
	const value = values[1];
	globalVariables[name] = value;
}

export function _THING(values: any[]): Cell {
	console.log('function _THING', values[0]);
	const name = values[0].val;
	return globalVariables[name];
}

export function _WORD(values: any[]): Cell {
	console.log('function _WORD', values);
	var word = '';
	for (var i=0; i<values.length; i++)
		word += values[i].val.toString();
	return { type: CellType.WORD, val: word };
}

export function _LIST(values: any[]): Cell {
	console.log('function _LIST', values);
	var list = [];
	for (var i=0; i<values.length; i++)
		list.push(values[i].val);
	return { type: CellType.LIST, val: list };
}

export function _FIRST(values: any[]): Cell {
	console.log('function _FIRST', values);
	var value = values[0];
	if (value.type === CellType.LIST) {
		const list = value.val;
		if (list.length)
			return list[0];
	}
	else {
		const word = value.val.toString();
		if (word.length)
			return { type: CellType.WORD, val: word.substring(0,1) };
	}
	err_arg1();
}
export function _LAST(values: any[]): Cell {
	console.log('function _LAST', values);
	var value = values[0];
	if (value.type === CellType.LIST) {
		const list = value.val;
		const length = list.length;
		if (length)
			return list[length-1];
	}
	else {
		var word = value.val.toString();
		if (word.length)
			return { type: CellType.WORD, val: word.slice(-1) };
	}
	err_arg1();
}
