/** @param {NS} ns **/
import {
    getUsefulServerInfo,
    calculateGrowthThreads,
    calculateWeakenThreads,
    calculateHackThreads,
    getTimingsForHostname
} from './utils.js';

export async function main(ns) {
    const hostname = ns.args[0] ? ns.args[0] : 'n00dles';
    let hackPercent = ns.args[1] ? ns.args[1] : 1.00;
    let threads, hackThreads, weaken1Threads, growThreads, weaken2Threads = 0;
    let waitTime = 0;
    let round = 1;
    ns.disableLog('ALL');
    while (true) {
        let { timing, hackTime, growTime, weakTime } = getTimingsForHostname(ns, hostname);
        const server = getUsefulServerInfo(ns, hostname);
        let money = server.currentMoney;
        let security = server.currentSecurity;
        if (round % 50 === 0) 
            ns.print(`${ns.getHostname()} - Round ${round} Levels for ${hostname}: ${server.currentMoney}/${server.maxMoney} and ${server.currentSecurity}/${server.minSecurity}. $${Math.floor(ns.getScriptIncome(ns.getScriptName(), ns.getHostname(), ...ns.args))}/sec`);

        //
        // Security Check
        // If we don't have enough threads to get security down, just focus on that until we do
        //
        threads = calculateWeakenThreads(ns, security, server.minSecurity);
        let availableThreads = Math.min(threads, Math.floor(getAvailableRAM(ns, ns.getHostname(), 1) / ns.getScriptRam('weaken.js')));
        if (threads > availableThreads) {
            ns.print(`Skipping cycle to weaken ${hostname} at max ${availableThreads}.`);
            if (availableThreads > 0) {
                ns.exec('weaken.js', ns.getHostname(), availableThreads, hostname, 0);
                ns.print(`Weakening ${hostname} with ${availableThreads} threads`);
            }
            timing = weakTime + 500;
        } else {
            let happy = false;
            let theoreticalMoney = money;
            let theoreticalSecurity = security;
            let roundHackPercent = hackPercent;
            let currentRatio = money / server.maxMoney;
            // We're happy when we have enough RAM to run all of our phases
            // Decrement hack 1% at a time until we can run the whole thing
            while (!happy) {
                theoreticalMoney = money;
                theoreticalSecurity = security;
                if (currentRatio > 1 - roundHackPercent) {
                    // Hack
                    hackThreads = calculateHackThreads(ns, hostname, roundHackPercent - (1 - currentRatio));
                    theoreticalSecurity += ns.hackAnalyzeSecurity(hackThreads);
                    theoreticalMoney -= ((ns.hackAnalyze(hostname) * hackThreads) * server.maxMoney);
                    
                    // Weaken 1
                    weaken1Threads = calculateWeakenThreads(ns, theoreticalSecurity, server.minSecurity);
                    theoreticalSecurity = server.minSecurity;
                    
                    // Grow
                    growThreads = Math.max(1, calculateGrowthThreads(ns, hostname, theoreticalMoney, server.maxMoney));
                    theoreticalSecurity += ns.growthAnalyzeSecurity(growThreads);
                    
                    // Weaken 2
                    weaken2Threads = calculateWeakenThreads(ns, theoreticalSecurity, server.minSecurity);

                    // Totals
                    let totalRAM = (ns.getScriptRam('hack.js') * hackThreads) +
                        (ns.getScriptRam('weaken.js') * (weaken1Threads + weaken2Threads)) +
                        (ns.getScriptRam('grow.js') * growThreads);
                    let availableRAM = getAvailableRAM(ns, ns.getHostname());
                    if (totalRAM < availableRAM) {
                        happy = true;
                        ns.print(`Can hack ${hostname} for ${roundHackPercent} with ${hackThreads} ${weaken1Threads} ${growThreads} ${weaken2Threads}.`);
                    } else {
                        roundHackPercent -= .01;
                        theoreticalSecurity = security;
                        theoreticalMoney = money;
                    }
                } else {
                    // We don't have enough RAM to do the hack and recover so skip the hack
                    hackThreads = 0;
                    let growPercent = 1.00;
                    while (!happy) {
                        theoreticalSecurity = security;
                        theoreticalMoney = money;
                        weaken1Threads = calculateWeakenThreads(ns, theoreticalSecurity, server.minSecurity);
                        theoreticalSecurity = server.minSecurity;
                        growThreads = calculateGrowthThreads(ns, hostname, theoreticalMoney, server.maxMoney * growPercent);
                        theoreticalSecurity += ns.growthAnalyzeSecurity(growThreads);
                        weaken2Threads = calculateWeakenThreads(ns, theoreticalSecurity, server.minSecurity);
                        let availableRAM = getAvailableRAM(ns, ns.getHostname());
                        if ((ns.getScriptRam('weaken.js') * (weaken1Threads + weaken2Threads)) +
                            (ns.getScriptRam('grow.js') * growThreads) < availableRAM) {
                            happy = true; // But not really :(
                            if (growThreads === 0) { // If we're really in trouble, just grow grow grow
                                growThreads = Math.floor(availableRAM / ns.getScriptRam('grow.js'));
                            }
                            console.log(`Skipping hack on ${hostname} but growing with ${weaken1Threads} ${growThreads} ${weaken2Threads}.`);
                        } else {
                            // If 1% is too much to grow, we still want to do something
                            if (theoreticalMoney > server.maxMoney * (growPercent - .01))
                                growPercent -= .001;
                            else
                                growPercent -= .01;
                        }
                    }
                } // End of skip hack block
            } // End 
            //
            // Hack
            //
            if (hackThreads > 0) {
                ns.print(`Hacking ${hostname} with ${hackThreads} threads after waiting ${waitTime}ms.`);
                waitTime = (timing - 2000) - hackTime;
                ns.exec('hack.js', ns.getHostname(), hackThreads, hostname, waitTime);
            } else {
                ns.print('Skipping hack');
            }

            //
            // Weaken 1
            //
            if (weaken1Threads > 0) {
                ns.print(`Weakening ${hostname} with ${weaken1Threads} threads after waiting ${waitTime}ms.`);
                waitTime = (timing - 1500) - weakTime;
                ns.exec('weaken.js', ns.getHostname(), weaken1Threads, hostname, waitTime);
            } else {
                ns.print('Skipping first weaken');
            }

            //
            // Grow
            //
            if (growThreads > 0) {
                ns.print(`Growing ${hostname} by ${growThreads} threads after waiting ${waitTime}ms.`);
                waitTime = (timing - 1000) - growTime;
                ns.exec('grow.js', ns.getHostname(), growThreads, hostname, waitTime);
            } else {
                ns.print('Skipping grow');
            }

            //
            // Weaken 2
            //
            if ( weaken2Threads > 0) {
                ns.print(`Weakening ${hostname} by ${weaken2Threads} threads after waiting ${waitTime}ms.`);
                waitTime = (timing - 500) - weakTime;
                ns.exec('weaken.js', ns.getHostname(), weaken2Threads, hostname, waitTime);
            } else {
                ns.print('Skipping second weaken');
            }

        } // End of non-Weaken Only round
        //
        // Cleanup
        //
        await ns.sleep(timing);
        round++;
    }
}

function getAvailableRAM(ns, hostname, maxPercent = 1) {
    const available = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
    return Math.min(available, ns.getServerMaxRam(hostname) * maxPercent);
}