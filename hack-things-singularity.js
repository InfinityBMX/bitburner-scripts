/** @param {NS} ns **/
import { backdoorServer } from './utils.js';

let ssh, ftp, smtp, http, sql = false;
const specialHostnames = ['CSEC', 'I.I.I.I', 'avmnite-02h', 'run4theh111z', 'w0r1d_d43m0n'];


export async function main(ns) {
    const depth = ns.args[0] ? ns.args[0] : 5;
    const start = 'home';
    const hostnames = getAllHostnames(ns, start, depth);
    let unhacked;
    let complete = false;
    console.log(`Found ${hostnames.length} servers ${depth} hops from ${start}`);

    while (!complete) {
        let backdoors = [];
        let currentAbilities = getAbilities(ns);
        console.log('Hacking abilities: ', currentAbilities, 'Hacking level: ', ns.getPlayer().hacking);
        // filter is a sync function
        unhacked = hostnames.filter(hostname => {
            const server = ns.getServer(hostname);

            // See if hacked
            if (server.hasAdminRights) {
                if (specialHostnames.includes(hostname) && !server.backdoorInstalled) {
                    backdoors.push(hostname);
                }
                return false;
            }
            if (server.numOpenPortsRequired <= currentAbilities && server.requiredHackingSkill <= ns.getPlayer().hacking) {
                console.log('Found server to hack: ', hostname);
                hackServer(ns, hostname);
            } else {
                console.log('Server Unhackable: ', hostname, server.numOpenPortsRequired, server.requiredHackingSkill);
            }
            return !server.hasAdminRights;
        });
        if (backdoors.length) {
            for (const target of backdoors) {
                await backdoorServer(ns, target);
            }
        }
        if (unhacked.length) {
            console.log(`${unhacked.length} unhacked servers left: `, unhacked);
            await ns.sleep(120000);
        } else {
            complete = true;
        }
    }
    console.log('Everything hacked!');
}

function getHostnames(ns, root, levels) {
    let hostnames = ns.scan(root);
    if (levels > 1) {
        hostnames.forEach(hostname => {
            hostnames = [...hostnames, ...getHostnames(ns, hostname, levels - 1)];
        })
    }
    return [...new Set(hostnames)];
}

function getAllHostnames(ns) {
    ns.tprint('Getting hostnames');
    let serverChecked = [];
    let checkList = [];
    checkList.push("home");
    serverChecked["home"] = true;

    while (checkList.length) {
        let server = checkList.shift();
        let edges = ns.scan(server);
        if (specialHostnames.includes(server)) {
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

function getAbilities(ns) {
    ssh = ns.fileExists('brutessh.exe');
    ftp = ns.fileExists('ftpcrack.exe');
    smtp = ns.fileExists('relaysmtp.exe');
    http = ns.fileExists('httpworm.exe');
    sql = ns.fileExists('sqlinject.exe');
    return (ssh ? 1 : 0) +
        (ftp ? 1 : 0) +
        (smtp ? 1 : 0) +
        (http ? 1 : 0) +
        (sql ? 1 : 0)
}

function hackServer(ns, hostname) {
    if (ssh) {
        ns.brutessh(hostname);
    }
    if (ftp) {
        ns.ftpcrack(hostname);
    }
    if (smtp) {
        ns.relaysmtp(hostname);
    }
    if (http) {
        ns.httpworm(hostname);
    }
    if (sql) {
        ns.sqlinject(hostname);
    }
    ns.nuke(hostname);
    // if (specialHostnames.includes(hostname))
    //     installBackdoor(hostname);
}