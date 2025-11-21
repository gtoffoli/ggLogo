// LogoDefine.tsx
// 2511120 - 1st version: inspired to Ildef.cpp of IperLogo

import { cellType, Cell } from './CoreDefinitions';
import { VarVoc, ProcVoc } from './Interpreter';


export function _SET(values: any[]): void {
	console.log('function _SET', values[0],values[1]);
	var name = values[0];
	var value = values[1];
	VarVoc[name] = value;
}

export function _DEFINE(values: any[]): void {
	console.log('function _DEFINE', values[0],values[1]);
	var name = values[0];
	var value = values[1];
	ProcVoc[name] = value;
}

export function _TO(values: any[]): void {
	console.log('function _TO', values[0]);
	var name = values[0];
}

export function _END(): void {
	console.log('function _END');
}
