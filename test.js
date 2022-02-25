import { formatDuration } from './utils/formats.js';
/** @param {NS} ns **/
export async function main(ns) {
	ns.tail();
	let player = ns.getPlayer();
	ns.print(formatDuration(player.playtimeSinceLastBitnode));
}