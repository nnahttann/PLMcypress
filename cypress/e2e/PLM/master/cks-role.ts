import { login } from './helpers';
import { ClaimProject, approveProject, navigateToWorkspace, performSimpleApprovalRole } from './claim-approve';
import { getStandardProjectName, getOntopProjectName } from './project-manager';
import { ApproveFunction, formattedDateMain, formattedDateOntop, GetProjectNameFn } from './config';
import { afterCKSPOST, performMusicRoles } from './flows';

const env = Cypress.env() as Record<string, string>;
const {
    cks, ckspass,
} = env;

// ========================
// PO COUNT GUARDS
// แนะนำ: ย้าย 2 ฟังก์ชันนี้ไป config.ts แล้ว import ใช้ร่วมกับ claim-approve.ts
// ========================

/**
 * อ่าน poCount แบบปลอดภัย — กัน 0 / NaN / "" / undefined
 */
export const resolvePoCount = (fallback = 1): number => {
    const raw = Number(Cypress.env('poCount'));
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
};

/**
 * เขียน poCount แบบมี guard — ปฏิเสธค่า <= 0 เพื่อไม่ให้ทับค่าดีที่ flow ก่อนหน้า set ไว้
 */
export const setPoCount = (count: number, source: string): void => {
    const prev = Number(Cypress.env('poCount')) || 0;
    if (!Number.isFinite(count) || count <= 0) {
        cy.log(`⚠️ [${source}] พยายาม set poCount = ${count} — ปฏิเสธ, คงค่าเดิม (${prev})`);
        return;
    }
    Cypress.env('poCount', count);
    cy.log(`✅ [${source}] poCount = ${count} (เดิม ${prev})`);
};

// ========================
// HELPERS
// ========================

const registerPoDetailPageIntercepts = (): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/mass-enh-po-detail/getByPoEnhRowId/**').as('getPoEnhDetail');
    cy.intercept('GET', '/PLMSpringBoot/api/check-sff-product-enh/**').as('getCheckSffEnh');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getByGroupTypeAndActiveFlagOrderByOrderbyAsc/Billing%20Priority/**').as('getBillingPriority');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getByGroupTypeAndLovVal4ContainsAndActiveFlag/Billing%20Priority/**').as('getBillingPriorityMobile');
    cy.intercept('GET', '/PLMSpringBoot/api/sff-product-by-detailrowid/**').as('getSffProductDetail');
};

const handlePoDetailRoute = (customStepsCallback: () => void): void => {
    cy.wait('@getPoEnhDetail', { timeout: 600000 });
    cy.wait('@getCheckSffEnh', { timeout: 600000 });
    cy.wait('@getBillingPriority', { timeout: 600000 });
    cy.wait('@getBillingPriorityMobile', { timeout: 600000 });
    cy.wait('@getSffProductDetail', { timeout: 600000 });

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

const waitForProjectPageLoad = (timeout = 6000000): void => {
    cy.wait(['@getProject', '@getHistory', '@getNote'], { timeout: 6000000 });

    cy.get('@getAttachment', { timeout: 10000000 }).then(
        (xhr) => {
            if (xhr) {
                cy.log('✅ @getAttachment fired');
            } else {
                cy.log('⚠️ @getAttachment did not fire — skipping (new-flow page)');
            }
        },
    );
};

/**
 * ✅ FIX: scrape ชื่อ PO แบบทนทาน — รองรับ h3/h4/label และ span ว่าง
 * คืน array ว่างได้ (caller ต้องมี fallback เสมอ)
 */
const scrapePoNamesFromCksDoer = (): string[] => {
    const poNames: string[] = [];
    const LABEL_RE = /PLM\s*PO\s*Name/i;

    Cypress.$('h3, h4, h5, label, .panel-heading').each((_, el) => {
        const $el = Cypress.$(el);
        const fullText = ($el.text() || '').replace(/\s+/g, ' ').trim();
        if (!LABEL_RE.test(fullText)) return;

        // 1) ลองหยิบจาก span ก่อน
        let value = $el.find('span').text().replace(/\s+/g, ' ').trim();

        // 2) ถ้า span ว่าง — ตัดเอาข้อความหลัง ":" ออกมาแทน
        if (!value) {
            const afterColon = fullText.split(':').slice(1).join(':').trim();
            value = afterColon;
        }

        // 3) ถ้ายังว่าง — ลองดู element ถัดไป
        if (!value) {
            value = $el.next().text().replace(/\s+/g, ' ').trim();
        }

        if (value && !LABEL_RE.test(value)) {
            poNames.push(value);
        }
    });

    return [...new Set(poNames)];
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

        cy.log(`🔢 poCount ขาเข้า CKS: ${resolvePoCount(0)} (raw: ${Cypress.env('poCount')})`);
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
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 300000 });
    cy.get('body').should('be.visible');

    const finalProjectName = getProjectNameFn();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

    ClaimProject(finalProjectName, { claimBy: 'project' });
    approveProject(finalProjectName);

    cy.then(() => {
        registerProjectPageIntercepts();
        waitForProjectPageLoad(60000);

        // ✅ FIX หลัก: ใช้จำนวนปุ่ม "Enhance PO" เป็นแหล่งความจริง
        // ส่วน scrape ชื่อ PO เป็นแค่ข้อมูลเสริม — ถ้าพังจะไม่ทับ env ด้วย 0 อีกต่อไป
        cy.get('button.btn-sample', { timeout: 300000 })
            .filter((_, el) => el.textContent?.trim() === 'Enhance PO')
            .then(($buttons) => {
                const buttonCount = $buttons.length;
                const poNames = scrapePoNamesFromCksDoer();

                cy.log(`🔢 Enhance PO buttons: ${buttonCount} | scraped PO names: ${poNames.length}`);

                if (poNames.length > 0) {
                    Cypress.env('allPoNames', poNames);
                    cy.log(`📋 PO Names: ${JSON.stringify(poNames)}`);
                } else {
                    cy.log(`⚠️ scrape ชื่อ PO ไม่ได้ — คง allPoNames เดิม: ${JSON.stringify(Cypress.env('allPoNames'))}`);
                }

                // ใช้ชื่อที่ scrape ได้ก่อน ถ้าไม่มีก็ fallback เป็นจำนวนปุ่ม
                setPoCount(poNames.length || buttonCount, 'CKS:enhancePO');

                if (buttonCount === 0) {
                    throw new Error('❌ ไม่พบปุ่ม "Enhance PO" บนหน้า CKS Doer');
                }

                Cypress._.times(buttonCount, (index) => {
                    enhanceSinglePO(index, buttonCount, customStepsCallback);
                });
            });
    });

    cy.then(() => {
        cy.log('✅ All PO(s) enhanced. Running beforeApprove...');
        beforeApproveCallback();
    });

    cy.then(() => {
        cy.log('🏁 Running cksDoerFinalStep...');
        cksDoerFinalStep(getProjectNameFn);
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

    cy.get('body').then(($body) => {
        if ($body.find('.cdk-overlay-backdrop').length > 0) {
            cy.log('⚠️ พบ overlay-backdrop ค้างก่อนกด Enhance PO — เคลียร์ก่อน');
            cy.get('.cdk-overlay-backdrop').click({ force: true });
            cy.get('.cdk-overlay-backdrop').should('not.exist');
        }
        const sel = '[class*="loading"], [class*="spinner"], .p-progress-spinner';
        if ($body.find(sel).length > 0) {
            cy.get(sel, { timeout: 300000 }).should('not.exist');
        }
    });

    cy.get('button.btn-sample', { timeout: 300000 })
        .should('have.length.greaterThan', index);

    registerPoDetailPageIntercepts();

    const tag = `po${index}`;

    cy.intercept({ method: 'GET', url: '**/getProjectByProjectId/**', times: 1 })
        .as(`getProject_${tag}`);

    cy.intercept({ method: 'GET', url: '**/sff-product-by-detailrowid/**', times: 1 })
        .as(`pageReady_${tag}`);

    cy.then(() => {
        cy.get('button.btn-sample')
            .filter((_, el) => el.textContent?.trim() === 'Enhance PO')
            .eq(index)
            .scrollIntoView()
            .should('be.visible')
            .and('not.be.disabled')
            .click();
    });

    cy.wait([
        `@getProject_${tag}`,
        `@pageReady_${tag}`,
    ], { timeout: 300000 });

    cy.get('body').then(($body) => {
        const sel = '[class*="loading"], [class*="spinner"], .p-progress-spinner';
        if ($body.find(sel).length > 0) {
            cy.get(sel, { timeout: 300000 }).should('not.exist');
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

    if (registerBeforeBack) {
        registerProjectPageIntercepts();
    }

    cy.get('body').then(($body) => {
        const buttonTexts = $body
            .find('button')
            .map((_, el) => el.textContent?.trim())
            .get()
            .filter(Boolean);
        cy.log(`🔍 ปุ่มที่เจอในหน้านี้: ${JSON.stringify(buttonTexts)}`);
    });

    cy.get('body').then(($body) => {
        if ($body.find('.cdk-overlay-backdrop').length > 0) {
            cy.log('⚠️ พบ overlay-backdrop โผล่ใหม่ก่อนกด Back');
            cy.get('.cdk-overlay-backdrop').click({ force: true });
            cy.get('.cdk-overlay-backdrop').should('not.exist');
        }
    });

    cy.contains('button', 'Back', { timeout: 150000 }).should('be.visible').and('not.be.disabled').click();
    cy.contains('button', 'Yes', { timeout: 150000 }).should('be.visible').click();

    cy.url({ timeout: 600000 }).should('include', '/new-flow/home/newcks/cks-doer');
    cy.get('body', { timeout: 600000 }).should('be.visible');
};

// ========================
// MAIN EXPORT
// ========================

const clickApproveButton = (specificLabel: string | undefined, timeout: number): void => {
    const candidates = specificLabel ? [specificLabel, 'Approve'] : ['Approve'];

    cy.get('button', { timeout }).should(($buttons) => {
        const texts = $buttons.toArray().map(b => Cypress.$(b).text().trim());
        const found = candidates.some(label => texts.includes(label));
        expect(found, `expected one of [${candidates.join(', ')}] to exist`).to.be.true;
    });

    cy.get('button').then(($buttons) => {
        for (const label of candidates) {
            const $match = $buttons.filter((_, el) => Cypress.$(el).text().trim() === label);
            if ($match.length > 0) {
                cy.wrap($match.first())
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click();
                return;
            }
        }
    });
};

export const cksDoerFinalStep = (getProjectNameFn?: GetProjectNameFn): void => {
    cy.wait(3000);

    cy.get('body').then(($body) => {
        const hasFastLane = $body.find('label:contains("Fast Lane :")').length > 0;

        if (hasFastLane) {
            cy.contains('label', 'Fast Lane :', { timeout: 300000 })
                .should('be.visible');

            cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

            cy.contains('label', 'Fast Lane :')
                .parent()
                .next()
                .find('input[type="checkbox"]')
                .check();

            cy.get('.row.col-md-11')
                .find('input[type="checkbox"]')
                .check();

            cy.get('input[aria-label="Date input field"]', { timeout: 300000 })
                .eq(1)
                .should('be.visible')
                .and('not.be.disabled');

            const onProdDate = getRandomFutureOnProductionDate();
            cy.get('input[aria-label="Date input field"]')
                .eq(1)
                .type(onProdDate);
        } else {
            cy.log('ℹ️ Fast Lane not found — skip checkbox/date logic, ไป Approve ตรงๆ');
        }
    });

    cy.intercept(
        { method: '*', url: '**/PromoteFromCksDoer/**' },
    ).as('submitApprove');

    cy.intercept({ method: '*', url: '**/api-cks/**' }).as('anyCksRequest');

    cy.contains('button', 'Approve', { timeout: 150000 })
        .should('be.visible')
        .click();

    cy.wait('@submitApprove', { timeout: 6000000 }).then((interception) => {
        cy.log(`✅ submitApprove METHOD : ${interception.request.method}`);
        cy.log(`✅ submitApprove URL    : ${interception.request.url}`);
        expect(interception.response?.statusCode).to.eq(200);
    });

    cy.url({ timeout: 6000000 })
        .should('include', '/#/workspace-home/workspace');

    const finalProjectName =
        (getProjectNameFn ? getProjectNameFn() : '') ||
        getStandardProjectName() ||
        Cypress.env('formattedDateMain') ||
        Cypress.env('formattedDate');

    if (!finalProjectName) {
        throw new Error(
            '❌ No project name found. Check getProjectNameFn, ProjectManager, formattedDateMain, or formattedDate'
        );
    }

    // ✅ FIX: กันไม่ให้ flow เดินต่อแบบ "เขียวหลอก" ตอน poCount = 0
    cy.then(() => {
        const count = resolvePoCount(0);
        expect(count, '❌ poCount = 0 ก่อน Claim/Approve — env ถูกเขียนทับหรือไม่เคยถูก set')
            .to.be.greaterThan(0);
    });

    cy.log(`🔑 Using projectName : ${finalProjectName}`);
    cy.log(`🔑 PO count          : ${resolvePoCount()}`);
    cy.log(`🔑 PO names          : ${JSON.stringify(Cypress.env('allPoNames'))}`);

    ClaimProject(finalProjectName, { claimBy: 'project' });
    approveProject(finalProjectName);

    cy.url({ timeout: 3_000_0000 })
        .should('include', '/#/new-flow/home/newcks/cks-checker');

    cy.get('body', { timeout: 3_000_0000 }).should('be.visible');
    cy.scrollTo('bottom');
    cy.wait(5000);

    cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
    cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');
    cy.intercept('POST', '**/mail-service/CGMD-Conigure/**').as('sendMail');

    clickApproveButton('Approve To CGMD', 3_000_0000);

    cy.wait('@promoteChecker', { timeout: 600000 }).then((interception) => {
        const statusCode = interception.response?.statusCode ?? 0;
        expect(statusCode, 'promoteChecker status').to.be.oneOf([200, 304]);
    });
    cy.wait('@assignCgmd', { timeout: 600000 }).then((interception) => {
        const statusCode = interception.response?.statusCode ?? 0;
        expect(statusCode, 'assignCgmd status').to.be.oneOf([200, 304]);
    });
    cy.wait('@sendMail', { timeout: 600000 }).then((interception) => {
        const statusCode = interception.response?.statusCode ?? 0;
        expect(statusCode, 'sendMail status').to.be.oneOf([200, 304]);
    });

    cy.url({ timeout: 3_000_0000 })
        .should('include', '/#/workspace-home/workspace');

    cy.contains('button', 'Logout')
        .should('be.visible')
        .click();
};

// ========================
// DATE UTILITIES
// ========================

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