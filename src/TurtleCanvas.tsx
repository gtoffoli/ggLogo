// TurtleCanvas.tsx
// 251013 - 1st version with DeepSeek
// 251018 - added some command handler
// 251025 - adapted to the global architecture proposed by Gemini

import React, { useEffect, useRef } from 'react';
import { useLogoDispatch, useLogoState } from './LogoStateContext';
// import { LogoStateProvider } from './LogoStateContext';
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
    
    // 1. REGISTRAZIONE DEL CONTESTO CANVASS NEL REDUX STATE
    useEffect(() => {
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                // Invia l'azione per registrare il contesto nello stato globale
                dispatch({ 
                    type: 'REGISTER_CANVAS', 
                    windowId, 
                    context,
                    canvas: canvasRef.current
                });
                
                // Imposta le dimensioni iniziali del Canvas (opzionale)
                // canvasRef.current.width = canvasRef.current.offsetWidth;
                // canvasRef.current.height = canvasRef.current.offsetHeight;
            }
        }
    }, [dispatch, windowId]);

    // 2. LOGICA DI DISEGNO BASATA SULLO STATO (MINIMALE)
    useEffect(() => {
        console.log(windowState);
        if (!windowState || !windowState.canvasContext) return;
        
        const ctx = windowState.canvasContext;
        const commands = windowState.drawingCommands;
        console.log(commands);

        // Esegui SOLO l'ultimo comando di disegno (per la fase di test)
        if (commands.length > 0) {
            const lastCommand = commands[commands.length - 1];
            
            // Simula l'esecuzione del comando di disegno
            if (lastCommand.type === 'LINE_TO') {
                const { x, y, color } = lastCommand;
                const { x: prevX, y: prevY } = commands[commands.length - 2] as any || {x: 0, y: 0}; // Posizione precedente (simplificata)

                // Disegna il segmento (per vedere qualcosa)
                ctx.beginPath();
                ctx.moveTo(prevX, prevY); 
                ctx.lineTo(x, y);
                ctx.strokeStyle = color;
                ctx.stroke();
                
                console.log(`Canvas: Linea disegnata fino a (${x}, ${y})`);
            }
            // Aggiungere logica per MOVE_TO, CLEAR_CANVAS, ecc.
        }

    }, [windowState]); // Ridisegna ogni volta che lo stato della finestra cambia

    return (
        <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', display: 'block' }} 
        />
    );
};

// export default TurtleCanvas;
export default Canvas;


/*
const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Inizializza il canvas con sfondo bianco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Posiziona la turtle al centro
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, 2 * Math.PI);
    ctx.fill();

	let xTurtle:number = 0;
	let yTurtle:number = 0, dirTurtle:number = 0; // radians

    // Iscrizione agli eventi dell'interprete per i comandi di disegno

    const handleTurtleForward = (dist: number) => {
	 	let dx:number = 0; // dist * Math.cos(dirTurtle);
	  	let dy:number = 0; // dist * Math.sin(dirTurtle);
      	ctx.lineTo (xTurtle + dx, yTurtle + dy);
      	xTurtle = xTurtle + dx;
      	yTurtle = yTurtle + dy;
    };

    const handleTurtleRight = (angle: number) => {
		let dirTurtle = dirTurtle + angle;
    };

    const handleTurtleLeft = (angle: number) => {
		let dirTurtle = dirTurtle - angle;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={800}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Canvas;
*/

