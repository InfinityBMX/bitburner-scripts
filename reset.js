import { outputResultsToFile, persistObject } from './utils/file-handling.js';
import { getPServRAM } from './utils.js';

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('getServerMaxRam');
	ns.tail();
	await outputResultsToFile(ns, 'reset-player-stats.json', ns.getPlayer);
	await persistObject(ns, { pservRAM: getPServRAM(ns) }, 'reset-server-ram.json');
	ns.installAugmentations('start.js');
}