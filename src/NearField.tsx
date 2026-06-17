// NearField.tsx
// 260617 - 1st version

import * as Tone from 'tone';
import { CellType, Cell } from './CoreDefinitions';
import { throwError} from './Interpreter';
import { toLogoCell, nodeToString } from './Parser';
import { contesti, liv_contesto } from './LogoControl';
import { password } from 'bun';
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
  var bitmap;
  var results = [];
  var writeChar: BluetoothRemoteGATTCharacteristic;
  var notifyChar: BluetoothRemoteGATTCharacteristic;

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
    [writeChar, notifyChar] = await LED_connect();
    switch (command) {
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
        text = args[2].val;
        results.push(text);
        bitmap = renderTextToBitmap(text);
        // da continuare
        break;
    }
  }
  return toLogoCell(results);
}

// from connectToLED draft in Gemini session 260614
async function LED_connect(): Promise<BluetoothRemoteGATTCharacteristic[]> {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{
      namePrefix: 'LED_BLE',
      // services: [LED_SERVICE_UUID] // SPOSTA QUI L'UUID
    }],
    optionalServices: [LED_SERVICE_UUID]
  });
  console.log("device:", device);
  const server = await device.gatt?.connect();
  console.log("server:", server);
  const service = await server?.getPrimaryService(LED_SERVICE_UUID);
  console.log("service:", service);
  const writeChar = await service?.getCharacteristic(LED_WRITE_CHAR_UUID);
  const notifyChar = await service?.getCharacteristic(LED_NOTIFY_CHAR_UUID);

  // Abilita le notifiche per ricevere risposte dal dispositivo
  await notifyChar?.startNotifications();
  return [writeChar, notifyChar];
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
