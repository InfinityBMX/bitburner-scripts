/** @param {NS} ns **/
import {
    canStart
} from './utils.js';
//
//	Starts rooting script.
//	First Arg sets ram for pservs
//

const HACK_SERVERS = 'hack-things-singularity.js';
const PURCHASE_FILES = 'purchase-files.js';
const PURCHASE_SERVERS = 'purchase-servers.js';
const MANAGE_GANG = 'manage-gang.js';
const MANAGE_SLEEVES = 'sleeve-manager';
const TARGET_UPDATER = 'update-targets.js';

export async function main(ns) {
	const ram = ns.args[0] ? ns.args[0] : 2048;
	ns.tprint('Starting');
	if (canStart(ns, HACK_SERVERS)) {
		ns.tprint('Firing up hack-things-singularity.js');
		ns.exec('hack-things-singularity.js', 'home', 1, 10);
		await ns.sleep(2000);
	}
	if (canStart(ns, PURCHASE_FILES)) {
		ns.tprint('Firing up purchase-files.js');
		ns.exec('purchase-files.js', 'home', 1);
		await ns.sleep(2000);
	}
	if (canStart(ns, PURCHASE_SERVERS)) {
		ns.tprint('Firing up purchase-servers.js');
		ns.exec('purchase-servers.js', 'home', 1, ram);
		await ns.sleep(2000);
	}
	if (canStart(ns, MANAGE_GANG)) {
		ns.tprint('Firing up manage-gang.js');
		ns.exec('manage-gang.js', 'home', 1);
		await ns.sleep(2000);
	}
	if (canStart(ns, MANAGE_SLEEVES)) {
		ns.tprint('Firing up sleeve-manager.js');
		ns.exec('sleeve-manager.js', 'home', 1);
	}
	if (canStart(ns, TARGET_UPDATER)) {
		ns.tprint('Firing up target-updater.js');
		ns.exec(TARGET_UPDATER, 'home', 1);
	}
}