import { 
    LogoGlobalState, 
    GraphicWindowState, 
    TurtleState, 
    DrawingCommand,
    InputWaiter
} from './LogoState'; // Presumiamo che i tipi siano qui

// Stato Iniziale Minimale
export const initialTurtleState: TurtleState = {
    x: 0, 
    y: 0,
    heading: 0, 
    penDown: true, 
    penColor: '#000000'
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
    userProcedures: {},
    globalVariables: {},
    configParams: {}
};

// Tipi di Azione
type LogoAction = 
    | { type: 'UPDATE_TURTLE_STATE', windowId: string, newState: Partial<TurtleState> }
    | { type: 'ADD_DRAWING_COMMAND', windowId: string, command: DrawingCommand }
    | { type: 'REGISTER_CANVAS', windowId: string, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement }
    | { type: 'WAIT_FOR_INPUT', waiter: InputWaiter }
    | { type: 'CLEAR_WAITER' };


export function logoReducer(state: LogoGlobalState, action: LogoAction): LogoGlobalState {
    switch (action.type) {
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
        case 'WAIT_FOR_INPUT':
            // Imposta il gestore di attesa e il nuovo prompt
            return { ...state, inputWaiter: action.waiter };
        case 'CLEAR_WAITER':
            // Rimuove il gestore di attesa e torna alla modalità normale
            return { ...state, inputWaiter: null };

        default:
            return state;
    }
}
