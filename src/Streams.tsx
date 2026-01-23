// LogoDevices.tsx
// 251214 - 1st version

/*
import { CellType, Cell } from './CoreDefinitions';
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
*/

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
  // type: 'BUFFER'; // as const;
  private type: string = 'BUFFER';
  private lines: string[];
  private currentIndex: number = 0;
  private name: string;

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
  // type: 'SHELL'; // as const;
  private type: string = 'SHELL';
  private name: string = "Console";
  private resolveNextLine: ((line: string) => void) | null = null;

  // Questa funzione verrà chiamata dal componente React (LogoShell) 
  // quando l'utente preme INVIO
  public provideInput(line: string) {
    console.log('ShellSource - provideInput', line, this.resolveNextLine);
    if (this.resolveNextLine) {
      const resolve = this.resolveNextLine;
      this.resolveNextLine = null;
      resolve(line);
    }
  }

  async getLine(): Promise<string | null> {
    console.log('ShellSource - getLine');
    return new Promise((resolve) => {
      this.resolveNextLine = resolve;
      // Qui potresti emettere un evento per dire alla UI di mostrare il prompt
    });
  }
}

export interface OutputChannel {
  type: 'SHELL' | 'BUFFER' | 'NULL';
  write(text: string): void;
  writeLine(text: string): void;
  error(text: string): void;
  name: string;
}

export class ShellOutput implements OutputChannel {
  private type: 'SHELL'; // as const;
  private name: string = "Console";
  private currentLineBuffer: string = "";
  
  // Passiamo il dispatcher per aggiornare lo stato di React
  // Accettiamo il dispatch come argomento
  constructor(private dispatch: (action: any) => void) {}

  write(text: string) {
    // this.dispatch({ type: 'APPEND_SHELL_LINE', payload: { text, type: 'output' } });
    this.currentLineBuffer += text;
    // Aggiorna la riga corrente nello stato di React senza crearne una nuova
    this.dispatch({ type: 'UPDATE_CURRENT_OUTPUT_LINE', text: this.currentLineBuffer });
  }

  // writeLine(text: string) {
  writeLine(text: string, lineType?: string = 'output') {
    // this.write(text + "\n");  // In un log a righe, write e writeLine spesso coincidono
    const fullLine = this.currentLineBuffer + text + "\n";
    this.currentLineBuffer = ""; // Reset del buffer
    // this.dispatch({ type: 'APPEND_SHELL_LINE', payload: { text: fullLine, type: 'output' } });
    this.dispatch({ type: 'APPEND_SHELL_LINE', payload: { text: fullLine, type: lineType } });
  }

  error(text: string) {
    this.dispatch({ 
      type: 'APPEND_SHELL_LINE', 
      payload: { text, type: 'error' } 
    });
  }
}




