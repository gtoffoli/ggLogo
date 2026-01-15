// Communication.tsx
// 260114 - 1st version: inspired to Ilscrivi.cpp and Ilanalis.cpp of IperLogo

import { CellType, Cell } from './CoreDefinitions';


export function _PRINT(args: any[]): void {
	console.log('function _PRINT', args);
	for (var i=0; i<args.length; i++) {}
}

export function _TYPE(args: any[]): void {
  console.log('function _TYPE', args);
  for (var i=0; i<args.length; i++) {}
}

export function _SHOW(args: any[]): void {
  console.log('function _SHOW', args);
  for (var i=0; i<args.length; i++) {}
}

export function _READWORD(): Cell {
  console.log('function _READWORD', args);
  retuen null;
}

export function _READLIST(): Cell {
  console.log('function _READLIST', args);
  retuen null;
}
