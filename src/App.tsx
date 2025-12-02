// LogoShell.tsx
// 251016 - new version with Gemini and DeepSeek
// 251128 - moved PanelContainer for LogoShell to LogoShell module

import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import "./index.css"; // (da installazione bundle Bum-React)
import PanelContainer from './PanelContainer';
import LogoShell from './LogoShell'; // Il tuo componente B (da Gemini)
import Canvas from './TurtleCanvas'; // Il tuo componente A (da DeepSeek)
import Editor from './LogoEditor'; // Il tuo componente C (da DeepSeek)
import "./style.css"; // (da Gemini)

import { LogoStateProvider } from './LogoStateContext';
import './i18n';

const App: React.FC = () => {
  return (
    // NOTA: I componenti React popolano i div con gli ID definiti nel CSS
  <I18nextProvider i18n={i18n} defaultNS={'translation'}>
    <LogoStateProvider>
     <>
      <div id="area-destra">
        <LogoShell />
        <Editor /> 
      </div>
      <Canvas windowId="TARTA" />
     </>
    </LogoStateProvider>
  </I18nextProvider>
  );
};

// AI Overview: come inserire in html un componente react definito in un modulo tsx
import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
