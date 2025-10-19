// CoreDefinitions.tsx
// 251019 - 1st version with Gemini

// Tipi per i comandi
export type CommandDef = {
  description: string;
  syntax: string;
  args: { name: string; type: 'number' | 'string' | 'boolean' }[];
  semantics: (args: any[]) => any; // La funzione che esegue il comando
};

// Tipi per i parametri di configurazione
export type ParamDef = {
  type: 'number' | 'string' | 'color';
  defaultValue: any;
  validator: (value: any) => boolean;
  min?: number;
  max?: number;
};

// Mappa che contiene tutte le definizioni (la LOGICA del tuo interprete)
export const CORE_DEFINITIONS = {
  // --- Comandi LOGO ---
  FD: {
    description: "Muove la tartaruga in avanti.",
    syntax: "FD <distanza>",
    args: [{ name: "distanza", type: 'number' }],
    semantics: (args) => console.log(`FD: Muovi ${args[0]} unità.`),
  } as CommandDef,
  PRINT: {
    description: "Visualizza un valore nella console.",
    syntax: "PRINT <valore>",
    args: [{ name: "valore", type: 'string' }],
    semantics: (args) => console.log(`Output: ${args[0]}`),
  } as CommandDef,

  // --- Parametri di Configurazione ---
  PENCOLOR: {
    type: 'color',
    defaultValue: '#000000',
    validator: (v) => typeof v === 'string' && v.startsWith('#'),
  } as ParamDef,
  TURTLESIZE: {
    type: 'number',
    defaultValue: 10,
    validator: (v) => v > 0,
    min: 5,
    max: 50,
  } as ParamDef,
};

// Tipo di supporto per le definizioni (per inferenza)
export type CoreDefinitionKeys = keyof typeof CORE_DEFINITIONS;
