// Communication.tsx
// 260114 - 1st version: inspired to Ilscrivi.cpp and Ilanalis.cpp of IperLogo

import { CellType, Cell } from './CoreDefinitions';
import { ShellSource, OutputChannel } from './Streams';
import { Parse, nodeToString } from './Parser';

export function _PRINT(channel: OutputChannel, args: any[]): void {
	console.log('function _PRINT', channel, args);
	for (var i=0; i<args.length; i++) {
    channel.writeLine(nodeToString(args[i], false));
  }
}

export function _TYPE(channel: OutputChannel, args: any[]): void {
  console.log('function _TYPE', channel, args);
  for (var i=0; i<args.length; i++) {
    channel.write(nodeToString(args[i], false));
  }
}

export function _SHOW(channel: OutputChannel, args: any[]): void {
  console.log('function _SHOW', channel, args);
  for (var i=0; i<args.length; i++) {
    channel.writeLine(nodeToString(args[i], true));
  }
}

export function _WRITECHAR(channel: OutputChannel, args: any[]): void {
  console.log('function _WRITECHAR', channel, args);
  channel.write(args[0].val);
}

export async function _READWORD(source: ShellSource): Promise<Cell> {
  const input = await source.getLine();
  console.log('function _READWORD', input);
  return { type: CellType.WORD, val: input };
}

export async function _READLIST(source: ShellSource): Promise<Cell> {
  const input = await source.getLine();
  console.log('function _READLIST', input);
  const parsed = Parse(input);
  return { type: CellType.LIST, val: input };
}

export function _READCHAR(): Cell {
  console.log('function _READCHAR');
  return null;
}
