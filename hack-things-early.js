let ssh, ftp, smtp, http, sql = false;
const specialHostnames = ['CSEC', 'I.I.I.I', 'avmnite-02h', 'run4theh111z', 'w0r1d_d43m0n'];

/** @param {NS} ns **/
export async function main(ns) {
    const hostnames = getAllHostnames(ns);
    const INTERVAL = 120000;
    let unhacked;
    let complete = false;
    let round = 1;
    console.log(`Found ${hostnames.length} servers`);
    let currentAbilities = getAbilities(ns); 
    console.log('Hacking abilities: ', currentAbilities, 'Hacking level: ', ns.getPlayer().hacking);
    // filter is a sync function
    unhacked = hostnames.filter(hostname => {
        const server = ns.getServer(hostname);
        // See if hacked
        if (server.hasAdminRights) {
            return false;
        }
        if (server.numOpenPortsRequired > currentAbilities) { // Since it's early, only hack servers we can hack with our current files
            return false;
        }
        if (server.requiredHackingSkill <= ns.getPlayer().hacking) {
            console.log('Found server to hack: ', hostname);
            hackServer(ns, hostname);
        } else {
            console.log('Server Unhackable: ', hostname, server.numOpenPortsRequired, server.requiredHackingSkill);
        }
        return !server.hasAdminRights;
    });
    if (unhacked.length) {
        ns.tprint(`${unhacked.length} unhacked servers left`);
    }
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