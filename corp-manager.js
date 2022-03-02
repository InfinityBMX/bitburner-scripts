import { formatMoney, formatNumberShort } from './utils/formats.js';
//import {NS} from './';

// Names
const CORP_NAME = 'ULDK';
const FIRST_INDUSTRY = 'Agriculture';
const FIRST_DIVISION = 'Devils Lettuce';
const SECOND_INDUSTRY = 'Tobacco';
const SECOND_DIVISION = 'Ol Smokey';
const TOBACCO_PRFX = 'Tobacco v';

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
const CITY_AEVUM = 'Aevum';
const CITIES = [
  CITY_AEVUM,
  "Chongqing",
  "Sector-12",
  "New Tokyo",
  "Ishima",
  "Volhaven"
];
const EARLY_UPGRADES = [
  "FocusWires",
  "Neural Accelerators",
  "Speech Processor Implants",
  "Nuoptimal Nootropic Injector Implants"
];
const UPGRADES = [
  ...EARLY_UPGRADES,
  "Smart Factories",
  "Smart Storage",
  "ABC SalesBots",
  "DreamSense",
  "Project Insight"
]
const UNLOCKS = [
  SMART_SUPPLY,
  "Market Research - Demand",
  "Market Data - Competition",
  "VeChain",
  "Shady Accounting",
  "Government Partnership"
];
const WILSON = "Wilson Analytics";
const PRODUCT_CAPACITY_UPGRADE = "uPgrade: Capacity.I";
const HIGH_TECH_LAB = "Hi-Tech R&D Laboratory";
const MARKET_TA1 = "Market-TA.I";
const MARKET_TA2 = "Market-TA.II";

// Settings
// Industry 1
const SETTING_MORALE_MIN = 99.00;
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
// Industry 2
const SETTING_UPGRADES_MIN = 20;
const SETTING_WILSON_MIN = 14;
const SETTING_EARLY_WILSON_CAP = 0.20; // Money ratio before Min
const SETTING_EARLY_UPGRADE_CAP = 0.10; // Money ratio before min
const SETTING_LATE_WILSON_CAP = 0.05;
const SETTING_LATE_UPGRADE_CAP = 0.025;
const SETTING_AD_CAP = 0.05;
const SETTING_PRODUCT_CAP = 0.20;
const SETTING_SIZE_CAP = 0.20;
const SETTING_WAREHOUSE_CAP = 0.05;
const SETTING_WAREHOUSE_MIN = 3000;
const SETTING_OUTPUT_INTERVAL = 250;

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
  employees: {
    "All": 3,
    // "Aevum": 3,
    // "Chongqing": 3,
    // "Sector-12": 3,
    // "New Tokyo": 3,
    // "Ishima": 3,
    // "Volhaven": 3
  },
  jobs: {
    "All":
      {
        Operations: 1,
        Engineer: 1,
        Business: 1
      }
  },
  warehouse: 300,
  materials: DEFAULT_MATERIALS,
  forceAssign: false
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

  for (const upgrade of EARLY_UPGRADES) {
    // Level each upgrade twice
    counter = 1;
    while (corporation.getUpgradeLevel(upgrade) < 2) {
      if (corporation.getCorporation().funds >= corporation.getUpgradeLevelCost(upgrade))
        corporation.levelUpgrade(upgrade);
      else {
        if (counter % 10 === 0)
          ns.print(`Waiting for funds to upgrade ${upgrade}`);
        await ns.sleep(SLOW_INTERVAL);
        counter++
      }
    }
    ns.print(`${upgrade} is now level ${corporation.getUpgradeLevel(upgrade)}`);
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
    employees: {
      "All": SETTING_FIRST_UPGRADE_SIZE
    },
    jobs: {
      "All": SETTING_FIRST_UPGRADE_SPREAD
    }
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

  ns.print("*** GO FIND MORE INVESTORS!");
  offer = corporation.getInvestmentOffer();
  if (offer.round > 2) {
    ns.print('Looks like we already accepted an offer');
  } else {
    ns.print("Waiting for 20 seconds for income to stabilize before finding investors...");
    await ns.sleep(20000);
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

  /* EXPAND TO FIRST PRODUCT! */
  // Start Division 2
  ns.print(`Creating ${SECOND_DIVISION} in the ${SECOND_INDUSTRY} Industry`);
  // Set Aevum to 30, all other offices to 15 people, buy warehouses
  await updateDivision(ns, SECOND_INDUSTRY, SECOND_DIVISION, {
    ...DEFAULT_INDUSTRY_SETTINGS,
    employees: {
      "All": 15,
      "Aevum": 30
    },
    jobs: {
      "All": getEvenSpread(15),
      "Aevum": getEvenSpread(30)
    },
    forceAssign: true
  });

  // Accept another bunch of money. Possibly a bad deal
  // ns.corporation.acceptInvestmentOffer();

  // Just go public. not selling stock so why wait?
  if (ns.corporation.goPublic(0)) {
    ns.print("🎉🎉🎉 WE HAVE IPO!!!");
    ns.corporation.issueDividends(0.2);
  }

  // All done. Passive mode
  ns.print("Beginning corporation maintenance loop");
  counter = 1;
  while ( true ) {
    let output = counter % SETTING_OUTPUT_INTERVAL === 0;
    await productLoop(ns, SECOND_INDUSTRY, SECOND_DIVISION, output);
    if (output) ns.print(`Loop: ${counter}`);
    await ns.sleep(FAST_INTERVAL);
    counter++;
  }
}

/**
 * @param {NS} ns
 * @param {Employee[]} employees
 * @param {string} division
 * @param {string} city
 * @param {object} positions
 * @returns {void}
 **/
const assignJobs = async (ns, employees, division, city, positions, output = true) => {
  ns.print(`Assigning ${employees.length} employees to jobs in ${city}.`);
  if (output) ns.print((Object.keys(positions).map(key => `${key}: ${positions[key]}`).join(' ')));
  for (const position of POSITIONS) {
    if (positions[position]) {
      let emps = employees.sort((emp1, emp2) => prodScore(emp2, position) - prodScore(emp1, position)).splice(0, positions[position]);
      ns.print(`Assigning ${emps.length} employees to ${position}`);
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
    let updateSpread = false;
    // Expand if not in city
    if (!ns.corporation.getDivision(division).cities.includes(city)) {
      ns.print(`Expanding ${division} to ${city}`);
      ns.corporation.expandCity(division, city);
    }

    // Make sure office has capacity for the employees we want
    let office;
    // Size priority is "City" > "All" > 0 so we can set individual city employment
    let finalSize = settings.employees[city] ?
      settings.employees[city] :
      settings.employees["All"] ?
        settings.employees["All"] :
        0;
    while ((office = ns.corporation.getOffice(division, city)).size < finalSize) {
      let upgradeSize = finalSize - office.size;
      if (ns.corporation.getOfficeSizeUpgradeCost(division, city, upgradeSize) <= ns.corporation.getCorporation().funds) {
        ns.corporation.upgradeOfficeSize(division, city, upgradeSize);
      } else
        await ns.sleep(FAST_INTERVAL);
    }

    // Hire new employees if we need to
    if (ns.corporation.getOffice(division, city).employees.length < finalSize) {
      ns.print(`Hiring up to ${finalSize} employees in ${city}`);
      while (ns.corporation.getOffice(division, city).employees.length < finalSize) {
        // Hire 3 employees for each city
        ns.corporation.hireEmployee(division, city);
        updateSpread = true;
      }
    }

    // Assign Employees
    // Spread priority is "City" > "All" > {} so we can set individual city assignments
    if (updateSpread || ns.corporation.getOffice(division, city).employeeProd.Unassigned > 0) {
      let employees = [
        ...ns.corporation.getOffice(division, city).employees.map(employee => ns.corporation.getEmployee(division, city, employee))
      ];
      ns.print("Assigning jobs to employees");
      let jobSpread = settings.jobs[city] ?
        settings.jobs[city] :
        settings.jobs["All"] ?
          settings.jobs["All"] :
          {}; // Shouldn't happen
      await assignJobs(ns, employees, division, city, jobSpread);
    }

    // Buy warehourse
    if (!ns.corporation.hasWarehouse(division, city)) {
      ns.print(`Buying Warehouse in ${city}`);
      ns.corporation.purchaseWarehouse(division, city);
    }

    // Upgrade warehouse to settings.warehouse
    if (ns.corporation.getWarehouse(division, city).size < settings.warehouse) {
      ns.print(`Upgrading the warehouse to ${settings.warehouse}`);
      while (ns.corporation.getWarehouse(division, city).size < settings.warehouse) {
        if (ns.corporation.getCorporation().funds >= ns.corporation.getUpgradeWarehouseCost(division, city))
          ns.corporation.upgradeWarehouse(division, city);
        await ns.sleep(FAST_INTERVAL);
      }
    }

    // Enable Smart Supply
    if (ns.corporation.hasUnlockUpgrade(SMART_SUPPLY) && !ns.corporation.getWarehouse(division, city).smartSupplyEnabled) {
      ns.print(`Enabling Smart Supply for ${division} in ${city}`);
      ns.corporation.setSmartSupply(division, city, true);
    }
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

const getEvenSpread = (population) => {
  return {
    Operations: Math.floor(population / 5),
    Engineer: Math.floor(population / 5),
    Business: Math.floor(population / 5),
    "Research & Development": Math.floor(population / 5) + (population % 5),
    Management: Math.floor(population / 5)
  }
}

/**
 * Calculate the next product name
 * @param {NS} ns
 * @param {string} division The division we're building in
 * @returns the next product name
 */
function nextProductName(ns, division) {
  let lastNumber = ns.corporation.getDivision(division).products.reduce(
    (previous, product) => Math.max(previous, product.slice(TOBACCO_PRFX.length)) , 0);
  // No products returns 0, otherwise last number
  return TOBACCO_PRFX + (lastNumber + 1);
}

/**
 * Discontinue the weakest product (based on demand)
 * @param {NS} ns
 * @param {*} division The division we're building in
 */
async function discontinueWeakestProduct(ns, division) {
  let product_names = ns.corporation.getDivision(division).products.sort(
    (a, b) => ns.corporation.getProduct(division, a).dmd - ns.corporation.getProduct(division, b).dmd);
  // Safety net, don't discontinue if we have no products
  if (product_names.length < 3) return
  // Sell all of it at MP to get rid of all inventory
  let weakestProduct = ns.corporation.getProduct(division, product_names[0]);
  if (weakestProduct.cityData[CITY_AEVUM][0] > 1000) {
    ns.print(`Selling off ${weakestProduct.name}`);
    ns.corporation.setProductMarketTA2(division, weakestProduct.name, false);
    ns.corporation.sellProduct(division, CITY_AEVUM, product_names[0], "MAX", "MP", true);
    ns.print("Waiting 10 seconds...");
    await ns.sleep(10000); // wait 10 seconds to sell inventory
  }
  ns.print(`Discontinuing ${weakestProduct.name}`);
  // Now discontinue once we're done selling
  ns.corporation.discontinueProduct(division, weakestProduct.name);
}

/**
 * @param {NS} ns
 * @param {string} industry
 * @param {string} division
 * @param {boolean} output
 * @returns {Promise<void>}
 */
const productLoop = async (ns, industry, division, output) => {
  // Check product creation and create if not currently
  // Could be a while if product nearly completed
  // Checks to make sure we have 3 products including one being created
  // If a product is near 95% completion, wait until it's done to move on
  if (output) ns.print('Managing Products');
  await manageProducts(ns, division, output);

  // Check Wilson against threshold (14)
  // Upgrade at a higher fund rate up to 14
  // Upgrade 1 lever per round max
  if (ns.corporation.getUpgradeLevel(WILSON) < SETTING_WILSON_MIN) {
    levelUpgrade(ns, WILSON, SETTING_EARLY_WILSON_CAP);
  }

  // Check Upgrades against threshold (20)
  // Upgrade at a higher fund rate up to 20
  // Upgrade 1 level per round max
  for (const upgrade of EARLY_UPGRADES) {
    if (ns.corporation.getUpgradeLevel(upgrade) < SETTING_UPGRADES_MIN) {
      levelUpgrade(ns, upgrade, SETTING_EARLY_UPGRADE_CAP);
    }
  }

  // Check ads against money
  // Buy ad if cost below funds threshold
  // Only buy 1 per round
  let adFunds = ns.corporation.getCorporation().funds * SETTING_AD_CAP;
  let adCost = ns.corporation.getHireAdVertCost(division)
  if (adFunds > adCost) {
    ns.print(`Hiring AdVert for ${formatMoney(ns.corporation.getHireAdVertCost(division))}`);
    ns.corporation.hireAdVert(division);
  } else if (output)
    ns.print(`Current Ad Funds: $${formatMoney(adFunds)} Ad Cost: $${formatMoney(adCost)}`);

  // Check all upgrades against money
  // Upgrade infinitely as long as upgrade cost is below funds threshold
  // Upgrade each up to 1 level per round
  if (output) ns.print('Checking for upgrades');
  for (const upgrade of [WILSON,...UPGRADES]) {
    levelUpgrade(ns, upgrade, upgrade === WILSON ? SETTING_LATE_WILSON_CAP : SETTING_LATE_UPGRADE_CAP, output);
  }

  // Check expansion against money
  // Expand AEVUM first then catch everyone up to AEVUM - 15
  let size = {
    max: 0
  }; // will contain cities as keys with office sizes and max as largest non-aevum size
  CITIES.forEach(city => {
    let officeSize = ns.corporation.getOffice(division, city).size;
    size[city] = officeSize;
    if (city !== CITY_AEVUM && officeSize > size.max)
      size.max = officeSize;
  });
  if (output) ns.print(Object.keys(size).map(key => `${key}: ${size[key]}`).join(' '));
  for (const city of CITIES) {
    let expansionBudget = ns.corporation.getCorporation().funds * SETTING_SIZE_CAP;
    let increase = 0;
    // upgrade if under cap and other cities have caught up
    if (
      (city === CITY_AEVUM && size[city] <= size.max + 15) || // Aevum and others have caught up
      (size[city] < size.max || size[city] < size[CITY_AEVUM] - 15) && // Others and not caught up
      expansionBudget >= ns.corporation.getOfficeSizeUpgradeCost(division, city, 15)) {
      increase = 15;
    }
    let settings = {
      ...DEFAULT_INDUSTRY_SETTINGS,
      employees: {
        [city]: size[city] + increase
      },
      jobs: {
        [city]: getEvenSpread(size[city] + increase)
      }
    }
    await updateDivision(ns, industry, division, settings);
  }

  // Warehouses should be at least 3000
  // Upgrade 1 level per round until MIN if we have money
  for (const city of CITIES) {
    let warehouseBudget = ns.corporation.getCorporation().funds * SETTING_WAREHOUSE_CAP;
    if (ns.corporation.getWarehouse(division, city).size < SETTING_WAREHOUSE_MIN &&
      warehouseBudget > ns.corporation.getUpgradeWarehouseCost(division, city)) {
      ns.corporation.upgradeWarehouse(division, city);
    }
  }

  // Check research
  // Immediately research if able to. Probably best to not wipe out all research but YOLO
  for (const research of [HIGH_TECH_LAB, MARKET_TA1, MARKET_TA2]) {
    if (!ns.corporation.hasResearched(division, research)) {
      if (ns.corporation.getResearchCost(division, research) < ns.corporation.getDivision(division).research)
        ns.corporation.research(division, research);
    }
  }

  // Check Unlocks
  for (const unlock of UNLOCKS) {
    if (!ns.corporation.hasUnlockUpgrade(unlock) && ns.corporation.getCorporation().funds > ns.corporation.getUnlockUpgradeCost(unlock)) {
      ns.corporation.unlockUpgrade(unlock);
      ns.print(`Unlocking ${unlock}`);
    }
  }
}

/**
 * @param {NS} ns
 * @param {string} division
 * @param {boolean} output
 * @returns {Promise<void>}
 */
const manageProducts = async (ns, division, output = false) => {
  // See if we're creating a product
  let product = ns.corporation.getDivision(division).products.find(
    prod => ns.corporation.getProduct(division, prod).developmentProgress < 100);
  // If so, see if we're almost done
  if (product) {
    if (output) ns.print(`${product} is ${ns.corporation.getProduct(division, product).developmentProgress}% complete.`);
    if (ns.corporation.getProduct(division, product).developmentProgress > 95) {
      // Product almost done
      ns.print(`${product} is ${ns.corporation.getProduct(division, product).developmentProgress}% complete. Waiting.`);
      while ( ns.corporation.getProduct(division, product).developmentProgress < 100 ) {
        await ns.sleep(FAST_INTERVAL);
      }
      // Selling should be picked up below
    }
  } else { // If not, start
    if ((ns.corporation.getDivision(division).products).length === 3) {
      // discontinue worst
      await discontinueWeakestProduct(ns, division);
    }
    // Create new one with X% of funds
    let productInvestment = Math.floor((ns.corporation.getCorporation().funds * SETTING_PRODUCT_CAP) / 2);
    ns.corporation.makeProduct(division, CITY_AEVUM, nextProductName(ns, division), productInvestment, productInvestment);
  }
  // Make sure all products are being sold
  for (const product of ns.corporation.getDivision(division).products.map(prod => ns.corporation.getProduct(division, prod))) {
    // ns.print(`Prod: ${product.name} sCost: ${product.sCost} prod: ${product.cityData[CITY_AEVUM][1]} sell: ${product.cityData[CITY_AEVUM][2]}`);
    // Sell starts at 0, make it MP*1
    if (!isNaN(product.sCost) || !product.sCost.includes('MP')) {
      ns.corporation.sellProduct(division, CITY_AEVUM, product.name, 'MAX', 'MP*1', true);
    }
    // If we have TA2, use it
    if (ns.corporation.hasResearched(division, MARKET_TA2)) {
      if (product.cityData[CITY_AEVUM][0] < 1000)
        ns.corporation.setProductMarketTA2(division, product.name, true);
      else
        ns.corporation.sellProduct(division, CITY_AEVUM, product.name, 'MAX', 'MP*1', true);
    } else {
      // We don't have TA2, change price if we're not selling out
      if (product.cityData[CITY_AEVUM][1] > product.cityData[CITY_AEVUM][2]) {
        // if production > sold, lower price
        let currentMult = Number(product.sCost.slice('MP*'.length));
        // if currently MP*1 or less, cut price in half instead of subtracting 1
        ns.corporation.sellProduct(division, CITY_AEVUM, product.name, 'MAX', 'MP*' + (currentMult <= 1 ? currentMult * 0.5 : currentMult - 1), true);
      } else if (product.cityData[CITY_AEVUM][1] / product.cityData[CITY_AEVUM][2] < 0.95) {
        // if demand is more than 5% above supply, increase price
        let currentMult = Number(product.sCost.slice('MP*'.length));
        ns.corporation.sellProduct(division, CITY_AEVUM, product.name, 'MAX', 'MP*' + (currentMult < 1 ? 1 : currentMult + 1), true);
      }
    }
  }
}

/**
 * See if we can upgrade and do so if we can
 * @param {NS} ns
 * @param {string} upgrade
 * @param {number} cap
 * @returns {boolean}
 */
const levelUpgrade = (ns, upgrade, cap) => {
  if (ns.corporation.getCorporation().funds * cap > ns.corporation.getUpgradeLevelCost(upgrade)) {
    ns.print(`Upgrading ${upgrade} for ${formatMoney(ns.corporation.getUpgradeLevelCost(upgrade))}`);
    ns.corporation.levelUpgrade(upgrade);
    return true;
  }
  return false;
}