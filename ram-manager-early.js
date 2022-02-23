import { formatMoney, formatNumberShort } from './utils/formats.js'

const default_home_spend = 0.8; // Don't spend more than this proportion of money
const INTERVAL = 5000;
const FAIL_UPDATE_FREQUENCY = 15;

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('sleep');
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('getServerMaxRam');
	const max_spend_ratio = ns.args[0] ?
		ns.args[0] :
		default_home_spend;
	let round = 1;
	while (true) {
		let currentRam = ns.getServerMaxRam("home");
		const money = ns.getServerMoneyAvailable("home");
		const spendable = money * max_spend_ratio;
		const cost = ns.getUpgradeHomeRamCost();
		const nextRam = currentRam * 2;
		const upgradeDesc = `home RAM from ${formatNumberShort(currentRam)}GB to ${formatNumberShort(nextRam)}GB`;
		if (spendable < cost) {
			if (round % FAIL_UPDATE_FREQUENCY === 0)
				ns.print(`Money we're allowed to spend (${formatMoney(spendable)}) is less than the cost (${formatMoney(cost)}) to upgrade ${upgradeDesc}.`);
		} else if (ns.upgradeHomeRam()) {
			announce(ns, `SUCCESS: Upgraded ${upgradeDesc}`, 'success');
			if (nextRam != ns.getServerMaxRam("home"))
				announce(ns, `WARNING: Expected to upgrade ${upgradeDesc}, but new home ram is ${formatNumberShort(ns.getServerMaxRam("home"))}GB`, 'warning');
		} else {
			announce(ns, `ERROR: Failed to upgrade ${upgradeDesc} thinking we could afford it (cost: ${formatMoney(cost)} cash: ${formatMoney(money)} budget: ${formatMoney(spendable)})`, 'error');
		}
		round++;
		await ns.sleep(INTERVAL);
	}
}

function announce(ns, message, toastStyle) {
	ns.print(message);
	ns.tprint(message);
	if (toastStyle) ns.toast(message, toastStyle);
}