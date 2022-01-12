/** @param {NS} ns **/
//
//	Starts rooting script.
//	First Arg sets ram for pservs
//
export async function main(ns) {
	const ram = ns.args[0] ? ns.args[0] : 2048;
	ns.tprint('Starting');
	ns.tprint('Firing up hack-things.js');
	ns.exec('hack-things.js', 'home', 1, 10);
	await ns.sleep(10000);
	ns.tprint('Firing up purchase-servers.js');
	ns.exec('purchase-servers.js', 'home', 1, ram);
}