// Math.tsx
// 2511218 first version

import { CellType, Cell } from './CoreDefinitions';
import { throwError } from './Interpreter';
import { toLogoCell } from './Parser';

function numberp(cell: Cell): boolean {
  return ((cell.type === CellType.NUMBER) || ((cell.type === CellType.WORD) && (! isNaN(parseFloat(cell.val)))))
}
export function _NUMBERP(args: any[]): Cell {
  return { type: CellType.BOOLEAN, val: numberp(args[0]) };
}

export function _ABS(values: any[]): Cell {
  return { type: CellType.NUMBER, val: Math.abs(values[0].val) };
}

export function _INT(values: any[]): Cell {
  return { type: CellType.NUMBER, val: Math.trunc(values[0].val) };
}

export function _ROUND(values: any[]): Cell {
  return { type: CellType.NUMBER, val: Math.round(values[0].val) };
}

export function _SIGN(values: any[]): Cell {
	var sign = 0;
	if (values[0].val < 0) sign = -1;
	else if (values[0].val > 0) sign = 1;
	return { type: CellType.NUMBER, val: sign };
}
export function _MINUS(values: any[]): Cell {
	return { type: CellType.NUMBER, val: -values[0].val };
}

export function _SUM(values: any[]): Cell {
	var sum = 0;
	for (var i=0; i<values.length; i++)
		sum += values[i].val;
	return { type: CellType.NUMBER, val: sum };
}

export function _DIFFERENCE(values: any[]): Cell {
//	var difference = values[0].val - values[1].val;
  var difference = values[0].val;
  if (values.length === 1)
    difference = -difference; // meno unario
  else
    difference = difference - values[1].val; // meno ubiario
	return { type: CellType.NUMBER, val: difference };
}

export function _PRODUCT(values: any[]): Cell {
	var product = 1;
	for (var i=0; i<values.length; i++)
		product *= values[i].val;
	return { type: CellType.NUMBER, val: product };
}

export function _QUOTIENT(values: any[]): Cell {
	var quotient = values[0].val / values[1].val;
	return { type: CellType.NUMBER, val: quotient };
}

export function _POWER(values: any[]): Cell {
  const base = values[0].val;
  const exp = values[1].val;
  if (((base === 0) && (exp <= 0)) || ((base < 0) && (!Number.isInteger(exp))))
    throwError('e05', null, exp);
  return { type: CellType.NUMBER, val: Math.pow(base, exp) };
}
export function _EXP(values: any[]): Cell {
  return { type: CellType.NUMBER, val: Math.exp(values[0].val) };
}
export function _SQRT(values: any[]): Cell {
  const arg = values[0].val;
  if (arg < 0) throwError('e05', null, arg);
  return { type: CellType.NUMBER, val: Math.sqrt(arg) };
}

export function _LOG10(values: any[]): Cell {
  const arg = values[0].val;
  if (arg <= 0) throwError('e05', null, arg);
  return { type: CellType.NUMBER, val: Math.log10(arg) };
}
export function _LN(values: any[]): Cell {
  const arg = values[0].val;
  if (arg <= 0) throwError('e05', null, arg);
  return { type: CellType.NUMBER, val: Math.log(arg) };
}

export function _RAD(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: arg * Math.PI/180};
}
export function _RADSIN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.sin(arg) };
}
export function _RADCOS(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.cos(arg) };
}
export function _RADTAN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.tan(arg) };
}
export function _RADARCTAN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.atan(arg) };
}
export function _SIN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.sin(arg * Math.PI/180) };
}
export function _COS(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.cos(arg * Math.PI/180) };
}
export function _TAN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.tan(arg * Math.PI/180) };
}
export function _ARCTAN(values: any[]): Cell {
  const arg = values[0].val;
  return { type: CellType.NUMBER, val: Math.atan(arg * 180 / Math.PI) };
}

// come creare un array di interi in sequenza da M a N ?
export function _ISEQ(values: any[]): Cell {
  const start: number = values[0].val;
  const end: number = values[1].val;
  const sequence: number[] = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return toLogoCell(sequence);
}
// come creare un array di N numeri ugualmente distanziati comprendente 2 estremi ?
function linspace(start: number, end: number, n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [start];
  return Array.from({ length: n }, (_, i) => start + (end - start) * (i / (n - 1)));
}
export function _RSEQ(values: any[]): Cell {
  const start: number = values[0].val;
  const end: number = values[1].val;
  const n: number = values[2].val;
  return toLogoCell(linspace(start, end, n));
}

/* Mulberry32 è un generatore a 32 bit molto semplice ma con ottime proprietà statistiche,
   scritto originariamente da Tommy Ettinger. (from Claude Sonnet 4.6 */
class Mulberry32 {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed >>> 0; // conversione a unsigned 32-bit integer
  }
  next(): number {
    this.seed = (this.seed + 0x6d2b79f5) >>> 0;
    let z = this.seed;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    z = (z ^ (z >>> 14)) >>> 0;
    return z / 4294967296;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  reset(seed: number): void {
    this.seed = seed >>> 0;
  }
}
const fixedSeed = 42; // 20260203; // data odierna: non dovrebbe influire molto sulla bontà del generatore
const randomGenerator = new Mulberry32(fixedSeed);
export function _RANDOM(values: any[]): Cell {
  var random_0_1; // intermediate result in the range [0 1)
  var random: number; // final result
  // random_0_1 = Math.random();
  random_0_1 = randomGenerator.next();
  if (values.length === 1)
    random = Math.floor(random_0_1 * values[0].val);
  else if (values.length > 2)
    throwError('e11');
  else if ((values[1].val -  values[0].val) < 1)
    throwError('e05', null, values[1].val);
  else {
    const min = Math.floor(values[0].val);
    const max = Math.ceil(values[1].val);
    random = Math.floor(random_0_1 * (max - min)) + min;
  }
  return { type: CellType.NUMBER, val: random };
}
export function _RERANDOM(values: any[]): void {
  var seed: number;
  if (values.length === 1) seed = values[0].val;
  else seed = fixedSeed;
  randomGenerator.reset(seed);
}

export function _LESSP(values: any[]): Cell {
	var value = (values[0].val < values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}
export function _LESSEQUALP(values: any[]): Cell {
	var value = (values[0].val <= values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}

export function _GREATERP(values: any[]): Cell {
	var value = (values[0].val > values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}
export function _GREATEREQUALP(values: any[]): Cell {
	var value = (values[0].val >= values[1].val);
	return { type: CellType.BOOLEAN, val: value };
}

export function equalNumbers(n1: number, n2: number): boolean {
	return (n1 === n2) ? true : false;
}
export function unEqualNumbers(n1: number, n2: number): boolean {
	return (n1 === n2) ? false : true;
}
