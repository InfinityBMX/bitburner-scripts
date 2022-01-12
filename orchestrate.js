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

    while (true) {
        let { timing, hackTime, growTime, weakTime } = getTimingsForHostname(ns, hostname);
        const server = getUsefulServerInfo(ns, hostname);
        let money = server.currentMoney;
        let security = server.currentSecurity;
        ns.tprint(`Round ${round} Levels for ${hostname}: ${server.currentMoney}/${server.maxMoney} and ${server.currentSecurity}/${server.minSecurity}`);

        //
        // Security Check
        // If we don't have enough threads to get security down, just focus on that until we do
        //
        threads = calculateWeakenThreads(ns, security, server.minSecurity);
        let availableThreads = Math.min(threads, Math.floor(getAvailableRAM(ns, ns.getHostname(), 1) / ns.getScriptRam('weaken.js')));
        if (threads > availableThreads) {
            console.log(`Skipping cycle to weaken ${hostname} at max ${availableThreads}.`);
            ns.exec('weaken.js', ns.getHostname(), availableThreads, hostname, 0);
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
                        console.log(`Can hack ${hostname} for ${roundHackPercent} with ${hackThreads} ${weaken1Threads} ${growThreads} ${weaken2Threads}.`);
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
                        if ((ns.getScriptRam('weaken.js') * (weaken1Threads + weaken2Threads)) +
                            (ns.getScriptRam('grow.js') * growThreads) < getAvailableRAM(ns, ns.getHostname())) {
                            happy = true; // But not really :(
                            console.log(`Skipping hack on ${hostname} but growing with ${weaken1Threads} ${growThreads} ${weaken2Threads}.`);
                        } else {
                            growPercent -= .01;
                        }
                    }
                } // End of skip hack block
            } // End 

            //
            // Hack
            //
            if (hackThreads > 0) {
                console.log(`Hacking ${hostname} with ${hackThreads} threads.`);
                waitTime = (timing - 2000) - hackTime;
                ns.exec('hack.js', ns.getHostname(), hackThreads, hostname, waitTime);
            } else {
                console.log('Skipping hack');
            }

            //
            // Weaken 1
            //
            if (weaken1Threads > 0) {
                console.log(`Weakening ${hostname} with ${weaken1Threads} threads.`);
                waitTime = (timing - 1500) - weakTime;
                ns.exec('weaken.js', ns.getHostname(), weaken1Threads, hostname, waitTime);
            } else {
                console.log('Skipping first weaken');
            }

            //
            // Grow
            //
            if (growThreads > 0) {
                console.log(`Growing ${hostname} by ${growThreads} threads.`);
                waitTime = (timing - 1000) - growTime;
                ns.exec('grow.js', ns.getHostname(), growThreads, hostname, waitTime);
            } else {
                console.log('Skipping grow');
            }

            //
            // Weaken 2
            //
            if ( weaken2Threads > 0) {
                console.log(`Weakening ${hostname} by ${weaken2Threads} threads.`);
                waitTime = (timing - 500) - weakTime;
                ns.exec('weaken.js', ns.getHostname(), weaken2Threads, hostname, waitTime);
            }
/*
            //
            // Hack
            //
            let currentRatio = money / server.maxMoney;
            if (currentRatio > 1 - hackPercent) {
                threads = calculateHackThreads(ns, hostname, hackPercent - (1 - currentRatio));
                console.log(`Hacking ${hostname} with ${threads} threads.`);
                // timing
                waitTime = (timing - 2000) - hackTime;
                if (threads)
                    ns.exec('hack.js', ns.getHostname(), threads, hostname, waitTime);
                //ns.tprint('Hack Time: ', funcTime, ' Wait: ', waitTime);
                security += ns.hackAnalyzeSecurity(threads);
                money -= ((ns.hackAnalyze(hostname) * threads) * server.maxMoney);
                console.log('After Hack - Money: ', money, ' Security: ', security);
            } else {
                console.log('Skipping hack');
            }

            //
            // Weaken
            //
            threads = calculateWeakenThreads(ns, security, server.minSecurity);
            if (threads > 0) {
                console.log(`Weakening ${hostname} by ${threads} threads.`);
                // timing
                waitTime = (timing - 1500) - weakTime;
                ns.exec('weaken.js', ns.getHostname(), threads, hostname, waitTime + 10);
                //ns.tprint('Weaken Time: ', funcTime, ' Wait: ', waitTime);
            } else {
                console.log('Skipping weaken');
            }
            security = server.minSecurity; // hopefully

            //
            // Grow
            //
            threads = Math.max(1, calculateGrowthThreads(ns, hostname, money, server.maxMoney));
            if (threads > 0) {
                // Because grow can get out of hand, cap it at half the RAM
                //console.log('Calculated Grow Threads: ', threads);
                threads = Math.min(threads, Math.floor(getAvailableRAM(ns, ns.getHostname(), .7) / ns.getScriptRam('grow.js')))
                console.log(`Growing ${hostname} by ${threads} threads.`);
                waitTime = (timing - 1000) - growTime;
                ns.exec('grow.js', ns.getHostname(), threads, hostname, waitTime);
                //ns.tprint('Grow Time: ', funcTime, ' Wait: ', waitTime);
                security += ns.growthAnalyzeSecurity(threads);
            } else {
                console.log('Skipping grow');
            }

            //
            // Weaken
            //
            threads = calculateWeakenThreads(ns, security, server.minSecurity);
            if (threads > 0) {
                threads = Math.min(threads, Math.floor(getAvailableRAM(ns, ns.getHostname(), 1) / ns.getScriptRam('weaken.js')))
                console.log(`Weakening ${hostname} by ${threads} threads.`);
                // timing
                waitTime = (timing - 500) - weakTime;
                ns.exec('weaken.js', ns.getHostname(), threads, hostname, waitTime);
                //ns.tprint('Weaken Time: ', funcTime, ' Wait: ', waitTime);
            } else {
                console.log('Skipping weaken');
            }
            security = server.minSecurity; // hopefully
        }
*/
        } // End of non-Weaken Only round
        //
        // Cleanup
        //
        console.log('Waiting for results for ' + hostname);
        await ns.sleep(timing);
        round++;
    }
}

function getAvailableRAM(ns, hostname, maxPercent = 1) {
    const available = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
    return Math.min(available, ns.getServerMaxRam(hostname) * maxPercent);
}