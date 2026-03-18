// LogoShell.tsx
// 251016 - 1st version with Gemini and DeepSeek

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import PanelContainer from './PanelContainer';
import { useLocalization, LanguageCode } from './UseLocalization';
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
      routeInput(currentInput);
	    setCurrentInput(''); // Pulisce l'input dopo l'invio
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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const filename =  file.name;
        var fileSource = new BufferSource(text, filename);
        interpreter.pushSource(fileSource);
        interpreter.run();
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


  // Menu per l'Area B (Interprete/Console)
  const menuB = [
	// Menu File
	{ label: 'File', submenu: [
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
      { label: t('menu.no_change'), action: handleDummyChange },
      { label: t('menu.break'), action: handleUserInterrupt },
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
        {state.shellHistory.map((msg, index) => (
          <div key={index} style={{
            color: msg.type === 'error' ? '#f00' :
                   msg.type === 'system' ? '#ff0' :
                   msg.type === 'input' ? '#aaa' : '#0f0' 
          }}>
            {msg.text}
          </div>
        ))}
        <div ref={endOfHistoryRef} /> {/* Punto di scroll */}
      </div>
      {/* Area di Input */}
      <div style={{ marginTop: 0, display: (state.keyboardTarget === 'commands') ? 'block' : 'none', borderStyle: 'solid', borderWidth: 1, borderColor: 'white', flexGrow: 0.1 }}>
        <span style={{ color: '#fff', marginRight: '5px' }}>&gt;</span>
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            backgroundColor: 'transparent', border: 'none', color: '#fff', outline: 'none', 
            fontFamily: 'monospace', width: '95%'
          }}
          placeholder={t('msg.command_placeholder')}
        />
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
      <input type="file" id='logo-file-input'  accept=".txt" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
    </PanelContainer>
  );
};

export default LogoShell;
