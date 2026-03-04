// TimeMusic.tsx
// 260216 - 1st version

import * as Tone from 'tone';
import { CellType, Cell } from './CoreDefinitions';
import { throwError} from './Interpreter';

var referenceTime: number = 0;

export function _TIME(): Cell {
  return { type: CellType.NUMBER, val: Date.now() - referenceTime };
}

export function _SETTIME(values: any[]): void {
  referenceTime = values[0].val;
}

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export async function _WAIT(values: any[]) {
  const ms = values[0].val;
  console.log('_WAIT 1', ms);
  await wait(ms); 
  console.log('_WAIT 2', ms);
}

let synth = null;

export const _MIDIOPEN = async (values: any[]) => {
  await Tone.start();
  // Creiamo un PolySynth per gestire più note contemporaneamente (polifonia)
  synth = new Tone.PolySynth(Tone.Synth).toDestination();
  return "Tone.js WebAudio Engine Ready - Internal Synth";
  // return { type: CellType.WORD, val: "Tone.js WebAudio Engine Ready - Internal Synth" };};
}
export const _MIDIMSG = (values: any[]) => {
  if (!synth) return;

  const msg = values[0].val;
  const msgLength = msg.length;
  if ((msgLength <= 0) || (msgLength % 3 !== 0))
    throwError('e05', null, msg);
  var triple;

  // Elaboriamo a gruppi di 3 (Status, Dato1, Dato2)
  for (let i = 0; i < msgLength; i += 3) {
    const status = msg[i].val;
    const d1 = msg[i + 1].val; // Nota (0-127)
    const d2 = msg[i + 2].val; // Velocity (Volume 0-127)

    // Logica MIDI Standard
    const channel = status & 0x0F; // Gli ultimi 4 bit sono il canale
    const command = status & 0xF0; // I primi 4 bit sono il comando

    if (command === 144) { // 0x90: Note On
      if (d2 > 0) {
        // Convertiamo il numero MIDI (es. 60) in nota (es. "C4")
        const freq = Tone.Frequency(d1, "midi").toNote();
        const velocity = d2 / 127; // Tone.js usa 0..1
        synth.triggerAttack(freq, Tone.now(), velocity);
      } else {
        // Velocity 0 equivale a Note Off
        const freq = Tone.Frequency(d1, "midi").toNote();
        synth.triggerRelease(freq, Tone.now());
      }
    } 
    else if (command === 128) { // 0x80: Note Off
      const freq = Tone.Frequency(d1, "midi").toNote();
      synth.triggerRelease(freq, Tone.now());
    }
  }
};
