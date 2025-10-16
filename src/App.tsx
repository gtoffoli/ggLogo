import React from 'react';
import "./index.css"; // (da installazione bundle Bum-React)
import LogoShell from './LogoShell'; // Il tuo componente B (da Gemini)
import Canvas from './Canvas'; // Il tuo componente A (da DeepSeek)
import Editor from './Editor'; // Il tuo componente C (da DeepSeek)
import "./style.css"; // (da Gemini)

const App: React.FC = () => {
  console.log('App');
  return (
    // NOTA: I componenti React popolano i div con gli ID definiti nel CSS
    <>
      <div id="area-a">
        <Canvas /> 
      </div>
      <div id="area-destra">
        <div id="area-b">
          <LogoShell />
        </div>
        <div id="area-c">
          <Editor />
        </div>
      </div>
    </>
  );
};

// AI Overview: come inserire in html un componente react definito in un modulo tsx
import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
