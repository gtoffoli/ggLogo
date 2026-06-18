// TimeMusic.tsx
// 260216 - 1st version

import * as Tone from 'tone';
import path from 'path';
import { CellType, Cell } from './CoreDefinitions';
import { throwError} from './Interpreter';
import { toLogoCell, nodeToString } from './Parser';
// import { contesti, liv_contesto } from './LogoControl';
// import { password } from 'bun';

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

// models a MIDI channel
type Channel = {
  instrument: number; // -1 (PolySynth) or reference to an item in the midiInstrumentList
  sampler: Tone.Synth | Tone.Sampler; // the Tone object able to produce some sound
  currentTicks: number; // used to synchronyze the MIDI channels
}
// map of MIDI channels
var channelArray: Channel[] = new Array(17);
var lastChannelNumber: number | null = null;

// finds the MIDI channel associated to an instrument number; if not found, return -1
// ma ha senso solo se supponiamo che ogni strumento sia associato a massimo un canale
// in tal caso ci serve per riutilizzare un sampler già creato a partire da certi campioni
function channelNumberFromInstrument(instrument: number): number {
  console.log('channelNumberFromInstrument', instrument);
  return channelArray.findIndex(channel => channel?.instrument === instrument);
}
// handles PolySynth as instrument # -1
function instrumentName(instrument: number): string {
  return (instrument === -1) ? 'PolySynth' : midiInstrumentList[instrument];
}

type MidiChannel = {
  name: string; // name of the instrument in the sound sample library
  instrument: Tone.Synth | Tone.Sampler; // Tone instrument object
}

type Sampler = Tone.Synth | Tone.Sampler;

// needed only for use of the basic Synthetizer
export const _MIDIOPEN = async (values: any[]) => {
  /* test of types Channel and ChannelMap and of functions channelFromInstrument and instrumentName */
  const sampler = new Tone.PolySynth(Tone.Synth).toDestination(); 
  channelArray[0] = { instrument: -1, sampler: sampler, currentTicks: 0 };
  lastChannelNumber = 0;
}
// closes the basic Synthetizer and releases possibly loaded instruments
export async function resetMidiChannels() {
  var channel: Channel;
  var sampler: Sampler;
  for (var i=0; i<=16; i++)
    if (channelArray[i] != undefined) {
      channel = channelArray[i];
      if (channel.sampler)
        channel.sampler.dispose();
      delete channelArray[i];
    }
}
export const _MIDICLOSE = async (values: any[]) => {
  await resetMidiChannels();
  lastChannelNumber = null;
}

export function _MIDI (values: any[]): Cell {
  var channel: Channel;
  if (lastChannelNumber !== null) {
    channel = channelArray[lastChannelNumber];
    return toLogoCell([lastChannelNumber, channel.instrument, instrumentName(channel.instrument)]);
  }
  else return toLogoCell([]);
}
// ouputs list of instruments associated to MIDI "channels"
export function _MIDICHANNELS (values: any[]): Cell {
  console.log('_MIDICHANNELS', channelArray);
  var channels: any[] = [];
  var channel: Channel;
  for (var i=0; i<=16; i++) {
    if (channelArray[i] != undefined) {
      channel = channelArray[i];
      channels.push([i, channel.instrument, instrumentName(channel.instrument)])
    }
  }
  return toLogoCell(channels);
}

// prenota un canale, qualsiasi o di indice specificato (>0), per associarvi uno strumento 
function getChannelforInstrument(instrumentNumber: number, channelNumber: number) {
  if (channelNumber > 0) {
    channelArray[channelNumber] = { instrument: instrumentNumber, sampler: null, currentTicks: 0 };
    return channelNumber;
  }
  for (var i=1; i<=16; i++) // find first free channel
    // if (channelArray[i] === undefined) {
    if (!(i in channelArray)) {
      channelArray[i] = { instrument: instrumentNumber, sampler: null, currentTicks: 0 };
      return i;
    }
  return 0; // no free channel found
}

// se il canale è specificato (già prenotato), carica lo strumento se il sampler non esiste già
// se il canale non è specificato (0), ne cerca uno, lo associa allo strumento e carica lo strumento
const loadInstrument = async (instrumentNumber: number, channelNumber: number) => {
  console.log('loadInstrument - 1', instrumentNumber, channelNumber);
  const instrumentName = midiInstrumentList[instrumentNumber];

  // Il canale è specificato?
  if ((channelNumber > 0) && (channelNumber in channelArray)) {
    console.log('loadInstrument - 2', instrumentNumber, channelNumber);
    if (channelArray[channelNumber].instrument === instrumentNumber) { // .. sì, ed è il canale cercato
      if (channelArray[channelNumber].sampler) // c'è anche il sampler?
        return;
    }
    else { // .. sì, ma è associato ad altro strumento
      channelArray[channelNumber].instrument = instrumentNumber; // cambio numero di strumento
      if (channelArray[channelNumber].sampler) // se il canale era attivo, faccio pulizia
        channelArray[channelNumber].sampler.dispose();
    }
  }

  if (!channelNumber) { // canale non specificato?
    console.log('loadInstrument - 3', instrumentNumber, channelNumber);
    channelNumber = channelNumberFromInstrument(instrumentNumber); // ne cerca uno già associato allo strumento
    if (channelNumber > 0) { // trovato
      if (channelArray[channelNumber].sampler) // c'è anche il sampler?
        return; // si
    }
    else // un canale con lo strumento specificato non esiste
      channelNumber = getChannelforInstrument(instrumentNumber, 0); // ne associa uno
  }
  console.log('loadInstrument - 4', channelNumber, instrumentNumber, instrumentName);

  if (channelArray[channelNumber].sampler) // strumento già caricato?
    return; // sì
  console.log('loadInstrument - 5', channelNumber, instrumentNumber, instrumentName);

  return new Promise((resolve, reject) => {

    // 2. Mappatura (Esempio: carichi solo 8 note, Tone.js calcola le altre)
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
        channelArray[channelNumber].sampler = sampler;
        lastChannelNumber = channelNumber;
        resolve(sampler); 
      },
      onerror: (error) => {
        console.error("Errore caricamento:", error);
        reject(error);
      }
    }).toDestination();
    console.log('loadInstrument - 6', channelNumber, sampler, channelArray);
  });
}

// loads an "instrument" from an MP3 sound sample library, partially copied as local assets
export const _MIDILOADINSTRUMENT = async (args: any[]) => {
  const instrumentNumber = args[0].val;
  await loadInstrument(instrumentNumber, 0);
  console.log('_MIDILOADINSTRUMENT', instrumentNumber, channelArray);
};

// inteprets a list of messages in MIDI notation as commands to Tone instruments
export const _MIDIMSG = async (values: any[]) => {
  if (lastChannelNumber === null) return;

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
    var channelNumber = status & 0x0F; // Gli ultimi 4 bit sono il canale
    if ((channelNumber === 0) || (!(channelNumber in channelArray)))
      channelNumber = lastChannelNumber;
    if ((channelNumber === null) || (!channelArray[channelNumber].sampler))
      throwError('e15', null, null);
    const sampler = channelArray[channelNumber].sampler;
    const command = status & 0xF0; // I primi 4 bit sono il comando
    console.log('_MIDIMSG', channelNumber, command)

    if (command === 144) { // 0x90: Note On
      if (d2 > 0) {
        // Convertiamo il numero MIDI (es. 60) in nota (es. "C4")
        const freq = Tone.Frequency(d1, "midi").toNote();
        const velocity = d2 / 127; // Tone.js usa 0..1
        console.log('_MIDIMSG', freq, velocity)
        sampler.triggerAttack(freq, Tone.now(), velocity);
      } else {
        // Velocity 0 equivale a Note Off
        const freq = Tone.Frequency(d1, "midi").toNote();
        sampler.triggerRelease(freq, Tone.now());
      }
    } 
    else if (command === 128) { // 0x80: Note Off
      const freq = Tone.Frequency(d1, "midi").toNote();
      sampler.triggerRelease(freq, Tone.now());
    }
  }
};

interface LogoNote {
  pitch: string;      // es: "C4", "D#5"
  duration: string;   // es: "4n", "8n"
  velocity: number;   // added 260508
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
  private currentOctave: number = 4; // Per gestire le ottave
  private currentChannel: number = 0; // Per gestire le "voci"
  private currentInstrument: number; // Per gestire gli strumenti

  // 1. Espansione macro per le ripetizioni (es: (C D)3 -> C D C D C D)
  private expandRepetitions(input: string): string {
    // Gestione RPT (opzionale): RPT 3 [ C D ] -> (C D)3
    const RPTRegex = /\[RPT(\d+)(.*?)\]/g;
    input = input.replace(RPTRegex, (_, count, content) => ("(" + content.trim() + ")" + count));
    // Nota: Terrapin usa spesso le tonde per la brevità
    const rptRegex = /\(([^)]+)\)(\d+)/g;
    let expanded = input;
    while (rptRegex.test(expanded)) {
      expanded = expanded.replace(rptRegex, (_, content, count) => 
        (content + " ").repeat(parseInt(count)).trim()
      );
    }
    return expanded.replace(/\s+/g, ' ');
  };

  parse(input: string) {
    const expandedInput = this.expandRepetitions(input.toUpperCase());
    
    // Usiamo una regex per catturare note, cambi tempo, canali o parentesi quadre
    // const tokens = expandedInput.match(/\[|\]|T\d+|I\d+|[A-GP][#B]?\d?\.?|\d*(?:'\d+)?[A-GP][#B]?\d?\.?/g) || [];
    const tokens = expandedInput.match(/\[|\]|T\d+|O\d+|I\d+|CHAN\d+|[A-GP][#B]?\d?\.?|\d*(?:'\d+)?[A-GP][#B]?\d?\.?/g) || [];
    
    const notes: (LogoNote & { channel: number })[] = [];
    const tempoChanges: LogoTempoChange[] = [];
    let isInChord = false;
    let chordStartTicks = 0;
    let maxChordDuration = 0;

    for (const token of tokens) {
      // Inizio Accordo
      if (token === '[') {
        isInChord = true;
        chordStartTicks = this.currentTicks;
        maxChordDuration = 0;
        continue;
      }
      // Fine Accordo
      if (token === ']') {
        isInChord = false;
        this.currentTicks = chordStartTicks + maxChordDuration;
        continue;
      }
      // Cambio Ottava default (es: O4, O5)
      if (token.startsWith('O')) {
        this.currentOctave = parseInt(token.slice(1));
        continue;
      }
      // Cambio Tempo (T120)
      if (token.startsWith('T')) {
        const newBpm = parseInt(token.slice(1));
        tempoChanges.push({ bpm: newBpm, ticks: this.currentTicks });
        continue;
      }
      // Cambio Canale (es: CHAN1, CHAN2)
      if (token.startsWith('CHAN')) {
        if ((this.currentChannel) || (this.currentInstrument) || (notes))
          throwError('e05', null, input); // CHAN può essere presente solo una volta all'inizio
        this.currentChannel = parseInt(token.slice(1));
        if (channelArray[this.currentChannel])
          this.currentInstrument = channelArray[this.currentChannel].instrument; // canale in uso: lo strumento è già specificato
        continue;
      }
      // Cambio Strumento (es: I1, I2)
      if (token.startsWith('I')) {
        const instrumentNumber = parseInt(token.slice(1));
        if ((this.currentInstrument) && (instrumentNumber != this.currentInstrument))
          throwError('e05', null, input); // strumento (e canale) non possono cambiare in un comando PLAY
        var channelNumber = channelNumberFromInstrument(instrumentNumber); // lo strumento è già caricato (associato ad un canale)?
        if (channelNumber < 0) // no
          channelNumber = getChannelforInstrument(instrumentNumber, this.currentChannel);
         if (channelNumber > 0) { // canale già esistente o appena assegnato
          this.currentChannel = channelNumber;
          this.currentInstrument = instrumentNumber;
        }
        continue;
      }

      // Parsing Nota
      const match = token.match(/^(\d*(?:'\d+)?)?([A-GP])([#B])?(\d)?(\.)?$/);
      if (match) {
        const [_, durStr, note, accidental, oct, dot] = match;
        const toneDuration = this.convertDuration(durStr || "4", !!dot);
        const durationInTicks = Tone.Time(toneDuration).toTicks();

        if (note !== 'P') {
          notes.push({
            // pitch: `${note}${accidental || ''}${oct || 4}`,
            pitch: `${note}${accidental || ''}${oct || this.currentOctave}`,
            duration: toneDuration,
            time: (isInChord ? chordStartTicks : this.currentTicks) + "i",
            velocity: 0.8,
          });
        }

        if (isInChord) {
          // In un accordo, teniamo traccia della nota più lunga
          maxChordDuration = Math.max(maxChordDuration, durationInTicks);
        } else {
          this.currentTicks += durationInTicks;
        }
      }
    }
    // Specificato un canale ma non uno strumento? Forzo lo strumento a 0
    if ((this.currentChannel > 0) && (!this.currentInstrument)) {
      this.currentInstrument = 0;
      channelArray[this.currentChannel] = { instrument: 0, sampler: null, currentTicks: 0 };
    }
    return [ this.currentChannel, this.currentInstrument, notes, tempoChanges ];
  }

  private convertDuration(dur: string, isDotted: boolean): string {
    let base = dur.includes("'") ? dur.split("'")[1] + "n" : dur + "n";
    return isDotted ? `${base}.` : base;
  }
}

async function midiPlay(logoString: string) {
  const parser = new LogoMusicParser();
  var [ channelNumber, instrumentNumber, notes, tempoChanges ] = parser.parse(logoString);
  console.log('play 1', channelNumber, instrumentNumber, notes, tempoChanges);
  var sampler = channelArray[channelNumber].sampler;
  if (!sampler)
    if (channelNumber === 0) {
      sampler = new Tone.PolySynth(Tone.Synth).toDestination(); 
      channelArray[0] = { instrument: -1, sampler: sampler, currentTicks: 0 };
    }
    else {
      await loadInstrument(instrumentNumber, channelNumber);
      sampler = channelArray[channelNumber].sampler;
    }
  console.log('play 2', channelNumber, sampler, channelArray);

  // Pulizia: fermiamo tutto e cancelliamo eventi precedenti sul Transport
  Tone.Transport.stop();
  Tone.Transport.cancel(); // <--- IMPORTANTE: rimuove i vecchi eventi programmati

  // 1. Programmiamo i cambi di BPM sulla timeline
  tempoChanges.forEach(change => {
    // Convertiamo i ticks nel tempo assoluto del transport
    const time = Tone.Time(change.ticks + "i").toSeconds();
    Tone.Transport.bpm.setValueAtTime(change.bpm, time);
  });

  // 2. Creiamo la parte e calcoliamo la durata totale
  let maxDuration = 0;
  const part = new Tone.Part((time, note) => {
    sampler.triggerAttackRelease(note.pitch, note.duration, time, note.velocity);
  }, notes).start(0);
  console.log('play 5');
  // Calcoliamo quando finirà l'ultima nota (in secondi)
  notes.forEach(note => {
    const endTime = Tone.Time(note.time).toSeconds() + Tone.Time(note.duration).toSeconds();
    if (endTime > maxDuration) maxDuration = endTime;
  });
  console.log('play 6');

  // 3. Avviamo e creiamo una Promise che attende la fine
  Tone.Transport.start();
  console.log('play 7');
  // Restituiamo una promessa che si risolve dopo 'maxDuration' secondi
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      part.dispose(); // Pulizia della memoria
      resolve();
    }, maxDuration * 1000); // Conversione in millisecondi
  });
  console.log('play 8');
}

// interprets a simple list of notes in Terrapin music notation
export const _MIDIPLAY = async (args: any[]) => {
  const noteString = nodeToString(args[0]);
  await midiPlay(noteString);
};

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
