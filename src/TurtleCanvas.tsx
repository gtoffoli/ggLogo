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
import { DrawingCommand} from './LogoState';
import { initialTurtleState } from './logoReducer';
// ... importa DrawingCommand, GraphicWindowState, etc.

// const drawIperLogoTurtle = (ctx: CanvasRenderingContext2D, turtle: TurtleState) => {
const drawIperLogoTurtle = (ctx: CanvasRenderingContext2D, turtle: TurtleState, foreground: HTMLCanvasElement, container: HTMLCanvasElement) => {
  const { x, y, heading } = turtle;

  ctx.save();
  // Spostiamo l'origine nel punto della tartaruga
  ctx.translate(x  + foreground.width/2, y + foreground.height/2);
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

/* Per implementare `FILL` (riempimento a macchia d'olio), non possiamo usare i comandi vettoriali del Canvas.
   Dobbiamo operare sui pixel.
   Ecco un algoritmo **iterativo** (per evitare lo "stack overflow" della ricorsione su aree grandi) */

// algoritmo floodFill classico, alternativo a quello realizzato in risposta ad un DrawingCommand di tipo 'POLYGON'
// (ancora non è utilizzato da una primitiva, come in jsLogo)
function floodFill(ctx, startX, startY, fillColor) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // 1. Ottieni tutti i pixel del canvas in un colpo solo
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 2. Leggi il colore del pixel di partenza (il "colore da sostituire")
  const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  // Se il colore è già quello desiderato, esci
  if (isSameColor(startR, startG, startB, startA, fillColor)) return;

  // 3. Coda dei pixel da processare
  const stack = [[Math.floor(startX), Math.floor(startY)]];
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const pos = (y * width + x) * 4;

    if (isSameColor(data[pos], data[pos+1], data[pos+2], data[pos+3], [startR, startG, startB, startA])) {
      // Colora il pixel
      data[pos] = fillColor[0];
      data[pos + 1] = fillColor[1];
      data[pos + 2] = fillColor[2];
      data[pos + 3] = 255;

      // Aggiungi i vicini (su, giù, sinistra, destra)
      if (x > 0) stack.push([x - 1, y]);
      if (x < width - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < height - 1) stack.push([x, y + 1]);
    }
  }
  
  // 4. Riporta i pixel modificati sul canvas
  ctx.putImageData(imageData, 0, 0);
}

function isSameColor(r, g, b, a, target) {
  return r === target[0] && g === target[1] && b === target[2] && a === target[3];
}


interface TurtleCanvasProps {
    windowId: string; // "TARTA"
}

const Canvas: React.FC<TurtleCanvasProps> = ({ windowId }) => {
  const scale = window.devicePixelRatio;
  console.log('TurtleCanvas - starting', scale);
  const containerRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const foregroundRef = useRef<HTMLCanvasElement>(null);
  const { state, dispatch, interpreter } = useLogoState();
    
  // Ottiene la finestra grafica specifica da Redux
  const windowState = state.windows[windowId];
  // Nuovo approccio
  const lastDrawnIndex = useRef(0)
  var lastBackgroundColor = useRef(windowState.backgroundColor)
	// 't' è la funzione di traduzione
	const { t, i18n } = useTranslation();
    
  // 1. REGISTRAZIONE DEL CONTESTO CANVASS NEL REDUX STATE
  useEffect(() => {
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
      // backgroundRef.current.width = backgroundRef.current.offsetWidth;
      // backgroundRef.current.height = backgroundRef.current.offsetHeight;
      const container = containerRef.current;
      const canvas = backgroundRef.current;
      canvas.width = windowState.canvasSize[0];
      canvas.height = windowState.canvasSize[1];
      foregroundRef.current.width = windowState.canvasSize[0];
      foregroundRef.current.height = windowState.canvasSize[1];
      ctx.fillStyle = windowState.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // container.scrollTo(container.width / 2, container.height / 2);
      container.scrollTo(canvas.width / 2, canvas.height / 2);
    }
  }, [dispatch, windowId]);

  // 2. LOGICA DI DISEGNO INCREMENTALE E OTTIMIZZATA
  useEffect(() => {
    // 1. Controlli preliminari
    if (!windowState || !windowState.canvasContext) return;
    
    const ctx = windowState.canvasContext;
    const canvas = windowState.backgroundRef;
    const commands = windowState.drawingCommands;
    const turtle = windowState.turtleState;
    
    // 2. GESTIONE RESET: Se i comandi sono diminuiti o la lista è vuota, o è cambiato lo sfondo, puliamo tutto
    if ((commands.length < lastDrawnIndex.current) || (windowState.backgroundColor != lastBackgroundColor.current)) {
      // ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = windowState.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      lastDrawnIndex.current = 0;
      lastBackgroundColor = windowState.backgroundColor;
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
          var { x, y, color } = currentCmd;
          
          // Troviamo il punto di partenza
          let prevX = 0;
          let prevY = 0;
          if ((i > 0) && (['MOVE_TO', 'LINE_TO'].includes(commands[i - 1].type))) {
            prevX = commands[i - 1].x;
            prevY = commands[i - 1].y;
          }

          if (currentCmd.type === 'LINE_TO') {
            ctx.beginPath();
            ctx.moveTo(prevX + centerX, centerY + prevY);
            ctx.lineTo(x + centerX, centerY + y);
            // ctx.lineWidth = 1;
            ctx.lineWidth = windowState.turtleState.penSize;
            // ctx.strokeStyle = color;
            ctx.strokeStyle = (turtle.penMode === 'PAINT') ? color : windowState.backgroundColor;
            ctx.stroke();
          } else {
            // Per MOVE_TO non disegniamo, il canvas sposta il "cursore" internamente
            ctx.moveTo(x + centerX, centerY + y);
          }
          break;

        case 'ARC':
          var { x, y, radius, startAngle, endAngle, color, fillColor } = currentCmd;
          ctx.beginPath();
          ctx.arc(x + centerX, y + centerY, radius, startAngle, endAngle);
          if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
          }
          if (color) {
            ctx.lineWidth = windowState.turtleState.penSize;
            ctx.strokeStyle = color;
            ctx.stroke();
          }
          break;

        case 'POLYGON':
          var { fillColor, path } = currentCmd;
          ctx.beginPath();
          ctx.moveTo(path[0].x + centerX, path[0].y + centerY);
          path.forEach(p => ctx.lineTo(p.x + centerX, p.y + centerY));
          ctx.closePath(); // Chiude automaticamente la figura
          ctx.fillStyle = fillColor;
          ctx.fill();
          break;

        case 'CLEAR_CANVAS':
          canvas.width = windowState.canvasSize[0];
          canvas.height = windowState.canvasSize[1];
          const foreground = foregroundRef.current;
          foreground.width = windowState.canvasSize[0];
          foreground.height = windowState.canvasSize[1];
          ctx.fillStyle = windowState.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Opzionale: se CLEAR_CANVAS è nel mezzo della lista, 
          // tecnicamente dovremmo ridisegnare tutto ciò che viene dopo.
          // In Logo di solito CLEAR svuota la lista, quindi lastDrawnIndex tornerà a 0.
          if (turtle.visible)
            drawIperLogoTurtle(foreground.getContext('2d'), turtle, foregroundRef.current, containerRef.current);
          break;
      }
    }

    // 4. AGGIORNAMENTO PUNTATORE: Salviamo dove siamo arrivati
    lastDrawnIndex.current = commands.length;

  }, [windowState.drawingCommands, windowState.canvasSize, windowState.backgroundColor]);

  // --- EFFECT 3: LA TARTARUGA (FOREGROUND) ---
  useEffect(() => {
    const foreground = foregroundRef.current;
    if (!foreground) return;
    const ctx = foreground.getContext('2d');
    if (!ctx) return;

    // 1. Puliamo il layer della tartaruga (fondamentale!)
    ctx.clearRect(0, 0, foreground.width, foreground.height);

    // 2. Disegniamo la tartaruga se è visibile
    const turtle = windowState.turtleState;
    if (turtle.visible)
      drawIperLogoTurtle(ctx, turtle, foreground, containerRef.current);
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
      // type: 'ADD_DRAWING_COMMAND', 
      type: 'ADD_DRAWING_COMMANDS', 
      windowId: windowId,
      // command: { type: 'CLEAR_CANVAS' }
      commands: [{ type: 'CLEAR_CANVAS' }]
    });
  };

  const exportPNG = () => {
    const canvas = backgroundRef.current;
    if (!canvas) return;
    // Crea un link temporaneo per il download
    const link = document.createElement('a');
    link.download = 'disegno-iperlogo.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportSVG = () => {
    let width = 800;
    let height = 800;
    let commands = windowState.drawingCommands;
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    svgContent += `<rect width="100%" height="100%" fill="white" />`; // Sfondo
  
    const centerX = width / 2;
    const centerY = height / 2;
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      if (cmd.type === 'LINE_TO' && i > 0) {
        const prev = commands[i - 1];
        svgContent += `<line x1="${prev.x + centerX}" y1="${prev.y + centerY}" 
                             x2="${cmd.x + centerX}" y2="${cmd.y + centerY}" 
                             stroke="${cmd.color}" stroke-width="1" />`;
      }
    };
    svgContent += `</svg>`;
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'disegno-iperlogo.svg';
    link.href = url;
    link.click();
  };

  // Menu per l'Area A (Canvas/Grafica)
  const menuA = [
  { label: t('menu.turtle'), submenu: [
    { label: t('menu.home'), action: handleHome },
    { label: t('menu.hide_show'), action: handleToggleVisibility },
  ]},
  { label: t('menu.image'), submenu: [
    { label: t('menu.clear'), action: handleClearCanvas },
    { label: t('menu.export_png'), action: exportPNG },
    // { label: t('menu.export_svg'), action: exportSVG(800, 800, windowState.drawingCommands) },
    { label: t('menu.export_svg'), action: exportSVG },
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
      <div className="canvas-container" ref={containerRef}>
        <canvas 
          id="background-canvas"
          className="canvas-layer"
          ref={backgroundRef}
          width={backgroundRef.width} height={backgroundRef.height}
        />
        <canvas 
          id="foreground-canvas"
          className="canvas-layer"
          ref={foregroundRef}
          width={foregroundRef.width} height={foregroundRef.height}
        />
      </div>
    </PanelContainer>
  );
};

export default Canvas;
