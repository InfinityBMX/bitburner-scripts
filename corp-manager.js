import { formatMoney, formatNumberShort } from './utils/formats.js';

// Names
const CORP_NAME = 'ULDK';
const FIRST_INDUSTRY = 'Agriculture';
const FIRST_DIVISION = 'Devils Lettuce';
const SECOND_INDUSTRY = 'Tobacco';
const SECOND_DIVISION = 'Old Smokey';

const SLOW_INTERVAL = 5000;
const FAST_INTERVAL = 1000;

// Constants
const SMART_SUPPLY = 'Smart Supply';
const MATERIAL_HARDWARE = 'Hardware';
const MATERIAL_AI_CORES = 'AI Cores';
const MATERIAL_REAL_ESTATE = 'Real Estate';
const MATERIAL_ROBOTS = 'Robots';
const UPGRADE_SMART_FACTORIES = 'Smart Factories';
const UPGRADE_SMART_STORAGE = 'Smart Storage';
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

// Settings
const SETTING_MORALE_MIN = 50.00;
const SETTING_FIRST_OFFER_MIN = 100e9;
const SETTING_FIRST_UPGRADE_SIZE = 9;
const SETTING_FIRST_UPGRADE_SPREAD = {
  Operations: 2,
  Engineer: 2,
  Business: 1,
  "Research & Development": 2,
  Management: 2
};
const SETTING_SMART_FIRST_LEVEL = 10; // First upgrade batch of Smart Factories and Storage
const SETTING_FIRST_MATERIALS = {
  [MATERIAL_HARDWARE]: 125,
  [MATERIAL_ROBOTS]: 0,
  [MATERIAL_AI_CORES]: 75,
  [MATERIAL_REAL_ESTATE]: 27000
};
const SETTING_SECOND_MATERIALS = {
  [MATERIAL_HARDWARE]: 2800,
  [MATERIAL_ROBOTS]: 96,
  [MATERIAL_AI_CORES]: 2520,
  [MATERIAL_REAL_ESTATE]: 146400
};
const SETTING_THIRD_MATERIALS = {
  [MATERIAL_HARDWARE]: 9300,
  [MATERIAL_ROBOTS]: 726,
  [MATERIAL_AI_CORES]: 6270,
  [MATERIAL_REAL_ESTATE]: 230400
};
const SETTING_SECOND_OFFER_MIN = 2e12;

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

const PROD_SCORE = {
  [POSITION_RANDD]: { int: 1.5, cha: 0, exp: 0.8, cre: 1, eff: 0.5 },
  [POSITION_ENGINEER]: { int: 1, cha: 0.1, exp: 1.5, cre: 0, eff: 1 },
  [POSITION_MANAGER]: { int: 0, cha: 2, exp: 1, cre: 0.2, eff: 0.7 },
  [POSITION_BUSINESS]: { int: 0.4, cha: 1, exp: 0.5, cre: 0, eff: 0 },
  [POSITION_OPERATIONS]: { int: 0.6, cha: 0.1, exp: 1, cre: 0.5, eff: 1 }
};

const DEFAULT_MATERIALS = {
  [MATERIAL_HARDWARE]: 0,
  [MATERIAL_ROBOTS]: 0,
  [MATERIAL_AI_CORES]: 0,
  [MATERIAL_REAL_ESTATE]: 0
};

const DEFAULT_INDUSTRY_SETTINGS = {
  employees: 3,
  jobs: { Operations: 1, Engineer: 1, Business: 1 },
  warehouse: 300,
  materials: DEFAULT_MATERIALS
}

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('sleep');
  ns.tail();
  const { corporation } = ns;
  ns.print('Starting Corp Script');
  let counter, offer, player;
  while (!((player = ns.getPlayer()).hasCorporation)) {
    if (player.money > 150e9 && corporation.createCorporation(CORP_NAME, true)) {
      ns.print('Corp Established');
      break;
    }
    await ns.sleep(SLOW_INTERVAL);
  }

  // Buy Smart Supply - Should have money
  while (!corporation.hasUnlockUpgrade(SMART_SUPPLY)) {
    corporation.unlockUpgrade(SMART_SUPPLY);
    await ns.sleep(FAST_INTERVAL);
  }

  // Set up industry if not already done
  await updateDivision(ns, FIRST_INDUSTRY, FIRST_DIVISION, DEFAULT_INDUSTRY_SETTINGS);
  for (const city of CITIES) {
    // Now start selling Plants + Food
    ns.print(`Setting sale prices for materials Plants + Food in ${city}`);
    ns.corporation.sellMaterial(FIRST_DIVISION, city, "Plants", "MAX", "MP");
    ns.corporation.sellMaterial(FIRST_DIVISION, city, "Food", "MAX", "MP");
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
    await updateMaterials(ns, FIRST_DIVISION, city, SETTING_FIRST_MATERIALS);
  }

  // Now wait for employee stats to improve
  ns.print(`Waiting for Morale to improve to at least ${SETTING_MORALE_MIN}`);
  while (minimumMorale(ns, FIRST_DIVISION) < SETTING_MORALE_MIN) await ns.sleep(10000);

  ns.print("*** Time to find investors!");
  offer = corporation.getInvestmentOffer();
  if (offer.round > 1) {
    ns.print('Looks like we already accepted an offer');
  } else {
    let offer = corporation.getInvestmentOffer();
    ns.print(`Starting offer: ${ formatMoney(offer.funds) }`)
    // For the first offer, we want at least $100b
    counter = 1;
    while ((offer = corporation.getInvestmentOffer()).funds < SETTING_FIRST_OFFER_MIN) {
      if (counter % 30 === 0) {
        ns.print(`Waited ${ counter } loops for first offer above ${ formatNumberShort(SETTING_FIRST_OFFER_MIN) }. Most recent offer: ${ formatMoney(offer.funds) }`);
        ns.tprint(`Waited ${ counter } loops for first offer above ${ formatNumberShort(SETTING_FIRST_OFFER_MIN) }. Most recent offer: ${ formatMoney(offer.funds) }`);
      }
      await ns.sleep(10000);
      counter++;
    }
    ns.print(`Accepting investment offer for $${ formatMoney(offer.funds) }!`);
    corporation.acceptInvestmentOffer();
  }

  // Upgrade corp again
  await updateDivision(ns, FIRST_INDUSTRY, FIRST_DIVISION, {
    ...DEFAULT_INDUSTRY_SETTINGS,
    employees: SETTING_FIRST_UPGRADE_SIZE,
    jobs: SETTING_FIRST_UPGRADE_SPREAD
  });

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
  await updateDivision(ns, FIRST_INDUSTRY, FIRST_DIVISION, { ...DEFAULT_INDUSTRY_SETTINGS, warehouse: 2000 });

  // Buy more materials!
  ns.print("Buying additional materials in each city");
  for (const city of CITIES) {
    await updateMaterials(ns, FIRST_DIVISION, city, SETTING_SECOND_MATERIALS);
  }

  ns.print(`* Current funds: ${formatMoney(ns.corporation.getCorporation().funds)}`);
  ns.print("Waiting for 20 seconds for income to stabilize before finding investors...");
  await ns.sleep(20000);

  ns.print("*** GO FIND MORE INVESTORS!");
  offer = corporation.getInvestmentOffer();
  if (offer.round > 2) {
    ns.print('Looks like we already accepted an offer');
  } else {
    let offer = corporation.getInvestmentOffer();
    ns.print(`Starting offer: ${ formatMoney(offer.funds) }`)
    // For the second offer, we want at least $2t
    counter = 1;
    while ((offer = corporation.getInvestmentOffer()).funds < SETTING_SECOND_OFFER_MIN) {
      if (counter % 30 === 0) {
        ns.print(`Waited ${counter} loops for second offer above ${formatNumberShort(SETTING_SECOND_OFFER_MIN)}. Most recent offer: ${formatMoney(offer.funds)}`);
        ns.tprint(`Waited ${counter} loops for second offer above ${formatNumberShort(SETTING_SECOND_OFFER_MIN)}. Most recent offer: ${formatMoney(offer.funds)}`);
      }
      await ns.sleep(10000);
      counter++;
    }
    ns.print(`Accepting investment offer for $${formatMoney(offer.funds)}!`);
    corporation.acceptInvestmentOffer();
  }

  // Upgrade the warehouses to 3800
  await updateDivision(ns, FIRST_INDUSTRY, FIRST_DIVISION, { ...DEFAULT_INDUSTRY_SETTINGS, warehouse: 3800 });

  // Buy more materials
  ns.print("Buying additional materials in each city");
  for (const city of CITIES) {
    await updateMaterials(ns, FIRST_DIVISION, city, SETTING_THIRD_MATERIALS);
  }
  ns.print(`Done with ${FIRST_DIVISION}!`);

  // Start Division 2
  ns.print(`Creating ${SECOND_DIVISION} in the ${SECOND_INDUSTRY} Industry`);
  await updateDivision(ns, SECOND_INDUSTRY, SECOND_DIVISION, DEFAULT_INDUSTRY_SETTINGS);
}

/**
 * @param {NS} ns
 * @param {Employee[]} employees
 * @param {string} division
 * @param {string} city
 * @param {object} positions
 * @returns {void}
**/
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

/**
 * @param {Employee} employee
 * @param {string} position
 * @returns {number}
 **/
const prodScore = (employee, position) => {
  return employee.int * PROD_SCORE[position].int +
    employee.cha * PROD_SCORE[position].cha +
    employee.exp * PROD_SCORE[position].exp +
    employee.cre * PROD_SCORE[position].cre +
    employee.eff * PROD_SCORE[position].eff;
}

/**
 * @param {NS} ns
 * @param {string} division
 * @returns {number}
**/
export const minimumMorale = (ns, division) => {
  return Math.min( // Turn cities into employees and reduce to find the lowest morale in each city then min that. huzzah
    ...CITIES.map(city => ns.corporation.getOffice(division, city).employees.reduce((prev, employee) => Math.min(ns.corporation.getEmployee(division, city, employee).mor, prev), 100))
  );
}

/**
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @param {string} material
 * @param {number} desired
 * @returns {number}
**/
const matsPerTick = (ns, division, city, material, desired) => ((desired - ns.corporation.getMaterial(division, city, material).qty) / 10);

/**
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @param {object} materialSetting
 * @returns {boolean}
**/
const matsAtLevel = (ns, division, city, materialSetting) => {
  return (ns.corporation.getMaterial(division, city, MATERIAL_HARDWARE).qty >= materialSetting[MATERIAL_HARDWARE]) &&
    (ns.corporation.getMaterial(division, city, MATERIAL_ROBOTS).qty >= materialSetting[MATERIAL_ROBOTS]) &&
    (ns.corporation.getMaterial(division, city, MATERIAL_AI_CORES).qty >= materialSetting[MATERIAL_AI_CORES]) &&
    (ns.corporation.getMaterial(division, city, MATERIAL_REAL_ESTATE).qty >= materialSetting[MATERIAL_REAL_ESTATE])
}

/**
 * @param {NS} ns
 * @param {string} industry
 * @param {string} division
 * @param {object} settings
 **/
const updateDivision = async (ns, industry, division, settings = DEFAULT_INDUSTRY_SETTINGS) => {
  while (!ns.corporation.getDivision(division)) {
    ns.print('Creating Industry');
    ns.corporation.expandIndustry(industry, division);
    if (ns.corporation.getDivision(division))
      break;
    await ns.sleep(SLOW_INTERVAL);
  }

  for (const city of CITIES) {
    // Expand if not in city
    if (!ns.corporation.getDivision(division).cities.includes(city)) {
      ns.print(`Expanding ${division} to ${city}`);
      ns.corporation.expandCity(division, city);
    }

    // Make sure office has capacity for the employees we want
    let office;
    while ((office = ns.corporation.getOffice(division, city)).size < settings.employees) {
      let upgradeSize = settings.employees - office.size;
      if (ns.corporation.getOfficeSizeUpgradeCost(division, city, upgradeSize) <= ns.corporation.getCorporation().funds) {
        ns.corporation.upgradeOfficeSize(division, city, upgradeSize);
      } else
        await ns.sleep(FAST_INTERVAL);
    }

    // Hire new employees if we need to
    let employees = [
      ...office.employees.map(employee => ns.corporation.getEmployee(division, city, employee))
    ];
    if (employees.length < settings.employees) {
      ns.print("Hiring ${employees.length settings} employees in ${city}");
      for (let i = 1; i <= (settings.employees - employees.length); i++) {
        // Hire 3 employees for each city
        employees.push(ns.corporation.hireEmployee(division, city));
      }
    }

    // Assign Employees
    ns.print("Assigning jobs to employees");
    await assignJobs(ns, employees, division, city, settings.jobs);

    // Buy warehourse
    if (!ns.corporation.hasWarehouse(division, city)) {
      ns.print(`Buying Warehouse in ${city}`);
      ns.corporation.purchaseWarehouse(division, city);
    }

    // Upgrade warehouse to settings.warehouse
    ns.print(`Upgrading the warehouse to ${settings.warehouse}`);
    while (ns.corporation.getWarehouse(division, city).size < settings.warehouse) {
      if (ns.corporation.getCorporation().funds >= ns.corporation.getUpgradeWarehouseCost(division, city))
        ns.corporation.upgradeWarehouse(division, city);
      await ns.sleep(FAST_INTERVAL);
    }

    // Enable Smart Supply
    ns.print(`Enabling Smart Supply for ${division} in ${city}`);
    ns.corporation.setSmartSupply(division, city, true);
    await ns.sleep(100);
  }
}

/**
 * @param {NS} ns
 * @param {string} division
 * @param {string} city
 * @param {object} materials
 **/
const updateMaterials = async (ns, division, city, materials) => {
  ns.print(`Updating materials in ${ city }`);
  let counter = 1;
  while (!matsAtLevel(ns, division, city, materials)) {
    ns.corporation.buyMaterial(
      division,
      city,
      MATERIAL_HARDWARE,
      matsPerTick(ns, division, city, MATERIAL_HARDWARE, materials[MATERIAL_HARDWARE])
    );
    ns.corporation.buyMaterial(
      division,
      city,
      MATERIAL_AI_CORES,
      matsPerTick(ns, division, city, MATERIAL_AI_CORES, materials[MATERIAL_AI_CORES])
    );
    ns.corporation.buyMaterial(
      division,
      city,
      MATERIAL_REAL_ESTATE,
      matsPerTick(ns, division, city, MATERIAL_REAL_ESTATE,materials[MATERIAL_REAL_ESTATE])
    );
    // Wait for a tick - can't use 10 seconds becaue bonus times breaks the timing
    if (counter % 200 === 0) // 200 loops should be ~10 seconds
      ns.print(`Currently ${ns.corporation.getMaterial(FIRST_DIVISION, city, MATERIAL_HARDWARE).qty} hardware in ${city}`);
    counter++;
    await ns.sleep(50);
  }
  ns.print("Setting materials back down to 0 purchasing");
  ns.corporation.buyMaterial(division, city, MATERIAL_HARDWARE, 0);
  ns.corporation.buyMaterial(division, city, MATERIAL_AI_CORES, 0);
  ns.corporation.buyMaterial(division, city, MATERIAL_REAL_ESTATE, 0);
}