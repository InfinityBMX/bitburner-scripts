/** @param {NS} ns **/
export async function main(ns) {
	const { sleeve } = ns;

	const MIN_STATS = 75;
	const PLAYER_MIN_STATS = 100;

	const TASK_SYNC = 'Synchro';
	const TASK_RECOVERY = 'Recovery';
	const TASK_GYM = 'Gym';
	const TASK_IDLE = 'Idle';
	const TASK_CRIME = 'Crime';

	const currentTasks = {};
	let round = 1;
	ns.disableLog('sleep');
	while (true) {
		const player = ns.getPlayer();
		for (let i = 0; i < sleeve.getNumSleeves(); i++) {
			const mySleeve = sleeve.getSleeveStats(i);
			if (currentTasks[i] && currentTasks[i] !== sleeve.getTask(i).task) {
				if (sleeve.getTask(i).task !== TASK_IDLE) {
					// Manual Override
					continue;
				}
			}

			if (mySleeve.sync < 100) {
				currentTasks[i] = TASK_SYNC;
				sleeve.setToSynchronize(i);
			} else if (mySleeve.shock > 10) {
				currentTasks[i] = TASK_RECOVERY;
				sleeve.setToShockRecovery(i);
			} else if (mySleeve.strength < MIN_STATS || player.strength < PLAYER_MIN_STATS) {
				currentTasks[i] = TASK_GYM;
				sleeve.setToGymWorkout(i, 'powerhouse gym', 'strength');
			} else if (mySleeve.defense < MIN_STATS || player.defense < PLAYER_MIN_STATS) {
				currentTasks[i] = TASK_GYM;
				sleeve.setToGymWorkout(i, 'powerhouse gym', 'defense');
			} else if (mySleeve.dexterity < MIN_STATS || player.dexterity < PLAYER_MIN_STATS) {
				currentTasks[i] = TASK_GYM;
				sleeve.setToGymWorkout(i, 'powerhouse gym', 'dexterity');
			} else if (mySleeve.agility < MIN_STATS || player.agility < PLAYER_MIN_STATS) {
				currentTasks[i] = TASK_GYM;
				sleeve.setToGymWorkout(i, 'powerhouse gym', 'agility');
			} else {
				currentTasks[i] = TASK_CRIME;
				if (mySleeve.strength > 75)
					sleeve.setToCommitCrime(i, 'homicide');
				else
					sleeve.setToCommitCrime(i, 'mug');
			}
			if (round % 10 === 0) {
				const task = sleeve.getTask(i);
				ns.print(`Round ${round} - Sync: ${mySleeve.sync.toFixed(4)} Shock: ${mySleeve.shock.toFixed(4)}` +
					` Combat: ${mySleeve.strength} ${mySleeve.defense} ${mySleeve.dexterity} ${mySleeve.agility}` +
					` Task: ${task.task}${task.gymStatType ? '-' + task.gymStatType : '' }`);
			}
		}
		await ns.sleep(10000);
		round++;
	}
}