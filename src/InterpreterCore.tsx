// InterpreterCore.tsx
// 251025 first version as proposed by Gemini on 251024
// 251101 readded, after erroneous removal

import { CellType, Cell, CommandDef } from './CoreDefinitions';
import { GraphicWindowState, TurtleState, DrawingCommand } from './LogoState';
import { initialTurtleState } from './logoReducer';
import { keywordResolver, getByValue, colorResolver } from './UseLocalization';
import { throwError, function_key } from './Interpreter';
import { nodeToString } from './Parser';

const screenModes = ['OPEN', 'CLOSED', 'WRAP'];
var screenMode: string = 'WRAP';

export function _SCREENSIZE(values: any[]): Cell {
  return { type: CellType.LIST, val: [{ type: CellType.NUMBER, val: window.screen.width}, { type: CellType.NUMBER, val: window.screen.height}] }
}

export function _CANVASSIZE(values: any[], state: GraphicWindowState): Cell {
  const canvas = state.backgroundRef;
  const dx = parseInt(canvas.width);
  const dy = parseInt(canvas.height);
  console.log('_CANVASSIZE', canvas);
  return { type: CellType.LIST, val: [{ type: CellType.NUMBER, val: dx}, { type: CellType.NUMBER, val: dy}] }
}

export function _SCRUNCH(values: any[], state: GraphicWindowState): Cell {
  const xScale = state.scaling[0];
  const yScale = state.scaling[1];
  return { type: CellType.LIST, val: [{ type: CellType.NUMBER, val: xScale}, { type: CellType.NUMBER, val: yScale}] }
}
export function _SETSCRUNCH(values: any[], state: GraphicWindowState): GraphicWindowState {
  const scale = values[0].val.map((n: Cell) => n.val);
  return { 
    ...state, 
    scaling: scale
  };
}

export function _CS(values: any[], state: TurtleState): { newState: TurtleState | null, command: DrawingCommand | null } {
	console.log('function _CS');
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

export function _WINDOW(values: any[]): void {
  screenMode = 'OPEN';
}

export function _FENCE(values: any[]): void {
  screenMode = 'CLOSED';
}

export function _WRAP(values: any[]): void {
  screenMode = 'WRAP';
}

export function _SETSCREEN(values: any[]): void {
  const foundKey = keywordResolver(values[0].val);
  if ((foundKey) && (screenModes.includes(foundKey)))
    screenMode = foundKey;
  else
    throwError('e05', function_key, values[0].val);
}

export function _SCREEN(values: any[]): Cell {
  return { type: CellType.WORD, val: getByValue(screenMode)}
}

export function _FD(values: any[], state: TurtleState): TurtleState {
	const distance: number = values[0].val;
	console.log('function _FD', distance);
	return calculateForward(state, distance);
}

export function _BK(values: any[], state: TurtleState): TurtleState {
	const distance: number = -(values[0].val);
	return calculateForward(state, distance);
}

export function _RT(values: any[], state: TurtleState): TurtleState {
	const angle: number = values[0].val;
	console.log('function _RT', angle);
	return calculateRight(state, angle);
}

export function _LT(values: any[], state: TurtleState): TurtleState {
	const angle: number = -(values[0].val);
  console.log('function _LT', angle);
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
export function _PENDOWNP(values: any[], state: TurtleState): Cell {
  return { type: CellType.BOOLEAN, val: state.penDown }
}

export function _SETHEADING(values: any[], state: TurtleState): TurtleState {
  const heading = values[0].val;
  return { 
    ...state, 
    heading: heading
  };
}
export function _HEADING(values: any[], state: TurtleState): Cell {
  return { type: CellType.NUMBER, val: state.heading }
}

function rgbToHex(r: number, g: number, b: number): string {
  // Converte ogni componente in esadecimale e garantisce due cifre (padStart)
  const toHex = (c) => c.toString(16).padStart(2, '0');
  // Assicura che i valori siano numeri interi tra 0 e 255
  const red = Math.max(0, Math.min(255, Math.round(r)));
  const green = Math.max(0, Math.min(255, Math.round(g)));
  const blue = Math.max(0, Math.min(255, Math.round(b))); 
  // Combina i valori con il simbolo #
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}
export function checkFormatColor(arg: Cell, functionKey: string): string {
  if (arg.type === CellType.WORD)
    return { type: CellType.WORD, val: colorResolver(arg.val) }
  else if (arg.type === CellType.LIST) {
    var triple = arg.val.map((n: Cell) => n.val);
    if ((triple.length === 3) && (triple.every(num => (!isNaN(num)) && (num >= 0)))) {
      triple = triple.map((n) => parseFloat(n));
      return { type: CellType.WORD, val: rgbToHex(triple[0], triple[1], triple[2]) }
    }
  }
  throwError('e05', functionKey, nodeToString(arg, true));
}

export function _BACKGROUNDCOLOR(values: any[], state: GraphicWindowState): Cell {
  return { type: CellType.WORD, val: state.backgroundColor}
}
export function _SETBACKGROUNDCOLOR(values: any[], state: GraphicWindowState): GraphicWindowState {
  const color = values[0].val;
  return { 
    ...state, 
    backgroundColor: color
  };
}

export function _PENCOLOR(values: any[], state: TurtleState): Cell {
	return { type: CellType.WORD, val: state.penColor}
}
export function _SETPENCOLOR(values: any[], state: TurtleState): TurtleState | null {
	const color: string = values[0].val;
    return { 
      ...state, 
      penColor: color
    };
}

export function _PENSIZE(values: any[], state: TurtleState): Cell {
  const cell: Cell = { type: CellType.NUMBER, val: state.penSize};
  return { type: CellType.LIST, val: [cell, cell] }
}
export function _SETPENSIZE(values: any[], state: TurtleState): TurtleState | null {
  var arg: Cell = values[0];
  if (arg.type === CellType.LIST)
    arg = (arg.val)[0];
  const size: number = arg.val;
    return { 
      ...state, 
      penSize: size
    };
}

export function _PENMODE(values: any[], state: TurtleState): Cell {
  return { type: CellType.WORD, val: state.penMode}
}

export function _POS(values: any[], state: TurtleState): Cell {
  return { type: CellType.LIST, val: [{ type: CellType.NUMBER, val: state.x}, { type: CellType.NUMBER, val: -(state.y)}] }
}
export function _XCOR(values: any[], state: TurtleState): Cell {
  return { type: CellType.NUMBER, val: state.x }
}
export function _YCOR(values: any[], state: TurtleState): Cell {
  return { type: CellType.NUMBER, val: -(state.y) }
}

export function _SHOWTURTLE(values: any[], state: TurtleState): TurtleState {
  return { 
    ...state, 
    visible: true
  };
}
export function _HIDETURTLE(values: any[], state: TurtleState): TurtleState {
  return { 
    ...state, 
    visible: false
  };
}
export function _SHOWNP(values: any[], state: TurtleState): Cell {
  return { type: CellType.BOOLEAN, val: state.visible}
}

// from jslogo
const PRECISION = 10;
function precision(n) {
  var f = Math.pow(10, PRECISION);
  return Math.round(n * f) / f;
}

/**
 * Calcola il comando (LINE_TO o MOVE_TO) da inviare al canvas e il nuovo stato (pos) della tartaruga dopo un comando tipo FD o BK
 */
export function calculateForward(state: TurtleState, distance: number): any[] {
  const rad = state.heading * Math.PI / 180;
  const newX = precision(state.x + distance * Math.sin(rad));
  const newY = precision(state.y - distance * Math.cos(rad)); // LOGO usa Y decrescente verso l'alto
  
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
  const newState: TurtleState = { 
    ...state, 
    heading: newHeading < 0 ? newHeading + 360 : newHeading
  };
  return newState;
}
/*
export function calculateRight(state: TurtleState, angle: number): TurtleState {
  var newHeading = state.heading + angle;
  if (newHeading >= 0)
    newHeading = newHeading % 360;
  else
    while (newHeading < 0)
      newHeading = newHeading + 360; 
  var newState: TurtleState = { 
    ...state, 
    heading: newHeading
  };
  return newState;
}
*/