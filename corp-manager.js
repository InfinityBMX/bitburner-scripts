import { formatMoney, formatNumberShort } from './utils/formats.js';

// Names
const CORP_NAME = 'ULDK';
const FIRST_INDUSTRY = 'Agriculture';
const FIRST_DIVISION = 'Devils Lettuce';
const SECOND_INDUSTRY = 'Tobacco';
const SECOND_DIVISION = 'Old Smokey';
const TOBACCO_PRFX = 'Tobacco-v';

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
const SETTING_UPGRADES_SECOND_LEVEL = 20;

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

  /* EXPAND TO FIRST PRODUCT! */
  // Start Division 2
  ns.print(`Creating ${SECOND_DIVISION} in the ${SECOND_INDUSTRY} Industry`);
  // Set Aevum to 30, all other offices to 9 people, buy warehouses
  await updateDivision(ns, SECOND_INDUSTRY, SECOND_DIVISION, {
    ...DEFAULT_INDUSTRY_SETTINGS,
    employees: {
      "All": SETTING_FIRST_UPGRADE_SIZE,
      "Aevum": 30
    },
    jobs: {
      "All": SETTING_FIRST_UPGRADE_SPREAD,
      "Aevum": getEvenSpread(30)
    }
  });
  ns.print("*** TIME TO CREATE PRODUCTS!");
  // Create product!
  ns.print("Creating our first Tobacco product!");
  let productNames = ns.corporation.getDivision(SECOND_DIVISION).products;
  if (productNames.length === 0) {
    ns.print("Developing new product");
    let productName = developNewProduct(ns, SECOND_DIVISION);
    ns.corporation.sellProduct(SECOND_DIVISION, "Aevum", productName, "MAX", "MP", true);
    ns.corporation.setProductMarketTA2(SECOND_DIVISION, productName, true);
  }
  // Upgrade Wilson Analytics while we have > $3t
  ns.print("Leveling up Wilson Analytics...");
  let wilsonCost;
  while (ns.corporation.getCorporation().funds > 3e12
          && (wilsonCost = ns.corporation.getUpgradeLevelCost(WILSON)) <= ns.corporation.getCorporation().funds) {
    ns.print(`Upgrading ${WILSON} for $${formatNumberShort(wilsonCost)}`);
    ns.corporation.levelUpgrade(WILSON);
  }
  ns.print("Wilson Analytics is now at " + ns.corporation.getUpgradeLevel(WILSON));
  // Level upgrades to 20
  ns.print("Upgrading Employee-focused upgrades to level " + SETTING_UPGRADES_SECOND_LEVEL);
  for (const upgrade of UPGRADES) {
    // ignore Smart Factories/Smart Warehouses for this
    if (upgrade.includes("Smart")) continue
    while (ns.corporation.getUpgradeLevel(upgrade) < SETTING_UPGRADES_SECOND_LEVEL) {
      for (let i = 1; i <= SETTING_UPGRADES_SECOND_LEVEL - ns.corporation.getUpgradeLevel(upgrade); i++) {
        ns.corporation.levelUpgrade(upgrade);
        await ns.sleep(FAST_INTERVAL);
      }
      if (ns.corporation.getUpgradeLevel(upgrade) === SETTING_UPGRADES_SECOND_LEVEL) {
        ns.print(`${upgrade} is now level ${ns.corporation.getUpgradeLevel(upgrade)}`);
      } else {
        ns.print(`${upgrade} not fully upgraded. Sleeping.`);
      }
      await ns.sleep(1000);
    }
  }
  // Dump the rest of our funds into AdVert
  ns.print("Spending the rest of the funds on AdVert");
  let advertCost;
  while ((advertCost = ns.corporation.getHireAdVertCost(SECOND_DIVISION)) < ns.corporation.getCorporation().funds) {
    ns.print(`Hiring AdVert for ${formatNumberShort(advertCost)}`);
    ns.corporation.hireAdVert(SECOND_DIVISION);
  }
  // Get 3 products out there
  ns.print("Executing main corp loop until we have 3 products");
  while (ns.corporation.getDivision(SECOND_DIVISION).products.length < 3) {
    // Don't develop a new product until the old one is done
    await waitForDevelopment(ns, SECOND_DIVISION);
    developNewProduct(ns, SECOND_DIVISION);
  }
  // Finish developing any products before moving on to the next phase
  await waitForDevelopment(ns, SECOND_DIVISION);

  ns.print("Expand Aevum to 60 employees");
  // Expand Aevum to 60
  await updateDivision(ns, SECOND_INDUSTRY, SECOND_DIVISION, {
    ...DEFAULT_INDUSTRY_SETTINGS,
    employees: {
      "All": SETTING_FIRST_UPGRADE_SIZE,
      "Aevum": 60
    },
    jobs: {
      "All": SETTING_FIRST_UPGRADE_SPREAD,
      "Aevum": getEvenSpread(60)
    }
  });
  // Loop the main corp loop until we can afford Market.TA1+2
  ns.print("Beginning corporation loop until we have purchased Market-TA.1 + 2...")
  while (
    !ns.corporation.hasResearched(SECOND_DIVISION, HIGH_TECH_LAB) &&
    !ns.corporation.hasResearched(SECOND_DIVISION, MARKET_TA1) &&
    !ns.corporation.hasResearched(SECOND_DIVISION, MARKET_TA2)
    ) {
    await corpLoop(ns, SECOND_INDUSTRY);
  }

  // Now get any remaining investment offers and go public!
  ns.print("Looking for investors again; hoping for at least $150t")
  while (offer = ns.corporation.getInvestmentOffer().round <= 4) {
    // Demand at least $800t
    await seekInvestmentOffer(ns, 800e12);
    await ns.sleep(30000);
  }
  // Go public!
  let went_public = ns.corporation.goPublic(0);
  if (went_public) {
    ns.print("🎉🎉🎉 WE HAVE IPO!!!");
    ns.corporation.issueDividends(0.1);
  }
}

/**
 * Buy scientific research
 * @param {import("../.").NS}  ns
 * @param {number} minimum Minimum desired amount for the offer
 */
async function seekInvestmentOffer(ns, minimum) {
  let offer = ns.corporation.getInvestmentOffer();
  ns.print(`Starting offer: $${numFormat(offer.funds)}`)
  let counter = 1;
  while ((offer = ns.corporation.getInvestmentOffer()).funds < minimum) {
    if (counter % 30 === 0) {
      ns.print(`Waited ${counter} loops for first offer above $${numFormat(minimum)}. Most recent offer: $${numFormat(offer.funds)}`);
    }
    if (counter > 300) {
      let should_accept_anyway = await ns.prompt(`It's been a while; accept the $${numFormat(offer.funds)} offer?`);
      if (should_accept_anyway) break;
    }
    await ns.sleep(10000);
    counter++;
  }
  ns.print(`Accepting investment offer for $${numFormat(offer.funds)}!`);
  ns.corporation.acceptInvestmentOffer();
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
      let emps = employees.sort((emp1, emp2) => prodScore(emp2, position) - prodScore(emp1, position)).splice(0, positions[position]);
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
    if (updateSpread) {
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
    } else {
      ns.print(`No need to update spread in ${city}`);
    }

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
 * Create a new iteratively-named product
 * @param {import("../.").NS} ns
 * @param {string} division The division we're building in
 * @returns {string} Name of new product
 */
function developNewProduct(ns, division) {
  let new_product_name = nextProductName(ns, division);
  ns.print("Creating new product: " + new_product_name);
  // new product in numerical order, with 1b each of design and marketing investment.
  ns.corporation.makeProduct(division, "Aevum", new_product_name, 1000000000, 1000000000);
  return new_product_name
}

/**
 * Calculate the next product name
 * @param {import("../.").NS} ns
 * @param {string} division The division we're building in
 * @returns the next product name
 */
function nextProductName(ns, division) {
  let product_names = ns.corporation.getDivision(division).products.sort((a, b) => a - b);
  let last_version = 1;
  // If there are existing products, try to figure out the last one
  if (product_names.length > 0) {
    let last_char = product_names.slice(-1)[0].slice(9);
    // if the last character is a number (not NaN), use it for evaluation
    if (!isNaN(last_char)) last_version = Number(last_char);
  }
  return TOBACCO_PRFX + (last_version + 1);
}

/**
 * Discontinue the oldest product (based on name)
 * @param {import("../.").NS}
 * @param {*} division The division we're building in
 */
async function discontinueOldestProduct(ns, division) {
  let product_names = ns.corporation.getDivision(division).products.sort((a, b) => a - b);
  // ns.print("Product names: " + product_names);
  // Safety net, don't discontinue if we have no products
  if (product_names.length == 0) return
  // Sell all of it at MP to get rid of all inventory
  ns.print(`Selling off ${product_names[0]}`);
  ns.corporation.setProductMarketTA2(division, product_names[0], false);
  ns.corporation.sellProduct(division, "Aevum", product_names[0], "MAX", "MP", true);
  ns.print("Waiting 10 seconds...");
  await ns.sleep(10000); // wait 20 seconds for two ticks to sell all inventory
  ns.print("Discontinuing product");
  // Now discontinue once we're done selling
  ns.corporation.discontinueProduct(division, product_names[0]);
}

/**
 * Wait until there are no products in development
 * @param {import("../.").NS}
 * @param {*} division The division we're building in
 */
async function waitForDevelopment(ns, division) {
  let product;
  while ((product = ns.corporation.getDivision(division).products.find(prod => ns.corporation.getProduct(division, prod).developmentProgress < 100))) {
    ns.print("Waiting 60 seconds until no products are in development...");
    await ns.sleep(60000);
  }
  ns.print(`${product} development complete.`);
}