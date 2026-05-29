import * as Master from '../../../Master';

// ========================================
// PRE-PAID PlugIN CGMD CONSOLIDATED TEST SUITE
// ========================================
// ✨ QUICK TIPS:
// 1. Run specific test: npx cypress run --spec="**/CGMD-Consolidated.cy.ts" --grep "Main Onetime"
// 2. Run only one case: Add .only after describe (e.g., describe.only(`Main Onetime`, () => {
// 3. Skip tests: Change it() to it.skip()
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

// Test Configuration for all PRE-PAID PlugIN CGMD combinations
const pluginCgmdTestConfigs = [
  // Main - Onetime
  {
    name: 'Main Onetime',
    billingType: 'onetime' as const,
    productClass: 'main' as const,
    productClass1: 'Main',
    afterHook: 'afterMKTMainPRE_NotComplex' as const,
    isMainProduct: true,
  },
  // Main - Recurring
  {
    name: 'Main Recurring',
    billingType: 'recurring' as const,
    productClass: 'main' as const,
    productClass1: 'Main',
    afterHook: 'afterMKTMainPRE_NotComplex' as const,
    isMainProduct: true,
  },
  // Main - Usage
  {
    name: 'Main Usage',
    billingType: 'usage' as const,
    productClass: 'main' as const,
    productClass1: 'Main',
    afterHook: 'afterMKTMainPRE_NotComplex' as const,
    isMainProduct: true,
  },
  // Ontop - Onetime
  {
    name: 'Ontop Onetime',
    billingType: 'onetime' as const,
    productClass: 'ontop' as const,
    afterHook: 'afterMKTOntop_NotComplex' as const,
    isMainProduct: false,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTOntop_NotComplex' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopOnetimePREENTERPlugin' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopOnetimePREMusicPlugin' },
    ],
  },
  // Ontop - Recurring
  {
    name: 'Ontop Recurring',
    billingType: 'recurring' as const,
    productClass: 'ontop' as const,
    afterHook: 'afterMKTOntop_NotComplex' as const,
    isMainProduct: false,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTOntop_NotComplex' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopPREENTERPlugin' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopPREMusicPlugin' },
    ],
  },
  // Ontop - Usage
  {
    name: 'Ontop Usage',
    billingType: 'usage' as const,
    productClass: 'ontop' as const,
    afterHook: 'afterMKTOntop_NotComplex' as const,
    isMainProduct: false,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTOntop_NotComplex' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopPREENTERPlugin' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopPREMusicPlugin' },
    ],
  },
  // OntopEx - Onetime
  {
    name: 'OntopEx Onetime',
    billingType: 'onetime' as const,
    productClass: 'ontopextra' as const,
    afterHook: 'afterMKTontopExtraPRE' as const,
    isMainProduct: false,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopExtraPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopExtraPREENTERPlugin' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopExtraPREMusicPlugin' },
    ],
  },
  // OntopEx - Recurring
  {
    name: 'OntopEx Recurring',
    billingType: 'recurring' as const,
    productClass: 'ontopextra' as const,
    afterHook: 'afterMKTontopExtraPRE' as const,
    isMainProduct: false,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopExtraPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopExtraPREENTERPlugin' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopExtraPREMusicPlugin' },
    ],
  },
  // OntopEx - Usage
  {
    name: 'OntopEx Usage',
    billingType: 'usage' as const,
    productClass: 'ontopextra' as const,
    afterHook: 'afterMKTontopExtraPRE' as const,
    isMainProduct: false,
    scenarios: [
      { scenario: 'PRE', afterHook: 'afterMKTontopExtraPRE' },
      { scenario: 'ENTER', afterHook: 'afterMKTontopExtraPREENTERPlugin' },
      { scenario: 'MUSIC', afterHook: 'afterMKTontopExtraPREMusicPlugin' },
    ],
  },
];

// Test Suite Runner
describe('PRE-PAID PlugIN CGMD', () => {
  pluginCgmdTestConfigs.forEach(config => {
    // ⭐ ตัวอย่าง: รัน Main Usage เท่านั้น
    // const testDescribe = config.name === 'Main Usage' ? describe.only : describe;
    // ปกติ (รันทั้ง 6 เคส): ปล่อยไว้ตามนี้
    const testDescribe = describe;

    testDescribe(`${config.name}`, () => {
      if (config.isMainProduct) {
        // Main Product Tests (no scenarios)
        it('MKT PREPAID role', () => {
          const testConfig: any = {
            Module: 'PRE',
            autoSetDuration: true,
            Plugin: 'Pl',
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

        // ✅ เรียกตรงๆ ใน describe scope
        const hookFunction = (Master as any)[config.afterHook];
        if (typeof hookFunction === 'function') {
          hookFunction();
        }
      } else {
        // Ontop Product Tests (with scenarios)
        config.scenarios?.forEach(scenario => {
          describe(`Scenario: ${scenario.scenario}`, () => {
            it('MKT PREPAID role', () => {
              const testConfig: any = {
                Module: scenario.scenario,
                autoSetDuration: true,
                Plugin: 'Pl',
              };

              if (scenario.scenario !== 'PRE') {
                testConfig.subModule = 'PRE';
              }

              Master.ProjectBasicInformationComplete(
                config.billingType,
                config.productClass,
                testConfig
              );

              // Additional setup for PRE module
              if (scenario.scenario === 'PRE') {
                cy.get('input[formcontrolname="allowMvpn"]').eq(1).check({ force: true });
                Master.Randomdropdown();
                Master.dropdownPromotionGroup();
                Master.smsWordingpre();
                Master.backBacicInfo();
                Master.addFile();
              }
            });

            // ✅ เรียกตรงๆ ใน describe scope
            const hookFunction = (Master as any)[scenario.afterHook];
            if (typeof hookFunction === 'function') {
              hookFunction();
            }
          });
        });
      }
    });
  });
});