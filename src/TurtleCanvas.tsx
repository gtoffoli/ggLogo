// TurtleCanvas.tsx
// 251013 - 1st version with DeepSeek
// 251018 - added some command handler
// 251025 - adapted to the global architecture proposed by Gemini

import React, { useEffect, useRef } from 'react';
// import { logoInterpreter } from '../interpreter/LogoInterpreter';
import { LogoStateProvider } from './LogoStateContext';

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

/*
    logoInterpreter.on('turtleForward', handleTurtleForward);
    logoInterpreter.on('turtleRight', handleTurtleRight);
    logoInterpreter.on('turtleLeft', handleTurtleLeft);

    return () => {
      // Rimuovi l'event listener quando il componente viene smontato
      logoInterpreter.emit('removeListener', 'turtleMove', handleTurtleMove);
    };
*/
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
