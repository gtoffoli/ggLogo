// LogoShell.tsx
// 251016 - 1st version with Gemini and DeepSeek

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import './i18n';
// import JSZip from "jszip";
import * as fflate from 'fflate';
import { useTranslation } from 'react-i18next';
import PanelContainer from './PanelContainer';
import { useLocalization, LanguageCode, loadLanguagePack } from './UseLocalization';
import { useLogoState } from './LogoStateContext';
import { setInterruption } from './Interpreter';
import { stopAsynchronousActivities } from './LogoControl';
import { ShellSource , BufferSource } from './Streams';
import { localizeTruthValues } from './Logic';

// export var shared_dispatch: (action: any) => void;	// mirrors value in react state
export var shared_langCode: LanguageCode; // mirrors value in react-i18next state
export var inputString: string = '';

const LogoShell: React.FC = ({ activeLang, setLanguage }) => {
  // console.log('LogoShell - starting', activeLang);
  localizeTruthValues(activeLang);
  // DA CommandInterpreter della versione 251026 di Gemini
  // Ottieni lo stato e il dispatcher dal Context/Redux
  const { state, dispatch, interpreter } = useLogoState();
  shared_langCode = activeLang;

  // Stato per l'input corrente
  const [currentInput, setCurrentInput] = useState('');
  // Stato per il data input corrente
  const [currentData, setCurrentData] = useState('');
 
   // Indice per la navigazione ( -1 significa che non stiamo navigando )
  const [historyIndex, setHistoryIndex] = useState(-1);
  // Memorizza l'input corrente mentre l'utente preme "SU" per non perderlo
  const [draftInput, setDraftInput] = useState('');
  // Filtriamo la storia per avere solo i comandi inseriti dall'utente
  const commandHistory = state.shellHistory
    .filter(msg => msg.type === 'input')
    .map(msg => msg.text);
 
  // Riferimento per scrollare automaticamente in basso
  const endOfHistoryRef = useRef<HTMLDivElement>(null);

  // Auto-scroll alla fine ogni volta che l'history cambia
  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.shellHistory]);
  // }, [history]);

  // Era la funzione per eseguire il comando
  const routeInput = (command: string) => {
    if (!command.trim()) return;
    console.log('LogoShell - command:', command);
    interpreter.getCurrentSource().provideInput(command);
  };

  // Gestore per l'invio del comando (tasto INVIO)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Impedisce il submit standard del form
      // Resetta l'indice di navigazione
      setHistoryIndex(-1);
      setDraftInput('');
      routeInput(currentInput);
      // Pulisce l'input dopo l'invio
	    setCurrentInput('');
    }
    else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Impedisce al cursore di andare all'inizio della riga
      
      if (commandHistory.length === 0) return;
  
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        if (historyIndex === -1) setDraftInput(currentInput); // Salva quello che stava scrivendo
        
        const selectedCommand = commandHistory[commandHistory.length - 1 - nextIndex];
        setCurrentInput(selectedCommand);
        setHistoryIndex(nextIndex);
      }
    } 
    else if (event.key === 'ArrowDown') {
      event.preventDefault();
      
      if (historyIndex <= 0) {
        // Siamo tornati alla riga vuota (o al draft iniziale)
        setHistoryIndex(-1);
        setCurrentInput(draftInput);
      } else {
        const nextIndex = historyIndex - 1;
        const selectedCommand = commandHistory[commandHistory.length - 1 - nextIndex];
        setCurrentInput(selectedCommand);
        setHistoryIndex(nextIndex);
      }
    }
  };

  // Gestore per l'invio del comando (tasto INVIO)
  const handleDataKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // if (event.key === 'Enter') {
    if ((event.key === 'Enter') || (interpreter.getCurrentCommand == 'READCHAR')) {
      event.preventDefault(); // Impedisce il submit standard del form
      interpreter.getDataSource().provideData(currentData);
      setCurrentData(''); // Pulisce l'input dopo l'invio
    }
  };

  // --- DEFINIZIONE DEI MENU (Hook per l'esecuzione dei comandi) ---

  const handleConsoleClear = () => {
     // La cronologia B verrà cancellata
     dispatch({ type: 'CLEAR_SHELL_HISTORY' });
  };

  const handleToggleEcho = () => {
     // alert('Console Clear: La cronologia B verrà cancellata.');
     dispatch({ type: 'TOGGLE_INPUT_ECHO' });
  };

  // Azione 2: Recupera (simula l'apertura del file dialog)
  const handleFileLoad = () => {
      // Logica per aprire un input file nascosto
      const fileInput = document.getElementById('logo-file-input') as HTMLInputElement;
      fileInput?.click();
  };

  const [text, setText] = useState('');

  // same structure as the loadZipLibrary function in the LogoEditor module
  const loadZipLibrary = async (file) => {
    try {
      // 1. Convertiamo il file (Blob/File) in Uint8Array per fflate
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
  
      // 2. Decomprimiamo lo ZIP
      // unzipSync è molto veloce; per file enormi esiste la versione asincrona unzip()
      const unzipped = fflate.unzipSync(uint8Array);
      var text = '';
  
      // 3. Iteriamo sui file estratti
      for (const relativePath in unzipped) {
        const fileData = unzipped[relativePath];
        
        // Verifichiamo se è un file valido (non una cartella e con estensione corretta)
        const isFile = fileData.length > 0; // fflate restituisce Uint8Array vuoti per le cartelle
        const hasValidExt = /\.(il|lgo|logo|txt)$/i.test(relativePath);
  
        if (isFile && hasValidExt) {
          // 4. Convertiamo i dati binari in stringa
          // const text = fflate.strFromU8(fileData);
          text += fflate.strFromU8(fileData);
          
          // 5. Integrazione con il tuo interprete
          // const fileSource = new BufferSource(text, relativePath);
          // interpreter.pushSource(fileSource);
          // interpreter.run();
        }
      }
      // 5. Integrazione con il tuo interprete
      const fileSource = new BufferSource(text, file.name);
      interpreter.pushSource(fileSource);
      interpreter.run();
    } catch (errore) {
      console.error("Errore durante la decompressione:", errore);
      alert("Errore nel caricamento dello ZIP.");
    }
  };
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const fileName = file.name;
    const fileType = file.type;
    const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  
    // Controllo file di testo/logo
    if (fileType.startsWith("text/") || ['.il', '.lgo', '.logo'].includes(extension)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const fileSource = new BufferSource(text, fileName);
        interpreter.pushSource(fileSource);
        interpreter.run();
      };
      reader.readAsText(file);
    } 
    // Controllo file ZIP
    else if (fileType.includes("zip") || extension === '.zip') {
      loadZipLibrary(file);
    }
  };

  // 't' è la funzione di traduzione
  const { t, i18n } = useTranslation();

    // Azione 1: Imposta la lingua (usa l'hook di localizzazione)
    const handleSetLanguage = async (langCode: LanguageCode) => {
        if (langCode === 'fr') {
          const langData = await loadLanguagePack(langCode);
          console.log('handleSetLanguage', langData);
        }
        setLanguage(langCode); // Questa funzione aggiorna lo stato della lingua usato da LocalizationMaps
        i18n.changeLanguage(langCode); // Questa funzione aggiorna lo stato della lingua usato da i18n
        shared_langCode = langCode;
        localizeTruthValues(langCode);
        // Opzionale: Aggiungi un messaggio di sistema alla console history
        // dispatch({ type: 'SYSTEM_MESSAGE', text: `Lingua impostata su: ${lang.toUpperCase()}` }); 
    };

  const handleUserInterrupt = async () => {
    setInterruption(true);
    await stopAsynchronousActivities();
  };

  const handleDummyChange = () => {
     dispatch({ type: 'DUMMY_STATE_CHANGE' });
  };

  const handleShowEditor = () => {
     dispatch({ type: 'SHOW_WINDOW', windowId: 'FOGLIO' });
  };

  const handleShowBrowser = () => {
     dispatch({ type: 'SHOW_WINDOW', windowId: 'BROWSER' });
  };

  // Menu per l'Area B (Interprete/Console)
  const menuB = [
	// Menu File
	{ label: t('menu.file'), submenu: [
	  { label: t('menu.load'), action: handleFileLoad },
	  { label: t('menu.save'), action: () => alert('Salva...') },
	]},
  { label: t('menu.history'), submenu: [
    { label: (state.echoInput) ? t('menu.echo_off') :  t('menu.echo_on'), action: handleToggleEcho },
    { label: t('menu.delete'), action: handleConsoleClear },
    { label: t('menu.export'), action: () => console.log('Esporta log della console') },
  ]},
  { label: t('menu.commands'), submenu: [
    { label: t('menu.help'), action: () => alert('Mostra la guida comandi LOGO.') },
    { label: t('menu.break'), action: handleUserInterrupt },
  ]},
  { label: t('menu.windows'), submenu: [
    { label: t('menu.turtle'), action: handleDummyChange },
    { label: t('menu.editor'), action: handleShowEditor },
    { label: t('menu.browser'), action: handleShowBrowser },
  ]},
	{ label: t('menu.language'), submenu: [
	  { label: 'Italiano', action: () => handleSetLanguage('it'), active: activeLang === 'it' },
	  { label: 'English', action: () => handleSetLanguage('en'), active: activeLang === 'en' },
    { label: 'Français', action: () => handleSetLanguage('fr'), active: activeLang === 'fr' },
 	]},
  ];

  // Stile semplice per i pulsanti mobile
  const mobileButtonStyle = {
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #666',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
    cursor: 'pointer'
  };

  return (
    <PanelContainer
      id="area-b"
      title={t('header.shell')}
      borderColor="#28a745" // Verde
      zIndex={1}
      menuItems={menuB}
    >
    <div style={{
		display: 'flex', flexDirection: 'column', height: '100%',
        backgroundColor: '#000', 
        color: '#0f0', 
        padding: '0px', 
         
        fontFamily: 'monospace' 
    }}>
      {/* Visualizzazione dell'History */}
      <div className="history" style={{ display: 'block', flexGrow: 4, overflowY: 'auto' }}>
        {state.shellHistory.map((msg, index) => (
          <div 
            key={index} 
            onClick={() => msg.type === 'input' && setCurrentInput(msg.text)} // Click per copiare
            style={{
              color: msg.type === 'error' ? '#f00' :
                     msg.type === 'system' ? '#ff0' :
                     msg.type === 'input' ? '#aaa' : '#0f0',
              cursor: msg.type === 'input' ? 'pointer' : 'default', // Cursore a manina solo sui comandi
              padding: '2px 5px',
              borderBottom: msg.type === 'input' ? '1px dotted #333' : 'none' // Opzionale: aiuta a distinguere i cliccabili
            }}
            title={msg.type === 'input' ? t('msg.click_to_copy') : ''}
          >
            {msg.text}
          </div>
        ))}
        <div ref={endOfHistoryRef} /> {/* Punto di scroll */}
      </div>
      {/* Area di Input con supporto Mobile */}
      <div style={{ 
          marginTop: 0, 
          display: (state.keyboardTarget === 'commands') ? 'flex' : 'none', 
          alignItems: 'center',
          border: '1px solid white', 
          flexGrow: 0.1,
          padding: '2px'
      }}>
        <span style={{ color: '#fff', marginRight: '5px' }}>&gt;</span>
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            backgroundColor: 'transparent', border: 'none', color: '#fff', outline: 'none', 
            fontFamily: 'monospace', flexGrow: 1
          }}
          placeholder={t('msg.command_placeholder')}
        />
        
        {/* Pulsanti per Mobile: visibili solo se è un dispositivo touch o sempre per comodità */}
        <div style={{ display: 'flex', gap: '5px', marginLeft: '5px' }}>
          <button onClick={() => handleKeyDown({ key: 'ArrowUp', preventDefault: () => {} })} 
                  style={mobileButtonStyle}>▲</button>
          <button onClick={() => handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} })} 
                  style={mobileButtonStyle}>▼</button>
        </div>
      </div>
      {/* Area di data Input */}
      <div style={{ marginTop: 0, display: (state.keyboardTarget === 'data') ? 'block' : 'none', borderStyle: 'solid', borderWidth: 1, borderColor: 'white', flexGrow: 0.1 }}>
        <span style={{ color: '#fff', marginRight: '5px' }}>?</span>
        <input
          type="text"
          value={currentData}
          onChange={(e) => setCurrentData(e.target.value)}
          onKeyDown={handleDataKeyDown}
          autoFocus
          style={{
            backgroundColor: 'transparent', border: 'none', color: '#fff', outline: 'none', 
            fontFamily: 'monospace', width: '95%'
          }}
          placeholder={t('msg.data_placeholder')}
        />
      </div>
      <input type="file" id='logo-file-input'  accept=".il,.lgo,.logo,.txt,.zip" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
    </PanelContainer>
  );
};

export default LogoShell;
