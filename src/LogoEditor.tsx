// LogoEditor.tsx
// 251013 - 1st version with Gemini on 251013

import React, { useState } from 'react';
import './i18n';
// import JSZip from "jszip";
import * as fflate from 'fflate';
import { useLogoDispatch, useLogoState } from './LogoStateContext';
import { useTranslation } from 'react-i18next';
import PanelContainer from './PanelContainer';
import { BufferSource } from './Streams';

function insertAtCursor(myField, myValue) {
    //MOZILLA and others
    if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}

const loadZipLibrary = async (file, element) => {
  try {
    // 1. Convertiamo il file (Blob/File) in Uint8Array per fflate
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 2. Decomprimiamo lo ZIP
    // unzipSync è molto veloce; per file enormi esiste la versione asincrona unzip()
    const unzipped = fflate.unzipSync(uint8Array);

    // 3. Iteriamo sui file estratti
    for (const relativePath in unzipped) {
      const fileData = unzipped[relativePath];
      
      // Verifichiamo se è un file valido (non una cartella e con estensione corretta)
      const isFile = fileData.length > 0; // fflate restituisce Uint8Array vuoti per le cartelle
      const hasValidExt = /\.(il|lgo|logo|txt)$/i.test(relativePath);

      if (isFile && hasValidExt) {
        // 4. Convertiamo i dati binari in stringa
        const text = fflate.strFromU8(fileData);
        
        // 5. Inseriamo il codice nella textarea dell'Editor
        insertAtCursor(element, text); 
      }
    }
  } catch (errore) {
    console.error("Errore durante la decompressione:", errore);
    alert("Errore nel caricamento dello ZIP.");
  }
};

// const Editor: React.FC = ({ interpreter }) => {
const Editor: React.FC = () => {
  const [zIndex, setzIndex] = useState(2);
	const [code, setCode] = useState('');
  const { state, dispatch, interpreter } = useLogoState();
	// 't' è la funzione di traduzione
	const { t, i18n } = useTranslation();

  const [currentData, setCurrentData] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd } = event.currentTarget;
    const selected = event.currentTarget.value.substring(selectionStart, selectionEnd);
    // Se la selezione è vuota (selectionStart === selectionEnd) e non eravamo già in selezione,
    // significa che il cursore si è spostato o la selezione è terminata/annullata.
    // Se c'è del testo selezionato, aggiorniamo il nostro stato.
    if (selectionStart !== selectionEnd) {
      setSelectedText(selected);
      setIsSelecting(true);
      console.log(`Selezione attiva: "${selected}"`);
    } else {
      setIsSelecting(false);
      // Potresti voler svuotare selectedText qui o con onBlur
      setSelectedText(''); 
      console.log("Nessun testo selezionato / Cursore spostato.");
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsSelecting(false);
    // Qui puoi decidere se mantenere l'ultimo testo selezionato o pulirlo
    // setSelectedText(''); 
    console.log("Perduto focus dalla textarea.");
  };

  // --- DEFINIZIONE DEI MENU (Hook per l'esecuzione dei comandi) ---

  const handleClear = () => {
    // dispatch({ type: 'CLEAR_EDITOR_CONTENT' });
    const element = document.getElementById('editor-area');
    element.value = '';
  };

  const handleFileLoad = () => {
      // Logica per aprire un input file nascosto
      const fileInput = document.getElementById('editor-file-input') as HTMLInputElement;
      fileInput?.click();
  };

	const handleFileChange = (event) => {
		const file = event.target.files[0];
    const element = document.getElementById('editor-area');
		if (file) {
      const fileName = file.name;
      const fileType = file.type;
			if ((fileType.startsWith("text/")) || (['.il', 'lgo', 'logo'].includes(fileName.slice(fileName.lastIndexOf("."))))) { // possible Logo code
        const reader = new FileReader();
  			reader.onload = (e) => {
    			const text = e.target.result;
          insertAtCursor(element, text)
    		};
  		  reader.readAsText(file);
  		}
      else if (fileType.includes("zip")) { // zipped library of text files
        loadZipLibrary(file, element);
      }
  	}
  };

  const handleFileSave = () => { console.log('Salvataggio file LOGO...'); };

  const handleRunSelection = () => {
    if (selectedText) {
      const editorSource = new BufferSource(selectedText, 'Editor');
      interpreter.pushSource(editorSource);
      interpreter.run();
    }
  };

  const handleRunAll = () => {
    const element = document.getElementById('editor-area');
    const text = element.value;
    const editorSource = new BufferSource(text, 'Editor');
    interpreter.pushSource(editorSource);
    interpreter.run();
  };

  const handleHide = () => {
    const element = document.getElementById('editor-overlay');
    setzIndex(zIndex - 2);
    element.style["z-index"] = zIndex;
  };

  // Menu per l'Area C (Editor LOGO)
  const menuC = [
  { label: t('menu.file'), submenu: [
    { label: t('menu.clear'), action: handleClear },
    { label: t('menu.load'), action: handleFileLoad },
    { label: t('menu.save'), action: handleFileSave },
    // { label: t('menu.hide'), action: handleHide },
  ]},
  { label: t('menu.edit'), submenu: [
    { label: t('menu.undo'), action: () => alert("Annulla effetto di ultima azione in Editor...") },
  ]},
  { label: t('menu.set'), submenu: [
    { label: t('menu.char'), action: () => alert("Imposta carattere in Editor...") },
  ]},
  { label: t('menu.test'), submenu: [
    { label: t('menu.run_selection'), action: handleRunSelection },
    { label: t('menu.run_all'), action: handleRunAll },
  ]},
  ];

  return (

  <PanelContainer
	  id="editor-overlay"
	  title={t('header.editor')}
	  borderColor="#ff8c00" // Arancione
    zIndex={state.editors['FOGLIO'].zIndex}
	  menuItems={menuC}
  >
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <textarea
        id="editor-area"
        // value={currentData}
        // onChange={(e) => setCode(e.target.value)}
        onSelect={handleSelect}
        onBlur={handleBlur}
        style={{ flex: 1, background: '#1e1e1e', color: 'white', border: 'none', padding: '10px' }}
        placeholder={t('msg.code_placeholder')}
      />
      <input type="file" id='editor-file-input' accept=".il,.lgo,.logo,.txt,.zip" onChange={handleFileChange} style={{ display: 'none' }} />
    </div>
  </PanelContainer>
  );
};

export default Editor;
