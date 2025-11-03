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
        console.log('comandi', ctx, commands);

        // Esegui SOLO l'ultimo comando di disegno (per la fase di test)
        if (commands.length > 0) {
            const lastCommand = commands[commands.length - 1];
            
            // Simula l'esecuzione del comando di disegno
            if (lastCommand.type === 'LINE_TO') {
                const { x, y, color } = lastCommand;
                const { x: prevX, y: prevY } = commands[commands.length - 2] as any || {x: 0, y: 0}; // Posizione precedente (simplificata)
                console.log('TurtleCanvas', 'LINE_TO', x, y, prevX, prevY);

                // Disegna il segmento (per vedere qualcosa)
                ctx.beginPath();
                ctx.moveTo(prevX + canvas.width / 2, canvas.height / 2 + prevY); 
                ctx.lineTo(x + canvas.width / 2, canvas.height / 2 + y);
                ctx.lineWidth = 1;
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
