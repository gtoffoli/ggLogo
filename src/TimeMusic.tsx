// TimeMusic.tsx
// 260216 - 1st version

import * as Tone from 'tone';
import path from 'path';
import { CellType, Cell } from './CoreDefinitions';
import { throwError} from './Interpreter';
import { toLogoCell, nodeToString } from './Parser';

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
// let synth: MidiChannel | null = null; // OmniOscillator routed through an AmplitudeEnvelope
// let samplers: MidiChannel[] = []; // Tone Sampler instances, eache able to repitch sample sounds from a real instrument
var samplers: Record<number, MidiChannel> = {}; // Tone Sampler instances, eache able to repitch sample sounds from a real instrument
var currentChannelKey: number | null = null;

// needed only for use of the basic Synthetizer
export const _MIDIOPEN = async (values: any[]) => {
  samplers = {};
  await Tone.start();
  // Creiamo un PolySynth per gestire più note contemporaneamente (polifonia)
  let instrument = new Tone.PolySynth(Tone.Synth).toDestination();
  // synth = { name: 'Synth', instrument: instrument };
  samplers[0] = { name: 'PolySynth', instrument: instrument };
  currentChannelKey = 0;
  // return "Tone.js WebAudio Engine Ready - Internal Synth";
}
// closes the basic Synthetizer and releases possibly loaded instruments
export async function resetMidiChannels() {
  /*
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
  */
  for (const [key, channel] of Object.entries(samplers)) {
    console.log(`Chiave: ${key}, Valore: ${channel}`);
    samplers[key].instrument.releaseAll();
    samplers[key].instrument.dispose();
    delete samplers[key];
  }
}
export const _MIDICLOSE = async (values: any[]) => {
  await resetMidiChannels();
  currentChannelKey = null;
}

export function _MIDI (values: any[]): Cell {
  var currentChannel = [currentChannelKey, samplers[currentChannelKey].name];
  return toLogoCell(currentChannel);
}
// ouputs list of instruments associated to MIDI "channels"
export function _MIDICHANNELS (values: any[]): Cell {
  var channels = [];
  for (const [key, channel] of Object.entries(samplers)) {
    console.log(`Chiave: ${key}, Valore: ${channel}`);
    channels.push([key, channel.name]);
  }
  return toLogoCell(channels);
}
// loads an "instrument" from an MP3 sound sample library, partially copied as local assets
export const _MIDILOADINSTRUMENT = async (values: any[]) => {
  // var instrumentName = values[0].val;
  const instrumentNumber = values[0].val;
  const instrumentName = midiInstrumentList[instrumentNumber];
  // 1. Pulizia memoria precedente
  // if (sampler) sampler.dispose();
  if (instrumentNumber in samplers)
    samplers[instrumentNumber].instrument.dispose();

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
      currentChannelKey = instrumentNumber;
      samplers[instrumentNumber] = { name: instrumentName, instrument: sampler };
    }
  }).toDestination();
  // samplers.push({ name: instrumentName, instrument: sampler });
};

// inteprets a list of messages in MIDI notation as commands to Tone instruments
export const _MIDIMSG = async (values: any[]) => {
  if (currentChannelKey === null) return;

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
    var channel = status & 0x0F; // Gli ultimi 4 bit sono il canale
    if ((channel === 0) || (!(channel in samplers)))
      channel = currentChannelKey;
    const command = status & 0xF0; // I primi 4 bit sono il comando
    console.log('_MIDIMSG', channel, command)

    if (command === 144) { // 0x90: Note On
      if (d2 > 0) {
        // Convertiamo il numero MIDI (es. 60) in nota (es. "C4")
        const freq = Tone.Frequency(d1, "midi").toNote();
        const velocity = d2 / 127; // Tone.js usa 0..1
        console.log('_MIDIMSG', freq, velocity)
        samplers[channel].instrument.triggerAttack(freq, Tone.now(), velocity);
      } else {
        // Velocity 0 equivale a Note Off
        const freq = Tone.Frequency(d1, "midi").toNote();
        samplers[channel].instrument.triggerRelease(freq, Tone.now());
      }
    } 
    else if (command === 128) { // 0x80: Note Off
      const freq = Tone.Frequency(d1, "midi").toNote();
      samplers[channel].instrument.triggerRelease(freq, Tone.now());
    }
  }
};

interface LogoNote {
  pitch: string;      // es: "C4", "D#5"
  duration: string;   // es: "4n", "8n"
  time: number;       // Offset temporale in secondi
}
interface LogoTempoChange {
  bpm: number;
  ticks: number; // Posizione esatta del cambio
}

class LogoMusicParser {
  // Usiamo i "Ticks" (standard 192 per quarto in Tone.js)
  // Questo permette al Transport di scalare il tempo correttamente
  private currentTicks: number = 0;

  parse(input: string) {
    const tokens = input.replace(/[\[\]]/g, '').toUpperCase().split(/\s+/);
    const notes: LogoNote[] = [];
    const tempoChanges: LogoTempoChange[] = [];

    for (const token of tokens) {
      // Cambio Tempo Dinamico
      if (token.startsWith('T')) {
        const newBpm = parseInt(token.slice(1));
        tempoChanges.push({ bpm: newBpm, ticks: this.currentTicks });
        continue;
      }

      // Parsing Nota...
      const match = token.match(/^(\d*(?:'\d+)?)?([A-GP])([#B])?(\d)?(\.)?$/);
      if (match) {
        const [_, durStr, note, accidental, oct, dot] = match;
        const toneDuration = this.convertDuration(durStr || "4", !!dot);

        // Convertiamo la durata in Ticks per mantenere la posizione relativa
        const durationInTicks = Tone.Time(toneDuration).toTicks();

        if (note !== 'P') {
          notes.push({
            pitch: `${note}${accidental || ''}${oct || 4}`,
            duration: toneDuration,
            // Usiamo i ticks come riferimento temporale
            time: this.currentTicks + "i", 
            velocity: 0.8
          });
        }
        
        this.currentTicks += durationInTicks;
      }
    }
    return { notes, tempoChanges };
  }

  private convertDuration(dur: string, isDotted: boolean): string {
    let base: string;
    if (dur.includes("'")) {
      // Formato 1'8 -> 8n
      base = dur.split("'")[1] + "n";
    } else {
      // Formato 4 -> 4n
      base = dur + "n";
    }
    return isDotted ? `${base}.` : base;
  }
}

function getInstrumentId(logoString: string): number {
  // Cerca la prima occorrenza di "I" seguita da cifre
  const match = logoString.match(/I(\d+)/i);
  // return match ? parseInt(match[1]) : 1; // Default allo strumento 1
  return match ? parseInt(match[1]) : 0; // Default allo strumento 1
}

async function playDynamicLogo(logoString: string, sampler: Tone.Sampler) {
  const parser = new LogoMusicParser();
  const { notes, tempoChanges } = parser.parse(logoString);

  Tone.Transport.stop();
  Tone.Transport.cancel();

  // 1. Programmiamo i cambi di BPM sulla timeline
  tempoChanges.forEach(change => {
    // Convertiamo i ticks nel tempo assoluto del transport
    const time = Tone.Time(change.ticks + "i").toSeconds();
    Tone.Transport.bpm.setValueAtTime(change.bpm, time);
  });
  // 2. Creiamo la parte usando i ticks come riferimento ("i")
  new Tone.Part((time, note) => {
    sampler.triggerAttackRelease(note.pitch, note.duration, time, note.velocity);
  }, notes).start(0);
  Tone.Transport.start();
}

async function startLogoMusic(logoString: string) {
  await Tone.start();
  // 1. Identifica quale sampler usare
  var instrumentId = getInstrumentId(logoString);
  if (!(instrumentId in samplers)) instrumentId = currentChannelKey;
  const selectedSampler = samplers[instrumentId].instrument;
  // 2. Passa il sampler selezionato alla logica di riproduzione
  // (Nota: rimuoviamo il comando I dalla stringa se necessario, 
  // o lasciamo che il parser lo ignori)
  playDynamicLogo(logoString, selectedSampler);
}

// inteprets a simple list of notes in Terrapin music notation
export const _MIDIPLAY = async (args: any[]) => {
  const noteString = nodeToString(args[0]);
  console.log('noteString', noteString);
  await startLogoMusic(noteString);
};

export async function _BLUEDEVICES(args: any[]): void {
  try {
    console.log('Recupero dei dispositivi Bluetooth autorizzati...');
    // Ottiene la lista dei dispositivi autorizzati
    const bt = navigator.bluetooth;
    console.log(`Bluetooth object:`, bt);
    /*
    const devices = await bt.getDevices();
    console.log(`> Trovati ${devices.length} dispositivi autorizzati.`);
    for (const device of devices) {
      console.log(`  - Nome: ${device.name}, ID: ${device.id}`);
      // Esempio: aggiungere un listener per modifiche o connettersi
      // device.addEventListener('gattserverdisconnected', onDisconnected);
    }
    */
    let options = {
      // filters: [
        // { name: "Fosi Audio" },
      // ],
      acceptAllDevices: true,
      // optionalServices: ["battery_service"],
    };
    try {
      const device = await bt.requestDevice({
        /*
        filters: [
         { name: "Fosi Audio BT20A" },
        ],
        */
        acceptAllDevices: true // O usare filters: [...]
      });
      console.log('Dispositivo selezionato:', device, device.name, device.id);
      const server = await device.gatt?.connect();
      console.log('Server connesso:', server);
    } catch (error) {
      console.log('Errore o annullato:', error);
    }
  } catch (error) {
    console.log('Argh! ' + error);
  }
}


var midiInstrumentMap: Record<number, string> = {}

function buildInstrumentMap(){
  for (var i = 0; i < midiInstrumentList.length; i++) {
    midiInstrumentMap[i] = midiInstrumentList[i];
  }
}

const midiInstrumentList: string[] = [
  "acoustic_grand_piano",
  "bright_acoustic_piano",
  "electric_grand_piano",
  "honkytonk_piano",
  "electric_piano_1",
  "electric_piano_2",
  "harpsichord",
  "clavinet",
  "celesta",
  "glockenspiel",
  "music_box",
  "vibraphone",
  "marimba",
  "xylophone",
  "tubular_bells",
  "dulcimer",
  "drawbar_organ",
  "percussive_organ",
  "rock_organ",
  "church_organ",
  "reed_organ",
  "accordion",
  "harmonica",
  "tango_accordion",
  "acoustic_guitar_nylon",
  "acoustic_guitar_steel",
  "electric_guitar_jazz",
  "electric_guitar_clean",
  "electric_guitar_muted",
  "overdriven_guitar",
  "distortion_guitar",
  "guitar_harmonics",
  "acoustic_bass",
  "electric_bass_finger",
  "electric_bass_pick",
  "fretless_bass",
  "slap_bass_1",
  "slap_bass_2",
  "synth_bass_1",
  "synth_bass_2",
  "violin", // 40
  "viola", // 41
  "cello", // 42
  "contrabass", // 43
  "tremolo_strings",
  "pizzicato_strings",
  "orchestral_harp",
  "timpani",
  "string_ensemble_1",
  "string_ensemble_2",
  "synth_strings_1",
  "synth_strings_2",
  "choir_aahs",
  "voice_oohs",
  "synth_choir",
  "orchestra_hit",
  "trumpet",
  "trombone",
  "tuba",
  "muted_trumpet",
  "french_horn",
  "brass_section",
  "synth_brass_1",
  "synth_brass_2",
  "soprano_sax",
  "alto_sax",
  "tenor_sax",
  "baritone_sax",
  "oboe",
  "english_horn",
  "bassoon",
  "clarinet",
  "piccolo",
  "flute", // 73
  "recorder",
  "pan_flute",
  "blown_bottle",
  "shakuhachi",
  "whistle",
  "ocarina", // 79
  "lead_1_square",
  "lead_2_sawtooth",
  "lead_3_calliope",
  "lead_4_chiff",
  "lead_5_charang",
  "lead_6_voice",
  "lead_7_fifths",
  "lead_8_bass__lead",
  "pad_1_new_age",
  "pad_2_warm",
  "pad_3_polysynth",
  "pad_4_choir",
  "pad_5_bowed",
  "pad_6_metallic",
  "pad_7_halo",
  "pad_8_sweep",
  "fx_1_rain",
  "fx_2_soundtrack",
  "fx_3_crystal",
  "fx_4_atmosphere",
  "fx_5_brightness",
  "fx_6_goblins",
  "fx_7_echoes",
  "fx_8_scifi",
  "sitar",
  "banjo",
  "shamisen",
  "koto",
  "kalimba",
  "bagpipe",
  "fiddle",
  "shanai",
  "tinkle_bell",
  "agogo",
  "steel_drums",
  "woodblock",
  "taiko_drum",
  "melodic_tom",
  "synth_drum",
  "reverse_cymbal",
  "guitar_fret_noise",
  "breath_noise",
  "seashore",
  "bird_tweet",
  "telephone_ring",
  "helicopter",
  "applause",
  "gunshot"
]