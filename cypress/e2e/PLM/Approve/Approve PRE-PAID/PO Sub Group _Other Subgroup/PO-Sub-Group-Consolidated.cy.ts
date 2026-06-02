import * as Master from '../../../PLM/Master';

// ========================================
// PRE-PAID PO SUB GROUP - OTHER SUBGROUP CONSOLIDATED TEST SUITE
// ========================================
// ✨ QUICK TIPS:
// 1. Run specific test: npx cypress run --spec="**/PO-Sub-Group-Consolidated.cy.ts" --grep "Order Fee"
// 2. Run only one case: Add .only after describe (e.g., describe.only(`Order Fee Onetime`, () => {
// 3. Skip tests: Change it() to it.skip()
// ========================================

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

// Test Configuration for all PRE-PAID PO Sub Group combinations
const prepaidPoSubGroupTestConfigs = [
  // Order Fee - Onetime
  {
    name: 'Order Fee Onetime',
    billingType: 'onetime' as const,
    subGroupName: 'OrderFee',
    module: 'PRE',
  },
  // Order Fee - Recurring
  {
    name: 'Order Fee Recurring',
    billingType: 'recurring' as const,
    subGroupName: 'OrderFee',
    module: 'PRE',
  },
  // Order Fee - Usage
  {
    name: 'Order Fee Usage',
    billingType: 'usage' as const,
    subGroupName: 'OrderFee',
    module: 'PRE',
  },
  // Service - Onetime
  {
    name: 'Service Onetime',
    billingType: 'onetime' as const,
    subGroupName: 'Service',
    module: 'PRE',
  },
  // Service - Recurring
  {
    name: 'Service Recurring',
    billingType: 'recurring' as const,
    subGroupName: 'Service',
    module: 'PRE',
  },
  // Service - Usage
  {
    name: 'Service Usage',
    billingType: 'usage' as const,
    subGroupName: 'Service',
    module: 'PRE',
  },
];

// Test Suite Runner
describe('PRE-PAID PO Sub Group - Other Subgroup', () => {
  prepaidPoSubGroupTestConfigs.forEach(config => {
    // ⭐ ตัวอย่าง: รัน Order Fee Recurring เท่านั้น
    const testDescribe = config.name === 'Order Fee Recurring' ? describe.only : describe;
    // ปกติ (รันทั้ง 6 เคส): const testDescribe = describe;

    testDescribe(`${config.name}`, () => {  // ✅ ใช้ testDescribe แทน describe

      // Setup environment variables for Service tests
      if (config.subGroupName === 'Service') {
        beforeEach(() => {
          Cypress.env('formattedDateMain', undefined);
          Cypress.env('formattedDateOntop', undefined);
          Cypress.env('formattedDateOntopExtra', undefined);
          Cypress.env('formattedDateMainPONAME', undefined);
          Cypress.env('formattedDateOntopPONAME', undefined);
          Cypress.env('formattedDateOntopExtraPONAME', undefined);
        });
      }

      it('MKT PRE-PAID role', () => {
        Master.ProjectBasicInformationCompleteOtherPOSub(
          config.billingType,
          config.subGroupName as 'OrderFee' | 'Service',
          config.module as 'POST' | 'PRE'
        );

        Master.backBacicInfo();
        Master.addFile();
      });

      // ✅ เรียกตรงๆ ใน describe scope
      Master.afterMKTothersubgroup(
        config.subGroupName,
        config.module as 'POST' | 'PRE'
      );
    });
  });
});