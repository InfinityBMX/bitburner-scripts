/** @param {NS} ns **/
import {
    canStart
} from './utils.js';

const GENERIC_HACK = 'maximize.js';
const PSERV_HACK = 'setup-servers.js';
const PSERV_FREQUENCTY = 15;

export async function main(ns) {
	let keepGoing = true;
	let lastPserv = 1 - PSERV_FREQUENCTY; // Make sure we start trying at the beginning;
	let lastServer = 1;
	let round = 1;
	while (keepGoing) {
		if (canStart(ns, GENERIC_HACK)) {
			ns.exec(GENERIC_HACK, 'home', 1);
			lastServer = round;
		}
		if ( round > lastPserv + PSERV_FREQUENCTY && canStart(ns, PSERV_HACK)) {
			ns.exec(PSERV_HACK, 'home', 1, true);
			lastPserv = round;
		}
		round++;
		await ns.sleep(60000);
	}
}