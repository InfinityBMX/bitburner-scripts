/** @param {NS} ns **/
const specialHostnames = ['CSEC','I.I.I.I','avmnite-02h','run4theh111z', 'The-Cave'];
const homeCores = 5;

export function output(ns) {
	ns.tprint('Export called');
}

export function getHostnames(ns, findSpecial = false) {
    let serverChecked = [];
    let checkList = [];
    checkList.push("home");
    serverChecked["home"] = true;

    while (checkList.length) {
        let server = checkList.shift();
        let edges = ns.scan(server);
        if (findSpecial && specialHostnames.includes(server)) {
            ns.tprint(`${server} found!`);
        }

        for (let i = 0; i < edges.length; i++) {
            if (!serverChecked[edges[i]]) {
                serverChecked[edges[i]] = true;
                checkList.push(edges[i]);
            }
        }
    }
    return Object.keys(serverChecked);
}

export function getHostnamesWithDetails(ns) {
    const hostnames = getHostnames(ns);
    let servers = [];
    for ( const hostname of hostnames ) {
        if (hostname !== 'home' && !hostname.startsWith('pserv')) {
            servers.push({ 
                hostname, 
                secRequired: ns.getServerRequiredHackingLevel(hostname),
                hacked: ns.hasRootAccess(hostname),
                maxMoney: ns.getServerMaxMoney(hostname)
            });
        }
    }
    return servers;
}

export function calculateGrowthThreads(ns, target, start, end) {
    if (end <= start) { 
        return 0; 
    }
    var threads = 1
    var needed;
    // Screw math, lets cheat
    if (start > 0)
        needed = 1 + ((end - start) / start);
    else 
        needed = 1 + ((end - start) / (start + .0001));
    while (ns.growthAnalyze(target, needed, ns.getServer().cpuCores) > threads) {
        threads++;
        //needed = end / (start + threads);
    }
    //console.log(start, end, needed, threads);
    return threads;
}

export function calculateWeakenThreads(ns, secLevel, minSecLevel) {
    if (secLevel <= minSecLevel) {
        return 0;
    }

    var threads = 1
    var needed = secLevel - minSecLevel;
//    console.log('calcWeaken: ', secLevel, minSecLevel, needed);
    while (ns.weakenAnalyze(threads, ns.getServer().cpuCores) < needed) { threads++; }
    return threads;
}

export function calculateHackThreads(ns, hostname, percent) {
    //console.log('Percent: ', percent );
    const perThread = ns.hackAnalyze(hostname);
    //console.log('Per thread: ', perThread, ' Total: ', Math.floor(percent/perThread));
    return Math.floor(percent/perThread);
}

export function getUsefulServerInfo(ns, hostname) {
    const maxMoney = ns.getServerMaxMoney(hostname);
    const currentMoney = ns.getServerMoneyAvailable(hostname);
    const minSecurity = ns.getServerMinSecurityLevel(hostname);
    const currentSecurity = ns.getServerSecurityLevel(hostname);
    return {
        maxMoney,
        currentMoney,
        minSecurity,
        currentSecurity
    };
}

export function getTimingsForHostname(ns, hostname) {
    const hackTime = Math.ceil(ns.getHackTime(hostname));
    const weakTime = Math.ceil(ns.getWeakenTime(hostname));
    const growTime = Math.ceil(ns.getGrowTime(hostname));
    const timing = Math.max(Math.ceil(hackTime/5000)*5000,Math.ceil(weakTime/5000)*5000,Math.ceil(growTime/5000)*5000)+2000;
    ns.tprint(`Timing for ${hostname} is ${timing} based on ${hackTime} hack, ${weakTime} weak and ${growTime} grow.`);
    return {
        timing,
        hackTime,
        growTime,
        weakTime
    };
}