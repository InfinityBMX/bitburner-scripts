/** @param {NS} ns **/
export async function main(ns) {
	let i = 0;
	console.log('Deleting servers');
	while (i < ns.getPurchasedServerLimit()) {
		const hostname = "pserv-" + i;
		if (ns.serverExists(hostname)) {
			console.log(hostname, ' found to delete');
			ns.killall(hostname);
			ns.deleteServer(hostname);
			ns.tprint('Deleted ', hostname);
			
		}
		++i;
		await ns.sleep(100);
	}
}