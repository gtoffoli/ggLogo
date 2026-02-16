// TimeMusic.tsx
// 260216 - 1st version

import { CellType, Cell } from './CoreDefinitions';

var referenceTime: number = 0;

export function _TIME(): Cell {
  return { type: CellType.NUMBER, val: Date.now() - referenceTime };
}

export function _SETTIME(values: any[]): void {
  referenceTime = values[0].val;
}
