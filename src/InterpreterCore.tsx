// InterpreterCore.tsx
// 251025 first version as proposed by Gemini on 251024
// 251101 readded, after erroneous removal

import { CommandDef } from './CoreDefinitions';
import { TurtleState, DrawingCommand } from './LogoState';
import { initialTurtleState } from './logoReducer';


export function _NOP(): void  {
}

export function _CS(definition: CommandDef, values: any[], state: TurtleState): { newState: TurtleState | null, command: DrawingCommand | null } {
	console.log('function _CS');
    return { newState: initialTurtleState, command: { type: 'CLEAR_CANVAS' }};
}

export function _FD(definition: CommandDef, values: any[], state: TurtleState): { newState: TurtleState | null, command: DrawingCommand | null } {
	const distance: number = values[0];
	return calculateForward(state, distance);
}

export function _BK(definition: CommandDef, values: any[], state: TurtleState): { newState: TurtleState | null, command: DrawingCommand | null } {
	const distance: number = -values[0];
	return calculateForward(state, distance);
}

export function _RT(definition: CommandDef, values: any[], state: TurtleState): { newState: TurtleState | null, command: DrawingCommand | null } {
	const angle: number = values[0];
	return calculateRight(state, angle);
}

export function _LT(definition: CommandDef, values: any[], state: TurtleState): TurtleState | null  {
	const angle: number = -values[0];
	return calculateRight(state, angle);
}

/**
 * Calcola il nuovo stato della tartaruga dopo un comando AVANTI/FD.
 */
export function calculateForward(state: TurtleState, distance: number): { newState: TurtleState, command: DrawingCommand | null } {
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
export function calculateRight(state: TurtleState, angle: number): { newState: TurtleState, command: DrawingCommand | null } {
    const newHeading = (state.heading + angle) % 360;
//    return {
    const newState: TurtleState = { 
        ...state, 
        heading: newHeading < 0 ? newHeading + 360 : newHeading
    };
    return { newState, command: null };
}
