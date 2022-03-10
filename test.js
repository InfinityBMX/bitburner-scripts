import { formatDuration } from './utils/formats.js';
/** @param {NS} ns **/
export async function main(ns) {
	const flagdata = ns.flags([
		["focus", "money"]
	]);
	ns.tail();
	ns.print(flagdata.focus);
}