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
    afterHook: 'afterMKTontopPRE' as const,
  },
  // Ontop - Recurring
  {
    name: 'Ontop Recurring',
    billingType: 'recurring' as const,
    productClass: 'ontop' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopPRE' as const,
  },
  // Ontop - Usage
  {
    name: 'Ontop Usage',
    billingType: 'usage' as const,
    productClass: 'ontop' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopPRE' as const,
  },
  // OntopEx - Onetime
  {
    name: 'OntopEx Onetime',
    billingType: 'onetime' as const,
    productClass: 'ontopextra' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopPRE' as const,
  },
  // OntopEx - Recurring
  {
    name: 'OntopEx Recurring',
    billingType: 'recurring' as const,
    productClass: 'ontopextra' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopPRE' as const,
  },
  // OntopEx - Usage
  {
    name: 'OntopEx Usage',
    billingType: 'usage' as const,
    productClass: 'ontopextra' as const,
    module: 'PRE',
    afterHook: 'afterMKTontopPRE' as const,
  },
];

// ⭐ กำหนด case ที่ต้องการรันตรงนี้ที่เดียว
// ใส่ชื่อ config.name ที่ต้องการ หรือ [] เพื่อรันทั้งหมด
const ACTIVE_CASES: string[] = ['Main Usage'];
// const ACTIVE_CASES: string[] = []; // ← รันทั้ง 9 เคส

// Test Suite Runner
describe('PRE-PAID Product Approvals', () => {
  prepaidTestConfigs.forEach(config => {
    const isActive = ACTIVE_CASES.length === 0 || ACTIVE_CASES.includes(config.name);

    // ✅ ใช้ it.skip แทน describe.skip
    // เพราะ describe.skip ยังคง execute callback (รวม hookFunction) ทุก config
    // ทำให้ hooks ถูก register ซ้ำผิด context
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

      // ✅ Guard hookFunction ให้ register เฉพาะ case ที่ active เท่านั้น
      // ป้องกัน afterEach/after hooks จาก skipped cases ไหลมา execute ใน active case
      if (isActive) {
        const hookFunction = (Master as any)[config.afterHook];
        if (typeof hookFunction === 'function') {
          hookFunction();
        }
      }
    });
  });
});