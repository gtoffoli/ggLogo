// TurtleGraphics.tsx (was InterpreterCore.tsx)
// 251025 first version as proposed by Gemini on 251024

import { CellType, Cell, CommandDef } from './CoreDefinitions';
import { GraphicWindowState, TurtleState, DrawingCommand } from './LogoState';
import { initialTurtleState } from './logoReducer';
import { keywordResolver, getByValue, colorResolver } from './UseLocalization';
import { throwError } from './Interpreter';
import { toLogoCell, nodeToString } from './Parser';

const screenModes = ['OPEN', 'CLOSED', 'WRAP'];
var screenMode: string = 'CLOSED'; // 'WRAP';

type Point = { x: number; y: number; }
type Bounds = { xMin: number; xMax: number; yMin: number; yMax: number; }
type Segment = { s: Point, e: Point }

var canvasBounds: Bounds = {xMin: -400, xMax: 400, yMin: -400, yMax: 400};  
var activePath: Point[] = []; // serve per il comando FILL; viene resettato da FILLSTART e FILL

export function _SCREENSIZE(values: any[]): Cell {
  return { type: CellType.LIST, val: [{ type: CellType.NUMBER, val: window.screen.width}, { type: CellType.NUMBER, val: window.screen.height}] }
}

function setCanvasSize(dx: number, dy: number, state: GraphicWindowState): GraphicWindowState {
  return state;
} 

function setCanvasOrigin(x: number, y: number, state: GraphicWindowState): GraphicWindowState {
  return state;
} 

export function _CANVASSIZE(values: any[], state: GraphicWindowState): Cell {
  const size = state.canvasSize;
  const dx = size[0];
  const dy = size[1];
  return { type: CellType.LIST, val: [{ type: CellType.NUMBER, val: dx}, { type: CellType.NUMBER, val: dy}] }
}
export function _SETCANVASSIZE(values: any[], state: GraphicWindowState): any[] {
  const size = values[0].val.map((n: Cell) => n.val);
  canvasBounds = {xMin: -size[0]/2, xMax: size[0]/2, yMin: -size[1]/2, yMax: size[1]/2};
  const newState = { 
    ...state, 
    canvasSize: size
  }
  return [ newState, { type: 'CLEAR_CANVAS' }];
}

export function _BOUNDS (values: any[]): Cell {
  return { type: CellType.LIST,
           val: [{ type: CellType.NUMBER, val: canvasBounds.xMin }, { type: CellType.NUMBER, val: canvasBounds.xMax },
                 { type: CellType.NUMBER, val: canvasBounds.yMin }, { type: CellType.NUMBER, val: canvasBounds.yMax }] }
}

export function _SCALE(values: any[], state: GraphicWindowState): Cell {
  const xScale = (state.scaling) ? state.scaling[0] : 1;
  const yScale = (state.scaling) ? state.scaling[1] : 1;
  return { type: CellType.LIST, val: [{ type: CellType.NUMBER, val: xScale}, { type: CellType.NUMBER, val: yScale}] }
}
export function _SETSCALE(values: any[], state: GraphicWindowState): GraphicWindowState {
  var scale = values[0].val.map((c: Cell) => parseInt(c.val));
  if ((scale[0] === 1) && (scale[1] === 1))
    scale = null;
  const newState = {
    ...state, 
    scaling: scale
  };
  return [newState, undefined];
}

export function _HOME(values: any[], state: TurtleState): TurtleState {
  return { 
    ...state, 
    x: 0,
    y: 0,
    heading:0
  };
}

export function _CLEAR(values: any[], state: TurtleState): { newState: TurtleState | null, commands: DrawingCommand[] } {
  return [ state, [{ type: 'CLEAR_CANVAS' }] ];
}
export function _CS(values: any[], state: TurtleState): { newState: TurtleState | null, commands: DrawingCommand[] } {
  return [ initialTurtleState, [{ type: 'CLEAR_CANVAS' }] ];
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

export function _SETTURTLEMODE(values: any[]): void {
  const foundKey = keywordResolver(values[0].val);
  if ((foundKey) && (screenModes.includes(foundKey)))
    screenMode = foundKey;
  else
    throwError('e05', null, values[0].val);
}
export function _TURTLEMODE(values: any[]): Cell {
  return { type: CellType.WORD, val: getByValue(screenMode)}
}

export function _TOWARDS(values: any[], state: TurtleState): Cell {
  const p1 = { x: state.x, y: state.y};
  const p2 = { x: values[0].val[0].val, y: values[0].val[1].val};
  // perché non funziona?
  // if ((Math.round(p2.x) === Math.round(p1.x)) && (Math.round(p2.y) === Math.round(p1.y)))
  if ((p2.x === p1.x) && (p2.y === p1.y))
    throwError('e05', null, nodeToString(values[0], true));
  return { type: CellType.NUMBER, val: calculateHeading(p1, p2) };
}

export function _SETPOS(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const xy: Cell[] = values[0].val;
  const p: Point = { x: xy[0].val, y: xy[1].val };
  return setNewPos(state, p);
}
export function _SETXY(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const p: Point = { x: values[0].val, y: values[1].val };
  return setNewPos(state, p);
}
export function _SETX(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const p: Point = { x: values[0].val, y: state.y };
  return setNewPos(state, p);
}
export function _SETY(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const p: Point = { x: state.x, y: values[0].val };
  return setNewPos(state, p);
}

export function _FD(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
	const distance: number = values[0].val;
	return calculateForward(state, distance);
}
export function _BK(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
	const distance: number = -(values[0].val);
	return calculateForward(state, distance);
}
// similar to jslogo LABEL and Terrapin Logo TURTLETEXT
export function _LABEL(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const text: string = nodeToString(values[0], false);
  var modes: any[] = [];
  if (values.length > 1)
    modes = values[1].val;
  return calculateLabel(state, text, modes);
}

export function _RT(values: any[], state: TurtleState): TurtleState {
	const angle: number = values[0].val;
	return calculateRight(state, angle);
}
export function _LT(values: any[], state: TurtleState): TurtleState {
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
  var drawingCommand;
  const newState = { 
    ...state, 
    backgroundColor: color
  };
  return [ newState, drawingCommand ];
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

export function _SETFONT(values: any[], state: TurtleState): TurtleState | null {
  var fontFamily: string;
  var fontHeight: number = 20;
  var labelMode: string = 'top';
  if (values[0].type === CellType.LIST) {
    const fontList = values[0].val;
    fontFamily = fontList[0].val;
    if (fontList.length > 1) {
      fontHeight = parseInt(fontList[1].val);
      if (fontList.length > 2)
        labelMode = fontList[2].val;
    }
  }
  else {
    fontFamily = values[0].val;
    if (values.length > 1) {
      fontHeight = parseInt(values[1].val);
      if (values.length > 2)
        labelMode = values[2].val;
    }
  }
  const newState: TurtleState = { 
    ...state,
    labelFont: fontFamily,
    labelHeight: fontHeight,
    labelMode: labelMode
  };
  return newState; 
}
export function _FONT(values: any[], state: TurtleState): Cell {
  const font: any[] = [state.labelFont, state.labelHeight, state.labelMode];
  return toLogoCell(font);
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
function precision(n: number) {
  var f = Math.pow(10, PRECISION);
  return Math.round(n * f) / f;
}

function calculateHeading (p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  var rad: number;
  if (dx === 0)
    rad = (dy < 0) ? 180: 0;
  else {
    rad = 90 - Math.atan2(dy, dx) * 180/Math.PI;
    if (rad < 0)
      rad += 360;
  }
  return rad;
}

/* Google AI Overview:
  Clamping and clipping in computer graphics both manage data outside defined boundaries but differ fundamentally:
  clamping forces values to the nearest edge (restricting range);
  clipping removes or cuts off geometry/pixels outside a viewing area or volume. */
function clampSegment(p1: Point, p2: Point, bounds: Bounds): Point {
  const { xMin, xMax, yMin, yMax } = bounds;
  var t;
  var xHit;
  var yHit;
  var hitPoint
  if (p2.x > xMax) { // Se p2 è fuori a destra
    t = (xMax - p1.x) / (p2.x - p1.x);
    yHit = p1.y + t * (p2.y - p1.y);
    p2 = { x: xMax, y: yHit }; // hitPoint
  }
  else if (p2.y > yMax) { // Se p2 è fuori in basso
    t = (yMax - p1.y) / (p2.y - p1.y);
    xHit = p1.x + t * (p2.x - p1.x);
    p2 = { x: xHit, y: yMax }; // hitPoint
  }
  else if (p2.x < xMin) { // Se p2 è fuori a sinistra
    t = (p1.x - xMin) / (p2.x - p1.x);
    yHit = p1.y - t * (p2.y - p1.y);
    p2 = { x: xMin, y: yHit }; // hitPoint
  }
  else if (p2.y < yMin) { // Se p2 è fuori in alto
    t = (p1.y - yMin) / (p2.y - p1.y);
    xHit = p1.x - t * (p2.x - p1.x);
    p2 = { x: xHit, y: yMin }; // hitPoint
  }
  return p2;
}

function calculateWrapSegments(p1: Point, p2: Point, bounds: Bounds): {s: Point, e: Point}[] {
  const { xMin, xMax, yMin, yMax } = bounds;
  const width = xMax - xMin;
  const height = yMax - yMin;
  // Se il punto d'arrivo è dentro i bordi, restituiamo il segmento unico
  if (p2.x >= xMin && p2.x <= xMax && p2.y >= yMin && p2.y <= yMax) {
    return [{ s: p1, e: p2 }];
  }

  // Troviamo quale bordo viene colpito per primo
  let t = 1;
  let edge: 'L' | 'R' | 'T' | 'B' | null = null;

  if (p2.x > xMax) { t = (xMax - p1.x) / (p2.x - p1.x); edge = 'R'; }
  else if (p2.x < xMin) { t = (xMin - p1.x) / (p2.x - p1.x); edge = 'L'; }
  
  // Verifichiamo se colpisce prima un bordo verticale o orizzontale
  let ty = 1;
  if (p2.y > yMax) ty = (yMax - p1.y) / (p2.y - p1.y);
  else if (p2.y < yMin) ty = (yMin - p1.y) / (p2.y - p1.y);

  if (ty < t) { t = ty; edge = p2.y > yMax ? 'T' : 'B'; }

  // Punto di collisione sul bordo
  const hit = {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y)
  };

  // Punto di rientro dal lato opposto
  const reEntry = { ...hit };
  if (edge === 'R') reEntry.x = xMin;
  else if (edge === 'L') reEntry.x = xMax;
  else if (edge === 'T') reEntry.y = yMin;
  else if (edge === 'B') reEntry.y = yMax;

  // Calcoliamo la parte rimanente del movimento
  const remainingP2 = {
    x: reEntry.x + (p2.x - hit.x),
    y: reEntry.y + (p2.y - hit.y)
  };

  // Ricorsione: il pezzo rimanente potrebbe colpire un altro bordo
  return [
    { s: p1, e: hit },
    ...calculateWrapSegments(reEntry, remainingP2, bounds)
  ];
}

function pointsEqual(p1: Point, p2: Point): boolean {
  return ((p1.x == p2.x) && (p1.y == p2.y))
}

// ora è usata anche da calculateForward, che precedentemente era autonoma
function setNewPos(state: TurtleState, p: Point): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  var p1: Point = {x: state.x, y: state.y};
  var p2: Point = {x: p.x, y: -p.y};  // LOGO usa Y decrescente verso l'alto
  var segments: Segment[];
  var newState: TurtleState;
  var drawingCommands: DrawingCommand[];

  if (screenMode === 'WRAP') {
    segments = calculateWrapSegments(p1, p2, canvasBounds);
    p2 = segments[segments.length-1].e;
  }
  else {
    if (screenMode === 'CLOSED')
      p2 = clampSegment(p1, p2, canvasBounds);
    segments = [{s: p1, e: p2}];
  }
  var drawingCommand: DrawingCommand;
  drawingCommands = [];
  for (var i=0; i < segments.length; i++) {
    const segment: Segment = segments[i];
    const { s, e } = segment;
    if ((i > 0) && (!pointsEqual(s, segments[i-1].e))) {
      drawingCommands.push({ type: 'MOVE_TO', x: s.x, y: s.y });
    }
    if (state.penDown) {
       drawingCommand = {
        type: 'LINE_TO',
        x: e.x, 
        y: e.y,
        color: state.penColor,
        thickness: state.penSize
      };
    } else {
      drawingCommand = {
        type: 'MOVE_TO',
        x: e.x, 
        y: e.y 
      };
    }
    drawingCommands.push(drawingCommand);
  }
  newState = {
    ...state, 
    x: p2.x, 
    y: p2.y 
  };
  if ((activePath) && (screenMode === 'CLOSED'))
    activePath.push(p2);
  return [ newState, drawingCommands ];
}

/**
 * Calcola il comando (LINE_TO o MOVE_TO) da inviare al canvas e il nuovo stato (pos) della tartaruga dopo un comando tipo FD o BK
 */
function calculateForward(state: TurtleState, distance: number): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const rad = state.heading * Math.PI / 180;
  var newX = precision(state.x + distance * Math.sin(rad));
  // var newY = precision(state.y - distance * Math.cos(rad)); // LOGO usa Y decrescente verso l'alto
  var newY = - precision(state.y - distance * Math.cos(rad)); // LOGO usa Y decrescente verso l'alto

  return setNewPos(state, { x: newX, y: newY });
}

/**
 * Calcola il comando (...) da inviare al canvas a fronte di un comando LABEL
 * FARE IL PARSE DELL'ARGOMENTO OPZIONALE modes CHE PUO' MODIFICARE heading E font !!!
 */
function calculateLabel(state: TurtleState, text: string, modes: any[]): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const newState: TurtleState = state;
  var drawingCommands: DrawingCommand[] = [];
  const font: string = state.labelHeight.toString() + 'px ' + state.labelFont;
  const drawingCommand: DrawingCommand = {
    type: 'LABEL',
    text: text,
    x: state.x,
    y: state.y,
    heading: ((state.heading-90) % 360) * Math.PI/180,
    font: font,
    color: state.penColor // Segue il colore della penna
  };
  drawingCommands.push(drawingCommand);
  return [ newState, drawingCommands ];
}

/**
 * Calcola il nuovo stato della tartaruga dopo un comando DESTRA/RT.
 */
function calculateRight(state: TurtleState, angle: number): TurtleState {
  const newHeading = (state.heading + angle) % 360;
  const newState: TurtleState = { 
    ...state, 
    heading: newHeading < 0 ? newHeading + 360 : newHeading
  };
  return newState;
}

export function resetActivePath() {
  activePath = [];
}
export function _FILLSTART(values: any[], state: TurtleState): TurtleState {
  if (screenMode === 'CLOSED')
    activePath = [{ x: state.x, y: state.y }]
  return state;
}
export function _FILL(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const color = values[0].val;
  var drawingCommand: DrawingCommand;
  var drawingCommands: DrawingCommand[];
  if (activePath.length >= 3) {
    drawingCommand = { type: 'POLYGON', fillColor: color, path: activePath };
    drawingCommands = [drawingCommand];
  }
  resetActivePath();
  return [ state, drawingCommands ];
}

export function calculateArc(state: TurtleState, angle: number, radius: number): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  var endAngle = ((state.heading-90+angle) % 360) * Math.PI/180;
  var drawingCommand: DrawingCommand;
  var drawingCommands: DrawingCommand[];
  drawingCommand = { type: 'ARC', x: state.x, y: state.y, radius: radius, startAngle: (state.heading-90) * Math.PI/180, endAngle: endAngle, color: state.penColor, fillColor: null };
  drawingCommands = [drawingCommand];
  return [ state, drawingCommands ];
}
export function _ARC(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const angle = values[0].val;
  if ((angle < 0) || (angle > 360)) throwError('e05', null, nodeToString(values[0], false));
  const radius = values[1].val;
  return calculateArc(state, angle, radius);
}
export function _CIRCLE(values: any[], state: TurtleState): [ newState: TurtleState, drawingCommands: DrawingCommand[] ] {
  const radius = values[0].val;
  return calculateArc(state, 360, radius);
}
