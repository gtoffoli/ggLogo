// LogoDevices.tsx
// 251214 - 1st version

import { CellType, Cell } from './CoreDefinitions';
import { contesti, liv_contesto } from './LogoControl';

export function _READER(values: any[]): Cell {
	var device = contesti[liv_contesto].dev_recupera;
	return { cellType: CellType.NUMBER, val: device};
}
