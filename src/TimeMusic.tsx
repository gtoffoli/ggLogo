// TimeMusic.tsx
// 260216 - 1st version

import * as Tone from 'tone';
import path from 'path';
import { CellType, Cell } from './CoreDefinitions';
import { throwError} from './Interpreter';
import { toLogoCell} from './Parser';

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

type MidiChannel = {
  name: string; // name of the instrument in the sound sample library
  instrument: Tone.Synth | Tone.Sampler; // Tone instrument object
}
let synth: MidiChannel | null = null; // OmniOscillator routed through an AmplitudeEnvelope
let samplers: MidiChannel[] = []; // Tone Sampler instances, eache able to repitch sample sounds from a real instrument

// needed only for use of the basic Synthetizer
export const _MIDIOPEN = async (values: any[]) => {
  await Tone.start();
  // Creiamo un PolySynth per gestire più note contemporaneamente (polifonia)
  let instrument = new Tone.PolySynth(Tone.Synth).toDestination();
  synth = { name: 'Synth', instrument: instrument };
  // return "Tone.js WebAudio Engine Ready - Internal Synth";
}
// closes the basic Synthetizer and releases possibly loaded instruments
export async function resetMidiChannels() {
  if (synth) {
    synth.instrument.releaseAll();
    synth.instrument.dispose();
  }
  synth = null;
  for (var i = 0; i < samplers.length; i++) {
    samplers[i].instrument.releaseAll();
    samplers[i].instrument.dispose();
  }
  samplers = [];
}
export const _MIDICLOSE = async (values: any[]) => {
  await resetMidiChannels();
}

// ouputs list of instruments associated to MIDI "channels"
export function _MIDICHANNELS (values: any[]): Cell {
  var channels = [];
  if (synth)
    channels.push([0, synth.name]);
  for (var i = 0; i < samplers.length; i++)
    channels.push([i+1, samplers[i].name]);
  return toLogoCell(channels);
}
// loads an "instrument" from an MP3 sound sample library, partially copied as local assets
export const _MIDILOADINSTRUMENT = async (values: any[]) => {
  var instrumentName = values[0].val;
  // 1. Pulizia memoria precedente
  // if (sampler) sampler.dispose();

  // 2. Mappatura (Esempio: carichi solo 3 note, Tone.js calcola le altre)
  // Il fetch avviene solo qui, ovvero "On Demand"
  let sampler = new Tone.Sampler({
    urls: {
      "G3": `G3.mp3`,
      "C4": `C4.mp3`,
      "E4": `E4.mp3`,
      "G4": `G4.mp3`,
      "C5": `C5.mp3`,
      "E5": `E5.mp3`,
      "G5": `G5.mp3`,
      "C6": `C6.mp3`,
    },
    baseUrl: `/sounds/${instrumentName}-mp3/`,
    onload: () => {
      console.log(`${instrumentName} caricato correttamente!`);
    }
  }).toDestination();
  samplers.push({ name: instrumentName, instrument: sampler });
};

// inteprets a list of messages in MIDI notation as commands to Tone instruments
export const _MIDIMSG = async (values: any[]) => {
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
          synth.instrument.triggerAttack(freq, Tone.now(), velocity);
        else if (channel <= maxChannel) {
          console.log('_MIDIMSG sampler:', samplers[channel - 1].instrument);
          samplers[channel - 1].instrument.triggerAttack(freq, Tone.now(), velocity);
        }
      } else {
        // Velocity 0 equivale a Note Off
        const freq = Tone.Frequency(d1, "midi").toNote();
        if (channel === 0)
          synth.instrument.triggerRelease(freq, Tone.now());
        else if (channel <= maxChannel)
          samplers[channel - 1].instrument.triggerRelease(freq, Tone.now());
      }
    } 
    else if (command === 128) { // 0x80: Note Off
      const freq = Tone.Frequency(d1, "midi").toNote();
      if (channel === 0)
        synth.instrument.triggerRelease(freq, Tone.now());
      else if (channel <= maxChannel)
        samplers[channel - 1].instrument.triggerRelease(freq, Tone.now());
    }
  }
};
