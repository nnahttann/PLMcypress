import * as Master from '../../Master';

// ========================================
// PRE-PAID CONSOLIDATED TEST SUITE
// ========================================
// ✨ QUICK TIPS:
// 1. Run specific test: npx cypress run --spec="**/Pre-paid Consolidated.cy.ts" --grep "Main Onetime"
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

// Test Configuration for all PRE-PAID combinations
const prepaidTestConfigs = [
  // Main - Onetime
  {
    name: 'Main Onetime',
    billingType: 'onetime' as const,
    productClass: 'main' as const,
    module: 'PRE',
    productClass1: 'Main',
    afterHook: 'afterMKTMainPRE_FullSpadFlow' as const,
  },
  // Main - Recurring
  {
    name: 'Main Recurring',
    billingType: 'recurring' as const,
    productClass: 'main' as const,
    module: 'PRE',
    productClass1: 'Main',
    afterHook: 'afterMKTMainPRE_FullSpadFlow' as const,
  },
  // Main - Usage
  {
    name: 'Main Usage',
    billingType: 'usage' as const,
    productClass: 'main' as const,
    module: 'PRE',
    productClass1: 'Main',
    afterHook: 'afterMKTMainPRE_FullSpadFlow' as const,
  },
  // Ontop - Onetime
  {
    name: 'Ontop Onetime',
    billingType: 'onetime' as const,
    productClass: 'ontop' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopOnetimePRE' as const,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopOnetimePRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopOnetimePREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopOnetimePREMUSIC' },
    ],
  },
  // Ontop - Recurring
  {
    name: 'Ontop Recurring',
    billingType: 'recurring' as const,
    productClass: 'ontop' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopPRE' as const,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopPREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopPREMUSIC' },
    ],
  },
  // Ontop - Usage
  {
    name: 'Ontop Usage',
    billingType: 'usage' as const,
    productClass: 'ontop' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopPREUsage' as const,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopPREUsage' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopPREUsageEnter' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopPREUsageMusic' },
    ],
  },
  // OntopEx - Onetime
  {
    name: 'OntopEx Onetime',
    billingType: 'onetime' as const,
    productClass: 'ontopextra' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopExtraPRE' as const,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopExtraPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopExtraPREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopExtraPREMUSIC' },
    ],
  },
  // OntopEx - Recurring
  {
    name: 'OntopEx Recurring',
    billingType: 'recurring' as const,
    productClass: 'ontopextra' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopExtraPRE' as const,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopExtraPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopExtraPREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopExtraPREMUSIC' },
    ],
  },
  // OntopEx - Usage
  {
    name: 'OntopEx Usage',
    billingType: 'usage' as const,
    productClass: 'ontopextra' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopExtraPRE' as const,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopExtraPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopExtraPREENTER' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopExtraPREMUSIC' },
    ],
  },
];

// ⭐ กำหนด case ที่ต้องการรันตรงนี้ที่เดียว
// ใส่ชื่อ config.name ที่ต้องการ หรือ [] เพื่อรันทั้งหมด
const ACTIVE_CASES: string[] = []; // ← รันทั้ง 9 เคส
// const ACTIVE_CASES: string[] = ['Ontop Recurring']; // ← ตัวอย่าง: รันแค่ case เดียว

// Test Suite Runner
describe('PRE-PAID Product Approvals', () => {
  prepaidTestConfigs.forEach(config => {
    const isActive = ACTIVE_CASES.length === 0 || ACTIVE_CASES.includes(config.name);

    // ถ้ามี scenarios array ให้สร้าง test case แยกสำหรับแต่ละ scenario
    if (config.scenarios && Array.isArray(config.scenarios)) {
      config.scenarios.forEach(scenarioConfig => {
        const scenarioName = scenarioConfig.scenario;
        const fullTestName = `${config.name} > Scenario: ${scenarioName}`;
        const isScenarioActive = isActive && (ACTIVE_CASES.length === 0 || ACTIVE_CASES.includes(fullTestName));
        
        describe(`${fullTestName}`, () => {
          const testIt = isScenarioActive ? it : it.skip;

          testIt('MKT PRE-PAID role', () => {
            const testConfig: any = {
              Module: config.module,
              subModule: config.module,
              autoSetDuration: true,
              scenario: scenarioConfig.scenario,
            };

            if (config.productClass1) {
              testConfig.ProductClass1 = config.productClass1;
            }

            Master.ProjectBasicInformationComplete(
              config.billingType,
              config.productClass,
              testConfig
            );
          });

          if (isScenarioActive) {
            const hookFunction = (Master as any)[scenarioConfig.afterHook];
            if (typeof hookFunction === 'function') {
              hookFunction();
            }
          }
        });
      });
    } else {
      // กรณีไม่มี scenarios array (ใช้ default behavior เดิม)
      describe(`${config.name}`, () => {
        const testIt = isActive ? it : it.skip;

        testIt('MKT PRE-PAID role', () => {
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
        });

        if (isActive) {
          const hookFunction = (Master as any)[config.afterHook];
          if (typeof hookFunction === 'function') {
            hookFunction();
          }
        }
      });
    }
  });
});