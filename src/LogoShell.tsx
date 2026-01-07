// LogoShell.tsx
// 251016 - 1st version with Gemini and DeepSeek
// 251024 - moved logoInterpreter to module Interpreter
// 251104 - call to useLocalization; executeCommand passes activeLang and resolveCommand to logoInterpreter
// 251116 - shared and exported some const retrieved through React-specific functions
// 251129 - new Language menu

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import PanelContainer from './PanelContainer';
import { LogoGlobalState } from './LogoState';
import { useLocalization, LanguageCode } from './UseLocalization';
// import { initialSource,  } from './App';
import { logoInterpreter, AsynchronousLogoInterpreter } from './Interpreter';
import { unParse } from './Parser';
import { useLogoState, useLogoDispatch } from './LogoStateContext';
import { ShellSource } from './Streams';
import { ini_main, ini_exec } from './LogoControl';
import { localizeTruthValues } from './Logic';

// Definisci il tipo per i messaggi di input/output (History)
type Message = {
  type: 'input' | 'output' | 'error';
  text: string;
};

export var shared_globalState: LogoGlobalState;		// mirrors value in react state
export var shared_dispatch: (action: any) => void;	// mirrors value in react state
export var inputString: string = '';
var prompt: string;

const LogoShell: React.FC = ({ activeLang, setLanguage, initialSource, resolveKeyword }) => {
  console.log('LogoShell - starting', activeLang);
  // DA CommandInterpreter della versione 251026 di Gemini
  // Ottieni lo stato e il dispatcher dal Context/Redux
  const globalState = useLogoState();
  shared_globalState = globalState;
  const dispatch = useLogoDispatch();
  shared_dispatch = dispatch;

  // Stato per l'history dei comandi e risultati
  // const [history, setHistory] = useState<Message[]>([{ type: 'output', text: "Wellcome in the LOGO Interpreter!" }]);
  const [history, setHistory] = useState<Message[]>([]);

  // Stato per l'input corrente
  const [currentCommand, setCurrentCommand] = useState('');
  
  // Riferimento per scrollare automaticamente in basso
  const endOfHistoryRef = useRef<HTMLDivElement>(null);

  // const { activeLang, activeMap, setLanguage, resolveCommand, resolveKeyword } = useLocalization('it'); 

  // Auto-scroll alla fine ogni volta che l'history cambia
  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Funzione per eseguire il comando
  const executeCommand = (command: string) => {

    if (globalState.inputWaiter) {
        
	    // 1. Modalità: C'è qualcuno in attesa (es. la primitiva TO)?
prompt = globalState.inputWaiter.prompt;
        // Verifica la condizione di terminazione del corpo procedura (END)
        // if (command.toUpperCase() === 'END') {
        var keyword = resolveKeyword(command.trim());
        if (keyword === 'END') {
            // Risolvi la Promise con la riga "END"
            globalState.inputWaiter.resolve(keyword);
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
prompt = '&gt;';

	    if (!command.trim()) return;
	
	    // 1. Aggiungi il comando all'history come 'input'
	    setHistory(prev => [...prev, { type: 'input', text: `> ${command}` }]);
	
	    // 2. Esegui il comando tramite l'interprete
	    console.log('LogoShell - command:', command);

	    // Invoca l'interprete con lo stato e il dispatcher
      // const result = logoInterpreter([command], resolveCommand);
      initialSource.provideInput(command);
/*	
	    // ... logica di visualizzazione del risultato (result) ...
	    console.log(t('msg.interpreter_result'), result);
	
	    // Gestione speciale per 'clear' (pulisce la console)
	    if (command.trim().toLowerCase() === 'clear') {
	        setHistory([]); // Pulisce lo stato history
	        return;
	    }

		// 3. Aggiungi l'output (o l'errore) all'history
		if (result)
			if (result.error) {
				setHistory(prev => [...prev, { type: 'error', text: `ERRORE: ${result.error}` }]);
			} else if (result.output) {
				// setHistory(prev => [...prev, { type: 'output', text: JSON.stringify(result.output) }]);
				// setHistory(prev => [...prev, { type: 'output', text: result.output.toString() }]);
			    console.log('output', unParse(result.output));
				setHistory(prev => [...prev, { type: 'output', text: unParse(result.output) }]);
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

    // Azione 2: Recupera (simula l'apertura del file dialog)
    const handleFileLoad = () => {
        // Logica per aprire un input file nascosto
        const fileInput = document.getElementById('logo-file-input') as HTMLInputElement;
        fileInput?.click();
    };

  const [text, setText] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const textOutput = document.getElementById('editor-area');
        const text = e.target.result;
        textOutput.value += text;
        var lines = text.split('\n');
        // const result = logoInterpreter(activeLang, lines, { resolveCommand });
        const result = logoInterpreter(lines, resolveCommand);
      };
      reader.readAsText(file);
    }
  };

  // 't' è la funzione di traduzione
  const { t, i18n } = useTranslation();

    // Azione 1: Imposta la lingua (usa l'hook di localizzazione)
    const handleSetLanguage = (langCode: LanguageCode) => {
        setLanguage(langCode); // Questa funzione aggiorna lo stato della lingua usato da LocalizationMaps
        i18n.changeLanguage(langCode); // Questa funzione aggiorna lo stato della lingua usato da i18n
        shared_langCode = langCode;
        localizeTruthValues();
        // Opzionale: Aggiungi un messaggio di sistema alla console history
        // dispatch({ type: 'SYSTEM_MESSAGE', text: `Lingua impostata su: ${lang.toUpperCase()}` }); 
    };

  // Menu per l'Area B (Interprete/Console)
  const menuB = [
	// Menu File
	{ label: 'File', submenu: [
	  { label: t('menu.load'), action: handleFileLoad },
	  { label: t('menu.save'), action: () => alert('Salva...') },
	]},
    { label: t('menu.history'), submenu: [
      { label: t('menu.delete'), action: handleConsoleClear },
      { label: t('menu.export'), action: () => console.log('Esporta log della console') },
    ]},
    { label: t('menu.commands'), submenu: [
      { label: t('menu.help'), action: () => alert('Mostra la guida comandi LOGO.') },
    ]},
        // Menu Lingua (Dynamic)
	{ label: t('menu.language'), submenu: [
	  { label: 'Italiano', action: () => handleSetLanguage('it'), active: activeLang === 'it' },
	  { label: 'English', action: () => handleSetLanguage('en'), active: activeLang === 'en' },
      // Aggiungi altre lingue qui
	]},
  ];

  return (
    <PanelContainer
      id="area-b"
      title={t('header.shell')}
      borderColor="#28a745" // Verde
      menuItems={menuB}
    >
    <div style={{
		display: 'flex', flexDirection: 'column', height: '100%',
        backgroundColor: '#000', 
        color: '#0f0', 
        padding: '0px', 
         
        fontFamily: 'monospace' 
    }}>
      {/* Visualizzazione dell'History dei Comandi e Risultati */}
      <div className="history"
		style={{ display: 'block', flexGrow: 4 }}>
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
      <div style={{ marginTop: 0, display: 'block', borderStyle: 'solid', borderWidth: 1, borderColor: 'white', flexGrow: 1 }}>
        <span style={{ color: '#fff', marginRight: '5px' }}>&gt;</span>
        <input
          type="text"
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            backgroundColor: 'transparent', 
            border: 'none', 
            color: '#fff', 
            outline: 'none', 
            fontFamily: 'monospace' 
          }}
          placeholder={t('msg.command_placeholder')}
        />
      </div>
      <input type="file" id='logo-file-input'  accept=".txt" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
    </PanelContainer>
  );
};

export default LogoShell;
