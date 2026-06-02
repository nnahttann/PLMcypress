import * as Master from '../../../PLM/Master';

// ========================================
// POST-PAID PO SUB GROUP - OTHER SUBGROUP CONSOLIDATED TEST SUITE
// ========================================
// ✨ QUICK TIPS:
// 1. Run specific test: npx cypress run --spec="**/PO-Sub-Group-Consolidated.cy.ts" --grep "Account Fee"
// 2. Run only one case: Add .only after describe (e.g., describe.only(`Account Fee Onetime`, () => {
// 3. Skip tests: Change it() to it.skip()
// ========================================

beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit(Master.urlsit);
    cy.viewport(1920, 1080);
});

// Test Configuration for all POST-PAID PO Sub Group combinations
const postpaidPoSubGroupTestConfigs = [
    // Account Fee - Onetime
    // {
    //     name: 'Account Fee Onetime',
    //     billingType: 'onetime' as const,
    //     subGroupName: 'AccountFee',
    //     module: 'POST',
    // },
    // // CashBack - Onetime
    // {
    //     name: 'Cashback Onetime',
    //     billingType: 'onetime' as const,
    //     subGroupName: 'CashBack',
    //     module: 'POST',
    // },
    // Order Fee - Onetime
    // {
    //     name: 'Order Fee Onetime',
    //     billingType: 'onetime' as const,
    //     subGroupName: 'OrderFee',
    //     module: 'POST',
    // },
    // Service - Onetime
    {
        name: 'Service Onetime',
        billingType: 'onetime' as const,
        subGroupName: 'Service',
        module: 'POST',
    },
];

// Test Suite Runner
describe('POST-PAID PO Sub Group - Other Subgroup', () => {
    postpaidPoSubGroupTestConfigs.forEach(config => {
        // ⭐ ตัวอย่าง: รัน Account Fee Onetime เท่านั้น
        // const testDescribe = config.name === 'Cashback Onetime' ? describe.only : describe;
        // ปกติ (รันทั้ง 4 เคส): ปล่อยไว้ตามนี้
        const testDescribe = describe;

        testDescribe(`${config.name}`, () => {
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

            it('MKT POSTPAID role', () => {
                Master.ProjectBasicInformationCompleteOtherPOSub(
                    config.billingType,
                    config.subGroupName as 'AccountFee' | 'CashBack' | 'OrderFee' | 'Service' | 'GroupPoFee',
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