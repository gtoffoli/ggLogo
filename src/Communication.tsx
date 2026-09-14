// Communication.tsx
// 260114 - 1st version: inspired to Ilscrivi.cpp and Ilanalis.cpp of IperLogo

import { CellType, Cell } from './CoreDefinitions';
import { BufferSource, ShellSource, OutputChannel, InteractiveData, FileStream } from './Streams';
import { localService, ParsedPath, parseLogoPath } from './Storage';
import { throwError, currentOutput } from './Interpreter';
import { Parse, nodeToString } from './Parser';
import { keywordResolver } from './UseLocalization';

// codifica degli handle fissi dei device MLOGO
export enum devCode {
  CONSOLE = 0,    // codice di console
  STAMPANTE = 1,  // codice di stampante
  FOGLIO = 2,     // codice di device del foglio di editor
  TARTALFA = 3,   // codice di schermo TARTA usato per output alfanum.
}

// codifica dei bit di stato MLOGO (_stato) per file C
export enum devType {
/*
  NULL_DEV = -1,
  O_BINARIO = 1,  // file aperto in modalita' binario
          // 2 riservato futuri usi per file 
          // 4 riservato futuri usi per file
  O_FINESTRA = 8, // device corrispondente a viewport del GFX
  O_TARTA = 16, // finestra di tipo tarta
*/
  O_LISTENER = 4, // finestra di IO interattivo
  O_FOGLIO = 32,  // finestra di tipo foglio
  O_ARCHIVIO = 64,// device di tipo archivio
/*
  O_PLAYER = 128, // player MCI
  O_BROWSER = 256,// browser HTML
*/
}

type IoDevice = {
  name: string,
  type: number,
  fileHandle?: FileSystemFileHandle,
  state?: number,
  stream?: BufferSource | FileStream
}

// inizializzazione della mappa dei device
export var DEVICES =
[
  { name: 'CONSOLE', type: devType.O_LISTENER } as IoDevice, // index 0
  { name: 'PRINTER', type: 0 } as IoDevice, // index 1
  { name: 'EDITOR', type: devType.O_FOGLIO } as IoDevice, // index 2
  // { name: 'TURTLE', type: devType.O_TARTA } as IoDevice, // index 3
]
const MIN_DEV = 3  // minimo codice di device non preallocato

var dev_recupera: number;
var dev_leggi: number;  /* device per lettura */
var dev_scrivi: number; /* device per scrittura */
var dev_in: number;   /* device di input corrente MLOGO */
var dev_out: number;  /* device di output corrente MLOGO */
var dev_dribble: number;  /* device per dribble */
var dev_tarta: number;  /* device attivo come TARTA */
var dev_fogli: number; /* device attivo come FOGLIO */

/*-----------------------------------------------------------------------
  inizializzazione dell' associazione dei flussi logici con device fisici
  -----------------------------------------------------------------------*/
export function ini_flussi () {
/*
  int i;
  for (i = MIN_DEV; i <= MAX_DEV; ++i) _file [i] = -1;
  _nome [CONSOLE] = pc_CONSOLE;
  _file [CONSOLE] = Q_COMANDI;    // handle di console 
  _fstato [CONSOLE] = O_FINESTRA; // dichiara che console e' una finestra
  _nome [STAMPANTE] = pc_STAMPANTE;
  _nome [FOGLIO] = pc_FOGLIO; _fstato [FOGLIO] = O_FINESTRA | O_FOGLIO;
  _file [FOGLIO] = -1;        // Rivedere !!!!
*/
  dev_leggi = dev_scrivi = dev_recupera = devCode.CONSOLE;
}

function getCurrentInput(): IoDevice {
  return DEVICES[dev_leggi];
}

export function getCurrentOutput(): IoDevice {
  return DEVICES[dev_scrivi];
}

export function _READER(values: any[]): Cell {
  return { type: CellType.NUMBER, val: dev_leggi };
}
export function _READFROM(args: any[]) {
  var deviceHandle: number;
  var deviceName;
  var device; 
  if (args[0].type === CellType.NUMBER) {
    deviceHandle = args[0].val;
    device = DEVICES[deviceHandle];
    if (!device)
      throwError('e22', null, deviceHandle.toString());
  }
  else {
    deviceName = args[0].val;
    deviceHandle = deviceHandleFromName(deviceName);
    if (deviceHandle < 0)
      throwError('e22', null, deviceName);
    device = DEVICES[deviceHandle];
  }
  if (![devType.O_LISTENER, devType.O_FOGLIO, devType.O_ARCHIVIO].includes(device.type))
    throwError('e25', null, device.name);
  dev_leggi = deviceHandle;
}
export function _READPOS(values: any[]): Cell {
  return { type: CellType.NUMBER, val: 0 };
}
export function _READAT(values: any[]) {
}

export function _WRITER(values: any[]): Cell {
  return { type: CellType.NUMBER, val: dev_scrivi };
}
export function _WRITETO(args: any[]) {
  var deviceHandle: number;
  var deviceName;
  var device; 
  if (args[0].type === CellType.NUMBER) {
    deviceHandle = args[0].val;
    device = DEVICES[deviceHandle];
    if (!device)
      throwError('e22', null, deviceHandle.toString());
  }
  else {
    deviceName = args[0].val;
    deviceHandle = deviceHandleFromName(deviceName);
    if (deviceHandle < 0)
      throwError('e22', null, deviceName);
    device = DEVICES[deviceHandle];
  }
  if (![devType.O_LISTENER, devType.O_FOGLIO, devType.O_ARCHIVIO].includes(device.type))
    throwError('e25', null, device.name);
  dev_scrivi = deviceHandle;
}
export function _WRITEPOS(values: any[]): Cell {
  return { type: CellType.NUMBER, val: 0 };
}
export function _WRITEAT(values: any[]) {
}

function textWrite(text: string, device: IoDevice, newline?: boolean) {
  if (device.type === devType.O_ARCHIVIO) {
    if (newline)
      text = text + '\n';
    var data = new TextEncoder().encode(text);
    device.stream.write(data);
  }
  else {
    if (newline)
      currentOutput.writeLine(text);
    else
      currentOutput.write(text);
  }
}

export function _PRINT(args: any[]): void {
  const device = DEVICES[dev_scrivi];
  var text;
	for (var i=0; i<args.length; i++) {
    // currentOutput.writeLine(nodeToString(args[i], false));
    text = nodeToString(args[i], false);
    textWrite(text, device, true);
  }
}

export function _TYPE(args: any[]): void {
  const device = DEVICES[dev_scrivi];
  var text;
  for (var i=0; i<args.length; i++) {
    text = nodeToString(args[i], false);
    textWrite(text, device);
  }
}

export function _SHOW(args: any[]): void {
  const device = DEVICES[dev_scrivi];
  var text;
  for (var i=0; i<args.length; i++) {
    text = nodeToString(args[i], true);
    textWrite(text, device);
  }
}

export function _WRITECHAR(args: any[]): void {
  const device = DEVICES[dev_scrivi];
  textWrite(args[0].val, device);
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

function getFirstFreeSlot(list: any[]): number {
  const index: number = list.findIndex(item => item === "" || item == null);
  return (index === -1) ? list.length : index;
}

function getDeviceNames(): string[] {
  return DEVICES.map(item => item.name);
}

function deviceHandleFromName(name: string): number {
  const handles: number[] = DEVICES.flatMap((item, index) => item.name === name ? [index] : []);
  if (handles.length > 0)
    return handles[0];
  else
    return -1;
}

export async function _OPEN(args: any[]): Promise<Cell> {
  const path: ParsedPath = parseLogoPath(args[0].val);
  var deviceName;
  var deviceHandle: number = 0;
  var fileHandle: FileSystemFileHandle | null = null;
  var fileStream;
  const deviceNames = getDeviceNames();
  if (args[0].type === CellType.WORD) { // è specificato un nome di file 
    deviceName = path.fileName;
    var normalizedName = keywordResolver(deviceName);
    if (!normalizedName)
      normalizedName = deviceName;
    if (deviceNames.includes(normalizedName)) // dispositivo o file già aperto?
      throwError('e23', null, deviceName);
    fileHandle = await localService.fileGet(deviceName);
    if (!fileHandle)
      throwError('e21', null, deviceName);
  }
  else if (args[0].type === CellType.LIST) { // lista di estensioni?
    const extensions = args[0].val.map((n: Cell) => n.val);
    const fileHandle = await localService.selectFile(extensions, ''); // fa selezionare il file all'utente
    if (fileHandle) {
      const fileName = fileHandle.name;
      if (deviceNames.includes(fileName)) // l'utente ha selezionato un file già aperto
        throwError('e23', null, deviceName);
    }
    else
      {}
  }
  fileStream = new FileStream(fileHandle);
  fileStream.open();
  deviceHandle = getFirstFreeSlot(DEVICES);
  DEVICES[deviceHandle] = {
    name: deviceName,
    type: devType.O_ARCHIVIO,
    fileHandle: fileHandle,
    state: 0,
    stream: fileStream
  };
  return { type: CellType.NUMBER, val: deviceHandle }; // riporta un device handle (chiave nella mappa)
}

export async function _CREATE_FILE(args: any[]): Promise<Cell> {
  const path: ParsedPath = parseLogoPath(args[0].val);
  const deviceName = path.fileName;
  var normalizedName = keywordResolver(deviceName);
  if (!normalizedName)
    normalizedName = deviceName;
  const deviceNames = getDeviceNames();
  if (deviceNames.includes(normalizedName)) // dispositivo o file già aperto?
    throwError('e23', null, deviceName);
  const fileHandle = await localService.fileGet(deviceName, true);
  if (!fileHandle)
    throwError('e21', null, deviceName);
  const fileStream = new FileStream(fileHandle);
  fileStream.open();
  const deviceHandle = getFirstFreeSlot(DEVICES);
  DEVICES[deviceHandle] = {
    name: deviceName,
    type: devType.O_ARCHIVIO,
    fileHandle: fileHandle,
    state: 0,
    stream: fileStream
  };
  return { type: CellType.NUMBER, val: deviceHandle }; // riporta un device handle (chiave nella mappa)
}

export async function _CLOSE(args: any[]) {
  var deviceName;
  var deviceHandle;
  var device;
  if (args[0].type === CellType.WORD) { // è specificato un nome
    deviceName = args[0].val;
    var normalizedName = keywordResolver(deviceName);
    if (!normalizedName)
      normalizedName = deviceName;
    if (getDeviceNames().includes(normalizedName)) { // il nome è presente nella mappa dei device?
      deviceHandle = deviceHandleFromName(normalizedName);
      if (deviceHandle < 0)
        throwError('e22', null, deviceName);
      device = DEVICES[deviceHandle];
    }
    else // il nome, eventualmente normalizzato, non esiste nella mappa dei device
      throwError('e22', null, deviceName);
  }
  else {
    // è specificato un device handle (numero)
    deviceHandle = args[0].val;
    device = DEVICES[deviceHandle];
    if (!device)
      throwError('e22', null, deviceHandle.toString());
  }
  if (deviceHandle < MIN_DEV) // non si tratta di file ma di dispositivo sempre aperto?
    throwError('e36', null, deviceName);
  if (device.type === devType.O_ARCHIVIO)
    device.stream.close();
  delete DEVICES[deviceHandle];
  if (dev_scrivi === deviceHandle)
    dev_scrivi = devCode.CONSOLE;
}
