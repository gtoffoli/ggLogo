// Math.tsx
// 2511227 first version

import { CellType, Cell } from './CoreDefinitions';
import { LANGUAGE_MAPS } from './LocalizationMaps';
import { shared_langCode } from './LogoShell';
import { equalNumbers, unEqualNumbers } from './Math';

export var localizedTruthValues: string[]; // list of strings representing localized truth values

// normalizes a localized Logo representation of a truth value
export function normalizeBoolean (arg: string): string {
	const dict = LANGUAGE_MAPS[shared_langCode];
	return dict[arg.toUpperCase()];
}

// converts a Javascript boolean in its localized Logo representation
export function localizeBoolean (arg: boolean): string {
	const dict = LANGUAGE_MAPS[shared_langCode];
	const keyword = (arg) ? 'TRUE' : 'FALSE';
	const localized = Object.keys(dict).find(key => dict[key] === keyword);
	return '\"'+localized;
}

// puts in the global variable localizedTruthValues a list of strings representing localized truth values
export function localizeTruthValues(): void {
	const keywords = ['FALSE', 'TRUE'];
	const dict = LANGUAGE_MAPS[shared_langCode];
	localizedTruthValues = [];
	var localized;
	for (var i=0; i<keywords.length; i++) {
		localized = Object.keys(dict).find(key => dict[key] === keywords[i]);
		localizedTruthValues.push(localized);
		localizedTruthValues.push(localized.toLowerCase());
	}
}

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
