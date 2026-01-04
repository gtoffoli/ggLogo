// InterpreterCore.tsx
// 251025 first version as proposed by Gemini on 251024
// 251101 readded, after erroneous removal

import { CellType, Cell, CommandDef } from './CoreDefinitions';
import { TurtleState, DrawingCommand } from './LogoState';
import { initialTurtleState } from './logoReducer';


export function _CS(values: any[], state: TurtleState): { newState: TurtleState | null, command: DrawingCommand | null } {
	console.log('function _CS');
    // return { newState: initialTurtleState, command: { type: 'CLEAR_CANVAS' }};
    return [ initialTurtleState, { type: 'CLEAR_CANVAS' }];
}

export function _HOME(values: any[], state: TurtleState): TurtleState {
    return { 
        ...state, 
        x: 0,
        y: 0,
        heading:0
    };
}

export function _FD(values: any[], state: TurtleState): TurtleState {
	// const distance: number = values[0];
	const distance: number = values[0].val;
	console.log('function _FD', distance);
	return calculateForward(state, distance);
}

export function _BK(values: any[], state: TurtleState): TurtleState {
	// const distance: number = -values[0];
	const distance: number = -(values[0].val);
	return calculateForward(state, distance);
}

export function _RT(values: any[], state: TurtleState): TurtleState {
	// const angle: number = values[0];
	const angle: number = values[0].val;
	console.log('function _RT', angle);
	return calculateRight(state, angle);
}

export function _LT(values: any[], state: TurtleState): TurtleState {
	// const angle: number = -values[0];
	const angle: number = -(values[0].val);
	return calculateRight(state, angle);
}

export function _PENUP(values: any[], state: TurtleState): TurtleState {
    return { 
        ...state, 
        penDown: false
    };
}

export function _PENDOWN(values: any[], state: TurtleState): TurtleState {
    return { 
        ...state, 
        penDown: true
    };
}

export function _PENCOLOR(values: any[], state: TurtleState): Cell | null {
	var color =  state.penColor;
	return { cellType: CellType.WORD, val: color}
}

export function _SETPENCOLOR(values: any[], state: TurtleState): TurtleState | null {
	// const color: string = values[0];
	const color: string = values[0].val;
    return { 
        ...state, 
        penColor: color
    };
}

/**
 * Calcola il nuovo stato della tartaruga dopo un comando AVANTI/FD.
 */
export function calculateForward(state: TurtleState, distance: number): any[] {
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
    
    return [ newState, drawingCommand ];
}

/**
 * Calcola il nuovo stato della tartaruga dopo un comando DESTRA/RT.
 */
export function calculateRight(state: TurtleState, angle: number): TurtleState {
    const newHeading = (state.heading + angle) % 360;
//    return {
    const newState: TurtleState = { 
        ...state, 
        heading: newHeading < 0 ? newHeading + 360 : newHeading
    };
    return newState;
}
