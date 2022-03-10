/** @param {NS} ns **/
export async function main(ns) {
	ns.exec('test.js', 'home', 1, '--focus research');
}