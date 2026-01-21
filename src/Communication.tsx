// Communication.tsx
// 260114 - 1st version: inspired to Ilscrivi.cpp and Ilanalis.cpp of IperLogo

import { CellType, Cell } from './CoreDefinitions';
import { ShellSource, OutputChannel } from './Streams';
import { nodeToString } from './Parser';

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

export function _READWORD(): Cell {
  console.log('function _READWORD', args);
  return null;
}

export function _READLIST(): Cell {
  console.log('function _READLIST', args);
  return null;
}
