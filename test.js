import { formatDuration } from './utils/formats.js';
import { getFileContents } from './utils/file-handling.js';
/** @param {NS} ns **/
export async function main(ns) {
	ns.tail();
	let previous = await getFileContents(ns, 'reset-player-stats.json');
	let ram = await getFileContents(ns, 'reset-server-ram.json');
	if (previous) {
		ns.print(previous.hacking, previous.timestamp);
	} else {
		ns.print('Not found');
	}
	if (ram) {
		ns.print('Ram: ', ram.pservRAM[0]);
	}
	let previousRAM = await getPreviousRAM(ns);
	const rambo = ns.args[0] ?
		ns.args[0] :
		previousRAM = await getPreviousRAM(ns) ?
			previousRAM.pservRAM[0] :
			2048;
	ns.tprint(rambo)
}

const getPreviousRAM = async (ns) => {
	return await getFileContents(ns, 'reset-server-ram.json');
}