// LogoEditor.tsx
// 251013 - 1st version with Gemini on 251013

import React, { useState } from 'react';
import './i18n';
import { useTranslation } from 'react-i18next';
import PanelContainer from './PanelContainer';

const Editor: React.FC = () => {
	const [code, setCode] = useState('');
	// 't' è la funzione di traduzione
	const { t, i18n } = useTranslation();

  // --- DEFINIZIONE DEI MENU (Hook per l'esecuzione dei comandi) ---

    const handleClear = () => {
		const textOutput = document.getElementById('editor-area');
		textOutput.value = '';
    };

    const handleFileLoad = () => {
        // Logica per aprire un input file nascosto
        const fileInput = document.getElementById('editor-file-input') as HTMLInputElement;
        fileInput?.click();
    };

	const handleFileChange = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
			const textOutput = document.getElementById('editor-area');
			const text = e.target.result;
			textOutput.value += text;
		};
		reader.readAsText(file);
	}
  };

  const handleFileSave = () => { console.log('Salvataggio file LOGO...'); };

  // Menu per l'Area C (Editor LOGO)
  const menuC = [
  { label: 'File', submenu: [
    { label: t('menu.clear'), action: handleClear },
    { label: t('menu.load'), action: handleFileLoad },
    { label: t('menu.save'), action: handleFileSave },
  ]},
  { label: t('menu.edit'), submenu: [
    { label: t('menu.undo'), action: () => alert('Esecuzione del codice nell\'Editor...') },
  ]},
  { label: t('menu.set'), submenu: [
    { label: t('menu.char'), action: () => alert('Esecuzione del codice nell\'Editor...') },
  ]},
  { label: t('menu.test'), submenu: [
    { label: t('menu.run_selection'), action: () => alert('Esecuzione del codice nell\'Editor...') },
    { label: t('menu.run_all'), action: () => alert('Esecuzione del codice nell\'Editor...') },
  ]},
  ];

  return (

  <PanelContainer
	  id="area-c"
	  title={t('header.editor')}
	  borderColor="#ff8c00" // Arancione
	  menuItems={menuC}
  >
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <textarea
        id="editor-area"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ flex: 1, background: '#1e1e1e', color: 'white', border: 'none', padding: '10px' }}
        placeholder={t('msg.code_placeholder')}
      />
      <input type="file" id='editor-file-input'  accept=".txt" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  </PanelContainer>
  );
};

export default Editor;
