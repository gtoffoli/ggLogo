// LogoDefine.tsx
// 251222 - 1st version: inspired to Ilparlis.cpp of IperLogo

import { CellType, Cell } from './CoreDefinitions';
import { globalVariables } from './Interpreter';

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
