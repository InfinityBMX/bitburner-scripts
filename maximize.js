import { getHostnames } from './utils.js';
import { MAXIMIZE_PORT, HOME, N00DLES } from './utils/constants.js';

const SCRIPT_NAME = 'hack-template.js';

// Script loops through all hostnames and finds the best target to hack. Then it sets up the bot net to attack the target.
/** @param {NS} ns **/
export async function main(ns) {
    const includePservs = ns.args[0] ? ns.args[0] : false;
    const forceRefresh = ns.args[1] ? ns.args[1] : false;
    const n00dles = {
        hostname: N00DLES,
        maxMoney: 0
    };
    const port = ns.getPortHandle(MAXIMIZE_PORT);

    let bestTarget = port.empty() ? n00dles : port.read();
    const previous = bestTarget;
    console.log(`Getting hacked hostnames`);
    const hostnames = getHostnames(ns).filter(hostname => ns.getServer(hostname).hasAdminRights);
    console.log('Got hostnames. Finding best target.');

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
    port.write(bestTarget);

    if (bestTarget.hostname !== previous.hostname) {
        ns.tprint(`${bestTarget.hostname} is the new best target. SEND IN THE CLOOONES!`);
    } else { 
        ns.print(`${bestTarget.hostname} is still the best target.`);
    }
    for (const hostname of hostnames) {
        try {
            if (hostname !== 'home' && (includePservs || !hostname.startsWith('pserv'))) {
                if (forceRefresh || !ns.isRunning(SCRIPT_NAME, hostname, bestTarget.hostname)) {
                    ns.killall(hostname);
                    await ns.scp('hack-template.js', HOME, hostname);
                    const instances = Math.floor(ns.getServerMaxRam(hostname) / ns.getScriptRam(SCRIPT_NAME, hostname));
                    const status = instances > 0 ? ns.exec(SCRIPT_NAME, hostname, instances, bestTarget.hostname) : 0;
                    if (status > 0)
                        ns.print(`Hacking with ${instances} threads on ${hostname}.`);
                    else
                        throw 'Exec status 0';
                }
            } else {
                ns.print(`Skipping ${hostname}`);
            }
        } catch (e) {
            ns.print(`Failed to start script on ${hostname}`);
            console.error(e);
        }
    };
        
}