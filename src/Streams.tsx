// LogoDevices.tsx
// 251214 - 1st version

import { devType, deviceDescription, CellType, Cell } from './CoreDefinitions';
import { contesti, liv_contesto } from './LogoControl';

// codifica dei device MLOGO
export enum devCode {
  CONSOLE = 0,  // codice di console
  STAMPANTE = 1,  // codice di stampante
  FOGLIO = 2,   // codice di device del foglio di editor
  TARTALFA = 3, // codice di schermo TARTA usato per output alfanum.
  COM1 = 4,   // codice di porta comunicazione n. 1
  MIN_DEV = 6,  // minimo codice di device non preallocato
}

// codifica dei bit di stato MLOGO (_stato) per file C
export enum devType {
  NULL_DEV = -1,
  O_BINARIO = 1,  // file aperto in modalita' binario
          // 2 riservato futuri usi per file 
          // 4 riservato futuri usi per file
  O_FINESTRA = 8, // device corrispondente a viewport del GFX
  O_TARTA = 16, // finestra di tipo tarta
  O_FOGLIO = 32,  // finestra di tipo foglio
  O_ARCHIVIO = 64,// device di tipo archivio
  O_PLAYER = 128, // player MCI
  O_BROWSER = 256,// browser HTML
}

export type deviceDescription = {
  name: string,
  handle: number,
  state: number,
}

export var DEVICES = {
  0: { name: 'CONSOLE', handle: 0, state: 0 } as deviceDescription,
  1: { name: 'TURTLE', handle: 0, state: 0 } as deviceDescription
}

export var is_recupera: boolean;

export function _READER(values: any[]): Cell {
	var device = contesti[liv_contesto].dev_recupera;
	return { cellType: CellType.NUMBER, val: device };
}

export function ini_streams(ctx: Context): void {
  console.log('ini_streams');
  is_recupera = false;
  ctx['dev_recupera'] = devCode.CONSOLE;
}

// La funzione getLine sarà accessibile solo se forniamo un dispatcher
interface InterpreterDispatch {
    dispatch: (action: any) => void;
}

/**
 * Funzione asincrona che l'interprete (es. la primitiva TO) può chiamare 
 * per ottenere la prossima riga di input in modo non bloccante.
 */
export function getConsoleLine(prompt: string, dispatch: InterpreterDispatch['dispatch']): Promise<string> {
    return new Promise((resolve, reject) => {
        // 1. Istruisce lo stato globale a mettersi in attesa
        dispatch({
            type: 'WAIT_FOR_INPUT',
            waiter: { resolve, reject, prompt }
        });
        
        // La Promise è ora sospesa, in attesa che l'azione venga gestita dal LogoShell.
    });
}

export async function getCommandLine(prompt: string, dispatch: InterpreterDispatch['dispatch']): string {
  var ctx = contesti[liv_contesto];
  console.log('getCommandLine', liv_contesto, ctx.dev_recupera, ctx, DEVICES);
  var device = DEVICES[ctx.dev_recupera];
   var line: string;
  if (device.handle === 0)
    line = await getConsoleLine(prompt, dispatch);
  return line;
}

/* IMPLEMENTATION OF SOURCES PATTERN */

export interface InputSource {
//  type: 'SHELL' | 'BUFFER' | 'PROCEDURE';
  type: 'SHELL' | 'BUFFER';
  // Restituisce una stringa o null se la sorgente è esaurita (EOF)
  getLine(): Promise<string | null>;
  // Un nome descrittivo (es. il nome del file o "Console")
  name: string;
}

export class BufferSource implements InputSource {
  type: 'BUFFER'; // as const;
  private lines: string[];
  private currentIndex: number = 0;
  name: string;

  constructor(content: string, name: string) {
    // Divide il testo in righe
    this.lines = content.split(/\r?\n/);
    this.name = name;
  }

  async getLine(): Promise<string | null> {
    if (this.currentIndex < this.lines.length) {
      return this.lines[this.currentIndex++];
    }
    return null; // Fine del buffer
  }
}

export class ShellSource implements InputSource {
  type: 'SHELL'; // as const;
  name: string = "Console";
  private resolveNextLine: ((line: string) => void) | null = null;

  // Questa funzione verrà chiamata dal componente React (LogoShell) 
  // quando l'utente preme INVIO
  public provideInput(line: string) {
    console.log('ShellSource - provideInput', line);
    if (this.resolveNextLine) {
      const resolve = this.resolveNextLine;
      this.resolveNextLine = null;
      resolve(line);
    }
  }

  async getLine(): Promise<string | null> {
    return new Promise((resolve) => {
      this.resolveNextLine = resolve;
      // Qui potresti emettere un evento per dire alla UI di mostrare il prompt
    });
  }
}



