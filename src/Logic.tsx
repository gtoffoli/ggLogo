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
export function localizeTruthValues(langCode): void {
	const keywords = ['FALSE', 'TRUE'];
	const dict = LANGUAGE_MAPS[langCode];
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
export function _OR(values: any[]): Cell {
  var or = false;
  for (var i=0; i<values.length; i++)
    or = or || values[i].val;
  return { type: CellType.BOOLEAN, val: or };
}
export function _AND(values: any[]): Cell {
  var and = true;
  for (var i=0; i<values.length; i++)
    and = and && values[i].val;
  return { type: CellType.BOOLEAN, val: and };
}
export function _XOR(values: any[]): Cell {
  var xor = false;
  for (var i=0; i<values.length; i++)
    xor = (!(xor && values[i].val));
  return { type: CellType.BOOLEAN, val: xor };
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

export function _BITOR(values: any[]): Cell {
  var bitor = 0x00000000 >>> 0;
  for (var i=0; i<values.length; i++)
    bitor = bitor | values[i].val;
  return { type: CellType.NUMBER, val: bitor };
}
export function _BITAND(values: any[]): Cell {
  var bitand = 0xFFFFFFFF >>> 0;
  for (var i=0; i<values.length; i++)
    bitand = bitand & values[i].val;
  return { type: CellType.NUMBER, val: bitand };
}
export function _BITXOR(values: any[]): Cell {
  var bitxor = 0x00000000 >>> 0;
  for (var i=0; i<values.length; i++)
    bitxor = bitxor ^ values[i].val;
  return { type: CellType.NUMBER, val: bitxor };
}
export function _BITNOT(values: any[]): Cell {
  var bitnot = ~(values[0].val >>> 0);
  return { type: CellType.NUMBER, val: bitnot };
}

export function _ASHIFT(values: any[]): Cell {
  const bitcount = values[1].val;
  var ashift = values[0].val;
  if (bitcount > 0) ashift = ashift << bitcount;
  if (bitcount < 0) ashift = ashift >> (-bitcount);
  return { type: CellType.NUMBER, val: ashift };
}
export function _LSHIFT(values: any[]): Cell {
  const bitcount = values[1].val;
  var lshift = values[0].val >>> 0;
  if (bitcount > 0) lshift = lshift << bitcount;
  if (bitcount < 0) lshift = lshift >>> (-bitcount);
  return { type: CellType.NUMBER, val: lshift };
}

