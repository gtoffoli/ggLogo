import { 
    LogoGlobalState, 
    GraphicWindowState, 
    TurtleState, 
    DrawingCommand,
    // InputWaiter
} from './LogoState'; // Presumiamo che i tipi siano qui

// Stato Iniziale Minimale
export const initialTurtleState: TurtleState = {
    x: 0, 
    y: 0,
    heading: 0, 
    penDown: true, 
    penColor: '#000000',
    penMode: 'PAINT'
};

const initialWindowState: GraphicWindowState = {
    windowId: "TARTA",
    name: "TARTA",
    isActive: true,
    turtleState: initialTurtleState,
    drawingCommands: [],
    canvasContext: null, // Aggiunto per l'associazione al DOM (vedi punto 3)
    canvasRef: null      // Aggiunto per l'associazione al DOM (vedi punto 3)
};

export const initialLogoState: LogoGlobalState = {
    windows: { "TARTA": initialWindowState },
    activeWindowId: "TARTA",
    shellHistory: [{ id: crypto.randomUUID(), lineType: 'output', text: "Wellcome in the LOGO Interpreter!\n" }],
    echoInput: true,
    keyboardTarget: 'commands',
    editorContent: '',
};

// Tipi di Azione
type LogoAction = 
    | { type: 'DUMMY_STATE_CHANGE' }
    | { type: 'UPDATE_TURTLE_STATE', windowId: string, newState: Partial<TurtleState> }
    | { type: 'ADD_DRAWING_COMMAND', windowId: string, command: DrawingCommand }
    | { type: 'REGISTER_CANVAS', windowId: string, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement }
    | { type: 'CLEAR_SHELL_HISTORY' }
    | { type: 'TOGGLE_INPUT_ECHO' }
    | { type: 'UPDATE_CURRENT_OUTPUT_LINE', text: string }
    | { type: 'APPEND_SHELL_LINE', lineType: 'input' | 'output' | 'error' | 'system', text: string }
    | { type: 'SET_KEYBOARD_TARGET', target: 'commands' | 'data' }
    | { type: 'CLEAR_EDITOR_CONTENT' }
    | { type: 'APPEND_TO_EDITOR_CONTENT', text: string };


export function logoReducer(state: LogoGlobalState, action: LogoAction): LogoGlobalState {
    var nOutputLines: number;
    var currentLine: string;
    switch (action.type) {
        case 'DUMMY_STATE_CHANGE':
          return state;
        case 'UPDATE_TURTLE_STATE':
            console.log('UPDATE_TURTLE_STATE', action.windowId);
            return {
                ...state,
                windows: {
                    ...state.windows,
                    [action.windowId]: {
                        ...state.windows[action.windowId],
                        turtleState: {
                            ...state.windows[action.windowId].turtleState,
                            ...action.newState // Usa Partial per aggiornamenti parziali
                        }
                    }
                }
            };
        case 'ADD_DRAWING_COMMAND':
            const win = state.windows[action.windowId];
            console.log('ADD_DRAWING_COMMAND', win);
            return {
                ...state,
                windows: {
                    ...state.windows,
                    [action.windowId]: {
                        ...win,
                        drawingCommands: [...win.drawingCommands, action.command]
                    }
                }
            };
        case 'REGISTER_CANVAS':
            console.log('REGISTER_CANVAS');
            // Associa il riferimento al Canvas e il suo contesto 2D allo stato
            return {
                ...state,
                windows: {
                    ...state.windows,
                    [action.windowId]: {
                        ...state.windows[action.windowId],
                        canvasContext: action.context,
                        canvasRef: action.canvas
                    }
                }
            };
        case 'CLEAR_SHELL_HISTORY':
          return {
            ...state,
            shellHistory: []
          };
        case 'TOGGLE_INPUT_ECHO':
          return {
            ...state,
            echoInput: !state.echoInput
          };
        case 'UPDATE_CURRENT_OUTPUT_LINE':
          nOutputLines = state.shellHistory.length;
          currentLine = (nOutputLines > 0) ? state.shellHistory[nOutputLines-1] : "";
          if ((nOutputLines === 0) || (currentLine.text.endsWith("\n"))) // new line must be open
            return {
              ...state,
              shellHistory: [
                ...state.shellHistory, 
                { id: crypto.randomUUID(), text: action.text, lineType: 'output' }
              ]
            };
          else { // last line is open
            currentLine['text'] = action.text;
            state.shellHistory.splice(nOutputLines-1, 1, currentLine);
            return state;
          }
          break;
        case 'APPEND_SHELL_LINE':
          nOutputLines = state.shellHistory.length;
          currentLine = (nOutputLines > 0) ? state.shellHistory[nOutputLines-1] : "";
          console.log('APPEND_SHELL_LINE', nOutputLines, currentLine)
          if ((nOutputLines === 0) || (currentLine.text.endsWith("\n"))) // new line must be open
            return {
              ...state,
              shellHistory: [
                ...state.shellHistory, 
                { id: crypto.randomUUID(), ...action.payload }
              ]
            };
          else { // last line is open
            currentLine['text'] += action.payload.text;
            state.shellHistory.splice(nOutputLines-1, 1, currentLine);
            return state;
          }
          break;
        case 'SET_KEYBOARD_TARGET':
          console.log('SET_KEYBOARD_TARGET', action.target);
          return {
            ...state,
            keyboardTarget: action.target
          };
        case 'CLEAR_EDITOR_CONTENT':
          return {
            ...state,
            editorContent: ''
          };
        case 'APPEND_TO_EDITOR_CONTENT':
          return {
            ...state,
            editorContent: 
              state.editorContent + action.text
          };

        default:
            return state;
    }
}
