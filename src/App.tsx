// LogoShell.tsx
// 251016 - new version with Gemini and DeepSeek
// 251128 - moved PanelContainer for LogoShell to LogoShell module

import React, { useReducer, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import "./index.css"; // (da installazione bundle Bum-React)
import PanelContainer from './PanelContainer';
import LogoShell from './LogoShell'; // Il tuo componente B (da Gemini)
import Canvas from './TurtleCanvas'; // Il tuo componente A (da DeepSeek)
import Editor from './LogoEditor'; // Il tuo componente C (da DeepSeek)
import { initialLogoState, logoReducer } from './logoReducer';
import { useLocalization, LanguageCode } from './UseLocalization';
import { ShellSource, ShellOutput } from './Streams';
import { AsynchronousLogoInterpreter } from './Interpreter';
import { ini_main, ini_exec } from './LogoControl';
import { localizeTruthValues } from './Logic';
import "./style.css"; // (da Gemini)

import { LogoStateProvider } from './LogoStateContext';

const App: React.FC = () => {

  console.log('App');
  const [state, dispatch] = useReducer(logoReducer, initialLogoState); 
  const { activeLang, activeMap, setLanguage, resolveCommand, resolveKeyword } = useLocalization('it'); 

  const initialSource = new ShellSource();
  const initialOutput = new ShellOutput(dispatch);
  // const asynchronousInterpreter = new AsynchronousLogoInterpreter(initialSource, initialOutput, resolveCommand, resolveKeyword);
  const asynchronousInterpreter = new AsynchronousLogoInterpreter(state, dispatch, initialSource, initialOutput, resolveCommand, resolveKeyword);
  asynchronousInterpreter.run();

  // Facciamo partire il ciclo dell'interprete al primo avvio
  // useEffect(() => { interpreter.run(); }, [interpreter]);

  localizeTruthValues(activeLang);
  ini_main();
  ini_exec();

  return (
    // NOTA: I componenti React popolano i div con gli ID definiti nel CSS
    <I18nextProvider i18n={i18n} defaultNS={'translation'}>
      <LogoStateProvider>
       <>
        <div id="area-destra">
          <LogoShell activeLang={ activeLang } setLanguage={ setLanguage } initialSource={ initialSource } resolveKeyword={ resolveKeyword } history={state.shellHistory} interpreter={ asynchronousInterpreter } />
          <Editor interpreter={ asynchronousInterpreter } /> 
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
