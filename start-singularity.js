/** @param {NS} ns **/
import {
	canStart
} from './utils.js';
//
//	Starts rooting script.
//	First Arg sets ram for pservs
//

const scripts = {
	HACK_SERVERS: {
		name: 'hack-things-singularity.js',
		args: []
	},
	PURCHASE_FILES: {
		name: 'purchase-files.js',
		args: []
	},
	PURCHASE_SERVERS: {
		name: 'purchase-servers.js',
		args: []
	},
	GANG_MANAGER: {
		name: 'gang-manager.js',
		args: []
	},
	SLEEVE_MANAGER: {
		name: 'sleeve-manager.js',
		args: []
	},
	TARGET_UPDATER: {
		name: 'update-targets.js',
		args: []
	},
	RAM_MANAGER: {
		name: 'ram-manager.js',
		args: []
	}
}

const interval = 1000;
const retryInterval = 60000;

export async function main(ns) {
	const ram = ns.args[0] ? ns.args[0] : 2048;
	scripts.PURCHASE_SERVERS.args.push(ram);
	
	let scriptQueue = [
		'HACK_SERVERS',
		'PURCHASE_SERVERS',
		'RAM_MANAGER',
		'PURCHASE_FILES',
		'GANG_MANAGER',
		'SLEEVE_MANAGER',
		'TARGET_UPDATER'
	]

	ns.tprint('Starting');
	while (scriptQueue.length > 0) {
		for (const script of scriptQueue){
			const { name, args } = scripts[script];
			if (canStart(ns, name)) {
				ns.tprint(`Firing up ${name}`);
				ns.exec(name, 'home', 1, ...args);
				scriptQueue.filter(s => s !== script);
			} else {
				ns.tprint(`Can't start ${name}. Not enoug RAM.`);
			}
			await ns.sleep(interval);
		}
		await ns.sleep(retryInterval);
	}

	ns.tprint('All scripts started');
}