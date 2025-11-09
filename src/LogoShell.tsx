// LogoShell.tsx
// 251016 - 1st version with Gemini and DeepSeek
// 251024 - moved logoInterpreter to module Interpreter
// 251104 - call to useLocalization; executeCommand passes activeLang and resolveCommand to logoInterpreter

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
// import { LogoGlobalState, TurtleState, DrawingCommand } from './LogoState';
import { useLocalization } from './UseLocalization';
import { logoInterpreter, ini_main, ini_exec } from './Interpreter';
import { useLogoState, useLogoDispatch } from './LogoStateContext';

// Definisci il tipo per i messaggi di input/output (History)
type Message = {
  type: 'input' | 'output' | 'error';
  text: string;
};

const LogoShell: React.FC = () => {
  // DA CommandInterpreter della versione 251026 di Gemini
  // Ottieni lo stato e il dispatcher dal Context/Redux
  const globalState = useLogoState();
  const dispatch = useLogoDispatch();

  // Stato per l'history dei comandi e risultati
  const [history, setHistory] = useState<Message[]>([{ type: 'output', text: "Wellcome in the LOGO Interpreter TypeScript/React!" },
  ]);

  // Stato per l'input corrente
  const [currentCommand, setCurrentCommand] = useState('');
  
  // Riferimento per scrollare automaticamente in basso
  const endOfHistoryRef = useRef<HTMLDivElement>(null);

  const { activeLang, activeMap, setLanguage, resolveCommand } = useLocalization('it'); 

  ini_main();
  ini_exec();

  // Auto-scroll alla fine ogni volta che l'history cambia
  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Funzione per eseguire il comando
  const executeCommand = (command: string) => {
    if (!command.trim()) return;

    // 1. Aggiungi il comando all'history come 'input'
    setHistory(prev => [...prev, { type: 'input', text: `> ${command}` }]);

    // 2. Esegui il comando tramite l'interprete
    console.log(command);


    // const result = logoInterpreter(command);
    // Invoca l'interprete con lo stato e il dispatcher
    const result = logoInterpreter(command, { globalState, dispatch, activeLang, resolveCommand });

    // ... logica di visualizzazione del risultato (result) ...
    console.log("Risultato interprete:", result);

    // Gestione speciale per 'clear' (pulisce la console)
    if (command.trim().toLowerCase() === 'clear') {
        setHistory([]); // Pulisce lo stato history
        return;
    }
/*
    // 3. Aggiungi l'output (o l'errore) all'history
    if (result.error) {
        setHistory(prev => [...prev, { type: 'error', text: `ERRORE: ${result.error}` }]);
    } else if (result.output) {
        setHistory(prev => [...prev, { type: 'output', text: result.output }]);
    }
*/  
  };

  // Gestore per l'invio del comando (tasto INVIO)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Impedisce il submit standard del form
      executeCommand(currentCommand);
      setCurrentCommand(''); // Pulisce l'input dopo l'invio
    }
  };

  return (
    <div style={{ 
        backgroundColor: '#000', 
        color: '#0f0', 
        padding: '10px', 
        height: '400px', 
        overflowY: 'auto', 
        fontFamily: 'monospace' 
    }}>
      {/* Visualizzazione dell'History dei Comandi e Risultati */}
      <div className="history">
        {history.map((msg, index) => (
          <div key={index} style={{ 
            color: msg.type === 'error' ? '#f00' : 
                   msg.type === 'input' ? '#aaa' : '#0f0' 
          }}>
            {msg.text}
          </div>
        ))}
        <div ref={endOfHistoryRef} /> {/* Punto di scroll */}
      </div>

      {/* Area di Input */}
      <div style={{ marginTop: '10px', display: 'flex' }}>
        <span style={{ color: '#fff', marginRight: '5px' }}>&gt;</span>
        <input
          type="text"
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{ 
            flexGrow: 1, 
            backgroundColor: 'transparent', 
            border: 'none', 
            color: '#fff', 
            outline: 'none', 
            fontFamily: 'monospace' 
          }}
          placeholder="Enter your LOGO command..."
        />
      </div>
    </div>
  );
};

export default LogoShell;
