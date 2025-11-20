// LogoDefine.tsx
// 2511120 - 1st version: inspired to Ildef.cpp of IperLogo

import { cellType, Cell } from './CoreDefinitions';
import { LogoVoc } from './Interpreter';


export function _SET(values: any[]): void {
	console.log('function _SET', values[0],values[1]);
	var name = values[0];
	var value = values[1];
	LogoVoc[name] = value;
}
