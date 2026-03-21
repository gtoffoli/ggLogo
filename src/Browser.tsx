// Browser.tsx
// 60319 - 1st version

import React, { useState } from 'react';
import './i18n';
import { useLogoDispatch, useLogoState } from './LogoStateContext';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import PanelContainer from './PanelContainer';

import { shared_langCode } from './LogoShell';

const Browser: React.FC = () => {
  const [zIndex, setzIndex] = useState(1);
  const [htmlContent, setHtmlContent] = useState('');

  const { state, dispatch, interpreter } = useLogoState();
	// 't' è la funzione di traduzione
	const { t, i18n } = useTranslation();

  const caricaMarkdown = async (url) => {
    const response = await fetch(url);
    const markdown = await response.text();
     // Convertiamo in HTML
    const htmlRaw = await marked.parse(markdown);
    // Aggiungiamo un pizzico di CSS interno e il "ponte" per i link LOGO:
    const htmlFinale = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; line-height: 1.6; padding: 20px; }
            a { color: #007bff; text-decoration: none; }
          </style>
        </head>
        <body>
          ${htmlRaw}
          <script>
            // Intercettiamo i click sui link dentro l'iframe
            document.addEventListener('click', (e) => {
              const link = e.target.closest('a');
              if (link && link.getAttribute('href').startsWith('LOGO:')) {
                e.preventDefault();
                // Comunichiamo con l'app principale (IperLOGO)
                window.parent.postMessage({
                  type: 'EXECUTE_LOGO',
                  command: decodeURIComponent(link.getAttribute('href').substring(5))
                }, '*');
              }
            });
          </script>
        </body>
      </html>
    `;
    
    setHtmlContent(htmlFinale);
  };

  const handleOpen = async () => {
    var url = `/locales/${shared_langCode}/doc/README.md`;
    await caricaMarkdown(url);
  };

  const handlePrint = () => { console.log('Print...'); };
  const handleHide = () => {
    const element = document.getElementById('browser-overlay');
    element.style["z-index"] = zIndex;
  };

  const handleBack = () => { console.log('Back'); };
  const handleForward = () => { console.log('Forward'); };
  const handleHome = () => { console.log('Home'); };
  const handleReload = () => { console.log('Open...'); };


  // Menu per l'Area E (Browser LOGO)
  const menuE = [
  { label: 'File', submenu: [
    { label: t('menu.open'), action: handleOpen },
    { label: t('menu.print'), action: handlePrint },
    { label: t('menu.hide'), action: handleHide },
  ]},
  { label: t('menu.navigate'), submenu: [
    { label: t('menu.back'), action: handleBack },
    { label: t('menu.forward'), action: handleForward },
    { label: t('menu.homepage'), action: handleHome },
    { label: t('menu.reload'), action: handleReload },
  ]},
  { label: t('menu.set'), submenu: [
    { label: t('menu.char'), action: () => alert("Imposta carattere in Browser...") },
  ]},
  ];

  return (

  <PanelContainer
	  id="browser-overlay"
	  title={t('header.browser')}
	  borderColor="#8c208c" // Viola
	  menuItems={menuE}
  >
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', zIndex: zIndex }}>
      <iframe
        id="browser-area"
        srcDoc={htmlContent} 
        style={{ flex: 1, color: '#1e1e1e', background: 'white', width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  </PanelContainer>
  );
};

export default Browser;
