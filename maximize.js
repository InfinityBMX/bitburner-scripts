/** @param {NS} ns **/
// Script loops through all hostnames and finds the best target to hack. Then it sets up the bot net to attack the target.
export async function main(ns) {
    const depth = ns.args[0] ? ns.args[0] : 1;
    const start = 'home';
    console.log(`Getting hacked hostnames ${depth} levels deep`);
    const hostnames = getHostnames(ns, start, depth).filter(hostname => ns.getServer(hostname).hasAdminRights);
    console.log(hostnames);
    console.log(getHostnames(ns, start, depth));
	console.log('Got hostnames. Finding best target.');
	let bestTarget = {
        hostname: 'n00dles',
        maxMoney: 0
    };
    
    hostnames.forEach(hostname => {
        const maxMoney = ns.getServerMaxMoney(hostname);
        if (maxMoney > bestTarget.maxMoney && ns.getServerRequiredHackingLevel(hostname) <= (ns.getPlayer().hacking * .5)) {
            bestTarget = {
                hostname,
                maxMoney
            };
            console.log('New best target: ', hostname);
        }
    });

    console.log('Best target found: ', bestTarget.hostname);

    for (const hostname of hostnames) {
        try {
            if (hostname !== 'home' /*&& !hostname.startsWith('pserv')*/) {
                ns.killall(hostname);
            } else {
                console.log('Skipping home and pservs');
            }
            await ns.scp('hack-template.js', start, hostname);
            const instances = Math.floor(ns.getServerMaxRam(hostname) / ns.getScriptRam('hack-template.js', hostname));
            const status = instances > 0 ? ns.exec('hack-template.js', hostname, instances, bestTarget.hostname) : 0;
            if (status > 0)
                console.log(`Hacking with ${instances} threads on ${hostname}.`);
            else
                throw 'Exec status 0';
        } catch (e) {
            console.log(`Failed to start script on ${hostname}`);
            console.error(e);
        }
    };
}

function getHostnames(ns, root, levels) {
    let hostnames = ns.scan(root);
    if(levels > 1) {
        hostnames.forEach(hostname => {
            hostnames = [...hostnames, ...getHostnames(ns, hostname, levels - 1)];
        })
    }
    return [...new Set(hostnames)];
}