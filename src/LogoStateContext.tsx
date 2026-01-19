// LogoStateContext.tsx
// 251025 - 1st version: from LogoStateContext.tsx proposed by Gemini on 251021
// 251031 - 2nd version: from LogoStateContext.tsx proposed by Gemini on 251021

// import React, { createContext, useReducer } from 'react';
import React, { createContext, useReducer, useRef, useEffect, useMemo } from 'react';

import { initialLogoState, logoReducer } from './logoReducer';
import { LogoGlobalState } from './LogoState'; // I tuoi tipi di stato
import { TurtleState, GraphicWindowState, GraphicWindowState } from './LogoState';
import { AsynchronousLogoInterpreter } from './Interpreter';
import { ShellSource } from './Streams';

// Definiamo i tipi per il Context
export const LogoStateContext = createContext<LogoGlobalState | undefined>(undefined);

// Hook personalizzato per l'uso più semplice
export const useLogoState = () => {
  const context = React.useContext(LogoStateContext);
  if (context === undefined) {
    throw new Error('useLogoState deve essere usato all\'interno di un LogoStateProvider');
  }
  return context;
};

export const LogoStateProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(logoReducer, initialLogoState);
  const source = new ShellSource();
  // 1. Creiamo la "scatola" (il riferimento allo stato)
  const stateRef = useRef(state);

  // 2. Ogni volta che lo stato cambia, aggiorniamo il contenuto della scatola
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 3. Creiamo l'interprete passando una funzione che legge dalla scatola
  const interpreter = useMemo(() => {
    // Passiamo una freccia () => stateRef.current
    // Questa funzione restituirà SEMPRE l'ultimo stato aggiornato
    return new AsynchronousLogoInterpreter(
      () => stateRef.current, // Questa è la nostra getState()
      dispatch, 
      source
    );
  }, [dispatch, source]); 
  // Nota: source e dispatch non cambiano mai, quindi l'interprete non viene mai ricreato

  return (
    <LogoStateContext.Provider value={{ state, dispatch, interpreter }}>
      {children}
    </LogoStateContext.Provider>
  );
};
