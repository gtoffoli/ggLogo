// Structures.tsx
// 251222 - 1st version: inspired to Ilparlis.cpp of IperLogo

import { CellType, Cell } from './CoreDefinitions';
import { throwError } from './Interpreter';


export function _WORD(args: any[]): Cell {
	var word = '';
	for (var i=0; i<args.length; i++)
		word += args[i].val.toString();
	return { type: CellType.WORD, val: word };
}

export function _LIST(args: any[]): Cell {
	var list = [];
	for (var i=0; i<args.length; i++)
		list.push(args[i]);
	return { type: CellType.LIST, val: list };
}

export function _SENTENCE(args: any[]): Cell {
	var sentence = [];
	var value;
	for (var i=0; i<args.length; i++) {
		value = args[i];
		if (value.type === CellType.LIST)
			sentence = sentence.concat(value.val);
		else
			sentence.push(value);
	}
	return { type: CellType.LIST, val: sentence };
}

export function _ARRAY(args: any[]): Cell {
  const size: number = args[0].val;
  if (size < 1) throwError('e05', null, args[0]);
  const origin: number = (args.length > 1) ? args[1].val : 1;
  if (origin < 0) throwError('e05', null, args[1]);
  var array: any[] = [];
  return { type: CellType.ARRAY, val: array, size: size, origin: origin };
}

export function _COUNT(args: any[]): Cell {
	var sequence = args[0].val;
	if (!(args[0].type === CellType.LIST))
		sequence = sequence.toString();
	return { type: CellType.NUMBER, val: sequence.length };
}

export function _FPUT(args: any[]): void {
	const list = args[1].val;
	return { type: CellType.LIST, val: [args[0]].concat(list) };
}
export function _LPUT(args: any[]): void {
	const list = args[1].val;
	list.push(args[0]);
	return { type: CellType.LIST, val: list };
}

function firstItem(arg: any[]): Cell {
  if (arg.type === CellType.LIST) {
    const list = arg.val;
    if (list.length)
      return list[0];
  }
  else {
    const word = arg.val.toString();
    if (word.length)
      return { type: CellType.WORD, val: word.substring(0,1) };
  }
}
function lastItem(arg: any[]): Cell {
  if (arg.type === CellType.LIST) {
    const list = arg.val;
    const length = list.length;
    if (length)
      return list[length-1];
  }
  else {
    var word = arg.val.toString();
    if (word.length)
      return { type: CellType.WORD, val: word.slice(-1) };
  }
}

export function _FIRST(args: any[]): Cell {
  return firstItem(args[0]);
}
export function _LAST(args: any[]): Cell {
  return lastItem(args[0]);
}

export function _FIRSTS(args: any[]): Cell {
  var sequence = args[0].val;
  var firsts = [];
  for (var i=0; i < sequence.length; i++)
    firsts.push(firstItem(sequence[i]));
  return { type: CellType.LIST, val: firsts };
}
export function _LASTS(args: any[]): Cell {
  var sequence = args[0].val;
  var lasts = [];
  for (var i=0; i < sequence.length; i++)
    lasts.push(lastItem(sequence[i]));
  return { type: CellType.LIST, val: lasts };
}

export function _BUTFIRST(args: any[]): Cell {
	var arg = args[0];
	var value = arg.val;
	if (value.length) {
		if (arg.type === CellType.LIST)
			return { type: CellType.LIST, val: value.slice(1) };
		else
			return { type: CellType.WORD, val: value.toString().slice(1) };
	}
}
export function _BUTLAST(args: any[]): Cell {
	var arg = args[0];
	var value = arg.val;
	if (value.length) {
		if (arg.type === CellType.LIST)
			return { type: CellType.LIST, val: value.slice(0, -1) };
		else
			return { type: CellType.WORD, val: value.toString().slice(0, -1) };
	}
}

export function _BUTFIRSTS(args: any[]): Cell {
  var sequence = args[0].val;
  var butfirsts = [];
  for (var i=0; i < sequence.length; i++) {
    var item = sequence[i];
    if (item.type === CellType.LIST)
      butfirsts.push( { type: CellType.LIST, val: item.val.slice(1) });
    else
      butfirsts.push( { type: CellType.WORD, val: item.val.toString().slice(1) });
  }
  return { type: CellType.LIST, val: butfirsts };
}
export function _BUTLASTS(args: any[]): Cell {
  var sequence = args[0].val;
  var butlasts = [];
  for (var i=0; i < sequence.length; i++) {
    var item = sequence[i];
    if (item.type === CellType.LIST)
      butlasts.push({ type: CellType.LIST, val: item.val.slice(0, -1)});
    else
      butlasts.push({ type: CellType.WORD, val: item.val.toString().slice(0, -1) });
  }
  return { type: CellType.LIST, val: butlasts };
}

export function _ITEM(args: any[]): Cell {
	var index = args[0].val;
	var sequence = args[1].val;
	if (index < 1 || index > sequence.length)
		throw new Error("Index out of bounds");
	if (args[1].type === CellType.LIST)
		return sequence[index-1];
	else
		return { type: CellType.WORD, val: sequence.toString().charAt(index-1) };
}
export function _MEMBERP(args: any[]): Cell {
  var item: any = args[0].val;
  var sequence: string | any[] = args[1].val;
  console.log('_MEMBERP 1', item, sequence);
  if (args[1].type === CellType.LIST)
    sequence = sequence.map((n: Cell) => n.val);
  var memberp: boolean = sequence.includes(item);
  console.log('_MEMBERP', item, sequence);
  return { type: CellType.BOOLEAN, val: memberp };
}
export function _SPLIT(args: any[]): Cell {
  const separator: any = args[0].val;
  const sequence: string | any[] = args[1].val;
  var split = [];
  var item: any;
  if (args[1].type === CellType.LIST) {
    var sublist: any[] = [];
    for (var i=0; i < sequence.length; i++) {
      item = sequence[i];
      if (item.val === separator) {
        if (sublist.length) { split.push({ type: CellType.LIST, val:sublist }); sublist = []; }
      }
      else sublist.push(item);
    }
    if (sublist.length) split.push({ type: CellType.LIST, val:sublist })
  }
  else {
    var substring = "";
    for (var j=0; j < sequence.length; j++) {
      item = sequence[j];
      if (item === separator) {
        if (substring.length) { split.push({ type: CellType.WORD, val:substring }); substring = ""; }
      }
      else substring = substring + item;
    } 
    if (substring.length) split.push({ type: CellType.WORD, val:substring });
  }
  return { type: CellType.LIST, val:split };
}

export function _LOWERCASE(args: any[]): Cell {
   return { type: CellType.WORD, val: args[0].val.toLowerCase() };
}
export function _UPPERCASE(args: any[]): Cell {
   return { type: CellType.WORD, val: args[0].val.toUpperCase() };
}

export function _ASCII(args: any[]): Cell {
  var string = args[0].val;
  if (string.length < 1) throwError('e05', null, args[0]);
  var carCode = string.charCodeAt(0);
  return { type: CellType.NUMBER, val: carCode };
}
export function _CHAR(args: any[]): Cell {
  var string = '';
  for (var i=0; i < args.length; i++)
    string += String.fromCharCode(args[i].val);
  return { type: CellType.WORD, val: string };
}

function wordp(cell: Cell): boolean {
	return ((cell.type===CellType.WORD) || (cell.type===CellType.NUMBER) || (cell.type===CellType.BOOLEAN))	
}
export function _WORDP(args: any[]): Cell {
	return { type: CellType.BOOLEAN, val: wordp(args[0]) };
}
export function _LISTP(args: any[]): Cell {
  return { type: CellType.BOOLEAN, val: (args[0].type === CellType.LIST) };
}
export function _EMPTYP(args: any[]): Cell {
  var emptyp: boolean = (args[0].val.length === 0) ? true : false;
  return { type: CellType.BOOLEAN, val: emptyp };
}
