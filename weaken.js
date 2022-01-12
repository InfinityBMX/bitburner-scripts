/** @param {NS} ns **/
export async function main(ns) {
	const target = ns.args[0];
	const delay = ns.args[1];
	console.log(`Sleeping ${delay}ms then weakening ${target}.`);
	await ns.sleep(delay);
	const result = await ns.weaken(target);
	//ns.tprint(`Weakened ${target} by ${result} security level.`);
}