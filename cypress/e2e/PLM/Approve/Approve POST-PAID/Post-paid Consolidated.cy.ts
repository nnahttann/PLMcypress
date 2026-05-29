import * as Master from '../../Master';

// ========================================
// POST-PAID CONSOLIDATED TEST SUITE
// ========================================
// ✨ QUICK TIPS:
// 1. Run specific test: npx cypress run --spec="**/Post-paid Consolidated.cy.ts" --grep "Main Onetime"
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

// Test Configuration for all POST-PAID combinations
const postpaidTestConfigs = [
  // Main - Onetime (POST only)
  {
    name: 'Main Onetime',
    billingType: 'onetime' as const,
    productClass: 'main' as const,
    module: 'POST',
    productClass1: 'Main',
    afterHook: 'afterMKTMAINPOST' as const,
  },
  // Main - Recurring (POST only)
  {
    name: 'Main Recurring',
    billingType: 'recurring' as const,
    productClass: 'main' as const,
    module: 'POST',
    productClass1: 'Main',
    afterHook: 'afterMKTMAINPOST' as const,
  },
  // Main - Usage (POST only)
  {
    name: 'Main Usage',
    billingType: 'usage' as const,
    productClass: 'main' as const,
    module: 'POST',
    productClass1: 'Main',
    afterHook: 'afterMKTMainUsagePOST' as const,
  },
  // Ontop - Onetime (POST, ENTER, MUSIC) - ใช้ afterMKTMAINPOST แทน
  {
    name: 'Ontop Onetime',
    billingType: 'onetime' as const,
    productClass: 'ontop' as const,
    module: 'POST',
    scenarios: [
      { scenario: 'POST', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'ENTER', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'MUSIC', afterHook: 'afterMKTMAINPOST' },
    ],
  },
  // Ontop - Recurring (POST, ENTER, MUSIC) - ใช้ afterMKTMAINPOST แทน
  {
    name: 'Ontop Recurring',
    billingType: 'recurring' as const,
    productClass: 'ontop' as const,
    module: 'POST',
    scenarios: [
      { scenario: 'POST', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'ENTER', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'MUSIC', afterHook: 'afterMKTMAINPOST' },
    ],
  },
  // Ontop - Usage (POST, ENTER, MUSIC) - ใช้ afterMKTMAINPOST แทน
  {
    name: 'Ontop Usage',
    billingType: 'usage' as const,
    productClass: 'ontop' as const,
    module: 'POST',
    scenarios: [
      { scenario: 'POST', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'ENTER', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'MUSIC', afterHook: 'afterMKTMAINPOST' },
    ],
  },
  // OntopEx - Onetime (POST, ENTER, MUSIC) - ใช้ afterMKTMAINPOST แทน
  {
    name: 'OntopEx Onetime',
    billingType: 'onetime' as const,
    productClass: 'ontopextra' as const,
    module: 'POST',
    scenarios: [
      { scenario: 'POST', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'ENTER', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'MUSIC', afterHook: 'afterMKTMAINPOST' },
    ],
  },
  // OntopEx - Recurring (POST, ENTER, MUSIC) - ใช้ afterMKTMAINPOST แทน
  {
    name: 'OntopEx Recurring',
    billingType: 'recurring' as const,
    productClass: 'ontopextra' as const,
    module: 'POST',
    scenarios: [
      { scenario: 'POST', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'ENTER', afterHook: 'afterMKTMAINPOST' },
      { scenario: 'MUSIC', afterHook: 'afterMKTMAINPOST' },
    ],
  },
];

// Test Suite Runner
describe('POST-PAID Product Approvals', () => {
  postpaidTestConfigs.forEach(config => {
    // ถ้ามี scenarios array ให้สร้าง test case แยกสำหรับแต่ละ scenario
    if (config.scenarios && Array.isArray(config.scenarios)) {
      config.scenarios.forEach(scenarioConfig => {
        const scenarioName = scenarioConfig.scenario;
        const fullTestName = `${config.name} > Scenario: ${scenarioName}`;
        
        describe(`${fullTestName}`, () => {
          it('MKT POSTPAID role', () => {
            const testConfig: any = {
              Module: (config as any).module,
              subModule: (config as any).module,
              autoSetDuration: true,
              scenario: scenarioConfig.scenario,
            };

            if ((config as any).productClass1) {
              testConfig.ProductClass1 = (config as any).productClass1;
            }

            Master.ProjectBasicInformationComplete(
              config.billingType,
              config.productClass,
              testConfig
            );
          });

          // ✅ เรียกตรงๆ ใน describe scope
          const hookFunction = (Master as any)[scenarioConfig.afterHook];
          if (typeof hookFunction === 'function') {
            hookFunction();
          }
        });
      });
    } else {
      // กรณีไม่มี scenarios array (ใช้ default behavior เดิม)
      describe(`${config.name}`, () => {
        it('MKT POSTPAID role', () => {
          const testConfig: any = {
            Module: (config as any).module,
            subModule: (config as any).module,
            autoSetDuration: true,
          };

          if ((config as any).productClass1) {
            testConfig.ProductClass1 = (config as any).productClass1;
          }

          Master.ProjectBasicInformationComplete(
            (config as any).billingType,
            (config as any).productClass,
            testConfig
          );
        });

        // ✅ เรียกตรงๆ ใน describe scope
        const hookFunction = (Master as any)[(config as any).afterHook];
        if (typeof hookFunction === 'function') {
          hookFunction();
        }
      });
    }
  });
});