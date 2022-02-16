/** @param {NS} ns **/
import { getHostnamesWithDetails } from 'utils.js'; 

export async function main(ns) {
	ns.tprint('Setting up servers');
	const killall = ns.args[0] ? ns.args[0] : false; // First arg kills running scripts before starting
	const percentage = ns.args[1] ? ns.args[1] : 1.00;
	let servers = getHostnamesWithDetails(ns)
		.filter(server => server.hacked && server.maxMoney > 0)
		.sort((server1, server2) => {return server1.secRequired > server2.secRequired ? 1 : -1} );
	ns.tprint(`${servers.length} servers to choose from.`);
	console.log(servers);
	// The higher servers break orchestrate.js for some reason
	const serverCap = Math.min(500, servers.length);
	for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
		let hostname = "pserv-" + i;
		if (ns.serverExists(hostname)) {
			if (killall)
				ns.killall(hostname);
			await ns.scp(['orchestrate.js', 'grow.js', 'hack.js', 'weaken.js', 'utils.js'], hostname);
			const targetIndex = serverCap - (i % serverCap) - 1;
			const target = servers[targetIndex].hostname;
			ns.tprint(`Assigning ${targetIndex}-${target} to ${hostname}`);
			ns.exec('orchestrate.js', hostname, 1, target, percentage);
		}
		await ns.sleep(250);
	}
}