// LogoShell.tsx
// 251016 - 1st version with Gemini and DeepSeek
// 251024 - moved logoInterpreter to module Interpreter
// 251104 - call to useLocalization; executeCommand passes activeLang and resolveCommand to logoInterpreter
// 251116 - shared and exported some const retrieved through React-specific functions
// 251129 - new Language menu

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import PanelContainer from './PanelContainer';
import { LogoGlobalState } from './LogoState';
import { useLocalization, LanguageCode } from './UseLocalization';
import { logoInterpreter } from './Interpreter';
import { useLogoState, useLogoDispatch } from './LogoStateContext';
import { ini_main, ini_exec } from './LogoControl';

export var shared_language: LanguageCode;
export var shared_globalState: LogoGlobalState;
export var shared_dispatch: (action: any) => void;

export var inputString: string = '';


// Definisci il tipo per i messaggi di input/output (History)
type Message = {
  type: 'input' | 'output' | 'error';
  text: string;
};

const LogoShell: React.FC = () => {
  // DA CommandInterpreter della versione 251026 di Gemini
  // Ottieni lo stato e il dispatcher dal Context/Redux
  const globalState = useLogoState();
  shared_globalState = globalState;
  const dispatch = useLogoDispatch();
  shared_dispatch = dispatch;

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

    if (globalState.inputWaiter) {
        
	    // 1. Modalità: C'è qualcuno in attesa (es. la primitiva TO)?

        // Verifica la condizione di terminazione del corpo procedura (END)
        // if (trimmedCommand.toUpperCase() === 'END') {
        if (command.toUpperCase() === 'END') {
            // Risolvi la Promise con la riga "END"
            globalState.inputWaiter.resolve(command);
            // Pulisci il waiter (torna al Command Mode)
            dispatch({ type: 'CLEAR_WAITER' });
        } else {
            // Risolvi la Promise con la riga di comando LOGO
            globalState.inputWaiter.resolve(command);
            // NOTA: Non puliamo il waiter qui! La primitiva TO chiamerà getLine() di nuovo 
            // per aspettare la riga successiva, mantenendo la modalità attiva.
        }
        
        // Aggiungi la riga all'history locale per feedback
        // (La logica di esecuzione è gestita all'interno della Promise risolta)
        // ... logica per mostrare ">" o il prompt nell'history ...
        
    } else {

		// 2. Modalità: Esecuzione standard del comando

	    if (!command.trim()) return;
	
	    // 1. Aggiungi il comando all'history come 'input'
	    setHistory(prev => [...prev, { type: 'input', text: `> ${command}` }]);
	
	    // 2. Esegui il comando tramite l'interprete
	    console.log(command);

	    // const result = logoInterpreter(command);
	    // Invoca l'interprete con lo stato e il dispatcher
	    const result = logoInterpreter(activeLang, command, { resolveCommand });
	
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

    }
  };

  // Gestore per l'invio del comando (tasto INVIO)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Impedisce il submit standard del form
      executeCommand(currentCommand);
	  setCurrentCommand(''); // Pulisce l'input dopo l'invio
    }
  };

// --- DEFINIZIONE DEI MENU (Hook per l'esecuzione dei comandi) ---

  const handleConsoleClear = () => { alert('Console Clear: La cronologia B verrà cancellata.'); };

    // Azione 1: Imposta la lingua (usa l'hook di localizzazione)
    const handleSetLanguage = (lang: LanguageCode) => {
        setLanguage(lang); // Questa funzione aggiorna lo stato della lingua
        shared_language = lang;
        // Opzionale: Aggiungi un messaggio di sistema alla console history
        // dispatch({ type: 'SYSTEM_MESSAGE', text: `Lingua impostata su: ${lang.toUpperCase()}` }); 
    };

  // Menu per l'Area B (Interprete/Console)
  const menuB = [
    { label: 'History', submenu: [
      { label: 'Cancella Log', action: handleConsoleClear },
      { label: 'Esporta Log', action: () => console.log('Esporta log della console') },
    ]},
        // Menu Lingua (Dynamic)
        { label: 'Language', submenu: [
            { label: 'Italiano', action: () => handleSetLanguage('it'), active: activeLang === 'it' },
            { label: 'English', action: () => handleSetLanguage('en'), active: activeLang === 'en' },
            // Aggiungi altre lingue qui
        ]},
    { label: 'Commands', submenu: [
      { label: 'Aiuto (F1)', action: () => alert('Mostra la guida comandi LOGO.') },
    ]},
  ];

  return (
    <PanelContainer
      id="area-b"
      title="Command Console"
      borderColor="#28a745" // Verde
      menuItems={menuB}
    >
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
    </PanelContainer>
  );
};

export default LogoShell;
