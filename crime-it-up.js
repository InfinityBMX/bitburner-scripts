import { formatDuration, formatNumberShort } from './utils/formats.js'

const statusUpdateInterval = 60000;
const crimes = [
    "shoplift",
    "rob store",
    "mug",
    "larceny",
    "deal drugs",
    "bond forgery",
    "traffick arms",
    "homicide",
    "grand theft auto",
    "kidnap",
    "assassinate",
    "heist"
];

/** @param {NS} ns */
export async function main(ns) {
    const manualCrime = ns.args.length == 0 ? undefined : ns.args.join(" "); // Join in case crime has a space
    ns.tail();
    if (!manualCrime || ns.args.includes("--fast-crimes-only"))
        await crimeForKillsKarmaStats(ns, 0, 0, Number.MAX_SAFE_INTEGER, ns.commitCrime, ns.args.includes("--fast-crimes-only"));
    else
        await legacyAutoCrime(ns, manualCrime);
}

/** @param {NS} ns */
export async function crimeForKillsKarmaStats(ns, reqKills, reqKarma, reqStats, crimeCommand = null, doFastCrimesOnly = false) {
    const bestCrimesByDifficulty = ["heist", "assassinate", "homicide", "mug"]; // Will change crimes as our success rate improves
    const chanceThresholds = [0.75, 0.9, 0.5, 0]; // Will change crimes once we reach this probability of success for better all-round gains
    if (!crimeCommand) crimeCommand = ns.commitCrime(crime);
    let player = ns.getPlayer();
    let strRequirements = [];
    let crimeCount = 0;
    let forever = reqKills >= Number.MAX_SAFE_INTEGER || reqKarma >= Number.MAX_SAFE_INTEGER || reqStats >= Number.MAX_SAFE_INTEGER;
    if (reqKills) strRequirements.push(() => `${reqKills} kills (Have ${player.numPeopleKilled})`);
    if (reqKarma) strRequirements.push(() => `-${reqKarma} Karma (Have ${ns.heart.break()})`);
    if (reqStats) strRequirements.push(() => `${reqStats} of each combat stat (Have Str: ${player.strength}, Def: ${player.defense}, Dex: ${player.dexterity}, Agi: ${player.agility})`);
    let crime, lastCrime, lastStatusUpdateTime;
    while (forever || player.strength < reqStats || player.defense < reqStats || player.dexterity < reqStats || player.agility < reqStats || player.numPeopleKilled < reqKills || -ns.heart.break() < reqKarma) {
        let crimeChances = Object.fromEntries(bestCrimesByDifficulty.map(c => [c, ns.getCrimeChance(c)]));
        let needStats = player.strength < reqStats || player.defense < reqStats || player.dexterity < reqStats || player.agility < reqStats;
        let karma = -ns.heart.break();
        crime = crimeCount < 10 ? (crimeChances["homicide"] > 0.75 ? "homicide" : "mug") : // Start with a few fast & easy crimes to boost stats if we're just starting
            (!needStats && (player.numPeopleKilled < reqKills || karma < reqKarma)) ? "homicide" : // If *all* we need now is kills or Karma, homicide is the fastest way to do that
                bestCrimesByDifficulty.find((c, index) => doFastCrimesOnly ? index > 1 : crimeChances[c] >= chanceThresholds[index]); // Otherwise, crime based on success chance vs relative reward (precomputed)
        if (lastCrime != crime || (Date.now() - lastStatusUpdateTime) > statusUpdateInterval) {
            ns.print(`Committing "${crime}" (${(100 * crimeChances[crime]).toPrecision(3)}% success) ` + (forever ? 'forever...' : `until we reach ${strRequirements.map(r => r()).join(', ')}`));
            lastCrime = crime;
            lastStatusUpdateTime = Date.now();
        }
        ns.tail(); // Force a tail window open when auto-criming, or else it's very difficult to stop if it was accidentally closed.
        await ns.sleep(await crimeCommand(crime));
        while ((player = ns.getPlayer()).crimeType == `commit ${crime}` || player.crimeType == crime) // If we woke up too early, wait a little longer for the crime to finish
            await ns.sleep(10);
        crimeCount++;
    }
    ns.print(`Done committing crimes. Reached ${strRequirements.map(r => r()).join(', ')}`);
    return true;
}

/** @param {NS} ns */
async function legacyAutoCrime(ns, crime = "mug") {
    let interval = 100;
    while (true) {
        let maxBusyLoops = 100;
        while (ns.isBusy() && maxBusyLoops-- > 0) {
            await ns.sleep(interval);
            ns.print("Waiting to no longer be busy...");
        }
        if (maxBusyLoops <= 0) {
            ns.tprint("User have been busy for too long. auto-crime.js exiting...");
            return;
        }
        ns.tail(); // Force a tail window open when auto-criming, or else it's very difficult to stop if it was accidentally closed.
        let wait = ns.commitCrime(crime) + 10;
        ns.print(`Karma: ${formatNumberShort(ns.heart.break())} Committing crime \"${crime}\" and sleeping for ${formatDuration(wait)}...`);
        await ns.sleep(wait);
    }
}