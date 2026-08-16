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

// Per inviare testo, devi prima rasterizzarlo
// export function renderTextToBitmap(text: string): Uint8Array {
// export function renderTextToBitmap(text: string) {
export function renderTextToBitmap(text: string, width: number, height: number, fontHeight: number, fontName: string): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = width; 
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = 'black'; // Sfondo
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'white'; // Colore testo
  ctx.font = fontHeight.toString() + 'px ' + fontName; // '16px Arial';
  ctx.fillText(text, 0, fontHeight);
  
  // Ora converti i pixel in un formato binario che il protocollo iPixel si aspetta
  // Nota: dovrai consultare la doc del protocollo per l'header del pacchetto!
  return ctx.getImageData(0, 0, width, height).data;
  // return formatForIPixel(ctx.getImageData(0, 0, 64, 32).data);
}

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
function floodFill3(imageData, width: number, height: number, startX: number, startY: number, cssColor, tolerance = 30) {
  const data = imageData.data;
  const targetColor = getPixelColor(data, startX, startY, width);
  const fillRGBA = cssToRgba(cssColor);
  if (colorsMatch(targetColor, fillRGBA, 0)) return;
  const queue = [[startX, startY]];
  // Matrice per evitare di ri-analizzare pixel già processati
  const visited = new Uint8Array(width * height);
  visited[startY * width + startX] = 1;
  // Colora subito il punto di partenza
  setPixelColor(data, startX, startY, width, fillRGBA);
  while (queue.length > 0) {
    const [x, y] = queue.shift();
   // Controlla i 4 vicini
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        if (!visited[idx]) {
          visited[idx] = 1; // Segna come visitato immediatamente
          const currentColor = getPixelColor(data, nx, ny, width);
          // Il confronto va fatto sempre rispetto al colore originale (targetColor)
          if (colorsMatch(currentColor, targetColor, tolerance)) {
            setPixelColor(data, nx, ny, width, fillRGBA);
            queue.push([nx, ny]);
          }
        }
      }
    }
  }
}
function cssToRgba(cssColor) {
  // Crea un canvas temporaneo da 1x1 pixel
  const canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 1;
  const ctx = canvas.getContext('2d');
  // Disegna il pixel
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  // Estrae i byte del pixel
  return ctx.getImageData(0, 0, 1, 1).data;
}
function colorsMatch(c1, c2, tolerance) {
  return Math.abs(c1[0] - c2[0]) <= tolerance &&
         Math.abs(c1[1] - c2[1]) <= tolerance &&
         Math.abs(c1[2] - c2[2]) <= tolerance &&
         Math.abs(c1[3] - c2[3]) <= tolerance;
}
function setPixelColor(data, nx, ny, width, fillRGBA) {
  const index = (ny * width + nx) * 4;
  data[index] = fillRGBA[0];
  data[index + 1] = fillRGBA[1];
  data[index + 2] = fillRGBA[2];
  data[index + 3] = fillRGBA[3];
}
function getPixelColor(data, nx, ny, width) {
  const index = (ny * width + nx) * 4;
  return [
    data[index],
    data[index + 1],
    data[index + 2],
    data[index + 3]];
}

interface TurtleCanvasProps {
    windowId: string; // "TARTA"
}

const Canvas: React.FC<TurtleCanvasProps> = ({ windowId }) => {
  const scale = window.devicePixelRatio;
  // console.log('TurtleCanvas - starting', scale);
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
          /*
          if ((i > 0) && (['MOVE_TO', 'LINE_TO'].includes(commands[i - 1].type))) {
            prevX = commands[i - 1].x;
            prevY = commands[i - 1].y;
          }
          */
          if (i > 0)
            for (var j=i-1; j>=0; j--)
              if (['MOVE_TO', 'LINE_TO'].includes(commands[j].type)) {
                prevX = commands[j].x;
                prevY = commands[j].y;
                break;
              }
 
          if (currentCmd.type === 'LINE_TO') {
            ctx.beginPath();
            ctx.moveTo(prevX + centerX, centerY + prevY);
            ctx.lineTo(x + centerX, centerY + y);
            // ctx.lineWidth = 1;
            ctx.lineWidth = windowState.turtleState.penSize;
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

        case 'FLOODFILL':
          var { x, y, fillColor } = currentCmd;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          floodFill3(imageData, canvas.width, canvas.height, x + centerX, y + centerY, fillColor, 10);
          ctx.putImageData(imageData, 0, 0);
          break;

        case 'LABEL':
          var { text, x, y, heading, font, color } = currentCmd;
          console.log('LABEL', text, x, y, heading, font, color, centerX, centerY);
          ctx.save(); // Salva lo stato corrente (posizione, colore, rotazione)
          // ctx.translate(centerX, centerY); // Sposta l'origine degli assi sulla tartaruga
          ctx.translate(x + centerX, y + centerY); // Sposta l'origine degli assi sulla tartaruga
          ctx.rotate(heading); // Ruota gli assi in base alla direzione della tarta
          ctx.textAlign = 'center'; // Allinea il testo in orizzontale ('left' / 'center' / 'right' / 'start' / 'end')
          ctx.textBaseline = 'middle'; // Allinea il testo in verticale ('top' / 'middle' / 'bottom' / 'alphabetic')
          ctx.font = font;
          ctx.fillStyle = color;
          // ctx.fillText(text, x + centerX, y + centerY);
          ctx.fillText(text, 0, 0);
          // ctx.strokeStyle = 'green';
          // ctx.strokeText(text, x, y);
          console.log('LABEL', text,  x + centerX, y + centerY, ctx);
          ctx.restore();
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
  const handleClearCanvas = () => {
    dispatch({ 
      type: 'ADD_DRAWING_COMMANDS', 
      windowId: windowId,
      commands: [{ type: 'CLEAR_CANVAS' }]
    });
  };
  const handleClearScreen = () => {
    handleClearCanvas();
    handleHome();
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

  const handlePrint = () => {
    // Aggiungiamo la classe specifica
    document.body.classList.add(`print-tarta`);
    // Lanciamo la stampa
    window.print();
    // Rimuoviamo la classe appena aggiunta
    document.body.classList.remove(`print-tarta`);
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
    { label: t('menu.reset'), action: handleClearScreen },
    { label: t('menu.home'), action: handleHome },
    { label: t('menu.hide_show'), action: handleToggleVisibility },
  ]},
  { label: t('menu.image'), submenu: [
    { label: t('menu.clear'), action: handleClearCanvas },
    { label: t('menu.export_png'), action: exportPNG },
    // { label: t('menu.export_svg'), action: exportSVG(800, 800, windowState.drawingCommands) },
    { label: t('menu.export_svg'), action: exportSVG },
    { label: t('menu.print'), action: handlePrint },
  ]},
  ];

  return (
    <PanelContainer
      id="area-a"
      title={t('header.canvas')}
      borderColor="#007bff" // Blu
      zIndex={1}
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
