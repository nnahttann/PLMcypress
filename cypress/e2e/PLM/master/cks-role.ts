import { login } from './helpers';
import { ClaimProject, approveProject, navigateToWorkspace, performRoleTaskWithAssignment, performSimpleApprovalRole } from './claim-approve';
import { getStandardProjectName, getOntopProjectName } from './project-manager';
import { ApproveFunction, GetProjectNameFn } from './config';
import { approveProjectCGMD, approveProjectCGMDtester, approveProjectACTM, approveProjectOPER } from './approval-flows';
import { afterCKSPOST, performMusicRoles } from './mkt-flows';

const env = Cypress.env() as Record<string, string>;
const {
    cks, ckspass,
} = env;

// ========================
// HELPERS
// ========================

const registerCksInitialIntercepts = (): void => {
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
};

const registerProjectPageIntercepts = (): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');
};

const registerPoEnhancementIntercepts = (): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/mass-enh-po-detail/getByPoEnhRowId/**').as('getPoEnhDetail');
    cy.intercept('GET', '/PLMSpringBoot/api/check-generate-po-enh/**').as('getCheckGenPoEnh');
    cy.intercept('GET', '/PLMSpringBoot/api/check-sff-product-enh/**').as('getCheckSffEnh');
};

export const getTomorrowDateString = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const yyyy = tomorrow.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

/**
 * backToCksDoer
 *
 * ✅ FIX: รับ parameter registerBeforeBack=true
 *    → register project page intercepts ก่อน click Back
 *    → ป้องกัน race condition ที่ Angular fire GET requests
 *      ก่อน Cypress ลงทะเบียน intercept ทัน
 */
const backToCksDoer = (registerBeforeBack: boolean = false): void => {
    cy.get('body').then(($body) => {
        if ($body.find('.cdk-overlay-backdrop').length > 0) {
            cy.get('.cdk-overlay-backdrop').click({ force: true });
            cy.get('.cdk-overlay-backdrop').should('not.exist');
        }
    });

    // ✅ register intercepts ก่อน click Back (ถ้า caller ต้องการ wait หลัง back)
    if (registerBeforeBack) {
        registerProjectPageIntercepts();
    }

    cy.contains('button', 'Back').should('be.visible').and('not.be.disabled').click();
    cy.contains('button', 'Yes').should('be.visible').click();

    cy.url({ timeout: 60000 }).should('include', '/new-flow/home/newcks/cks-doer');
    cy.get('body', { timeout: 60000 }).should('be.visible');
};

// ========================
// CKS ROLE EXECUTION
// ========================

export const executeCKSRole = (
    projectNameStrategy: 'standard' | 'ontop',
    customSteps: () => void,
    declareFn: () => void = () => { },
    beforeApprove: () => void = () => { /* no-op */ },
    overrideProjectName?: string
): void => {
    it('CKS role', () => {
        let getProjectName: GetProjectNameFn = overrideProjectName
            ? () => overrideProjectName
            : projectNameStrategy === 'standard'
                ? getStandardProjectName
                : getOntopProjectName;
// const getProjectName: GetProjectNameFn = () => 'MOB PRE Rec Main PRJ 1806 1122';
        cy.log(String(Cypress.env('poCount')));
        standardCksPoEnhancementFlow(getProjectName, customSteps, beforeApprove);
    });

    declareFn();
};

// ========================
// CKS PO ENHANCEMENT FLOW
// ========================

const handleProductNameTrim = (): void => {
    cy.get('input[formcontrolname="productName"]').each(($input) => {
        cy.wrap($input)
            .siblings('small')
            .invoke('text')
            .then((text) => {
                const match = text.match(/(\d+)\s*\/\s*(\d+)/);
                if (!match) return;

                const currentCounter = parseInt(match[1], 10);
                const maxLen = parseInt(match[2], 10);

                cy.wrap($input).invoke('val').then((currentVal) => {
                    const valStr = (currentVal || '').toString();
                    let newVal = valStr.trimEnd();

                    if (currentCounter > maxLen || valStr.length > maxLen) {
                        newVal = newVal.substring(0, maxLen);
                    }

                    if (newVal !== valStr) {
                        cy.log(`✏️ แก้ไข PO Name: "${valStr}" -> "${newVal}" (Max: ${maxLen})`);
                        cy.wrap($input).clear().type(newVal).blur();
                    }
                });
            });
    });
};

const handlePoDetailRoute = (customStepsCallback: () => void): void => {
    cy.wait('@getPoEnhDetail',   { timeout: 60000 });
    cy.wait('@getCheckGenPoEnh', { timeout: 60000 });
    cy.wait('@getCheckSffEnh',   { timeout: 60000 });

    handleProductNameTrim();

    cy.wait(500);
    customStepsCallback();
};

const handleAdditionalRoute = (customStepsCallback: () => void): void => {
    cy.log('ℹ️ Landed on mass-enh-additional route — skipping PO detail waits');
    cy.wait(500);
    customStepsCallback();
};

const enhanceSinglePO = (
    index: number,
    actualCount: number,
    customStepsCallback: () => void,
): void => {
    cy.log(`📦 [${index + 1}/${actualCount}] Starting Enhance PO loop`);

    registerPoEnhancementIntercepts();

    cy.get('button.btn-sample')
        .filter((_, el) => el.textContent?.trim() === 'Enhance PO')
        .eq(index)
        .scrollIntoView({ ensureScrollable: false })
        .should('be.visible')
        .click();

    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.wait('@getRequest', { timeout: 30000 }).its('response.statusCode').should('eq', 200);

    cy.url()
        .should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/)
        .then((url) => {
            if (url.includes('mass-enh-product-offering-detail')) {
                handlePoDetailRoute(customStepsCallback);
            } else {
                handleAdditionalRoute(customStepsCallback);
            }

            const isLastPO = index >= actualCount - 1;

            if (!isLastPO) {
                // ✅ FIX: register intercepts ก่อน click Back
                //    Angular จะ fire GET requests ทันทีที่ navigate กลับ cks-doer
                //    ต้อง intercept พร้อมก่อน
                cy.log(`🔙 [${index + 1}/${actualCount}] Back → re-register intercepts before Back`);
                backToCksDoer(true); // registerBeforeBack=true

                // ✅ wait หลัง back — intercept ลงทะเบียนไว้แล้วใน backToCksDoer
                cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 60000 });
                cy.wait(500);
                cy.log(`✅ [${index + 1}/${actualCount}] Project page loaded, ready for next PO`);
            } else {
                // PO สุดท้าย — back ปกติ ไม่ต้อง wait project page intercepts
                cy.log(`🏁 [${index + 1}/${actualCount}] Last PO — back without project page wait`);
                backToCksDoer(false); // registerBeforeBack=false
            }
        });
};

export const standardCksPoEnhancementFlow = (
    getProjectNameFn: GetProjectNameFn,
    customStepsCallback: () => void,
    beforeApproveCallback: () => void
): void => {
    login(cks, ckspass);

    registerCksInitialIntercepts();
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 30000 });
    cy.get('body').should('be.visible');

    const finalProjectName = getProjectNameFn();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

    ClaimProject(finalProjectName, { claimBy: 'project' });

    approveProject(finalProjectName);

    cy.then(() => {
        // ✅ register intercepts ก่อน wait — project page data load หลัง approveProject navigate กลับ
        registerProjectPageIntercepts();
        cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 60000 });

        cy.get('button.btn-sample')
            .filter((_, el) => el.textContent?.trim() === 'Enhance PO')
            .then(($buttons) => {
                const actualCount = $buttons.length;
                cy.log(`🔢 Actual Enhance PO buttons found: ${actualCount}`);

                Cypress._.times(actualCount, (index) => {
                    enhanceSinglePO(index, actualCount, customStepsCallback);
                });

                cy.log(`✅ All ${actualCount} PO(s) enhanced. Running beforeApprove...`);
                beforeApproveCallback();
            });
    });
};

export const afterCKSCommon = (Module: string): void => {
    afterCKSPOST();
    if (Module === 'MUSIC') {
        performMusicRoles();
    }
};