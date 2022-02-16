/** @param {NS} ns */
const crimes = [
    "heist",
    "assassination",
    "kidnap",
    "grand theft auto",
    "homicide",
    "larceny",
    "mug someone",
    "rob store",
    "shoplift",
   // "traffic illegal arms"
];

export async function main(ns) {
    const manualCrime = ns.args[0] ? ns.args[0]: 'mug someone';
    // First, work out a bit to build up stats

    // Disable the log
    ns.disableLog("ALL");
    ns.tail(); // Open a window to view the status of the script
    let timeout = 250; // In ms - too low of a time will result in a lockout/hang
    while (true) {
        await ns.sleep(timeout); // Wait it out first
        if (ns.isBusy()) continue;
        ns.commitCrime(manualCrime);
    }
}