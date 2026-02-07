// TurtleCanvas.tsx
// 251013 - 1st version with DeepSeek
// 251018 - added some command handler
// 251025 - adapted to the global architecture proposed by Gemini
// 251115 - implemented MOVE_TO and CLEAR_CANVAS

import React, { useEffect, useRef } from 'react';
import { useLogoDispatch, useLogoState } from './LogoStateContext';
import './i18n';
import { useTranslation } from 'react-i18next';
import PanelContainer from './PanelContainer';
import { initialTurtleState } from './logoReducer';
// ... importa DrawingCommand, GraphicWindowState, etc.

// const drawIperLogoTurtle = (ctx: CanvasRenderingContext2D, turtle: TurtleState) => {
const drawIperLogoTurtle = (ctx: CanvasRenderingContext2D, turtle: TurtleState, canvas: HTMLCanvasElement) => {
  const { x, y, heading } = turtle;
  console.log('drawIperLogoTurtle', x, y, heading)

  ctx.save();
  // Spostiamo l'origine nel punto della tartaruga
  // ctx.translate(x, y);
  ctx.translate(x  + canvas.width/2, y + canvas.height/2);
  // Ruotiamo il contesto (LOGO usa gradi, JS usa radianti)
  // Nota: LOGO 0° è verso l'alto, Canvas 0 è verso destra. Sottraiamo 90°.
  ctx.rotate((heading - 90) * Math.PI / 180);

  // Disegniamo il triangolo isoscele schiacciato
  ctx.beginPath();
  ctx.moveTo(10, 0);       // Punta
  ctx.lineTo(-5, -6);      // Base sinistra
  ctx.lineTo(-5, 6);       // Base destra
  ctx.closePath();

  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; // Un leggero riempimento
  ctx.fill();

  ctx.restore();
};

interface TurtleCanvasProps {
    windowId: string; // "TARTA"
}

// const TurtleCanvas: React.FC<TurtleCanvasProps> = ({ windowId }) => {
const Canvas: React.FC<TurtleCanvasProps> = ({ windowId }) => {
  console.log('TurtleCanvas - starting');
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const foregroundRef = useRef<HTMLCanvasElement>(null);
  const { state, dispatch, interpreter } = useLogoState();
    
  // Ottiene la finestra grafica specifica da Redux
  const windowState = state.windows[windowId];
  // Nuovo approccio
  const lastDrawnIndex = useRef(0)
	// 't' è la funzione di traduzione
	const { t, i18n } = useTranslation();
    
  // 1. REGISTRAZIONE DEL CONTESTO CANVASS NEL REDUX STATE
  useEffect(() => {
    // if (backgroundRef.current) {
    if (backgroundRef.current && foregroundRef.current) {
      const ctx = backgroundRef.current.getContext('2d');
      // Invia l'azione per registrare il contesto nello stato globale
      dispatch({ 
          type: 'REGISTER_CANVAS', 
          windowId: windowId,
          context: ctx,
          // canvas: backgroundRef.current
          background: backgroundRef.current,
          foreground: foregroundRef.current
      });

      // Imposta le dimensioni iniziali del Canvas (opzionale)
      backgroundRef.current.width = backgroundRef.current.offsetWidth;
      backgroundRef.current.height = backgroundRef.current.offsetHeight;
    }
  }, [dispatch, windowId]);

  // 2. LOGICA DI DISEGNO INCREMENTALE E OTTIMIZZATA
  useEffect(() => {
    // 1. Controlli preliminari
    if (!windowState || !windowState.canvasContext) return;
    
    const canvas = windowState.backgroundRef;
    const ctx = windowState.canvasContext;
    const commands = windowState.drawingCommands;
    
    // 2. GESTIONE RESET: Se i comandi sono diminuiti o la lista è vuota, puliamo tutto
    if (commands.length < lastDrawnIndex.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lastDrawnIndex.current = 0;
      console.log('Canvas: Reset totale');
    }

    // Se non ci sono nuovi comandi, non fare nulla
    if (commands.length === lastDrawnIndex.current) return;

    // Cache delle dimensioni per evitare ricalcoli nel loop
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 3. LOOP INCREMENTALE: Partiamo dall'ultimo comando disegnato
    for (let i = lastDrawnIndex.current; i < commands.length; i++) {
      const currentCmd = commands[i];

      switch (currentCmd.type) {
        case 'MOVE_TO':
        case 'LINE_TO':
          const { x, y, color } = currentCmd;
          
          // Troviamo il punto di partenza
          let prevX = 0;
          let prevY = 0;
          if (i > 0) {
            prevX = commands[i - 1].x;
            prevY = commands[i - 1].y;
          }

          if (currentCmd.type === 'LINE_TO') {
            ctx.beginPath();
            ctx.moveTo(prevX + centerX, centerY + prevY);
            ctx.lineTo(x + centerX, centerY + y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = color;
            ctx.stroke();
          } else {
            // Per MOVE_TO non disegniamo, il canvas sposta il "cursore" internamente
            ctx.moveTo(x + centerX, centerY + y);
          }
          break;

        case 'CLEAR_CANVAS':
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Opzionale: se CLEAR_CANVAS è nel mezzo della lista, 
          // tecnicamente dovremmo ridisegnare tutto ciò che viene dopo.
          // In Logo di solito CLEAR svuota la lista, quindi lastDrawnIndex tornerà a 0.
          break;
      }
    }

    // 4. AGGIORNAMENTO PUNTATORE: Salviamo dove siamo arrivati
    lastDrawnIndex.current = commands.length;

  }, [windowState.drawingCommands]); // Molto importante: osserva solo i comandi, non tutto lo stato

  // --- EFFECT 3: LA TARTARUGA (FOREGROUND) ---
  useEffect(() => {
    const canvas = foregroundRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Puliamo il layer della tartaruga (fondamentale!)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Disegniamo la tartaruga se è visibile
    const turtle = windowState.turtleState;
    if (turtle.visible)
      drawIperLogoTurtle(ctx, turtle, canvas);
  }, [windowState.turtleState]); // Si attiva a ogni cambio di posizione/direzione

  // --- DEFINIZIONE DEI MENU (Hook per l'esecuzione dei comandi) ---

  const handleHome = () => {
    dispatch({ 
      type: 'UPDATE_TURTLE_STATE', 
      windowId: windowId,
      newState: initialTurtleState 
    });
  };
  const handleToggleVisibility = () => {
    const toggled = !(windowState.turtleState.visible);
    dispatch({ 
      type: 'UPDATE_TURTLE_STATE',
      windowId: windowId,
      newState: { // Usa Partial per aggiornamenti parziali
        ...windowState.turtleState,
        visible: toggled
      }
    });
  };

  const handleClearCanvas = () => {
    dispatch({ 
      type: 'ADD_DRAWING_COMMAND', 
      windowId: windowId,
      command: { type: 'CLEAR_CANVAS' }
    });
  };

  // Menu per l'Area A (Canvas/Grafica)
  const menuA = [
  { label: t('menu.turtle'), submenu: [
    { label: t('menu.home'), action: handleHome },
    { label: t('menu.hide_show'), action: handleToggleVisibility },
  ]},
  { label: t('menu.image'), submenu: [
    { label: t('menu.clear'), action: handleClearCanvas },
    { label: t('menu.save'), action: () => alert('Salvataggio Canvas...') },
    { label: t('menu.print'), action: () => alert('Stampa Canvas...') },
  ]},
  ];

  return (
    <PanelContainer
      id="area-a"
      title={t('header.canvas')}
      borderColor="#007bff" // Blu
      menuItems={menuA}
    >
      <div className="canvas-container">
        <canvas 
          id="background-canvas"
          className="canvas-layer"
          ref={backgroundRef}
          width={720} height={540}
        />
        <canvas 
          id="foreground-canvas"
          className="canvas-layer"
          ref={foregroundRef}
          width={720} height={540}
        />
      </div>
    </PanelContainer>
  );
};

// export default TurtleCanvas;
export default Canvas;

//      <canvas 
//        ref={backgroundRef} 
//        style={{ width: '100%', height: '100%', display: 'block' }} 
//       />
