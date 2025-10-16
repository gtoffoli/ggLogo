import React, { useEffect, useRef } from 'react';
// import { logoInterpreter } from '../interpreter/LogoInterpreter';

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Inizializza il canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
/*
    // Iscrizione agli eventi dell'interprete per i comandi di disegno
    // Per ora, non implementato, ma qui si gestiranno gli eventi di movimento della turtle

    // Esempio: quando l'interprete emette 'turtleMove', aggiorna il canvas
    const handleTurtleMove = (data: any) => {
      // ... disegna in base al comando
    };

    logoInterpreter.on('turtleMove', handleTurtleMove);

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
