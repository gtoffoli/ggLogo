// LogoShell.tsx
// 251016 - new version with Gemini and DeepSeek

import React from 'react';
import "./index.css"; // (da installazione bundle Bum-React)
import PanelContainer from './PanelContainer';
import LogoShell from './LogoShell'; // Il tuo componente B (da Gemini)
import Canvas from './TurtleCanvas'; // Il tuo componente A (da DeepSeek)
import Editor from './LogoEditor'; // Il tuo componente C (da DeepSeek)
import "./style.css"; // (da Gemini)

// --- DEFINIZIONE DEI MENU (Hook per l'esecuzione dei comandi) ---

const handleCanvasReset = () => { alert('Canvas Reset: La tartaruga verrà riportata a (0,0).'); };
const handleConsoleClear = () => { alert('Console Clear: La cronologia B verrà cancellata.'); };
const handleEditorLoad = () => { console.log('Caricamento file LOGO...'); };
const handleEditorSave = () => { console.log('Salvataggio file LOGO...'); };

// Menu per l'Area A (Canvas/Grafica)
const menuA = [
  { label: 'File', submenu: [
    { label: 'Salva Immagine', action: () => alert('Salvataggio Canvas...') },
    { label: 'Stampa', action: () => alert('Stampa Canvas...') },
  ]},
  { label: 'Turtle', submenu: [
    { label: 'Reset Posizione', action: handleCanvasReset },
    { label: 'Mostra/Nascondi', action: () => console.log('Toggle Turtle visibility') },
  ]},
];

// Menu per l'Area B (Interprete/Console)
const menuB = [
  { label: 'History', submenu: [
    { label: 'Cancella Log', action: handleConsoleClear },
    { label: 'Esporta Log', action: () => console.log('Esporta log della console') },
  ]},
  { label: 'Commands', submenu: [
    { label: 'Aiuto (F1)', action: () => alert('Mostra la guida comandi LOGO.') },
  ]},
];

// Menu per l'Area C (Editor LOGO)
const menuC = [
  { label: 'File', submenu: [
    { label: 'Nuovo', action: () => console.log('Nuovo file') },
    { label: 'Carica...', action: handleEditorLoad },
    { label: 'Salva', action: handleEditorSave },
  ]},
  { label: 'Run', submenu: [
    { label: 'Esegui Editor', action: () => alert('Esecuzione del codice nell\'Editor...') },
  ]},
];

import { LogoStateProvider } from './LogoStateContext';

const App: React.FC = () => {
  return (
    // NOTA: I componenti React popolano i div con gli ID definiti nel CSS
    <LogoStateProvider>
     <>
      <div id="area-destra">
        <PanelContainer
          id="area-b"
          title="Command Console"
          borderColor="#28a745" // Verde
          menuItems={menuB}
        >
          <LogoShell />
        </PanelContainer>
        <PanelContainer
          id="area-c"
          title="Procedure Editor"
          borderColor="#ff8c00" // Arancione
          menuItems={menuC}
        >
          <Editor /> 
        </PanelContainer>
      </div>
      <PanelContainer
        id="area-a"
        title="Turtle Graphics"
        borderColor="#007bff" // Blu
        menuItems={menuA}
      >
        <Canvas windowId="TARTA" />
      </PanelContainer>
     </>
    </LogoStateProvider>
  );
};

// AI Overview: come inserire in html un componente react definito in un modulo tsx
import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
