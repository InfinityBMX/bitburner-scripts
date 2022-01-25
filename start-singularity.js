/** @param {NS} ns **/
//
//	Starts rooting script.
//	First Arg sets ram for pservs
//

export async function main(ns) {
	const ram = ns.args[0] ? ns.args[0] : 2048;
	ns.tprint('Starting');
	ns.tprint('Firing up hack-things-singularity.js');
	ns.exec('hack-things-singularity.js', 'home', 1, 10);
	await ns.sleep(5000);
	ns.tprint('Firing up purchase-files.js');
	ns.exec('purchse-files.js', 'home', 1);
	await ns.sleep(5000);
	ns.tprint('Firing up purchase-servers.js');
	ns.exec('purchase-servers.js', 'home', 1, ram);
}