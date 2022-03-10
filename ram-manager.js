import { formatMoney, formatNumberShort } from './utils/formats.js'

const MIN_RAM_TO_LIMIT = 2048;
const DEFAULT_HOME_SPEND = 0.1; // Don't spend more than this proportion of money
const DEFAULT_PSERV_SPEND = 0.01;
const INTERVAL = 5000;
const FAIL_UPDATE_FREQUENCY = 15;

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog('sleep');
	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('getServerMaxRam');
	const maxSpendRatio = ns.args[0] ?
		ns.args[0] :
		DEFAULT_HOME_SPEND;
	const maxPservSpendRatio = ns.args[1] ?
		ns.args[1] :
		DEFAULT_PSERV_SPEND;
	const pservMaxRAM = ns.getPurchasedServerMaxRam();
	let round = 1;
	while (true) {
		let currentRam = ns.getServerMaxRam("home");
		const money = ns.getServerMoneyAvailable("home");
		const spendable = currentRam < MIN_RAM_TO_LIMIT ? money : money * maxSpendRatio;
		const pservSpendable = money * maxPservSpendRatio;
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
			ns.tprint(`Next home RAM upgrade is ${formatMoney(ns.getUpgradeHomeRamCost())} for ${nextRam * 2}GB`);
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