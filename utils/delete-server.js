/** @param {NS} ns **/
export async function main(ns) {
	ns.deleteServer(ns.args[0]);
}