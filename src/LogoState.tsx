// LogoState.tsx
// 251025 - 1st version: from logo-state.ts proposed by Gemini on 251021
// 251101 - 2nd version: added DrawingCommand according to Gemini 251024


// Definisce l'interfaccia per una linea di output su Shell
export type ShellLine = {
  id: string;
  text: string;
  type: 'input' | 'output'  | 'error' | 'system';
}

export type Point = { x: number; y: number; }

// Definisce un comando di disegno elementare
export type DrawingCommand = 
  | { type: 'MOVE_TO', x: number, y: number }
  | { type: 'LINE_TO', x: number, y: number, color: string, thickness: number }
  | { type: 'POLYGON', fillColor: string, path: Point[] }
  | { type: 'ARC', x: number, y: number, radius: number, startAngle: number, endAngle: number, color: string, fillColor: string | null }
  | { type: 'CLEAR_CANVAS' };

// 1. Definisce lo stato specifico di una Finestra Grafica (Canvas/Tartaruga)
export interface TurtleState {
  x: number;
  y: number;
  heading: number; // Direzione (0-359 gradi)
  penDown: boolean;
  penColor: string; // Basato sul parametro PENCOLOR
  penSize: number;
  penMode: 'PAINT' | 'ERASE'  | 'REVERSE';
  visible: boolean;
  // ... altri stati grafici (es. fillcolor, turtleshape)
}

export interface GraphicWindowState {
  windowId: string; // ID univoco, es. "TARTA" o "finestra2"
  name: string;
  isActive: boolean; // Indica se è la finestra correntemente in primo piano
  canvasOrigin: number[]; // [x, y]
  canvasSize: number[]; // [dx, dy] BOUNDS are: [x-dx/2, x+dx/2, y-dx/2, y+dx/2]
  scaling: number[]; // scaleX e scaleY
  backgroundColor: string; // Basato sul parametro BACKGROUNDCOLOR
  turtleState: TurtleState;
  // Qui si potrebbero aggiungere le chiamate di disegno effettuate, per il rendering.
  // drawingCommands: any[]; 
  drawingCommands: DrawingCommand[]; // Ora è tipizzato 
  canvasContext: any; // Aggiunto per l'associazione al DOM (vedi punto 3)
  backgroundRef: any;     // Aggiunto per l'associazione al DOM (vedi punto 3)
  foregroundRef: any;
}

// 2. Definisce lo Stato Globale dell'Interprete
export interface LogoGlobalState {
  // Mappa di tutte le finestre grafiche
  windows: Record<string, GraphicWindowState>; 
  // ID della finestra attualmente selezionata/in uso dall'interprete LOGO
  activeWindowId: string; 
  // Storia dell'output su Shell
  shellHistory: ShellLine[];
  // Echo command input to shellHistory
  echoInput: boolean,
  // Input primitive waiting data
  keyboardTarget: string,
  // Testo contenuto nell'Editor panel
  editorContent: string;
}
