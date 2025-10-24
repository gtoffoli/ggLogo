// LogoShell.tsx
// 251016 - 1st version with Gemini and DeepSeek

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useLocalization } from './UseLocalization';
import { logoTokenizerFSM } from './Parser';


// Definisci il tipo per i messaggi di input/output (History)
type Message = {
  type: 'input' | 'output' | 'error';
  text: string;
};

// ** Importa la logica dell'interprete, che inizialmente sarà un mock. **
// Nel tuo progetto reale, questo sarebbe il modulo TypeScript dell'interprete.
const logoInterpreter = {
  // Funzione fittizia per simulare l'esecuzione di un comando LOGO
  execute: (command: string): { output: string; error?: string } => {
    /*
    command = command.trim().toLowerCase();
    if (command.startsWith('print')) {
      return { output: command.substring(5).trim() };
    } else if (command === 'clear') {
        return { output: "Schermo pulito." };
    } else if (command === 'errore') {
        return { output: "", error: "Errore: Comando non riconosciuto." };
    }
    return { output: `Comando "${command}" eseguito. (Nessun output testuale)` };
    */
    // QUI CI SARÀ L'INTERPRETE LOGO REALE
    command = command.trim();
    let tokens = logoTokenizerFSM(command);
    return { output: tokens.toString() };
  },
};


const LogoShell: React.FC = () => {
  // Stato per l'history dei comandi e risultati
  const [history, setHistory] = useState<Message[]>([{ type: 'output', text: "Wellcome in the LOGO Interpreter TypeScript/React!" },
    // { type: 'output', text: "Digita 'print \"ciao mondo\"' o 'fd 100' (se il canvas fosse attivo)." },
  ]);

  // Stato per l'input corrente
  const [currentCommand, setCurrentCommand] = useState('');
  
  // Riferimento per scrollare automaticamente in basso
  const endOfHistoryRef = useRef<HTMLDivElement>(null);

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
    const result = logoInterpreter.execute(command);
    
    // Gestione speciale per 'clear' (pulisce la console)
    if (command.trim().toLowerCase() === 'clear') {
        setHistory([]); // Pulisce lo stato history
        return;
    }

    // 3. Aggiungi l'output (o l'errore) all'history
    if (result.error) {
        setHistory(prev => [...prev, { type: 'error', text: `ERRORE: ${result.error}` }]);
    } else if (result.output) {
        setHistory(prev => [...prev, { type: 'output', text: result.output }]);
    }
    
    // *Nota: Le chiamate grafiche (es. `fd 100`) gestiranno lo stato del `TurtleCanvas` separatamente.
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
