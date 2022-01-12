/** @param {NS} ns **/
import { getHostnamesWithDetails } from 'utils.js'; 

export async function main(ns) {
	const start = ns.args[0] ? ns.args[0] : 20;
	const total = ns.args[1] ? ns.args[1] : 20;
	let servers = getHostnamesWithDetails(ns)
		.filter(server => server.hacked && server.maxMoney > 0)
		.sort((server1, server2) => {return server1.secRequired > server2.secRequired ? 1 : -1} );
	for (let i = start; i < start + total; i++) {
		const hostname = servers[i].hostname;
		let instance = 1;
		while(ns.isRunning('orchestrate.js', 'home', hostname, instance)) { instance++; }
		ns.exec('orchestrate.js', ns.getHostname(), 1, servers[i].hostname, instance);
	}
}