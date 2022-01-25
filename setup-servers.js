/** @param {NS} ns **/
import { getHostnamesWithDetails } from 'utils.js'; 

export async function main(ns) {
	const killall = ns.args[0] ? ns.args[0] : false; // First arg kills running scripts before starting
	let servers = getHostnamesWithDetails(ns)
		.filter(server => server.hacked && server.maxMoney > 0)
		.sort((server1, server2) => {return server1.secRequired > server2.secRequired ? 1 : -1} );
	console.log(servers);
	for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
		let hostname = "pserv-" + i;
		if (killall)
			ns.killall(hostname);
		await ns.scp(['orchestrate.js', 'grow.js', 'hack.js', 'weaken.js', 'utils.js'], hostname);
		const target = servers[i % servers.length].hostname;
		let instance = 1;
		while(ns.isRunning('orchestrate.js', hostname, target, instance)) { instance++; }
		ns.exec('orchestrate.js', hostname, 1, target, instance);
	}
}