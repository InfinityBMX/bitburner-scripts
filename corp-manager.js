import { formatMoney } from './utils/formats.js';

const CORP_NAME = 'ULDK';
const FIRST_INDUSTRY = 'Agriculture';
const FIRST_DIVISION = 'Devils Lettuce';

const SMART_SUPPLY = 'Smart Supply';

const SLOW_INTERVAL = 5000;
const FAST_INTERVAL = 1000;

const SETTING_MORALE_MIN = 50.00;
const SETTING_FIRST_UPGRADE_SIZE = 9;
const SETTING_FIRST_UPGRADE_SPREAD = {
  Operations: 2,
  Engineer: 2,
  Business: 1,
  "Research & Development": 2,
  Management: 2
};
const SETTING_SMART_FIRST_LEVEL = 10; // First upgrade batch of Smart Factories and Storage

const CITIES = [
  "Aevum",
  "Chongqing",
  "Sector-12",
  "New Tokyo",
  "Ishima",
  "Volhaven"
];

const UPGRADES = [
  "FocusWires",
  "Neural Accelerators",
  "Speech Processor Implants",
  "Nuoptimal Nootropic Injector Implants",
  "Smart Factories"
];

const POSITION_RANDD = 'Research & Development';
const POSITION_BUSINESS = 'Business';
const POSITION_ENGINEER = 'Engineer';
const POSITION_MANAGER = 'Management';
const POSITION_OPERATIONS = 'Operations';
const POSITIONS = [
  POSITION_RANDD,
  POSITION_ENGINEER,
  POSITION_MANAGER,
  POSITION_BUSINESS,
  POSITION_OPERATIONS
];

const PROD_SCORE = {};
PROD_SCORE[POSITION_RANDD] = { int: 1.5, cha: 0, exp: 0.8, cre: 1, eff: 0.5 };
PROD_SCORE[POSITION_ENGINEER] = { int: 1, cha: 0.1, exp: 1.5, cre: 0, eff: 1 };
PROD_SCORE[POSITION_MANAGER] = { int: 0, cha: 2, exp: 1, cre: 0.2, eff: 0.7 };
PROD_SCORE[POSITION_BUSINESS] = { int: 0.4, cha: 1, exp: 0.5, cre: 0, eff: 0 };
PROD_SCORE[POSITION_OPERATIONS] = { int: 0.6, cha: 0.1, exp: 1, cre: 0.5, eff: 1 };

const MATERIAL_HARDWARE = 'Hardware';
const MATERIAL_AI_CORES = 'AI Cores';
const MATERIAL_REAL_ESTATE = 'Real Estate';
const MATERIAL_ROBOTS = 'Robots';

const UPGRADE_SMART_FACTORIES = 'Smart Factories';
const UPGRADE_SMART_STORAGE = 'Smart Storage';

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('sleep');
  ns.tail();
  const { corporation } = ns;
  ns.print('Starting Corp Script');
  let counter;

  let player;
  while (!((player = ns.getPlayer()).hasCorporation)) {
    if (player.money > 150e9 && corporation.createCorporation(CORP_NAME, true)) {
      ns.print('Corp Established');
      break;
    }
    ns.sleep(SLOW_INTERVAL);
  }

  // Set up industry if not already done
  let corp = corporation.getCorporation();
  if (corp.divisions.length === 0) {
    ns.print('Creating Industry');
    corporation.expandIndustry(FIRST_INDUSTRY, FIRST_DIVISION);
  }

  // Buy Smart Supply - Should have money
  while (!corporation.hasUnlockUpgrade(SMART_SUPPLY)) {
    corporation.unlockUpgrade(SMART_SUPPLY);
    await ns.sleep(FAST_INTERVAL);
  }

  for (const city of CITIES) {
    corp = corporation.getCorporation();

    // Expand if not in city
    if (!corp.divisions[0].cities.includes(city)) {
      ns.print("Expanding to " + city);
      corporation.expandCity(FIRST_DIVISION, city);
    }
    let office = corporation.getOffice(FIRST_DIVISION, city);
    let employees = [...office.employees.map(employee => ns.corporation.getEmployee(FIRST_DIVISION, city, employee))];
    if (office.employees.length < 3) {
      ns.print("Hiring employees");
      for (let i = 1; i <= (3 - office.employees.length); i++) {
        // Hire 3 employees for each city
        employees.push(corporation.hireEmployee(FIRST_DIVISION, city));
      }
    }
    // Assign Employees
    ns.print("Assigning jobs to employees");
    await assignJobs(ns, employees, FIRST_DIVISION, city, { Operations: 1, Engineer: 1, Business: 1 });

    // Buy warehourse
    if (!corporation.hasWarehouse(FIRST_DIVISION, city)) {
      ns.print("Buying Warehouse");
      corporation.purchaseWarehouse(FIRST_DIVISION, city);
    }
    // Upgrade warehouse to 300
    ns.print("Upgrading the warehouse to 300");
    while (corporation.getWarehouse(FIRST_DIVISION, city).size < 300) {
      corporation.upgradeWarehouse(FIRST_DIVISION, city);
    }
    // Enable Smart Supply
    ns.print(`Enabling Smart Supply for ${ FIRST_DIVISION } in ${ corp.divisions[0].cities[0] }`);
    corporation.setSmartSupply(FIRST_DIVISION, city, true);
    // Now start selling Plants + Food
    ns.print("Setting sale prices for materials Plants + Food");
    corporation.sellMaterial(FIRST_DIVISION, city, "Plants", "MAX", "MP");
    corporation.sellMaterial(FIRST_DIVISION, city, "Food", "MAX", "MP");
    await ns.sleep(100);
  }

  // Cities set up, buy 1 AdVert
  if (corporation.getHireAdVertCount(FIRST_DIVISION) < 1) {
    // Buy one level of AdVert
    ns.print("Buying one round of AdVert");
    corporation.hireAdVert(FIRST_DIVISION);
  }

  for (const upgrade of UPGRADES) {
    // Level each upgrade twice
    for (let i = 1; i <= (2 - corporation.getUpgradeLevel(upgrade)); i++) {
      corporation.levelUpgrade(upgrade);
    }
    ns.print(`${ upgrade } is now level ${ corporation.getUpgradeLevel(upgrade) }`);
  }

  for (const city of CITIES) {
    ns.print(`Buying initial materials in ${ city }`);
    counter = 1;
    while (corporation.getMaterial(FIRST_DIVISION, city, MATERIAL_HARDWARE).qty < 125) {
      corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_HARDWARE, 12.5);
      corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_AI_CORES, 7.5);
      corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_REAL_ESTATE, 2700);
      // Wait for a tick - can't use 10 seconds becaue bonus times breaks the timing
      if (counter % 200 === 0) // 200 loops should be ~10 seconds
        ns.print(`Currently ${ corporation.getMaterial(FIRST_DIVISION, city, MATERIAL_HARDWARE).qty } hardware in ${city}`);
      counter++;
      await ns.sleep(50);
    }
    ns.print("Setting materials back down to 0 purchasing");
    corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_HARDWARE, 0);
    corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_AI_CORES, 0);
    corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_REAL_ESTATE, 0);
  }

  // Now wait for employee stats to improve
  ns.print(`Waiting for Morale to improve to at least ${SETTING_MORALE_MIN}`);
  while (minimumMorale(ns, FIRST_DIVISION) < SETTING_MORALE_MIN) await ns.sleep(10000);

  ns.print("*** Time to find investors!");
  if (corporation.getCorporation().funds > 100e9) {
    ns.print('Looks like we already accepted an offer');
  } else {
    let offer = corporation.getInvestmentOffer();
    ns.print(`Starting offer: ${ formatMoney(offer.funds) }`)
    // For the first offer, we want at least $10b
    while (offer.funds < 100e9) {
      ns.print(`Waiting 10 seconds for a better offer than ${ formatMoney(offer.funds) }`);
      await ns.sleep(10000);
      offer = corporation.getInvestmentOffer();
    }
    ns.print(`Accepting investment offer for $${ formatMoney(offer.funds) }!`);
    corporation.acceptInvestmentOffer();
  }

  // Upgrade corp again
  let upgradeList = [...CITIES];
  while (upgradeList.length) {
    for (const city of upgradeList) {
      let office = corporation.getOffice(FIRST_DIVISION, city);
      let employees = [...office.employees.map(employee => ns.corporation.getEmployee(FIRST_DIVISION, city, employee))];
      let expansion;

      // See if we need to upgrade
      if ((expansion = SETTING_FIRST_UPGRADE_SIZE - office.size)) {
        if (corporation.getCorporation().funds > corporation.getOfficeSizeUpgradeCost(FIRST_DIVISION, city, expansion)) {
          ns.print(`Adding ${ expansion } slots to ${ city }`);
          corporation.upgradeOfficeSize(FIRST_DIVISION, city, expansion);
        } else { // We need to upgrade but not enough money
          continue;
        }
      }
      // Upgraded or we didn't need to
      office = corporation.getOffice(FIRST_DIVISION, city);
      for (let i = 1; i <= (office.size - office.employees.length); i++) {
        employees.push(corporation.hireEmployee(FIRST_DIVISION, city));
      }
      ns.print(`Assigning jobs to employees in ${city}`);
      await assignJobs(ns, employees, FIRST_DIVISION, city, SETTING_FIRST_UPGRADE_SPREAD);

      upgradeList = upgradeList.filter(cty => cty !== city);
    }
    if (upgradeList.length)
      await ns.sleep(5000); // Probably didn't have enough money for all upgrades
  }

  // Upgrade Smart stuff to level 10 each
  ns.print("Upgrading Smart Factories + Smart Storage");
  while (corporation.getUpgradeLevel(UPGRADE_SMART_STORAGE) < SETTING_SMART_FIRST_LEVEL ||
  corporation.getUpgradeLevel(UPGRADE_SMART_FACTORIES) < SETTING_SMART_FIRST_LEVEL) {
    let upgradeList = [UPGRADE_SMART_FACTORIES, UPGRADE_SMART_STORAGE];
    for (const upgrade of upgradeList) {
      for (let i = 1; i <= SETTING_SMART_FIRST_LEVEL - corporation.getUpgradeLevel(upgrade); i++) {
        corporation.levelUpgrade(upgrade);
      }
      if (corporation.getUpgradeLevel(upgrade) === SETTING_SMART_FIRST_LEVEL) {
        ns.print(`${ upgrade } is now level ${ corporation.getUpgradeLevel(upgrade) }`);
        upgradeList = upgradeList.filter(upg => upg !== upgrade);
      } else {
        ns.print(`${upgrade} not fully upgraded. Sleeping.`);
      }
    }
    if (upgradeList.length)
      await ns.sleep(5000);
  }

  ns.print("Upgrading the warehouses to 2000");
  for (const city of CITIES) {
    // Upgrade the warehouse to fit at least 2000
    while (corporation.getWarehouse(FIRST_DIVISION, city).size < 2000) {
      if (corporation.getUpgradeWarehouseCost(FIRST_DIVISION, city) > corporation.getCorporation().funds) {
        await ns.sleep(5000);
      } else {
        corporation.upgradeWarehouse(FIRST_DIVISION, city);
      }
    }
  }

  // Buy more materials!
  ns.print("Buying additional materials in each city");
  for (const city of CITIES) {
    counter = 1;
    while (corporation.getMaterial(FIRST_DIVISION, city, MATERIAL_HARDWARE).qty < 2800) {
      corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_HARDWARE, 267.5);
      corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_ROBOTS, 9.6);
      corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_AI_CORES, 244.5);
      corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_REAL_ESTATE, 11940);
      if (counter % 200 === 0) // 200 loops should be ~10 seconds
        ns.print(`Currently ${ corporation.getMaterial(FIRST_DIVISION, city, MATERIAL_HARDWARE).qty } hardware in ${city}`);
      counter++;
      await ns.sleep(50);
    }
    ns.print("Setting materials back down to 0 purchasing");
    corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_HARDWARE, 0);
    corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_ROBOTS, 0);
    corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_AI_CORES, 0);
    corporation.buyMaterial(FIRST_DIVISION, city, MATERIAL_REAL_ESTATE, 0);
  }

  corp = ns.corporation.getCorporation();
  ns.print(`* Current funds: ${formatMoney(corp.funds)}`);
  ns.print("Waiting for 20 seconds for income to stabilize before finding investors...");
  await ns.sleep(20000);
  ns.print("*** GO FIND MORE INVESTORS!");
}

/** @param {NS} ns **/
const assignJobs = async (ns, employees, division, city, positions) => {
  ns.print(`Assigning ${employees.length} employees to jobs in ${city}.`);
  for (const position of POSITIONS) {
    if (positions[position]) {
      let emps = employees.sort((emp1, emp2) => prodScore(emp1, position) - prodScore(emp2, position)).splice(0, positions[position]);
      for (const emp of emps) {
        if (emp.pos !== position) {
          await ns.corporation.assignJob(division, city, emp.name, position)
        }
      }
    }
  }
}

// RandD 1.5 INT           .8 EXP  1 CRE  .5 Eff
// Eng     1 INT  .1 CHA  1.5 EXP          1 Eff
// Mng             2 CHA    1 EXP .2 CRE  .7 Eff
// Bus    .4 INT   1 CHA   .5 EXP
// Oper   .6 INT  .1 CHA    1 EXP .5 CRE   1 Eff

const prodScore = (employee, position) => {
  return employee.int * PROD_SCORE[position].int +
    employee.cha * PROD_SCORE[position].cha +
    employee.exp * PROD_SCORE[position].exp +
    employee.cre * PROD_SCORE[position].cre +
    employee.eff * PROD_SCORE[position].eff;
}

/** @param {NS} ns **/
export const minimumMorale = (ns, division) => {
  return Math.min( // Turn cities into employees and reduce to find the lowest morale in each city then min that. huzzah
    ...CITIES.map(city => ns.corporation.getOffice(division, city).employees.reduce((prev, employee) => Math.min(ns.corporation.getEmployee(division, city, employee).mor, prev), 100))
  );
}