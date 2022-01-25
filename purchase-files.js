/** @param {NS} ns **/
const allFiles = [
	'BruteSSH.exe',
	'FTPCrack.exe',
	'relaySMTP.exe',
	'HTTPWorm.exe',
	'SQLInject.exe',
	'ServerProfiler.exe',
	'DeepscanV1.exe',
	'DeepscanV2.exe',
	'AutoLink.exe',
	//'Formulas.exe'
];
export async function main(ns) {
	// Get TOR first
	let files = allFiles;
	let tor = ns.getPlayer().tor;
	while (!tor) {
		if (ns.purchaseTor()) {
			ns.tprint('Purchased TOR');
			tor = true;
			continue;
		} 
		await ns.sleep(1000);
	}
	// Get Files
	while (files.length) {
		for (const filename of files) {
			if (ns.fileExists(filename)){
				files = files.filter(file => file !== filename);
				continue;
			}
			// Attempt to buy everything every time
			// because I do what I want
			if (ns.purchaseProgram(filename)) {
				ns.tprint(`Purchased ${filename}`);
				files = files.filter(file => file !== filename);
			}
		}
		if (files.length) {
			console.log('Still need to buy: ', files);
			await ns.sleep(60000);
		}
	}
	ns.tprint('All files bought');
}