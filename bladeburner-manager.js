import { formatDuration } from './utils/formats.js';

const SKILL_OVERCLOCK = 'Overclock';
const SKILLS_MAIN = [
	"Blade's Intuition",
	"Cloak",
	"Short-Circuit",
	"Digital Observer"
];
const TASK_TRAINING = {
	type: "general",
	name: "Training"
};
const TASK_FIELD_ANALYSIS = {
	type: "general",
	name: "Field Analysis"
};
const OPERATION_UNDERCOVER = {
	type: "operation",
	name: "Undercover Operation"
};
const OPERATION_INVESTIGATION = {
	type: "operation",
	name: "Investigation"
}
const OPERATION_STEALTH_RETIREMENT = {
	type: "operation",
	name: "Stealth Retirement Operation"
}
const CONTRACT_TRACKING = {
	type: "contract",
	name: "Tracking"
}

const SR_FREQUENCY = 15;
const trainChance = 0.15;
const attemptThreshold = 0.80;

/** @param {NS} ns **/
export async function main(ns) {
	const { bladeburner } = ns;
	ns.tail();
	ns.disableLog('ALL');
	bladeburner.getContractNames().forEach(contract => bladeburner.setActionAutolevel("contract", contract, true));
	bladeburner.getOperationNames().forEach(op => bladeburner.setActionAutolevel("operation", op, true));
	let capitalismSucks = true;
	let lastRun = {};
	let round = 1;
	while (capitalismSucks) {
		// Can we spend points?
		let points = bladeburner.getSkillPoints();
		const skills = [SKILL_OVERCLOCK, ...SKILLS_MAIN].map(skill => {
			return {
				name: skill,
				level: bladeburner.getSkillLevel(skill),
				cost: bladeburner.getSkillUpgradeCost(skill)
			}
		})
		skills.forEach(skill => {
			if (skill.name === SKILL_OVERCLOCK && skill.level >= 90) {
				return;
			}
			if (skill.cost <= points) {
				if (bladeburner.upgradeSkill(skill.name)) {
					ns.print(`${skill.name} upgraded to ${skill.level + 1} for ${skill.cost} points.`);
					points -= skill.cost;
				}
			}
		});

		const [currentStamina, maxStamina] = bladeburner.getStamina();
		let task;
		if (hasStaminaPenalty(currentStamina, maxStamina)) { // Stamina penalty
			// Do Field Analysis (75%) or Training (25%)
			ns.print('Not enough Stamina for contracts or operations.');
			task = Math.random() < trainChance ? TASK_TRAINING : TASK_FIELD_ANALYSIS;
		} else { // No stamina penalty
			let blackOp = bladeburner.getBlackOpNames().find(name => canDoBlackOp(ns, name));
			if (blackOp) { // If next black op is 100%, do it
				task = { type: "blackop", name: blackOp }
			} else if (canDoTask(ns, OPERATION_STEALTH_RETIREMENT) &&
				round > SR_FREQUENCY + (lastRun[OPERATION_STEALTH_RETIREMENT.name] || 0)) {
				task = OPERATION_STEALTH_RETIREMENT;
			} else if (canDoTask(ns, OPERATION_UNDERCOVER)) { // otherwise if operation undercover has uses and 100% chance, do it
				task = OPERATION_UNDERCOVER;
			} else if (canDoTask(ns, OPERATION_INVESTIGATION)) { // otherwise if operation investigation has uses and 100% chance, do it
				task = OPERATION_INVESTIGATION;
			} else if (canDoTask(ns, CONTRACT_TRACKING)) {
				task = CONTRACT_TRACKING;
			} else {
				task = Math.random() < trainChance ? TASK_TRAINING : TASK_FIELD_ANALYSIS;
			}
		}
		const taskTime = bladeburner.getActionTime(task.type, task.name);
		ns.print(`Doing ${task.name} for ${formatDuration(taskTime)}`);
		bladeburner.startAction(task.type, task.name);
		lastRun[task.name] = round;
		await ns.sleep(taskTime);
		round++;
	}
}

const canDoTask = (ns, task) => ns.bladeburner.getActionCountRemaining(task.type, task.name) > 0 && ns.bladeburner.getActionEstimatedSuccessChance(task.type, task.name)[0] > attemptThreshold;

const canDoBlackOp = (ns, name) => {
	return ns.bladeburner.getActionCountRemaining("blackop", name) > 0
		&& ns.bladeburner.getActionEstimatedSuccessChance("blackop", name)[0] > attemptThreshold
		&& ns.bladeburner.getBlackOpRank(name) < ns.bladeburner.getRank();
}

const hasStaminaPenalty = (current, max) => (current / max) < 0.5;