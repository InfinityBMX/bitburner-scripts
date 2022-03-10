import {
    canStart,
	getPServRAM,
	getAvailableRAM
} from './utils.js';

const GENERIC_HACK = 'maximize.js';
const PSERV_HACK = 'setup-servers.js';
const PSERV_FREQUENCY = 15;
const MAX_INTERVAL = 300000;

/** @param {NS} ns **/
export async function main(ns) {
	let serverRAM = getPServRAM(ns)[0];
	let serversCanOwn = serverRAM > 256 && serverRAM <= 4096; // True if all servers are above 256 RAM
	let forceRefresh = false;
	let args = [!serversCanOwn, forceRefresh]; // Arg1 includes pservs in hack, Arg2 updates even if target hasn't changed
	let keepGoing = true;
	let lastPserv = 1 - PSERV_FREQUENCY; // Make sure we start trying at the beginning;
	let lastServer;
	let round = 1;
	while (keepGoing) {
		if (canStart(ns, GENERIC_HACK)) {
			ns.exec(GENERIC_HACK, 'home', 1, ...args);
			lastServer = round;
		}
		if (serversCanOwn && round > lastPserv + PSERV_FREQUENCY && canStart(ns, PSERV_HACK)) {
			ns.exec(PSERV_HACK, 'home', 1, true);
			lastPserv = round;
		}
		//if (getAvailableRAM(ns, 'home') < 64) {
		//	break;
		//}
		round++;
		await ns.sleep(Math.min(MAX_INTERVAL, round * 30000));
	}
	ns.tprint('Ending update-targets.js');
}