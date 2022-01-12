/** @param {NS} ns **/
export async function main(ns) {
	const target = ns.args[0];
	const delay = ns.args[1];
	console.log(`Sleeping ${delay}ms then growing ${target}.`);
	await ns.sleep(delay);
	const result = await ns.grow(target);
	//ns.tprint(`Grew ${target} by ${result * 100}%`);
}