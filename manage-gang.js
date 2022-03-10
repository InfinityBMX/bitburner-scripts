const TASK_TRAIN = 'Train Combat';
const TASK_WANTED = 'Vigilante Justice';
const TASK_NOOB = 'Mug People';
const TASK_RESPECT = 'Terrorism';
const TASK_MONEY = 'Human Trafficking';
const TASK_WARFARE = 'Territory Warfare';
const TASK_IDLE = 'Unassigned';
const TASK_MANUAL = 'Manual Task';

const STATS_MIN = 3000;
const STATS_HARD_MIN = 200;
const STATS_THRESHOLD = 0.7;
const TRAIN_CHANCE = 0.2;
const RESPECT_MIN = 2e+6;

// Minimum total multiplier to ascend
const ASCEND_THRESHOLD = 10;

// Maximum percentage of current money to spend on equipment
const EQUIP_COST_THRESHOLD = 0.01;

const MEMBERS_MIN = 6;
const MEMBERS_MAX = 12;

const WANTED_PENALTY_THRESHOLD = 0.999;
const WARFARE_TRESHOLD = 2;

const SLEEP_TIME = 10000;

/** @param {NS} ns **/
export async function main(ns) {
	const gang = ns.gang;

	while (!gang.inGang()) {
		if (ns.heart.break() < -54000 && ns.getPlayer().factions.includes('Tetrads')) {
			gang.createGang('Tetrads');
		} else {
			await ns.sleep(SLEEP_TIME);
		}
	}

	const autoTasks = {}; // Store info about automated tasks
	let defaultTask = null;
	if (ns.args[0] && gang.getTaskNames().includes(ns.args[0])) {
		defaultTask = ns.args[0];
	}

	// Get sum of combat stats
	const getStatsForMember = (member) => {
		const info = gang.getMemberInformation(member);
		return info.str + info.def + info.dex + info.agi;
	}

	// Pass gang info object to receive the biggest threat
	const getMaxEnemyPower = (gangInfo) => {
		const others = gang.getOtherGangInformation();
		let maxPower = 0;
		for (let name in others) {
			if (name === gangInfo.faction) continue;
			maxPower = Math.max(maxPower, others[name].power);
		}
		return maxPower;
	}

	// Set the member to a task
	const setTask = (member, task) => {
		const info = gang.getMemberInformation(member);
		const lastTask = info.task;
		// If we manually set a task, don't override it.
		if (lastTask !== TASK_IDLE && autoTasks.hasOwnProperty(member) && autoTasks[member] !== lastTask) {
			autoTasks[member] = TASK_MANUAL;
			return;
		}
		// Otherwise make sure member is doing it
		autoTasks[member] = task;
		if (lastTask !== task) {
			gang.setMemberTask(member, task);
		}
	}

	const getNewMemberName = (currentNames) => {
		const staticNames = ['jeff', 'tanya', 'annabelle', 'madelyn', 'lexie', 'kimen', 'froderick', 'blingon']
		const names = [...staticNames, ...[...(Array(12 - staticNames.length))].map((_, i) => `Minion-${++i}`)];
		for (const name of names) {
			if (!currentNames.includes(name))
				return name;
		}
		return 'FoundaBug';
	}

	while (!ns.gang.inGang()) {
		let jump = false;
		if (ns.heart.break() < -54000)
			jump = ns.gang.createGang('Tetrads');
		if (!jump)
			await ns.sleep(5000);
		else
			ns.tprint('Gang founded!');
	}

	ns.kill('crime-it-up.js', 'home');

	// Main loop
	let keepGoing = true;
	while (keepGoing) {
		// Recruit
		while (gang.canRecruitMember()) {
			gang.recruitMember(getNewMemberName(gang.getMemberNames()));
		}

		let bestStats = STATS_MIN;
		const members = gang.getMemberNames();
		const noobMode = members.length < MEMBERS_MIN;
		const info = gang.getGangInformation();
		// Ascend if good enough
		for (const member of members) {
			const ascendResult = gang.getAscensionResult(member);
			if (!ascendResult) continue; // Can't ascend
			const multiplier = ascendResult.agi * ascendResult.def * ascendResult.dex * ascendResult.str;
			if (multiplier > ASCEND_THRESHOLD) {
				gang.ascendMember(member);
				ns.tprint(`Member ${member} ascended!`);
			}
		}

		// Buy equipment
		const allEquip = gang.getEquipmentNames();
		let money = ns.getServerMoneyAvailable('home');
		for (let equip of allEquip) {
			const cost = gang.getEquipmentCost(equip);
			const burden = cost/money;
			// If it costs too much, skip it
			if (burden > EQUIP_COST_THRESHOLD) continue;
			for (let member of members) {
				const info = gang.getMemberInformation(member);
				// If we already have it, skip it
				if (info.upgrades.includes(equip) || info.augmentations.includes(equip)) continue;
				if (gang.purchaseEquipment(member, equip)) { money -= cost; }  
			}
		}

		// Find best stats
		for (let member of members) {
			let sum = getStatsForMember(member);
			if (sum > bestStats)
				bestStats = sum;
		}

		// Check for warfare
		let powerfulEnough = info.power >= getMaxEnemyPower(info) * WARFARE_TRESHOLD;
		//ns.tprint(`P:${powerfulEnough} Me: ${info.power} E: ${getMaxEnemyPower(info)}`);
		gang.setTerritoryWarfare(powerfulEnough);

		// Choose task
		let task = defaultTask;
		if (!defaultTask) {
			// If gang isn't full, gain respect to recruit
			if (members.length < MEMBERS_MAX) {
				// If gang is small, mugging is enough
				task = noobMode ? TASK_NOOB : TASK_RESPECT;
			} else {
				if (info.respect < RESPECT_MIN) {
					task = TASK_RESPECT;
				} else if (!powerfulEnough) {
					task = TASK_WARFARE;
				} else {
					task = TASK_MONEY;
				}
			}

		}

		for (const member of members) {
			let sum = getStatsForMember(member);
			// Train members, not acceptable in 'noob mode'
			if (sum < STATS_HARD_MIN || (!noobMode && sum < bestStats * STATS_THRESHOLD)) {
				setTask(member, TASK_TRAIN); 
				continue;
			}
			// Vigilante Justice if wanted penalty too large 
			if (info.wantedLevel > 2 && info.wantedPenalty < WANTED_PENALTY_THRESHOLD) {
				setTask(member, TASK_WANTED);
				continue;
			}
			// Do the default task (autoselected or called with args[0])
			setTask(member, Math.random() < TRAIN_CHANCE ? TASK_TRAIN : task);
		}

		await ns.sleep(SLEEP_TIME);
	}
}