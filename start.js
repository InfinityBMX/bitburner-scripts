import { PHASE_THRESHOLD } from './config/config.js'
import { getFileContents } from './utils/file-handling.js';

//
//	Starts rooting script.
//	First Arg sets ram for pservs
//
const scripts = {
	HACK_SERVERS: { // 11.2GB
		name: 'hack-things-singularity.js',
		args: [],
		earlyPriority: 0,
		latePriority: 1
	},
	HACK_SERVERS_EARLY: { // 4.7GB 
		name: 'hack-things-early.js',
		args: [],
		earlyPriority: 1,
		latePriority: 0
	},
	PURCHASE_FILES: { // 6.2GB
		name: 'purchase-files.js',
		args: [],
		earlyPriority: 0,
		latePriority: 2
	},
	PURCHASE_SERVERS: { // 6.35GB
		name: 'purchase-servers.js',
		args: [],
		earlyPriority: 2,
		latePriority: 3
	},
	GANG_MANAGER: { // 29.7GB
		name: 'gang-manager.js',
		args: [],
		earlyPriority: 0,
		latePriority: 4
	},
	SLEEVE_MANAGER: { // 50.3GB
		name: 'sleeve-manager.js',
		args: [],
		earlyPriority: 4,
		latePriority: 5
	},
	TARGET_UPDATER: { // 5.4GB + 9.5GB Max + 13.05GB Orch = 27.95GB
		name: 'update-targets.js',
		args: [],
		earlyPriority: 5,
		latePriority: 6
	},
	RAM_MANAGER: { // 13.9GB
		name: 'ram-manager.js',
		args: [],
		earlyPriority: 0,
		latePriority: 7
	},
	RAM_MANAGER_EARLY: { // 6.25GB
		name: 'ram-manager-early.js',
		args: [],
		earlyPriority: 3,
		latePriority: 0
	},
	BLADEBURNER_MANAGER: { // 48.8GB
		name: 'bladeburner-manager.js',
		args: [],
		earlyPriority: 0,
		latePriority: 8
	}
};

const interval = 1000;
const retryInterval = 60000;

/** @param {NS} ns **/
export async function main(ns) {
	const latePhase = isLatePhase(ns);
	ns.tprint(`${latePhase ? 'Late Phase' : 'Early Phase'}`);
	let previousRAM;
	const ram = ns.args[0] ?
		ns.args[0] :
		(previousRAM = await getPreviousRAM(ns)) ?
			previousRAM.pservRAM[0] :
			2048;
	scripts.PURCHASE_SERVERS.args.push(ram);
	
	let scriptQueue = [
		'HACK_SERVERS',
		'HACK_SERVERS_EARLY',
		'PURCHASE_FILES',
		'PURCHASE_SERVERS',
		'GANG_MANAGER',
		'SLEEVE_MANAGER',
		'TARGET_UPDATER',
		'RAM_MANAGER',
		'RAM_MANAGER_EARLY',
		'BLADEBURNER_MANAGER'
	];

	scriptQueue = scriptQueue.filter(script => latePhase ? scripts[script].latePriority !== 0 : scripts[script].earlyPriority !== 0)
		.sort((script1, script2) => latePhase ? scripts[script1].latePriority - scripts[script2].latePriority : scripts[script1].earlyPriority - scripts[script2].earlyPriority);

	ns.tprint('Starting');
	while (scriptQueue.length > 0) {
		for (const script of scriptQueue){
			const { name, args } = scripts[script];
			if (canStart(ns, name)) {
				ns.tprint(`Firing up ${name}`);
				ns.exec(name, 'home', 1, ...args);
				scriptQueue = scriptQueue.filter(s => s !== script);
			} else {
				ns.tprint(`Can't start ${name}. Not enoug RAM.`);
			}
			await ns.sleep(interval);
		}
		await ns.sleep(retryInterval);
	}

	ns.tprint('All scripts started');
}

const getPreviousRAM = async (ns) => await getFileContents(ns, 'reset-server-ram.json');

const isLatePhase = (ns) => ns.getPlayer().playtimeSinceLastBitnode > PHASE_THRESHOLD.time && ns.getServerMaxRam('home') > PHASE_THRESHOLD.ram && false;

const canStart = (ns, scriptName) => ns.getScriptRam(scriptName) < getAvailableRAM(ns, ns.getHostname());