import { formatMoney, formatDuration } from './utils/formats.js';

const interval = 5000; // Update this often
const minTaskWorkTime = 59000; // Sleeves assigned a new task should stick to it for at least this many milliseconds
const tempFile = '/Temp/sleeve-set-task.txt';
const crimes = ['mug', 'homicide']
const works = ['security', 'field', 'hacking']; // When doing faction work, we prioritize physical work since sleeves tend towards having those stats be highest
const workByFaction = {}

// const MIN_STATS = 75;
// const PLAYER_MIN_STATS = 100;

const TASK_SYNC = 'Synchro';
const TASK_RECOVERY = 'Recovery';
const TASK_GYM = 'Gym';
const TASK_IDLE = 'Idle';
const TASK_CRIME = 'Crime';
const TASK_CLASS = 'Class';
const TASK_WORK = 'Company';
const TASK_FACTION = 'Faction';

let options;
const argsSchema = [
	['shock-recovery', 0.25], // Set to a number between 0 and 1 to devote that much time to shock recovery
	['crime', ''],
	['aug-budget', 0.5], // Spend up to this much of current cash on augs per tick (Default is high, because these are permanent for the rest of the BN)
	['buy-cooldown', 60 * 1000], // Must wait this may milliseconds before buying more augs for a sleeve
	['min-aug-batch', 20], // Must be able to afford at least this many augs before we pull the trigger (or fewer if buying all remaining augs)
];

/** @param {NS} ns **/
export async function main(ns) {
	const { sleeve } = ns;
	options = ns.flags(argsSchema);
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('sleep');

	if (!crimes.includes(options.crime)) crimes.push(options.crime);
	let task = [], lastUpdate = [], lastPurchase = [], availableAugs = [], lastReassign = [];

	// Collect info that won't change or that we can track ourselves going forward
    let numSleeves;
    try {
        numSleeves = sleeve.getNumSleeves();
    } catch {
        return ns.print("User does not appear to have access to sleeves. Exiting...");
    }
    for (let i = 0; i < numSleeves; i++)
        availableAugs[i] = null;

	while (true) {
		let cash = ns.getServerMoneyAvailable("home");
		let budget = cash * options['aug-budget'];
		let playerInfo = ns.getPlayer();
		for (let i = 0; i < numSleeves; i++) {
			let sleeveStats = sleeve.getSleeveStats(i);
			let { shock, sync } = sleeveStats;

			// Manage augs
			if (shock == 0 && availableAugs[i] == null) // No augs are available 
				availableAugs[i] = sleeve.getSleevePurchasableAugs(i).sort((a, b) => a.cost - b.cost);
			if (shock == 0 && availableAugs[i].length > 0) {
				const cooldownLeft = Math.max(0, options['buy-cooldown'] - (Date.now() - (lastPurchase[i] || 0)));
				const [batchCount, batchCost] = availableAugs[i].reduce(([n, c], aug) => c + aug.cost <= budget ? [n + 1, c + aug.cost] : [n, c], [0, 0]);
				const purchaseUpdate = `sleeve ${i} can afford ${batchCount.toFixed(0).padStart(2)}/${availableAugs[i].length.toFixed(0).padEnd(2)} remaining augs (cost ${formatMoney(batchCost)} of ` +
                    `${formatMoney(availableAugs[i].reduce((t, aug) => t + aug.cost, 0))}).`;
				if (lastUpdate[i] != purchaseUpdate)
                    log(ns, `INFO: With budget ${formatMoney(budget)}, ` + (lastUpdate[i] = purchaseUpdate) + ` (Min batch size: ${options['min-aug-batch']}, Cooldown: ${formatDuration(cooldownLeft)})`);
				if (cooldownLeft == 0 && batchCount > 0 && ((batchCount >= availableAugs[i].length - 1) || batchCount >= options['min-aug-batch'])) { // Don't require the last aug it's so much more expensive
                    let strAction = `Purchase ${batchCount} augmentations for sleeve ${i} at total cost of ${formatMoney(batchCost)}`;
                    let toPurchase = availableAugs[i].splice(0, batchCount);
                    budget -= batchCost;
                    if (toPurchase.map(a => a.name).reduce((s, aug) => s && sleeve.purchaseSleeveAug(i, aug), true))
                        log(ns, `SUCCESS: ${strAction}`, 'success');
                    else log(ns, `ERROR: Failed to ${strAction}`, 'error');
                    lastPurchase[i] = Date.now();
                }
			}

			// Manage the sleeve task
			let command, designatedTask, designatedTaskDesc;
			if (task[i] && task[i] !== sleeve.getTask(i).task) {
				if (sleeve.getTask(i).task !== TASK_IDLE) {
	 				// Manual Override
					task[i] = TASK_IDLE;
	 				continue;
	 			}
			}
			if (sync < 100) { // Synchronize
                designatedTask = TASK_SYNC;
				designatedTaskDesc = 'Synchronize';
				// Don't change tasks if we've changed tasks recently
            	if (Date.now() - (lastReassign[i] || 0) < minTaskWorkTime || task[i] == designatedTask) continue;
                command = sleeve.setToSynchronize(i);
                if (task[i] == designatedTask && Date.now() - (lastUpdate[i] ?? 0) > minTaskWorkTime) {
                    log(ns, `INFO: Sleeve ${i} is syncing... ${sync.toFixed(2)}%`);
                    lastUpdate[i] = Date.now();
                }
			} else if (shock > 0 && options['shock-recovery'] > 0 && Math.random() < options['shock-recovery']) { // Recover from shock
                designatedTask = TASK_RECOVERY;
				designatedTaskDesc = 'Recovery';
				// Don't change tasks if we've changed tasks recently
            	if (Date.now() - (lastReassign[i] || 0) < minTaskWorkTime || task[i] == designatedTask) continue;
                command = sleeve.setToShockRecovery(i);
                if (task[i] == designatedTask && Date.now() - (lastUpdate[i] ?? 0) > minTaskWorkTime) {
                    log(ns, `INFO: Sleeve ${i} is recovering from shock... ${shock.toFixed(2)}%`);
                    lastUpdate[i] = Date.now();
                }
            } else if (i == 0 && playerInfo.isWorking && playerInfo.workType == "Working for Faction") { // If player is currently working for faction rep, sleeves 0 shall help him out (only one sleeve can work for a faction)
                let work = works[workByFaction[playerInfo.currentWorkFactionName] || 0];
				designatedTask = TASK_FACTION;
                designatedTaskDesc = `work for faction '${playerInfo.currentWorkFactionName}' (${work})`;
				// Don't change tasks if we've changed tasks recently
            	if (Date.now() - (lastReassign[i] || 0) < minTaskWorkTime || task[i] == designatedTask) continue;
                command = sleeve.setToFactionWork(i, playerInfo.currentWorkFactionName, work);
            } else if (i == 0 && playerInfo.isWorking && playerInfo.workType == "Working for Company") { // If player is currently working for a company rep, sleeves 0 shall help him out (only one sleeve can work for a company)
                designatedTask = TASK_WORK
				designatedTaskDesc = `work for company '${playerInfo.companyName}'`;
				// Don't change tasks if we've changed tasks recently
            	if (Date.now() - (lastReassign[i] || 0) < minTaskWorkTime || task[i] == designatedTask) continue;
                command = sleeve.setToCompanyWork(i, playerInfo.companyName);
            } else { // Do something productive
                let crime = options.crime || (sleeveStats.strength < 100 ? 'mug' : 'homicide');
				designatedTask = TASK_CRIME;
                designatedTaskDesc = `commit ${crime}`;
				// Don't change tasks if we've changed tasks recently
            	if (Date.now() - (lastReassign[i] || 0) < minTaskWorkTime || task[i] == designatedTask) continue;
                command = sleeve.setToCommitCrime(i, crime);
            }
			
            // Start doing the specified task
            let strAction = `Set sleeve ${i} to ${designatedTask}`;
			if (command) {
                task[i] = designatedTask;
                lastReassign[i] = Date.now();
                log(ns, `SUCCESS: ${strAction}`);
            } else {
                // If working for faction / company, it's possible he current work isn't supported, so try the next one.
                if (designatedTaskDesc.startsWith('work for faction')) {
                    log(ns, `WARN: Failed to ${strAction} - work type may not be supported.`, 'warning');
                    workByFaction[playerInfo.currentWorkFactionName] = (workByFaction[playerInfo.currentWorkFactionName] || 0) + 1;
                } else
                    log(ns, `ERROR: Failed to ${strAction}`, 'error');
            }
		}
		await ns.sleep(interval);
	}	
	// const currentTasks = {};
	// let round = 1;
	// ns.disableLog('sleep');
	// while (true) {
	// 	const player = ns.getPlayer();
	// 	for (let i = 0; i < sleeve.getNumSleeves(); i++) {
	// 		const mySleeve = sleeve.getSleeveStats(i);
	// 		if (currentTasks[i] && currentTasks[i] !== sleeve.getTask(i).task) {
	// 			if (sleeve.getTask(i).task !== TASK_IDLE) {
	// 				// Manual Override
	// 				continue;
	// 			}
	// 		}

	// 		if (mySleeve.sync < 100) {
	// 			currentTasks[i] = TASK_SYNC;
	// 			sleeve.setToSynchronize(i);
	// 		} else if (mySleeve.shock > 10) {
	// 			currentTasks[i] = TASK_RECOVERY;
	// 			sleeve.setToShockRecovery(i);
	// 		} else if (mySleeve.strength < MIN_STATS || player.strength < PLAYER_MIN_STATS) {
	// 			currentTasks[i] = TASK_GYM;
	// 			sleeve.setToGymWorkout(i, 'powerhouse gym', 'strength');
	// 		} else if (mySleeve.defense < MIN_STATS || player.defense < PLAYER_MIN_STATS) {
	// 			currentTasks[i] = TASK_GYM;
	// 			sleeve.setToGymWorkout(i, 'powerhouse gym', 'defense');
	// 		} else if (mySleeve.dexterity < MIN_STATS || player.dexterity < PLAYER_MIN_STATS) {
	// 			currentTasks[i] = TASK_GYM;
	// 			sleeve.setToGymWorkout(i, 'powerhouse gym', 'dexterity');
	// 		} else if (mySleeve.agility < MIN_STATS || player.agility < PLAYER_MIN_STATS) {
	// 			currentTasks[i] = TASK_GYM;
	// 			sleeve.setToGymWorkout(i, 'powerhouse gym', 'agility');
	// 		} else {
	// 			currentTasks[i] = TASK_CRIME;
	// 			if (mySleeve.strength > 75)
	// 				sleeve.setToCommitCrime(i, 'homicide');
	// 			else
	// 				sleeve.setToCommitCrime(i, 'mug');
	// 		}
	// 		if (round % 10 === 0) {
	// 			const task = sleeve.getTask(i);
	// 			ns.print(`Round ${round} - Sync: ${mySleeve.sync.toFixed(4)} Shock: ${mySleeve.shock.toFixed(4)}` +
	// 				` Combat: ${mySleeve.strength} ${mySleeve.defense} ${mySleeve.dexterity} ${mySleeve.agility}` +
	// 				` Task: ${task.task}${task.gymStatType ? '-' + task.gymStatType : '' }`);
	// 		}
	// 	}
	// 	await ns.sleep(10000);
	// 	round++;
	// }
}

function log(ns, log, toastStyle, printToTerminal) {
    ns.print(log);
    if (toastStyle) ns.toast(log, toastStyle);
    if (printToTerminal) ns.tprint(log);
}