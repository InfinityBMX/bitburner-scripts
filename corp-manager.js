const CORP_NAME = 'ULDK';
const FIRST_INDUSTRY = 'Agriculture';
const FIRST_DIVISION = 'Devils Lettuce';

const SMART_SUPPLY = 'Smart Supply';

const SLOW_INTERVAL = 5000;
const FAST_INTERVAL = 1000;

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

/** @param {NS} ns **/
export async function main(ns) {
  const { corporation } = ns;
  ns.print('Starting Corp Script');

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
    let employees = [];

    // Expand if not in city
    if (!corp.divisions[0].cities.includes(city)) {
      ns.print("Expanding to " + city);
      corporation.expandCity(DIVISION, city);
    }
    let office = corporation.getOffice(DIVISION, city);
    if (office.employees.length < 3) {
      ns.print("Hiring employees");
      for (let i = 1; i <= (3 - office.employees.length); i++) {
        // Hire 3 employees for each city
        employees.push(corporation.hireEmployee(DIVISION, city));
      }
    }
    // Assign Employees
    ns.print("Assigning jobs to employees");
    await assignJobs(employees, DIVISION, city, { Operations: 1, Engineer: 1, Business: 1 });

    // Buy warehourse
    if (!corporation.hasWarehouse(DIVISION, city)) {
      ns.print("Buying Warehouse");
      corporation.purchaseWarehouse(DIVISION, city);
    }
    // Upgrade warehouse to 300
    ns.print("Upgrading the warehouse to 300");
    while (corporation.getWarehouse(DIVISION, city).size < 300) {
      corporation.upgradeWarehouse(DIVISION, city);
    }
    // Enable Smart Supply
    ns.print(`Enabling Smart Supply for ${DIVISION} in ${corp.divisions[0].cities[0]}`);
    corporation.setSmartSupply(DIVISION, city, true);
    // Now start selling Plants + Food
    ns.print("Setting sale prices for materials Plants + Food");
    corporation.sellMaterial(DIVISION, city, "Plants", "MAX", "MP");
    corporation.sellMaterial(DIVISION, city, "Food", "MAX", "MP");
    await ns.sleep(100);
  }

  // Cities set up, buy 1 AdVert
  if (corporation.getHireAdVertCount(DIVISION) < 1) {
    // Buy one level of AdVert
    ns.print("Buying one round of AdVert");
    corporation.hireAdVert(DIVISION);
  }

  for (const upgrade of UPGRADES) {
    // Level each upgrade twice
    for (let i = 1; i <= (2 - corporation.getUpgradeLevel(upgrade)); i++) {
      corporation.levelUpgrade(upgrade);
    }
    ns.print(`${upgrade} is now level ${corporation.getUpgradeLevel(upgrade)}`);
  }

  ns.print("Buying initial materials in each city");
  for (const city of CITIES) {
    while (corporation.getMaterial(DIVISION, city, MATERIAL_HARDWARE).qty < 125) {
      corporation.buyMaterial(DIVISION, city, MATERIAL_HARDWARE, 12.5);
      corporation.buyMaterial(DIVISION, city, MATERIAL_AI_CORES, 7.5);
      corporation.buyMaterial(DIVISION, city, MATERIAL_REAL_ESTATE, 2700);
      // Wait for a tick - can't use 10 seconds becaue bonus times breaks the timing
      ns.print("Waiting for Hardware quantity to reach 125...");
      ns.print(`Current hardware material: ${ncorporation.getMaterial(DIVISION, city, MATERIAL_HARDWARE).qty}`);
      await ns.sleep(50);
    }
    ns.print("Setting materials back down to 0 purchasing");
    corporation.buyMaterial(DIVISION, city, MATERIAL_HARDWARE, 0);
    corporation.buyMaterial(DIVISION, city, MATERIAL_AI_CORES, 0);
    corporation.buyMaterial(DIVISION, city, MATERIAL_REAL_ESTATE, 0);

    corp = corporation.getCorporation();
    ns.print(`* Current funds: $${numFormat(corp.funds)}`);
    // Now wait for employee stats to improve
// TODO LEFT OFF HERE
    ns.print("Looking at Employee Happiness, Morale, and Energy");
    let average_morale = calculateAverageEmployeeStat(ns, DIVISION, city, "Morale");
    
    let office = ns.corporation.getOffice(division, city);
    let average = 0;
    for (const employee of office.employees) {
      average += ns.corporation.getEmployee(division, city, employee).mor
    }
    return average / office.employees.length
    while (corporation.getOffice(DIVISION, city).employees.find(emp => emp.mor < 99.5)) {
      ns.print("Waiting for employee morale to improve. Currently: " + average_morale);
      await ns.sleep(10000);
      average_morale = calculateAverageEmployeeStat(ns, DIVISION, city, "Morale");
    }
  }
}

const assignJobs = async (employees, division, city, positions) => {
  for (const position in POSITIONS) {
    if (positions[position]) {
      let promises = [];
      let emps = employees.sort((emp1, emp2) => prodScore(emp1, position) - prodScore(emp2, position)).splice(0, positions[position]);
      for (const emp of emps) {
        if (emp.pos !== position)
          promises.push(corporation.assignJob(division, city, emp.name, position));
      }
      await Promise.all(promises);
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