/** @param {NS} ns **/
export async function main(ns) {
	const ram = ns.args[0] ? ns.args[0] : 2048;

	let i = 0;

	while (i < ns.getPurchasedServerLimit()) {
		const hostname = 'pserv-' + i;
		if (ns.serverExists(hostname)) {
			++i;
		} else if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
			ns.purchaseServer(hostname, ram);
			await ns.scp(['orchestrate.js', 'grow.js', 'hack.js', 'weaken.js', 'utils.js'], hostname);
			++i;
		}
		await ns.sleep(1000);
	}
	if (ram >= 256)
		ns.exec('setup-servers.js', 'home', 1);
	else
		ns.exec('maximize.js', 'home');
}