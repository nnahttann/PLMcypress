import { login } from './helpers';
import { ClaimProject, approveProject, navigateToWorkspace, performSimpleApprovalRole } from './claim-approve';
import { getStandardProjectName, getOntopProjectName } from './project-manager';
import { ApproveFunction, formattedDateMain, formattedDateOntop, GetProjectNameFn } from './config';
import { approveProjectCGMD, approveProjectCGMDtester, approveProjectACTM, approveProjectOPER } from './approval-flows';
import { afterCKSPOST, performMusicRoles } from './flows';

const env = Cypress.env() as Record<string, string>;
const {
    cks, ckspass,
} = env;

// ========================
// HELPERS
// ========================

const registerPoDetailPageIntercepts = (): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/mass-enh-po-detail/getByPoEnhRowId/**').as('getPoEnhDetail');
    cy.intercept('GET', '/PLMSpringBoot/api/check-generate-po-enh/**').as('getCheckGenPoEnh');
    cy.intercept('GET', '/PLMSpringBoot/api/check-sff-product-enh/**').as('getCheckSffEnh');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getByGroupTypeAndActiveFlagOrderByOrderbyAsc/Billing%20Priority/**').as('getBillingPriority');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getByGroupTypeAndLovVal4ContainsAndActiveFlag/Billing%20Priority/**').as('getBillingPriorityMobile');
    cy.intercept('GET', '/PLMSpringBoot/api/sffProductDiy/addupdatesoid/**').as('getSffDiyDone');
};

const handlePoDetailRoute = (customStepsCallback: () => void): void => {
    cy.wait('@getPoEnhDetail', { timeout: 60000 });
    cy.wait('@getCheckGenPoEnh', { timeout: 60000 });
    cy.wait('@getCheckSffEnh', { timeout: 60000 });
    cy.wait('@getBillingPriority', { timeout: 60000 });
    cy.wait('@getBillingPriorityMobile', { timeout: 60000 });
    cy.wait('@getSffDiyDone', { timeout: 60000 });

    handleProductNameTrim();

    cy.wait(500);
    customStepsCallback();
};

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

export const getTomorrowDateString = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const yyyy = tomorrow.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const waitForProjectPageLoad = (timeout = 600000): void => {

    cy.wait(['@getProject', '@getHistory', '@getNote'], { timeout: 600000 });

    cy.get('@getAttachment', { timeout: 1000000 }).then(
        (xhr) => {
            if (xhr) {
                cy.log('✅ @getAttachment fired');
            } else {
                cy.log('⚠️ @getAttachment did not fire — skipping (new-flow page)');
            }
        },
    );
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
        // const getProjectName: GetProjectNameFn = () => 'MOB PRE Rec Main PRJ 2906 0912';
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

const handleAdditionalRoute = (customStepsCallback: () => void): void => {
    cy.log('ℹ️ Landed on mass-enh-additional route — skipping PO detail waits');
    cy.wait(500);
    customStepsCallback();
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
        registerProjectPageIntercepts();
        waitForProjectPageLoad(60000);

        cy.get('button.btn-sample')
            .filter((_, el) => el.textContent?.trim() === 'Enhance PO')
            .then(($buttons) => {
                const actualCount = $buttons.length;
                cy.log(`🔢 Actual Enhance PO buttons found: ${actualCount}`);

                Cypress._.times(actualCount, (index) => {
                    enhanceSinglePO(index, actualCount, customStepsCallback);
                });
            });
    });

    cy.then(() => {
        cy.log('✅ All PO(s) enhanced. Running beforeApprove...');
        beforeApproveCallback();
    });

    cy.then(() => {
        cy.log('🏁 Running cksDoerFinalStep...');
        cksDoerFinalStep();
    });
};

export const afterCKSCommon = (Module: string): void => {
    afterCKSPOST();
    if (Module === 'MUSIC') {
        performMusicRoles();
    }
};

const enhanceSinglePO = (
    index: number,
    actualCount: number,
    customStepsCallback: () => void,
): void => {
    cy.log(`📦 [${index + 1}/${actualCount}] Starting Enhance PO loop`);

    registerPoDetailPageIntercepts();

    const tag = `po${index}`;

    cy.intercept({ method: 'GET', url: '**/getProjectByProjectId/**', times: 1 })
        .as(`getProject_${tag}`);
    cy.intercept({ method: 'GET', url: '**/sffProductDiy/addupdatesoid/**', times: 1 })
        .as(`pageReady_${tag}`);

    cy.then(() => {
        cy.get('button.btn-sample')
            .filter((_, el) => el.textContent?.trim() === 'Enhance PO')
            .eq(index)
            .scrollIntoView({ ensureScrollable: false })
            .should('be.visible')
            .click();
    });

    cy.wait([
        `@getProject_${tag}`,
        `@pageReady_${tag}`,
    ], { timeout: 300000 });

    cy.get('body').then(($body) => {
        const sel = '[class*="loading"], [class*="spinner"], .p-progress-spinner';
        if ($body.find(sel).length > 0) {
            cy.get(sel, { timeout: 30000 }).should('not.exist');
        }
    });

    cy.url()
        .should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/)
        .then((url) => {
            if (url.includes('mass-enh-product-offering-detail')) {
                handlePoDetailRoute(customStepsCallback);
            } else {
                handleAdditionalRoute(customStepsCallback);
            }
        });

    const isLastPO = index >= actualCount - 1;
    cy.log(`🔙 [${index + 1}/${actualCount}] Back → re-register intercepts before Back`);

    backToCksDoer(true);
    waitForProjectPageLoad(60000);
    cy.wait(500);

    if (!isLastPO) {
        cy.log(`✅ [${index + 1}/${actualCount}] Project page loaded, ready for next PO`);
    } else {
        cy.log(`🏁 [${index + 1}/${actualCount}] Last PO — project page loaded, ready for beforeApprove`);
    }
};

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

    // 🔍 Debug: log ปุ่มทั้งหมดในหน้า ก่อนหา "Back"
    cy.get('body').then(($body) => {
        const buttonTexts = $body
            .find('button')
            .map((_, el) => el.textContent?.trim())
            .get()
            .filter(Boolean);
        cy.log(`🔍 ปุ่มที่เจอในหน้านี้: ${JSON.stringify(buttonTexts)}`);
    });

    // 🔍 เช็ค overlay อีกรอบก่อนกด เผื่อมันโผล่มาใหม่ระหว่าง customStepsCallback ทำงานเสร็จ
    cy.get('body').then(($body) => {
        if ($body.find('.cdk-overlay-backdrop').length > 0) {
            cy.log('⚠️ พบ overlay-backdrop โผล่ใหม่ก่อนกด Back');
            cy.get('.cdk-overlay-backdrop').click({ force: true });
            cy.get('.cdk-overlay-backdrop').should('not.exist');
        }
    });

    cy.contains('button', 'Back', { timeout: 15000 }).should('be.visible').and('not.be.disabled').click();
    cy.contains('button', 'Yes', { timeout: 15000 }).should('be.visible').click();

    cy.url({ timeout: 60000 }).should('include', '/new-flow/home/newcks/cks-doer');
    cy.get('body', { timeout: 60000 }).should('be.visible');
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const cksDoerFinalStep = (): void => {
    cy.wait(3000);

    // ─── Fast Lane checkbox ───────────────────────────────────────
    cy.contains('label', 'Fast Lane :', { timeout: 30000 })
        .should('be.visible');

    // register ก่อน check — เผื่อ checkbox trigger API
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    cy.contains('label', 'Fast Lane :')
        .parent()
        .next()
        .find('input[type="checkbox"]')
        .check();

    cy.get('.row.col-md-11')
        .find('input[type="checkbox"]')
        .check();

    // ─── Wait for date field ──────────────────────────────────────
    cy.get('input[aria-label="Date input field"]', { timeout: 30000 })
        .eq(1)
        .should('be.visible')
        .and('not.be.disabled');

    const onProdDate = getRandomFutureOnProductionDate();
    cy.get('input[aria-label="Date input field"]')
        .eq(1)
        .type(onProdDate);

    // ─── Step 1: Intercept Approve BEFORE clicking ────────────────
    cy.intercept(
        { method: '*', url: '**/PromoteFromCksDoer/**' },
    ).as('submitApprove');

    cy.intercept({ method: '*', url: '**/api-cks/**' }).as('anyCksRequest');

    cy.contains('button', 'Approve', { timeout: 15000 })
        .should('be.visible')
        .click();

    cy.wait('@submitApprove', { timeout: 600000 }).then((interception) => {
        cy.log(`✅ submitApprove METHOD : ${interception.request.method}`);
        cy.log(`✅ submitApprove URL    : ${interception.request.url}`);
        expect(interception.response?.statusCode).to.eq(200);
    });

    cy.url({ timeout: 600000 })
        .should('include', '/#/workspace-home/workspace');

    // ─── Step 2: CKS-Checker phase ───────────────────────────────
    const finalProjectName =
        Cypress.env('formattedDateMain') ||
        Cypress.env('formattedDate');

    if (!finalProjectName) {
        throw new Error(
            '❌ No project name found in Cypress env. Check formattedDateMain or formattedDate'
        );
    }

    cy.log(`🔑 Using projectName : ${finalProjectName}`);
    cy.log(`🔑 PO count          : ${Cypress.env('poCount')}`);
    cy.log(`🔑 PO names          : ${JSON.stringify(Cypress.env('allPoNames'))}`);

    ClaimProject(finalProjectName, { claimBy: 'project' });
    approveProject(finalProjectName);

    cy.url({ timeout: 3_000_000 })
        .should('include', '/#/new-flow/home/newcks/cks-checker');

    cy.get('body', { timeout: 3_000_000 }).should('be.visible');
    cy.scrollTo('bottom');
    cy.wait(5000);

    // ─── Step 3: Approve To CGMD ─────────────────────────────────
    cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
    cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');
    cy.intercept('POST', '**/mail-service/CGMD-Conigure/**').as('sendMail');

    cy.contains('button', 'Approve To CGMD', { timeout: 3_000_000 })
        .should('be.visible')
        .click();

    cy.wait('@promoteChecker', { timeout: 60000 })
        .its('response.statusCode').should('eq', 200);
    cy.wait('@assignCgmd', { timeout: 60000 })
        .its('response.statusCode').should('eq', 200);
    cy.wait('@sendMail', { timeout: 60000 })
        .its('response.statusCode').should('eq', 200);

    cy.url({ timeout: 3_000_000 })
        .should('include', '/#/workspace-home/workspace');

    // ─── Step 4: Logout ──────────────────────────────────────────
    cy.contains('button', 'Logout')
        .should('be.visible')
        .click();
};

const fmtDate = (d: Date): string => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
};

const endOfMonth = (year: number, month: number): Date =>
    new Date(year, month + 1, 0);

const addMonths = (base: Date, months: number): Date => {
    const d = new Date(base);
    const rawMonth = d.getMonth() + months;
    const targetMonth = ((rawMonth % 12) + 12) % 12;
    d.setMonth(rawMonth);
    if (d.getMonth() !== targetMonth) d.setDate(0);
    return d;
};

export const getRandomFutureOnProductionDate = (): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const roll = Math.random();
    let result: Date;

    if (roll < 0.30) {
        const monthsAhead = 1 + Math.floor(Math.random() * 24);
        const target = addMonths(today, monthsAhead);
        result = endOfMonth(target.getFullYear(), target.getMonth());
    } else if (roll < 0.50) {
        result = addMonths(today, 1);
    } else if (roll < 0.70) {
        const twoYears = new Date(today);
        twoYears.setFullYear(twoYears.getFullYear() + 2);
        const jitter = Math.floor(Math.random() * 15) - 7;
        twoYears.setDate(twoYears.getDate() + jitter);
        result = twoYears;
    } else {
        const daysAhead = 1 + Math.floor(Math.random() * 1095);
        const rand = new Date(today);
        rand.setDate(rand.getDate() + daysAhead);
        result = rand;
    }

    if (result <= today) {
        result = new Date(today);
        result.setDate(result.getDate() + 1);
    }

    return fmtDate(result);
};