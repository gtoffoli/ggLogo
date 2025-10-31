// LogoStateContext.tsx
// 251025 - 1st version: from LogoStateContext.tsx proposed by Gemini on 251021
// 251031 - 2nd version: from LogoStateContext.tsx proposed by Gemini on 251021

import React, { createContext, useReducer } from 'react';

import { initialLogoState, logoReducer } from './logoReducer';
import { LogoGlobalState } from './LogoState'; // I tuoi tipi di stato
import { TurtleState, GraphicWindowState, GraphicWindowState } from './LogoState';

// Definiamo i tipi per il Context
export const LogoStateContext = createContext<LogoGlobalState | undefined>(undefined);
export const LogoDispatchContext = createContext<React.Dispatch<any> | undefined>(undefined);


// Hook personalizzato per l'uso più semplice
export const useLogoState = () => {
  const context = React.useContext(LogoStateContext);
  if (context === undefined) {
    throw new Error('useLogoState deve essere usato all\'interno di un LogoStateProvider');
  }
  return context;
};

export const useLogoDispatch = () => {
  const context = React.useContext(LogoDispatchContext);
  if (context === undefined) {
    throw new Error('useLogoDispatch deve essere usato all\'interno di un LogoStateProvider');
  }
  return context;
};

export const LogoStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(logoReducer, initialLogoState); 
    
    return (
        <LogoStateContext.Provider value={state}>
            <LogoDispatchContext.Provider value={dispatch}>
                {children}
            </LogoDispatchContext.Provider>
        </LogoStateContext.Provider>
    );
};

/*
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
  configParams: { }
};

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
*/
