// LogoDevices.tsx
// 251214 - 1st version

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

export class InteractiveData {
  private resolveData: ((data: string) => void) | null = null;

  // Questa funzione verrà chiamata dal componente React (LogoShell) 
  // quando l'utente preme INVIO
  public provideData(data: string) {
    console.log('InteractiveData - provideData', data, this.resolveData);
    if (this.resolveData) {
      const resolve = this.resolveData;
      this.resolveData = null;
      resolve(data);
    }
  }

  async getData(): Promise<string | null> {
    console.log('InteractiveData - getData');
    return new Promise((resolve) => {
      this.resolveData = resolve;
      // Qui potresti emettere un evento per dire alla UI di mostrare il prompt
    });
  }
}

export interface OutputChannel {
  // type: 'SHELL' | 'BUFFER' | 'NULL';
  type: 'SHELL' | 'BUFFER' | 'NULL';
  write(text: string): void;
  writeLine(text: string): void;
  error(text: string): void;
  name: string;
}

export class ShellOutput implements OutputChannel {
  // private type: 'SHELL'; // as const;
  private type; // as const;
  private name: string = "Console";
  private currentLineBuffer: string = "";
  
  // Passiamo il dispatcher per aggiornare lo stato di React
  // Accettiamo il dispatch come argomento
  constructor(private dispatch: (action: any) => void) {
    this.type = 'SHELL';
  }

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

export class FileStream {
  private handle: FileSystemFileHandle;
  private bufferData: Uint8Array = new Uint8Array(0);
  private cursor: number = 0;
  private modified: boolean = false;

  constructor(handle: FileSystemFileHandle) {
    this.handle = handle;
  }

  async open() {
    const file = await this.handle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    this.bufferData = new Uint8Array(arrayBuffer);
    this.cursor = 0;
    this.modified = false;
  }

  read(length: number): Uint8Array {
    const end = Math.min(this.cursor + length, this.bufferData.length);
    const chunk = this.bufferData.slice(this.cursor, end);
    this.cursor = end;
    return chunk;
  }

  write(data: Uint8Array) {
    // Espande o sovrascrive il buffer in base alla posizione del cursore
    const newLen = Math.max(this.bufferData.length, this.cursor + data.length);
    const newBuffer = new Uint8Array(newLen);
    newBuffer.set(this.bufferData);
    newBuffer.set(data, this.cursor);
    this.bufferData = newBuffer;
    this.cursor += data.length;
    this.modified = true;
  }

  seek(position: number) {
    this.cursor = Math.max(0, Math.min(position, this.bufferData.length));
  }

  async close() {
    if (this.modified) {
      const writable = await this.handle.createWritable();
      await writable.write(this.bufferData);
      await writable.close();
    }
  }
}
