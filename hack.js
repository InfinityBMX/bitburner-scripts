/** @param {NS} ns **/
export async function main(ns) {
	const target = ns.args[0];
	const delay = ns.args[1];
	//	const threads = ns.args[2] ? ns.args[2] : ns.getRunningScript().threads;
	console.log(`Sleeping ${delay}ms then hacking ${target}.`);
	await ns.sleep(delay);
	const result = await ns.hack(target);
	//ns.tprint(`Stole ${result} from ${target}.`);
}