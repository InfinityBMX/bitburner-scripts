import { formatMoney, formatNumberShort } from './utils/formats.js'

const default_home_spend = 0.1; // Don't spend more than this proportion of money
const default_pserv_spend = 0.01;
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
	const max_pserv_spend_ratio = ns.args[1] ?
		ns.args[1] :
		default_pserv_spend;
	const pservMaxRAM = ns.getPurchasedServerMaxRam();
	let round = 1;
	while (true) {
		let currentRam = ns.getServerMaxRam("home");
		const money = ns.getServerMoneyAvailable("home");
		const spendable = money * max_spend_ratio;
		const pservSpendable = money * max_pserv_spend_ratio;
		const cost = ns.getUpgradeHomeRamCost();
		const nextRam = currentRam * 2;
		const upgradeDesc = `home RAM from ${formatNumberShort(currentRam)}GB to ${formatNumberShort(nextRam)}GB`;
		let upgradedHome = false;
		if (spendable < cost) {
			if (round % FAIL_UPDATE_FREQUENCY === 0)
				ns.print(`Money we're allowed to spend (${formatMoney(spendable)}) is less than the cost (${formatMoney(cost)}) to upgrade ${upgradeDesc}. ${formatMoney(pservSpendable)} available for PServs`);
		} else if (ns.upgradeHomeRam()) {
			upgradedHome = true;
			announce(ns, `SUCCESS: Upgraded ${upgradeDesc}`, 'success');
			if (nextRam != ns.getServerMaxRam("home"))
				announce(ns, `WARNING: Expected to upgrade ${upgradeDesc}, but new home ram is ${formatNumberShort(ns.getServerMaxRam("home"))}GB`, 'warning');
		} else {
			announce(ns, `ERROR: Failed to upgrade ${upgradeDesc} thinking we could afford it (cost: ${formatMoney(cost)} cash: ${formatMoney(money)} budget: ${formatMoney(spendable)})`, 'error');
		}

		// If we didn't upgrade home, try a pserv
		if (!upgradedHome) {
			for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
				const hostname = 'pserv-' + i;
				if (ns.serverExists(hostname)) {
					const currentRAM = ns.getServerMaxRam(hostname);
					// See if server max ram?
					if (currentRAM >= pservMaxRAM) {
						continue;
					}
					// See if server can be upgraded
					let upgradeRAM = currentRAM;
					while (ns.getPurchasedServerCost(upgradeRAM * 2) < pservSpendable) {
						upgradeRAM *= 2;
					}
					if (upgradeRAM > currentRAM) {
						// Copy running processes and arguments
						const scripts = ns.ps(hostname);
						// Delete old server
						ns.print(`Deleting ${hostname}`);
						ns.killall(hostname);
						ns.deleteServer(hostname);
						// Purchase new server
						const message = `Purchasing new ${hostname} with ${upgradeRAM}GB of RAM for ${formatMoney(ns.getPurchasedServerCost(upgradeRAM))}`;
						ns.tprint(message);
						ns.print(message);
						ns.purchaseServer(hostname, upgradeRAM);
						await ns.scp(['orchestrate.js', 'grow.js', 'hack.js', 'weaken.js', 'utils.js', 'hack-template.js'], hostname);
						scripts.filter(script => script.filename === 'orchestrate.js' || script.filename === 'hack-template.js').forEach(script => {
							let threads = (script.filename === 'orchestrate.js') ? 1 :
								Math.floor(ns.getServerMaxRam(hostname) / ns.getScriptRam(script.filename, hostname));
							ns.exec(script.filename, hostname, threads, ...script.args);
							ns.print(`Starting up ${script.filename} on ${hostname} with ${threads} thread(s)`);
						});
						break;
					}
				}
			}
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