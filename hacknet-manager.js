const HACKNET_PURCHASE_RATIO = 0.1;
const HACKNET_UPGRADE_RATIO = 0.2;
const HACKNET_CACHE_RATIO = 0.01;

/** @param {NS} ns **/
export async function main(ns) {
	const maxNodes = ns.hacknet.maxNumNodes();
	const flagdata = ns.flags([
		["focus", "money"]
	]);
	while (true) {
		const cash = ns.getServerMoneyAvailable('home');
		let purchaseBudget = cash * HACKNET_PURCHASE_RATIO;
		let upgradeBudget = cash * HACKNET_UPGRADE_RATIO;
		let cacheBudget = cash * HACKNET_CACHE_RATIO;
		if (ns.hacknet.numNodes() < maxNodes && ns.hacknet.getPurchaseNodeCost() < purchaseBudget) {
			ns.hacknet.purchaseNode();
		}

		let cheapestUpgrade = findCheapestUpgrade(ns);
		switch (cheapestUpgrade.type) {
			case 'cores':
				if (ns.hacknet.getCoreUpgradeCost(cheapestUpgrade.server, 1) < upgradeBudget)
					ns.hacknet.upgradeCore(cheapestUpgrade.server, 1);
				break;
			case 'level':
				if (ns.hacknet.getLevelUpgradeCost(cheapestUpgrade.server, 1) < upgradeBudget)
					ns.hacknet.upgradeLevel(cheapestUpgrade.server, 1);
				break;
			case 'ram':
				if (ns.hacknet.getRamUpgradeCost(cheapestUpgrade.server, 1) < upgradeBudget)
					ns.hacknet.upgradeRam(cheapestUpgrade.server, 1);
				break;
			default:
				ns.tprint('Hacknet Upgrade failed to find a cheapest option');
		}


		let bestCache = findBestCacheUpgrade(ns, cacheBudget);
		if (bestCache >= 0) // -1 for no upgrade
			ns.hacknet.upgradeCache(bestCache, 1);

		if (ns.getPlayer().hasCorporation)
			if (flagdata.focus === 'research')
				ns.hacknet.spendHashes('Exchange for Corporation Research');
			else
				ns.hacknet.spendHashes('Sell for Corporation Funds');
		else {
			while (ns.hacknet.numHashes() > ns.hacknet.hashCost('Sell for Money'))
				ns.hacknet.spendHashes('Sell for Money');
		}
		await ns.sleep(1000);
	}
}

/** @param {NS} ns **/
const findCheapestUpgrade = (ns) => {
	let lowestUpgrades = {};
	let lowestServers = { cores: 0, level: 0, ram: 0 };
	for (let i = 0; i < ns.hacknet.numNodes(); i++) {
		let stats = ns.hacknet.getNodeStats(i);
		for (const upgrade of ['cores', 'level', 'ram']) {
			if (!lowestUpgrades[upgrade] || (lowestUpgrades[upgrade] && stats[upgrade] < lowestUpgrades[upgrade])) {
				lowestUpgrades[upgrade] = stats[upgrade];
				lowestServers[upgrade] = i;
			}
		}
	}
	let coreCost = ns.hacknet.getCoreUpgradeCost(lowestServers.cores, 1);
	let levelCost = ns.hacknet.getLevelUpgradeCost(lowestServers.level, 1);
	let ramCost = ns.hacknet.getRamUpgradeCost(lowestServers.ram, 1);
	if (coreCost < levelCost && coreCost < ramCost)
		return { type: 'cores', server: lowestServers.cores };
	else if (levelCost <= coreCost && levelCost <= ramCost)
		return { type: 'level', server: lowestServers.level };
	return { type: 'ram', server: lowestServers.ram };
}

/** 
 * @param {NS} ns 
 * @param {number} budget Amount we can spend on cache
 * **/
const findBestCacheUpgrade = (ns, budget) => {
	let cachePrices = [...Array(ns.hacknet.numNodes()).keys()]
		.filter(i => ns.hacknet.getCacheUpgradeCost(i, 1) <= budget)
		.sort((x, y) => ns.hacknet.getCacheUpgradeCost(y, 1) - ns.hacknet.getCacheUpgradeCost(x, 1));
	return cachePrices.length > 0 ? cachePrices[0] : -1;
}