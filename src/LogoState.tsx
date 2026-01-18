// LogoState.tsx
// 251025 - 1st version: from logo-state.ts proposed by Gemini on 251021
// 251101 - 2nd version: added DrawingCommand according to Gemini 251024


export interface ShellLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
}

// Definisce un comando di disegno elementare
export type DrawingCommand = 
  | { type: 'MOVE_TO', x: number, y: number }
  | { type: 'LINE_TO', x: number, y: number, color: string, thickness: number }
  | { type: 'CLEAR_CANVAS' };

// 1. Definisce lo stato specifico di una Finestra Grafica (Canvas/Tartaruga)
export interface TurtleState {
  x: number;
  y: number;
  heading: number; // Direzione (0-359 gradi)
  penDown: boolean;
  penColor: string; // Basato sul parametro PENCOLOR
  // ... altri stati grafici (es. fillcolor, turtleshape)
}

export interface GraphicWindowState {
  windowId: string; // ID univoco, es. "TARTA" o "finestra2"
  name: string;
  isActive: boolean; // Indica se è la finestra correntemente in primo piano
  turtleState: TurtleState;
  // Qui si potrebbero aggiungere le chiamate di disegno effettuate, per il rendering.
  // drawingCommands: any[]; 
  drawingCommands: DrawingCommand[]; // Ora è tipizzato 
  canvasContext: any; // Aggiunto per l'associazione al DOM (vedi punto 3)
  canvasRef: any;     // Aggiunto per l'associazione al DOM (vedi punto 3)
}

// Definisce l'interfaccia per una linea di output su Shell
export interface ShellLine {
  id: string;
  text: string;
  lineType: 'input' | 'output' | 'error' | 'system';
}

// 2. Definisce lo Stato Globale dell'Interprete
export interface LogoGlobalState {
  // Mappa di tutte le finestre grafiche
  windows: Record<string, GraphicWindowState>; 
  // ID della finestra attualmente selezionata/in uso dall'interprete LOGO
  activeWindowId: string; 
  // Storia dell'output su Shell
  shellHistory: ShellLine[];
  // Testo contenuto nell'Editor panel
  editorContent: string;
}
