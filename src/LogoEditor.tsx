// LogoEditor.tsx
// 251013 - 1st version with Gemini on 251013

import React, { useState } from 'react';
import PanelContainer from './PanelContainer';

const Editor: React.FC = () => {
  const [code, setCode] = useState('');

  // --- DEFINIZIONE DEI MENU (Hook per l'esecuzione dei comandi) ---

  const handleEditorLoad = () => { console.log('Caricamento file LOGO...'); };
  const handleEditorSave = () => { console.log('Salvataggio file LOGO...'); };

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

  return (

  <PanelContainer
	  id="area-c"
	  title="Procedure Editor"
	  borderColor="#ff8c00" // Arancione
	  menuItems={menuC}
  >
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <textarea
        id="editor-area"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ flex: 1, background: '#1e1e1e', color: 'white', border: 'none', padding: '10px' }}
        placeholder="Enter your LOGO code here..."
      />
    </div>
  </PanelContainer>
  );
};

export default Editor;
