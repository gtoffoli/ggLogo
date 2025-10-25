// LogoStateContext.tsx
// 251025 - 1st version: from LogoStateContext.tsx proposed by Gemini on 251021


// ... importa gli interi come LogoGlobalState ...
import { TurtleState, GraphicWindowState, GraphicWindowState } from './LogoState';

const initialTurtleState: TurtleState = {
  x: 0, y: 0, heading: 0, penDown: true, penColor: '#000000'
};

const initialWindowState: GraphicWindowState = {
  windowId: "TARTA",
  name: "TARTA",
  isActive: true,
  turtleState: initialTurtleState,
  drawingCommands: [],
};

const initialLogoState: LogoGlobalState = {
  windows: { "TARTA": initialWindowState },
  activeWindowId: "TARTA",
  userProcedures: {},
  globalVariables: {},
  configParams: { /* ... default values ... */ }
};

// Crea il Context
export const LogoStateContext = React.createContext<LogoGlobalState | undefined>(undefined);
export const LogoDispatchContext = React.createContext<React.Dispatch<any> | undefined>(undefined);

// Provider (Gestore dello Stato con useReducer o Zustand/Redux)
export const LogoStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Per l'integrità, usa useReducer (pattern Redux) per gestire le modifiche allo stato
  const [state, dispatch] = React.useReducer(logoReducer, initialLogoState); 
  
  return (
    <LogoStateContext.Provider value={state}>
      <LogoDispatchContext.Provider value={dispatch}>
        {children}
      </LogoDispatchContext.Provider>
    </LogoStateContext.Provider>
  );
};
