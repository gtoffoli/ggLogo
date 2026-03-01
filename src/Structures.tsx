// Structures.tsx
// 251222 - 1st version: inspired to Ilparlis.cpp of IperLogo

import { CellType, Cell } from './CoreDefinitions';
import { throwError, function_key } from './Interpreter';


export function _WORD(args: any[]): Cell {
	console.log('function _WORD', args);
	var word = '';
	for (var i=0; i<args.length; i++)
		word += args[i].val.toString();
	return { type: CellType.WORD, val: word };
}

export function _LIST(args: any[]): Cell {
	console.log('function _LIST', args);
	var list = [];
	for (var i=0; i<args.length; i++)
		list.push(args[i]);
	return { type: CellType.LIST, val: list };
}

export function _SENTENCE(args: any[]): Cell {
	console.log('function _SENTENCE', args);
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
	console.log('function _FIRST', args);
	var arg = args[0];
  return firstItem(args[0]);
}
export function _LAST(args: any[]): Cell {
	console.log('function _LAST', args);
  return lastItem(args[0]);
	// err_arg1();
}

export function _FIRSTS(args: any[]): Cell {
  console.log('function _FIRSTS', args);
  var sequence = args[0].val;
  var firsts = [];
  for (var i=0; i < sequence.length; i++)
    firsts.push(firstItem(sequence[i]));
  return { type: CellType.LIST, val: firsts };
}
export function _LASTS(args: any[]): Cell {
  console.log('function _LASTS', args);
  var sequence = args[0].val;
  var lasts = [];
  for (var i=0; i < sequence.length; i++)
    lasts.push(lastItem(sequence[i]));
  return { type: CellType.LIST, val: lasts };
}

export function _BUTFIRST(args: any[]): Cell {
	console.log('function _BUTFIRST', args);
	var arg = args[0];
	var value = arg.val;
	if (value.length) {
		if (arg.type === CellType.LIST)
			return { type: CellType.LIST, val: value.slice(1) };
		else
			return { type: CellType.WORD, val: value.toString().slice(1) };
	}
	// err_arg1(); 
}
export function _BUTLAST(args: any[]): Cell {
	console.log('function _BUTLAST', args);
	var arg = args[0];
	var value = arg.val;
	if (value.length) {
		if (arg.type === CellType.LIST)
			return { type: CellType.LIST, val: value.slice(0, -1) };
		else
			return { type: CellType.WORD, val: value.toString().slice(0, -1) };
	}
	// err_arg1(); 
}

export function _BUTFIRSTS(args: any[]): Cell {
  console.log('function _BUTFIRSTS', args);
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
  console.log('function _BUTLASTS', args);
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
	console.log('function _ITEM', args);
	var index = args[0].val;
	var sequence = args[1].val;
	if (index < 1 || index > sequence.length)
		throw new Error("Index out of bounds");
	if (args[1].type === CellType.LIST)
		return sequence[index-1];
	else
		return { type: CellType.WORD, val: sequence.toString().charAt(index-1) };
}

function wordp(cell: Cell): boolean {
	return ((cell.type===CellType.WORD) || (cell.type===CellType.NUMBER) || (cell.type===CellType.BOOLEAN))	
}
export function _WORDP(args: any[]): Cell {
	console.log('function _WORDP', args);
	return { type: CellType.BOOLEAN, val: wordp(args[0]) };
}

export function _LISTP(args: any[]): Cell {
	console.log('function _LISTP', args);
	return { type: CellType.BOOLEAN, val: (args[0].type === CellType.LIST) };
}
