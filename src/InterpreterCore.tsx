// InterpreterCore.tsx
// 251025 first version as proposed by Gemini on 251024

import { TurtleState, DrawingCommand } from './LogoState';

/**
 * Calcola il nuovo stato della tartaruga dopo un comando AVANTI/FD.
 */
function calculateForward(state: TurtleState, distance: number): { newState: TurtleState, command: DrawingCommand | null } {
    const rad = state.heading * Math.PI / 180;
    const newX = state.x + distance * Math.sin(rad);
    const newY = state.y - distance * Math.cos(rad); // LOGO usa Y decrescente verso l'alto
    
    let drawingCommand: DrawingCommand | null = null;

    const newState: TurtleState = { 
        ...state, 
        x: newX, 
        y: newY 
    };
    
    if (state.penDown) {
        drawingCommand = {
            type: 'LINE_TO',
            x: newX,
            y: newY,
            color: state.penColor,
            thickness: 1 // Usiamo un valore fisso per ora
        };
    } else {
        drawingCommand = {
            type: 'MOVE_TO',
            x: newX,
            y: newY
        };
    }
    
    return { newState, command: drawingCommand };
}

/**
 * Calcola il nuovo stato della tartaruga dopo un comando DESTRA/RT.
 */
function calculateRight(state: TurtleState, angle: number): TurtleState {
    const newHeading = (state.heading + angle) % 360;
    return { 
        ...state, 
        heading: newHeading < 0 ? newHeading + 360 : newHeading
    };
}
