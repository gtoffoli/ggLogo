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

let synth = null; // OmniOscillator routed through an AmplitudeEnvelope
let samplers = []; // Samplers eache able to repitch a few sample sounds from a real instrument

export const _MIDIOPEN = async (values: any[]) => {
  await Tone.start();
  // Creiamo un PolySynth per gestire più note contemporaneamente (polifonia)
  synth = new Tone.PolySynth(Tone.Synth).toDestination();
  return "Tone.js WebAudio Engine Ready - Internal Synth";
  // return { type: CellType.WORD, val: "Tone.js WebAudio Engine Ready - Internal Synth" };};
}

export const _MIDILOADINSTRUMENT = async (values: any[]) => {
  var instrumentName = values[0].val;
  // 1. Pulizia memoria precedente
  // if (sampler) sampler.dispose();

  // 2. Mappatura (Esempio: carichi solo 3 note, Tone.js calcola le altre)
  // Il fetch avviene solo qui, ovvero "On Demand"
  console.log(`_MIDILOADINSTRUMENT`, `/ggLogo/assets/sounds/${instrumentName}-mp3/`);
  let sampler = new Tone.Sampler({
    urls: {
      "C4": `C4.mp3`,
      "G4": `G4.mp3`,
      "C5": `C5.mp3`,
    },
    baseUrl: `/ggLogo/assets/sounds/${instrumentName}-mp3/`,
    onload: () => {
      console.log(`${instrumentName} caricato correttamente!`);
      this.triggerAttackRelease(["C4", "G4", "C5"], 4);
    }
  }).toDestination();
  samplers.push(sampler);
};

export const _MIDIMSG = (values: any[]) => {
  var maxChannel = samplers.length;
  if ((!synth) && (!maxChannel))
    return

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
    console.log('_MIDIMSG', channel, command)

    if (command === 144) { // 0x90: Note On
      if (d2 > 0) {
        // Convertiamo il numero MIDI (es. 60) in nota (es. "C4")
        const freq = Tone.Frequency(d1, "midi").toNote();
        const velocity = d2 / 127; // Tone.js usa 0..1
        console.log('_MIDIMSG', freq, velocity)
        if (channel === 0)
          synth.triggerAttack(freq, Tone.now(), velocity);
        else if (channel <= maxChannel)
          samplers[channel - 1].triggerAttack(freq, Tone.now(), velocity);
      } else {
        // Velocity 0 equivale a Note Off
        const freq = Tone.Frequency(d1, "midi").toNote();
        if (channel === 0)
          synth.triggerRelease(freq, Tone.now());
        else if (channel <= maxChannel)
          samplers[channel - 1].triggerRelease(freq, Tone.now());
      }
    } 
    else if (command === 128) { // 0x80: Note Off
      const freq = Tone.Frequency(d1, "midi").toNote();
      if (channel === 0)
        synth.triggerRelease(freq, Tone.now());
      else if (channel <= maxChannel)
        samplers[channel - 1].triggerRelease(freq, Tone.now());
    }
  }
};
