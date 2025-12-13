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
// ... importa DrawingCommand, GraphicWindowState, etc.

interface TurtleCanvasProps {
    windowId: string; // "TARTA"
}

// const TurtleCanvas: React.FC<TurtleCanvasProps> = ({ windowId }) => {
const Canvas: React.FC<TurtleCanvasProps> = ({ windowId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dispatch = useLogoDispatch();
    const state = useLogoState();
    
    // Ottiene la finestra grafica specifica da Redux
    const windowState = state.windows[windowId];

	// 't' è la funzione di traduzione
	const { t, i18n } = useTranslation();
    
    // 1. REGISTRAZIONE DEL CONTESTO CANVASS NEL REDUX STATE
    useEffect(() => {
        if (canvasRef.current) {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                // Invia l'azione per registrare il contesto nello stato globale
                dispatch({ 
                    type: 'REGISTER_CANVAS', 
                    windowId: windowId,
                    context: ctx,
                    canvas: canvasRef.current
                });

                // Imposta le dimensioni iniziali del Canvas (opzionale)
                canvasRef.current.width = canvasRef.current.offsetWidth;
                canvasRef.current.height = canvasRef.current.offsetHeight;

                const canvas = canvasRef.current;
                // Posiziona la turtle al centro
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, 1, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }, [dispatch, windowId]);

    // 2. LOGICA DI DISEGNO BASATA SULLO STATO (MINIMALE)
    useEffect(() => {
        console.log('TurtleCanvas', windowState);
        if (!windowState || !windowState.canvasContext) return;
        
        const canvas = windowState.canvasRef;
        const ctx = windowState.canvasContext;
        const commands = windowState.drawingCommands;
        const n_commands = commands.length;
        var lastCommand;
        console.log('comandi', ctx, commands);

        // Esegui SOLO l'ultimo comando di disegno (per la fase di test)
        if (n_commands > 0) {
            // const lastCommand = commands[commands.length - 1];
			console.log(commands.length, '----- COMMANDS')
        for (var i=0; i<n_commands; i++) {
            lastCommand = commands[i];
            // if (lastCommand.type === 'LINE_TO') {
		    switch (lastCommand.type) {
		        case 'MOVE_TO':
		        case 'LINE_TO':
	                const { x, y, color } = lastCommand;
	                // const { x: prevX, y: prevY } = commands[commands.length - 2] as any || {x: 0, y: 0}; // Posizione precedente (simplificata)
	     			if (i > 0)
	     				var { x: prevX, y: prevY } = commands[i-1] as any;
	     			else
	     				var { x: prevX, y: prevY } = {x: 0, y: 0} as any;
	                console.log('TurtleCanvas', 'LINE_TO', x, y, prevX, prevY);
	
	                // Disegna il segmento (per vedere qualcosa)
	                if (lastCommand.type === 'LINE_TO') {
						console.log('----- LINE_TO');
		                ctx.beginPath();
		                ctx.moveTo(prevX + canvas.width / 2, canvas.height / 2 + prevY); 
	                	ctx.lineTo(x + canvas.width / 2, canvas.height / 2 + y);
		                ctx.lineWidth = 1;
		                ctx.strokeStyle = color;
		                ctx.stroke();      
	                	console.log(`Canvas: Linea disegnata fino a (${x}, ${y})`);
	                } else {
						console.log('----- MOVE_TO');
	                	ctx.moveTo(x + canvas.width / 2, canvas.height / 2 + y);
	                	console.log(`Canvas: Posizione aggiornata a (${x}, ${y})`);
					}      
	                break;
		        case 'CLEAR_CANVAS':
					console.log('----- CLEAR_CANVAS');
					ctx.clearRect(0, 0, canvas.width, canvas.height);
	                console.log(`Canvas: fully cleared`);
					break;
            }
            // Aggiungere logica per altri comandi
        }}

    }, [windowState]); // Ridisegna ogni volta che lo stato della finestra cambia

  // --- DEFINIZIONE DEI MENU (Hook per l'esecuzione dei comandi) ---

  const handleCanvasReset = () => { alert('Canvas Reset: La tartaruga verrà riportata a (0,0).'); };

  // Menu per l'Area A (Canvas/Grafica)
  const menuA = [
  { label: t('menu.turtle'), submenu: [
    { label: t('menu.home'), action: handleCanvasReset },
    { label: t('menu.hide_show'), action: () => console.log('Toggle Turtle visibility') },
  ]},
  { label: t('menu.image'), submenu: [
    { label: t('menu.clear'), action: () => alert('Pulisce canvas...') },
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
        <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', display: 'block' }} 
        />
      </PanelContainer>
    );
};

// export default TurtleCanvas;
export default Canvas;
