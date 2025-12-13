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

  const handleEditorLoad = () => { console.log('Caricamento file LOGO...'); };
  const handleEditorSave = () => { console.log('Salvataggio file LOGO...'); };

  // Menu per l'Area C (Editor LOGO)
  const menuC = [
  { label: 'File', submenu: [
    { label: t('menu.new'), action: () => console.log('Nuovo file') },
    { label: t('menu.load'), action: handleEditorLoad },
    { label: t('menu.save'), action: handleEditorSave },
  ]},
  { label: t('menu.run'), submenu: [
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
    </div>
  </PanelContainer>
  );
};

export default Editor;
