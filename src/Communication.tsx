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

export async function _READWORD(source: InteractiveData): Promise<Cell> {
  console.log('function _READWORD - 1', source);
  // Chiediamo alla ShellSource di fornirci una riga "una tantum"
  const input = await source.getData();
  // Il parser Logo solitamente prende solo la prima parola per READWORD
  return { type: CellType.WORD, val: input ? input.trim().split(/\s+/)[0] : "" };
}

export async function _READLIST(source: InteractiveData): Promise<Cell> {
  console.log('function _READLIST - 1', source);
  // Chiediamo alla ShellSource di fornirci una riga "una tantum"
  const input = await source.getData();
  console.log('function _READLIST - 2', input);
  const parsed = Parse(input.trim());
  return { type: CellType.LIST, val: parsed };
}

export async function _READCHAR(source: InteractiveData): Promise<Cell> {
  console.log('function _READCHAR - 1', source);
  const input = await source.getData();
  return { type: CellType.WORD, val: input };
}
