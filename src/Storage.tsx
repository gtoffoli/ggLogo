// Storage.tsx
// 260816 - 1st version

import { CellType, Cell } from './CoreDefinitions';
import { throwError} from './Interpreter';
import { toLogoCell } from './Parser';

export async function _SELECT_FOLDER(args: any[]): Promise<Cell> {
  const folder = await localService.selectFolder();
  if (folder)
    return { type: CellType.WORD, val: folder };
  else
    return { type: CellType.BOOLEAN, val: false };
}

export async function _CURDIR(args: any[]): Promise<Cell> {
  const curDir: string = await localService.curDir();
  return { type: CellType.WORD, val: curDir };
}

export async function _SETCURDIR(args: any[]) {
  const path: ParsedPath = parseLogoPath(args[0].val);
  await localService.setCurDir(path.fileName);
}

export async function _CREATE_DIR(args: any[]) {
  const path: ParsedPath = parseLogoPath(args[0].val);
  await localService.createDir(path.fileName);
}

export function _SUBCURDIR(args: any[]): void {
}

export async function _DIRECTORY(args: any[]): Promise<Cell> {
  const directoryList =  await localService.listDirectory();
  return toLogoCell(directoryList);
}

export async function _SELECT_FILE(args: any[]): Promise<Cell> {
  const file = await localService.selectFile();
  if (file)
    return { type: CellType.WORD, val: file };
  else
    return { type: CellType.BOOLEAN, val: false };
}

export async function _FILEP(args: any[]): Promise<Cell> {
  const path: ParsedPath = parseLogoPath(args[0].val);
  const exists: boolean = await localService.fileExists(path.fileName);
  console.log('_FILEP', path, exists);
  return { type: CellType.BOOLEAN, val: exists };
}

export function _CREATE(args: any[]): void {
}

export function _OPEN(args: any[]): void {
}

export function _CLOSE(args: any[]): void {
}

export async function _RENAME_FILE(args: any[]) {
  const oldPath: ParsedPath = parseLogoPath(args[0].val);
  const newPath: ParsedPath = parseLogoPath(args[1].val);
  await localService.fileRename(oldPath.fileName, newPath.fileName);
}

export function _READFILE(args: any[]): void {
}

export function _WRITEFILE(args: any[]): void {
}

export async function _DELETE_FILE(args: any[]) {
  const path: ParsedPath = parseLogoPath(args[0].val);
  await localService.fileDelete(path.fileName);
}


export type StoragePrefix = '~FILES' | '~HOME' | '~DROPBOX' | '~GDRIVE' | '~CLASS';
export interface ParsedPath {
  prefix: StoragePrefix;
  fileName: string;
}
/**
 * Scompone una stringa di percorso Logo nel prefisso e nel nome file.
 * Esempio: '"~FILES/progetto.logo"' -> { prefix: '~FILES', fileName: 'progetto.logo' }
 */
export function parseLogoPath(rawPath: string): ParsedPath {
  // Rimuove eventuali virgolette tipiche della sintassi Logo (es. "~FILES/file)
  const cleanPath = rawPath.replace(/^"/, '');
  
  const match = cleanPath.match(/^(~[A-Z]+)\/(.+)$/);
  if (!match) {
    // Se non viene specificato un prefisso, Terrapin Logo usa ~FILES di default
    return { prefix: '~FILES', fileName: cleanPath };
  }

  return {
    prefix: match[1] as StoragePrefix,
    fileName: match[2]
  };
}

/*
## Emulazione di ~FILES con le File System Access API
Ecco la classe TypeScript per gestire lettura e scrittura:
*/

export class LocalStorageService {
  private directoryHandle: FileSystemDirectoryHandle | null = null;

  /**
   * Richiede all'utente di selezionare una cartella sul proprio PC
   */
  async initializeDirectory(): Promise<void> {
    try {
      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      currentDirectory = "~FILES/"
    } catch (error) {
      console.error("Accesso alla cartella negato dall'utente:", error);
      throw error;
    }
  }

  /** Emula il comando CURDIR di Logo */
  async curDir(): Promise<string> {
    if (!this.directoryHandle) {
      await this.initializeDirectory();
    }
    return currentDirectory;
  }

  /** Emula il comando SETCURDIR di Logo */
  async setCurDir(fileName: string) {
    if (!this.directoryHandle) {
      await this.initializeDirectory();
    }
    currentDirectory = "~FILES/" + fileName;
  }

  /** Emula il comando SELECT.FOLDER di Logo */
  async selectFolder(): Promise<string> {
    try {
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      return directoryHandle.name;
    } catch (error) {
      console.error("Accesso alla cartella negato dall'utente:", error);
      // throw error;
      return '';
    }
  }

  /** Emula il comando CREATE.DIR di Logo */
  async createDir(dirName: string) {
    if (!this.directoryHandle) {
      await this.initializeDirectory();
    }
    const subDirectoryHandle = await this.directoryHandle.getDirectoryHandle(dirName, { create: true });
  }

  /** Emula il comando DIRECTORY di Logo */
  async listDirectory() {
    if (!this.directoryHandle) {
      await this.initializeDirectory();
    }
    var directoryList = [];
    for await (const [key, value] of this.directoryHandle.entries()) {
      directoryList.push(key);
    }
    return directoryList;
  }

  /** Emula il comando SELECT.FILE di Logo */
  async selectFile(): Promise<string> {
    try {
      const fileHandle = await window.showOpenFilePicker();
      console.log("selectFile", fileHandle);
      if (fileHandle.length > 0)
        return fileHandle[0].name;
      return '';
    } catch (error) {
      console.error("Accesso al file negato dall'utente:", error);
      return '';
    }
  }

  /** Emula il comando FILEP di Logo */
  async fileExists(fileName: string): Promise<boolean> {
    if (!this.directoryHandle) {
      await this.initializeDirectory();
    }
    for await (const [key, value] of this.directoryHandle.entries()) {
      if (key === fileName)
        return true;
    }
    return false;
  }

  /** Emula il comando DELETE di Logo */
  async fileDelete(fileName: string) {
    if (!this.directoryHandle) {
      await this.initializeDirectory();
    }
    for await (const [key, value] of this.directoryHandle.entries()) {
      if (key === fileName) {
        // await this.directoryHandle.remove(value);
        await this.directoryHandle.removeEntry(fileName);
        return;
      }
    }
    throwError('e21', null, fileName);
  }

  /** Emula il comando RENAME di Logo */
  async fileRename(oldName: string, newName: string) {
    if (!this.directoryHandle) {
      await this.initializeDirectory();
    }
    for await (const [key, value] of this.directoryHandle.entries()) {
      if (key === oldName) {
        // Rinomina il file mantenendolo nella stessa cartella
        await value.move(newName);
        return;
      }
    }
    throwError('e21', null, oldName);
  }

  /**
   * Emula il comando SAVE di Logo
   */
  async saveFile(fileName: string, content: string): Promise<void> {
    if (!this.directoryHandle) {
      await this.initializeDirectory();
    }

    try {
      // Ottiene o crea il file all'interno della directory selezionata
      const fileHandle = await this.directoryHandle!.getFileHandle(fileName, { create: true });
      
      // Crea uno stream di scrittura
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      console.log(`File ${fileName} salvato con successo.`);
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      throw error;
    }
  }

  /**
   * Emula il comando LOAD di Logo
   */
  async loadFile(fileName: string): Promise<string> {
    if (!this.directoryHandle) {
      await this.initializeDirectory();
    }

    try {
      const fileHandle = await this.directoryHandle!.getFileHandle(fileName, { create: false });
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      console.error("Errore durante il caricamento del file:", error);
      throw error;
    }
  }
}

// semplificazione (provvisoria?) rispetto all'uso dello StorageRouter (commentato più sotto)
const localService: LocalStorageService = new LocalStorageService();
var currentDirectory = null;
let directoryStack: FileSystemDirectoryHandle[] = [];

/*
## Gestione e Routing dei Servizi (~GDRIVE, ~DROPBOX)
Per emulare i servizi cloud all'interno della stessa architettura, puoi creare un Router di Storage che smista le chiamate in base al prefisso identificato da parseLogoPath:

// StorageRouter.tsx
import { parseLogoPath, type StoragePrefix } from './types';
 { LocalStorageService } from './LocalStorageService';
export class StorageRouter {
  private localService = new LocalStorageService();

  async executeSave(logoPath: string, content: string): Promise<void> {
    const { prefix, fileName } = parseLogoPath(logoPath);

    switch (prefix) {
      case '~FILES':
      case '~HOME':
        // Reindirizza l'archiviazione locale alle File System Access API
        await this.localService.saveFile(fileName, content);
        break;
      
      case '~GDRIVE':
        // Qui implementerai l'SDK di Google Drive (OAuth2 + Fetch)
        console.log(`Salvataggio su Google Drive del file: ${fileName}`);
        break;

      case '~DROPBOX':
        // Qui implementerai l'SDK di Dropbox
        console.log(`Salvataggio su Dropbox del file: ${fileName}`);
        break;

      default:
        throw new Error(`Servizio di archiviazione ${prefix} non supportato.`);
    }
  }
}
*/

/*
## 1. Il Pattern "Workspace" (Persistenza Silenziosa)
*/

import { get, set } from 'idb-keyval'; // Libreria leggera per IndexedDB
export class PersistentWorkspace {
  private rootHandle:  | null = null;

  async initWorkspace() {
    // 1. Tenta di recuperare l'handle salvato in precedenza
    this.rootHandle = await get('logo-workspace-handle');
    
    if (this.rootHandle) {
      // 2. Verifica se abbiamo già i permessi (raro al primo avvio di sessione)
      if (await this.verifyPermission(this.rootHandle, true)) {
        return;
      }
      // 3. Se non abbiamo i permessi, serve un click dell'utente per fare il "Request"
      this.showReauthUI();
    } else {
      this.showSetupUI(); // Prima configurazione assoluta
    }
  }

  async requestAccess() {
    // Questa funzione DEVE essere chiamata dentro un addEventListener di un click
    if (this.rootHandle) {
      const status = await this.rootHandle.requestPermission({ mode: 'readwrite' });
      if (status === 'granted') return;
    }
    
    // Se non c'è l'handle, chiediamo la cartella per la prima volta
    this.rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await set('logo-workspace-handle', this.rootHandle);
  }

  private async verifyPermission(fileHandle: FileSystemDirectoryHandle, readWrite: boolean) {
    const options: FileSystemHandlePermissionDescriptor = {};
    if (readWrite) options.mode = 'readwrite';
    return (await fileHandle.queryPermission(options)) === 'granted';
  }
  
  // Metodi interni per iniettare l'interfaccia utente di sblocco...
  private showReauthUI() { /* Mostra un banner: "Clicca qui per consentire a Logo l'accesso ai file locali" */ }
  private showSetupUI() { /* Mostra un bottone: "Seleziona la tua cartella Logo sul PC" */ }
}
