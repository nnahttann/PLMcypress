import * as Master from '../../Master';

// ========================================
// PRE-PAID CONSOLIDATED TEST SUITE
// ========================================
// ✨ QUICK TIPS:
// 1. Run specific test: npx cypress run --spec="**/Pre-paid Consolidated.cy.ts" --grep "Main Usage - ENTER"
// 2. Run only one case: Add .only after describe (e.g., describe.only(`Main Onetime`, () => {
// 3. Skip tests: Change it() to it.skip()
// 4. Debug mode: Add cy.debug() or cy.pause() in test
// ========================================

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

interface ScenarioConfig {
  scenario: string;
  afterHook: string;
}

interface PrepaidTestConfig {
  name: string;
  billingType: 'onetime' | 'recurring' | 'usage';
  productClass: 'main' | 'ontop' | 'ontopextra';
  module: 'PRE';
  productClass1?: string;
  scenarios?: ScenarioConfig[];
  afterHook?: string;
}

// Test Configuration for all PRE-PAID combinations
const prepaidTestConfigs: PrepaidTestConfig[] = [
  // Main - Onetime
  {
    name: 'Main Onetime',
    billingType: 'onetime',
    productClass: 'main',
    module: 'PRE',
    productClass1: 'Main',
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTMainPRE_FullSpadFlow' },
      { scenario: 'ENTER', afterHook: 'afterMKTMainPREENTERPlugin' },
      { scenario: 'MUSIC', afterHook: 'afterMKTMainPREMusicPlugin' },
    ],
  },
  // Main - Recurring
  {
    name: 'Main Recurring',
    billingType: 'recurring',
    productClass: 'main',
    module: 'PRE',
    productClass1: 'Main',
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTMainPRE_FullSpadFlow' },
      { scenario: 'ENTER', afterHook: 'afterMKTMainPREENTERPlugin' },
      { scenario: 'MUSIC', afterHook: 'afterMKTMainPREMusicPlugin' },
    ],
  },
  // Main - Usage
  {
    name: 'Main Usage',
    billingType: 'usage',
    productClass: 'main',
    module: 'PRE',
    productClass1: 'Main',
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTMainPRE_FullSpadFlow' },
      { scenario: 'ENTER', afterHook: 'afterMKTMainPREENTERPlugin' },
      { scenario: 'MUSIC', afterHook: 'afterMKTMainPREMusicPlugin' },
    ],
  },
  // Ontop - Onetime
  {
    name: 'Ontop Onetime',
    billingType: 'onetime',
    productClass: 'ontop',
    module: 'PRE',
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopOnetimePRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopOnetimePREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopOnetimePREMUSIC' },
    ],
  },
  // Ontop - Recurring
  {
    name: 'Ontop Recurring',
    billingType: 'recurring',
    productClass: 'ontop',
    module: 'PRE',
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopPREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopPREMUSIC' },
    ],
  },
  // Ontop - Usage
  {
    name: 'Ontop Usage',
    billingType: 'usage',
    productClass: 'ontop',
    module: 'PRE',
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopPREUsage' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopPREUsageEnter' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopPREUsageMusic' },
    ],
  },
  // OntopEx - Onetime
  {
    name: 'OntopEx Onetime',
    billingType: 'onetime',
    productClass: 'ontopextra',
    module: 'PRE',
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopExtraPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopExtraPREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopExtraPREMUSIC' },
    ],
  },
  // OntopEx - Recurring
  {
    name: 'OntopEx Recurring',
    billingType: 'recurring',
    productClass: 'ontopextra',
    module: 'PRE',
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopExtraPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopExtraPREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopExtraPREMUSIC' },
    ],
  },
  // OntopEx - Usage
  {
    name: 'OntopEx Usage',
    billingType: 'usage',
    productClass: 'ontopextra',
    module: 'PRE',
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopExtraPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopExtraPREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopExtraPREMUSIC' },
    ],
  },
];

// ⭐ กำหนด case ที่ต้องการรันตรงนี้ที่เดียว
// รูปแบบ: 'ชื่อผลิตภัณฑ์ - ชื่อScenario' (เช่น 'Main Usage - ENTER') 
// หรือใส่แค่ 'ชื่อผลิตภัณฑ์' เพื่อรันทุก Scenario ของผลิตภัณฑ์นั้น
const ACTIVE_CASES: string[] = []; 
// const ACTIVE_CASES: string[] = ['Main Usage - ENTER']; // ← ตัวอย่าง: รันแค่เคสเดียว
// const ACTIVE_CASES: string[] = ['Ontop Recurring']; // ← ตัวอย่าง: รันทุก Scenario ของ Ontop Recurring

// Test Suite Runner
describe('PRE-PAID Product Approvals', () => {
  prepaidTestConfigs.forEach(config => {
    if (!config.scenarios || config.scenarios.length === 0) {
      return;
    }

    config.scenarios.forEach(scen => {
      const fullTestCaseName = `${config.name} - ${scen.scenario}`;
      
      // ตรวจสอบว่าเคสนี้ควรถูกรันหรือไม่
      // รันถ้า: 1. ACTIVE_CASES ว่าง (รันหมด) หรือ 2. ตรงกับชื่อเต็ม หรือ 3. ตรงกับชื่อผลิตภัณฑ์ (รันทุก scenario ของตัวนั้น)
      const isActive = ACTIVE_CASES.length === 0 || 
                       ACTIVE_CASES.includes(fullTestCaseName) || 
                       ACTIVE_CASES.includes(config.name);

      describe(`${config.name}`, () => {
        const testIt = isActive ? it : it.skip;

        testIt(`${scen.scenario}`, () => {
          const testConfig: any = {
            Module: config.module,
            subModule: config.module,
            autoSetDuration: true,
          };

          if (config.productClass1) {
            testConfig.ProductClass1 = config.productClass1;
          }

          Master.ProjectBasicInformationComplete(
            config.billingType,
            config.productClass,
            testConfig
          );

          // เรียกใช้ Hook ที่ตรงกับ Scenario นั้นๆ
          const hookFunction = (Master as any)[scen.afterHook];
          if (typeof hookFunction === 'function') {
            hookFunction();
          } else {
            cy.log(`⚠️ Warning: Hook function '${scen.afterHook}' not found.`);
          }
        });
      });
    });
  });
});