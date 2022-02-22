/** @param {NS} ns **/
export async function main(ns) {
	const ram = ns.args[0] ?
		ns.args[0] :
		ns.fileExists('server-ram.txt') ?
			ns.read('server-ram.txt') :
			2048;
	const setup = ns.args[1];
	const serverCost = ns.getPurchasedServerCost(ram);
	let i = 0;
	ns.tprint(`Purchasing servers with ${ram}GB RAM. Each costs ${serverCost}`);
	while (i < ns.getPurchasedServerLimit()) {
		const hostname = 'pserv-' + i;
		if (ns.serverExists(hostname)) {
			++i;
		} else if (ns.getServerMoneyAvailable("home") > serverCost) {
			ns.purchaseServer(hostname, ram);
			await ns.scp(['orchestrate.js', 'grow.js', 'hack.js', 'weaken.js', 'utils.js'], hostname);
			++i;
		}
		await ns.sleep(1000);
	}
	if (ram >= 256 && setup)
		ns.exec('setup-servers.js', 'home', 1);
	else
		ns.exec('maximize.js', 'home', 1, true);
}