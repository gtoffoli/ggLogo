// NearField.tsx
// 260617 - 1st version

import { bstr, buf, str } from "crc-32"
import { CellType, Cell } from './CoreDefinitions';
import { throwError} from './Interpreter';
import { toLogoCell, nodeToString } from './Parser';
import { contesti, liv_contesto } from './LogoControl';
import { renderTextToBitmap }from './TurtleCanvas'; 

const LED_DEVICE_PREFIX = 'LED_BLE';
const LED_DEVICE_NAME = 'LED_BLE_4C519840';
const LED_DEVICE_ID = '/j1X1CfrhV893qnU8TMkvA==';
const GENERIC_ACCESS_UUID = '00001800-0000-1000-8000-00805f9b34fb'; // non è il servizio con le characteristics

// UUID estratti dalla analisi
const READ_SERVICE_UUID = '00000018-0000-1000-8000-00805f9b34fb'; // 0x1800
const WRITE_SERVICE_UUID = '000000fa-0000-1000-8000-00805f9b34fb'; // 0x00FA <---------- ok
const OTHER_SERVICE_UUID = '0000ae00-0000-1000-8000-00805f9b34fb'; // 0xAE00
const LED_SERVICE_UUID = WRITE_SERVICE_UUID; 

const LED_WRITE_CHAR_UUID = '0000fa02-0000-1000-8000-00805f9b34fb'; // LED Write Characteristic
const LED_NOTIFY_CHAR_UUID = '0000fa03-0000-1000-8000-00805f9b34fb'; // LED Notify Characteristic
const LED_CCCD_UUID = "00002902-0000-1000-8000-00805f9b34fb"; // Client Characteristic Configuration Descriptor

const LED_COMMAND_POWER = '0x0107'

var device: BluetoothDevice = null;
var writeChar: BluetoothRemoteGATTCharacteristic = null;
var notifyChar: BluetoothRemoteGATTCharacteristic = null;

export async function _BLUEDEVICES(args: any[]): any {
  // creo l'oggetto Bluetooth
  const bt = navigator.bluetooth;
  console.log(`Bluetooth object:`, bt);
  const availability = await bt.getAvailability();
  if (!availability)
    throwError('e15', null, null);
  // recupero i dispositivi Bluetooth autorizzati
  const devices = await bt.getDevices();
  console.log(`Trovati ${devices.length} dispositivi autorizzati.`);
  return toLogoCell(devices.map(device => [device.name, device.id]));
}

export async function _BLUE(args: any[]): any {
  const namePrefix: string = args[0].val;
  const command: string = args[1].val.toUpperCase();
  var text: string;
  var results = [];

  // Creo l'oggetto Bluetooth e verifico che sia supportato dal browser
  const bt = navigator.bluetooth;
  console.log(`Bluetooth object:`, bt);
  const availability = await bt.getAvailability();
  if (!availability)
    throwError('e15', null, null);

  // Eseguo il comando (nome comando + parametro opzionale)
  if (namePrefix.toUpperCase().startsWith(LED_DEVICE_PREFIX)) {
    results.push(LED_DEVICE_NAME);
    results.push(command);
    // if (command !== 'TEXT')
    if ((command !== 'DISCONNECT') && ((!device) || (!device.gatt?.connected))) {
      await LED_connect();
      // device.addEventListener('gattserverdisconnected', onDisconnected);
    }
    
    switch (command) {
      case 'DISCONNECT':
        LED_disconnect();
        break;
      case 'OFF':
        await LED_setPower(writeChar, false)
        // Errore di sistema: No Services matching UUID 0000fa00-0000-1000-8000-00805f9b34fb
        break;
      case 'ON':
        await LED_setPower(writeChar, true)
        break;
      case 'TEXT':
        if (args.length < 3)
          throwError('e11', contesti[liv_contesto].funzione.coreKey);
        text = nodeToString(args[2], false);
        results.push(text);
        LED_sendText(writeChar, text);
        break;
    }
  }
  return toLogoCell(results);
}

// from connectToLED draft in Gemini session 260614
async function LED_connect() {
  if (!device) {
    device = await navigator.bluetooth.requestDevice({
      filters: [{
        namePrefix: 'LED_BLE',
        // services: [LED_SERVICE_UUID] // SPOSTA QUI L'UUID
      }],
      optionalServices: [LED_SERVICE_UUID]
    });
    console.log("device:", device);
  }
  const server = await device.gatt?.connect();
  console.log("server:", server);
  const services = await server.getPrimaryServices();
  services.forEach(s => console.log("service UUID trovato:", s.uuid));
  const service = await server?.getPrimaryService(LED_SERVICE_UUID);
  console.log("service:", service);
  writeChar = await service?.getCharacteristic(LED_WRITE_CHAR_UUID);
  notifyChar = await service?.getCharacteristic(LED_NOTIFY_CHAR_UUID);

  // Abilita le notifiche per ricevere risposte dal dispositivo
  await notifyChar?.startNotifications();
  await notifyChar?.addEventListener('characteristicvaluechanged', handleNotifications);
  // return [writeChar, notifyChar];
}

function handleNotifications(event) {
  let characteristic = event.target;
  let value = characteristic.value; // Questo è un oggetto DataView
   console.log('Notifica ricevutoa ', value);
  
  // Esempio: Lettura di un valore intero a 8 bit (Uint8)
  // let myValue = value.getUint8(0);
  // console.log('Nuovo valore ricevuto: ', myValue);
}

function LED_disconnect() {
  if ((device) && (!device.gatt?.connected))
    device.gatt.disconnect();
  device = null;
  writeChar = null;
  notifyChar = null;
}

const onDisconnected = async () => {
  console.log("Connessione persa, riprovo tra 2 secondi...");
  // device = null;
  // writeChar = null;
  // notifyChar = null;
  setTimeout(async () => {
    // Logica di riconnessione
    await LED_connect();
  }, 2000);
}

// from setDisplayPower draft in Gemini session 260614 and set_power command in ipixel-ctrl
async function LED_setPower(writeChar: BluetoothRemoteGATTCharacteristic, isOn: boolean) {
   const powerCmd = new Uint8Array([
    0x05, 0x00, // Lunghezza totale del comando
    0x07, 0x01, // Comando Power
    isOn ? 0x01 : 0x00, // Valore (1=ON, 0=OFF)
  ]);
  await writeChar.writeValue(powerCmd);
}

async function LED_sendText(writeChar: BluetoothRemoteGATTCharacteristic, text: string) {
  const num_chars = text.length;
  var width = 64;
  var height = 32;
  var fontHeight = 16;
  var fontName = 'Arial';
  var bitmapClamped: Uint8ClampedArray = renderTextToBitmap(text, width, height, fontHeight, fontName);
  var bitmapUint8: Uint8Array = new Uint8Array(bitmapClamped.buffer, bitmapClamped.byteOffset, bitmapClamped.length);
  console.log('_BLUE sendText 1', text, bitmapUint8.length);
  var sendTextBuffer: ArrayBuffer = formatForIPixel(num_chars, bitmapUint8);
  console.log('_BLUE - sendText 2', sendTextBuffer);
  // await writeChar.writeValue(sendTextBuffer);
  await writeChar.writeValueWithResponse(sendTextBuffer);
  console.log('_BLUE - sendText 3');
}

// see 1. https://github.com/sdolphin-JP/ipixel-ctrl/blob/main/docs/DeviceCommands.md
// see 2. https://github.com/lucagoc/pypixelcolor/tree/main/src/pypixelcolor/commands/send_text
function formatForIPixel(num_chars: number, bitmap: Uint8Array) {
  const fgRed = 0xff; const fgGreen = 0xff; const fgBlue = 0xff;
  const bgRed = 0x00; const bgGreen = 0x00; const bgBlue = 0x00;
  var prefix = new Uint8Array([
    0x00, 0x00, // place for Total command size in little endian at offset 0
    0x00, 0x01, // Comando 0x0100 - set_text
    // DATA FOR COMMAD follow
    
    0x00, // fixed, unknown use
    0x00, 0x00, 0x00, 0x00, // DAT_SIZE_LE, place for DAT data size at offset 4+1
    0x00, 0x00, 0x00, 0x00, // DAT_CRC32_LE, place for crc 32 of DAT data at offset 4+5
    0x00, // fixed, unknown use
    0x01, // SCR_NO (1 - 255), screen number ?
    // TXT_DATA: follow the prefix
  ]);
  // properties: 3 fixed bytes (?) + animation + speed + rainbow + 3 bytes fg color + 1 byte bg flag + 3 bytes bg color(from 2)
  var textProperties = new Uint8Array([ // (from 1)
    // TXT_DATA: follow the prefix
    0x00, 0x00, // DAT_LEN_LEN, place for Text Length  at offset 0
    0x01, 0x01, // reserved, unknown use
    0x00, // animation (= no effect)
    0x00, // speed (= fixed)
    0x00, // rainbow_mode (= no style)
    fgRed, fgGreen, fgBlue, // fg color RGB
    0x00, // backround enabled (= disabled)
    bgRed, bgGreen, bgBlue, // backround color RGB
  ]);
  new DataView(textProperties.buffer).setUint16(0, num_chars, true); // inserisco direttamente num_chars LE a offset 0
  // var charactersBytes = new Uint8Array([0xff]);
  var charactersBytes = encode_car_image(bitmap);
  const dataPayload = concatUint8Arrays([textProperties, charactersBytes]);
  const payloadSize = dataPayload.length;
  const commandSize = payloadSize + prefix.length;
  new DataView(prefix.buffer).setUint16(0, commandSize, true); // inserisco direttamente command size LE a offset 0 di prefix
  const crc_32 = buf(dataPayload); // see https://github.com/sheetjs/js-crc32
  console.log('CRC32', crc_32); // Outputs a decimal number
  new DataView(prefix.buffer).setUint32(4+1, payloadSize, true); // inserisco direttamente payload size LE a offset 4+1 di prefix
  new DataView(prefix.buffer).setUint32(4+5, crc_32, true); // inserisco direttamente crc LE a offset 4+5 di prefix
  const formattedText: Uint8Array = concatUint8Arrays([prefix, dataPayload]);
  const textBuffer: ArrayBuffer = formattedText.buffer;
  return textBuffer;
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  // 1. Calcola la dimensione totale di tutti gli array
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  // 2. Crea un nuovo array della dimensione corretta
  const result = new Uint8Array(totalLength);
  // 3. Copia i singoli array nel risultato man mano
  let offset = 0;
  for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
  }
  return result;
}

// see https://github.com/lucagoc/pypixelcolor/blob/main/src/pypixelcolor/commands/send_text/image_processing.py
function encode_car_image(bitmap: Uint8Array): Uint8Array {
  // bitmap è [R, G, B, A, R, G, B, A, ...]
  // Assumiamo che il display voglia 1 bit per pixel (monocromatico)
  // 64 colonne * 32 righe = 2048 pixel / 8 = 256 byte
  const output = new Uint8Array(256); 
  
  for (let x = 0; x < 64; x++) {
    for (let y = 0; y < 32; y++) {
      // Calcola l'indice nel canvas (RGBA)
      const rgbaIdx = (y * 64 + x) * 4;
      // Se R+G+B > 128, pixel acceso
      const isPixelOn = (bitmap[rgbaIdx] + bitmap[rgbaIdx+1] + bitmap[rgbaIdx+2]) > 384;
      
      if (isPixelOn) {
        // Logica di packing: imposta il bit corretto nel byte dell'output
        // Questo dipende dall'ordine Column-Major del display
        const byteIdx = x * 4 + Math.floor(y / 8);
        const bitIdx = y % 8;
        output[byteIdx] |= (1 << bitIdx);
      }
    }
  }
  return output;
}

