import { Module, PriceType, ProductClass, ProjectBasicOptions, now, MKTpre, MKTpre1, MKTpost, MKTpost1, enter, enterpass, music, musicpass } from './config';
import { getTimeSuffix } from './config';
import { login, getRandomPhone, scrollAndWait } from './helpers';
import { registerProjectName, registerProjectCode } from './project-manager';
import { createPOWordingPools, RandomProjectDescription, RandomRemark } from '../Approve/po-wording-pools';
import { PriceExcluding, selectTargetGroup, dropdownPromotionGroup, targetgroup, RetryPattern, RandomMultiDuration, Randomdropdown, RandomFixedDates, RunMassMktTabs } from './dropdowns-randomizers';
import { CopyDeductFail } from './priority-updaters';
import { smsWording } from './sms-wording';
import { RandomProductSpecification } from './product-specs';
import { beforeapproveMKT } from './flows';
import { ChargePartner, InternalShare, RevenueSharing, SharingPartner } from './MKT_Share';
import { RandomHumanTouchPoint } from './human-touch-point';
import { RandomNonHumanTouchPoint } from './non-human-touch-point';
import { selectModifySections, fillSelectedModifySections } from './modify';

// ========================
// CREDENTIALS HELPER
// ========================

const getCredentials = (module: Module): { user: string, pass: string } => {
    const credMap: Record<Module, { user: string, pass: string }> = {
        'POST': { user: MKTpost, pass: MKTpost1 },
        'PRE': { user: MKTpre, pass: MKTpre1 },
        'ENTER': { user: enter, pass: enterpass },
        'MUSIC': { user: music, pass: musicpass }
    };
    return credMap[module] || credMap['POST'];
};

const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

// ========================
// PROJECT BASIC INFORMATION HELPERS
// ========================

const ABBREVIATIONS: Record<string, string> = {
    recurring: 'REC',
    onetime: 'OT',
    usage: 'USG',
    main: 'MAIN',
    ontop: 'ONTOP',
    ontopextra: 'ONTOP X',
    ENTER: 'ENT',
    MUSIC: 'MUS',
    AccountFee: 'ACC FEE',
    OrderFee: 'ORD FEE',
    CashBack: 'CASHBACK',
    Service: 'SERVICE',
    GroupPoFee: 'GRP PO FEE',
};

const getAbbreviation = (word: string | undefined): string => {
    if (!word) return '';
    return ABBREVIATIONS[word] || word;
};

const generateUniqueId = (): string => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${month}${day} ${h}${mm}`;
};

const buildUniqueName = (baseName: string, identifier: string, maxLength: number): string => {
    const reservedLength = identifier.length;
    const maxBaseLength = maxLength - reservedLength;

    let cleanBase = baseName;
    if (cleanBase.length > maxBaseLength) {
        cleanBase = cleanBase.substring(0, maxBaseLength);
    }

    return `${cleanBase} ${identifier}`;
};

// ========================
// GENERATE PROJECT NAMES
// ========================

const generateProjectNames = (
    prefix: string,
    Module: Module,
    subModule: string | undefined,
    PriceType: string,
    ProductClass?: string,
    PoSubGroup?: string,
    Plugin?: string,
    touchPoint?: { runHumanTouchPoint?: boolean; runNonHumanTouchPoint?: boolean }
): { projectName: string; poName: string; prefixName: string } => {
    const timeId = generateUniqueId();
    let prefixName: string;

    if (PoSubGroup) {
        const modulePart = getAbbreviation(Module);
        const subGroupPart = getAbbreviation(PoSubGroup);
        if (Module === 'PRE' && (PoSubGroup === 'Service' || PoSubGroup === 'OrderFee')) {
            prefixName = `MOB ${modulePart} ${getAbbreviation(PriceType)} ${subGroupPart}`;
        } else {
            prefixName = `MOB ${modulePart} ${subGroupPart}`;
        }
    } else {
        const ModulePart = (Module === 'ENTER' || Module === 'MUSIC')
            ? `${getAbbreviation(prefix)} ${getAbbreviation(subModule)}`
            : `${getAbbreviation(prefix)} ${getAbbreviation(Module)}`;

        const parts = [ModulePart, getAbbreviation(PriceType), getAbbreviation(ProductClass), getAbbreviation(Plugin)].filter(Boolean);
        prefixName = parts.join(' ');
    }
    const touchPointTag =
        touchPoint?.runHumanTouchPoint && touchPoint?.runNonHumanTouchPoint
            ? 'BTP'
            : touchPoint?.runHumanTouchPoint
            ? 'HTP'
            : touchPoint?.runNonHumanTouchPoint
            ? 'NHTP'
            : '';

    const projectIdentifier = touchPointTag
        ? `PRJ ${touchPointTag} ${timeId}`
        : `PRJ ${timeId}`;
    const poIdentifier = `PO ${timeId}`;

    const projectName = buildUniqueName(prefixName, projectIdentifier, 40);
    const poName = buildUniqueName(prefixName, poIdentifier, 35);

    return { projectName, poName, prefixName };
};

const selectOptionSafely = (
    selector: string,
    targetText: string,
    options: { timeout?: number; retries?: number } = {}
): void => {
    const { timeout = 15000, retries = 3 } = options;
    const normalize = (s: string) => (s || '').trim().replace(/\s+/g, ' ');

    const attempt = (retriesLeft: number): void => {
        cy.get(selector, { timeout }).should('be.visible').and('not.be.disabled');

        cy.get(`${selector} option`, { timeout }).should('have.length.greaterThan', 0);

        cy.get(`${selector} option`).then(($opts) => {
            const target = normalize(targetText);
            const optArr = [...$opts] as HTMLOptionElement[];

            // 1) exact match on trimmed visible text
            let match = optArr.find((o) => normalize(o.textContent || '') === target);

            // 2) exact match on the option's value attribute
            if (!match) {
                match = optArr.find((o) => normalize(o.value) === target);
            }

            // 3) fallback: text contains target (handles minor formatting drift)
            if (!match) {
                match = optArr.find((o) => normalize(o.textContent || '').includes(target));
            }

            if (!match) {
                const dump = optArr
                    .map((o) => `value="${o.value}" text="${normalize(o.textContent || '')}"`)
                    .join(' | ');
                cy.log(`⚠️ [selectOptionSafely] No match for "${targetText}" in ${selector}. Options: ${dump}`);

                if (retriesLeft > 0) {
                    cy.wait(1000);
                    attempt(retriesLeft - 1);
                    return;
                }

                throw new Error(
                    `❌ selectOptionSafely: could not find option matching "${targetText}" in ${selector}. Available: ${dump}`
                );
            }

            cy.get(selector).select(match!.value);
            cy.get(selector).should('have.value', match!.value);
        });
    };

    attempt(retries);
};

// ========================
// CREATE PROJECT BASE
// ========================

const createProjectBase = (
    credentials: { user: string; pass: string },
    projectName: string,
    Module: Module,
    subModule?: string,
    projectObject: string = 'Create',
    projectIndex: number = 0
): string => {
    login(credentials.user, credentials.pass);

    cy.intercept('POST', '/PLMSpringBoot/api/**').as('saveRequest');

    cy.get('.col-md-10 > .btn').should('be.visible').click();

    const finalProjectName = projectObject !== 'Create' ? `MOD ${projectName}` : projectName;

    cy.get('input[formcontrolname="projectName"]', { timeout: 10000 })
        .should('be.visible')
        .should('not.be.disabled')
        .click()
        .type(finalProjectName, { delay: 30 });

    const date = new Date();
    date.setDate(date.getDate() + 1);
    const formattedDateString = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    cy.get('input[formcontrolname="projectName"]').blur();

    cy.get('input[aria-label="Date input field"]')
        .click()
        .type(formattedDateString, { delay: 30 });
    cy.get('input[aria-label="Date input field"]').should('have.value', formattedDateString);

    if (Module === 'ENTER' || Module === 'MUSIC') {
        if (!subModule) throw new Error(`subModule is required for Module ${Module}`);
        const customerType = subModule === 'POST' ? 'Post-paid' : 'Pre-paid';
        cy.get('select[formcontrolname="customerType"]').select(customerType);
    }

    if (projectObject !== 'Create') {
        cy.get('select[formcontrolname="projectObject"]')
            .should('be.visible')
            .select(projectObject)
            .should('have.value', projectObject);
    }

    cy.get('input[formcontrolname="phoneNo"]')
        .click()
        .type(getRandomPhone(), { delay: 30 });

    RandomProjectDescription(finalProjectName, subModule, Module);

    cy.get('button[type="button"]').contains('Save').click();

    cy.wait('@saveRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

    cy.get('.modal-body > :nth-child(1) > div > .btn', { timeout: 15000 })
        .should('be.visible').click({ force: true });

    cy.get('modal-container').should('not.exist');

    cy.get('input[formcontrolname="projectCode"]', { timeout: 15000 })
        .should('be.visible')
        .invoke('val')
        .should('not.be.empty')
        .then((code) => {
            const projectCode = String(code).trim();
            cy.log(`📌 Captured Project Code: "${projectCode}" (index: ${projectIndex})`);
            Cypress.env('currentProjectCode', projectCode);
            registerProjectCode(projectCode, projectIndex);
        });

    return finalProjectName;
};
// ========================
// CREATE PO BASE
// ========================

const createPOBase = (
    poName: string,
    promotionSubGroupValue: string
): void => {
    cy.contains('li.sidebar-brand', 'List of Product Offering:')
        .find('button.btn')
        .first()
        .should('be.visible')
        .click();

    cy.get('input[formcontrolname="productName"]').type(poName);
    cy.get('select[formcontrolname="promotionSubGroupFrom"]').select(promotionSubGroupValue);

    cy.intercept('POST', '**/plm-po/addUpdate/**').as('createPO');

    cy.contains('button', 'Create').should('be.visible').click();

    cy.wait('@createPO', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

    // ให้เวลา Angular router/backend ประมวลผลหลัง POST ก่อนเช็ค hash
    // ถ้ามี loading curtain ระหว่าง navigate ให้รอจนกว่ามันจะหายไปก่อน
    cy.get('body').then(($body) => {
        if ($body.find('.loading-curtain').length > 0) {
            cy.get('.loading-curtain', { timeout: 120000 }).should('not.exist');
        }
    });

    cy.location('hash', { timeout: 120000 }).should((hash) => {
        expect(hash).to.include('/project-home/mass-mkt/mass-mkt-product-offering');
        expect(hash).to.include('projectId=');
        expect(hash).to.include('productId=');
    });

    cy.get('select[formcontrolname="priceType"]', { timeout: 60000 }).should('be.visible');
};

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const pickMultiple = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

const cleanEnglishText = (str: string): string => {
    if (!str) return '';
    return str
        .replace(/[^\x00-\x7F\s]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const cleanThaiText = (str: string): string => {
    if (!str) return '';
    return str
        .replace(/[^\u0E00-\u0E7F\u0020-\u007F\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const limit = (str: string, maxLen: number): string => {
    if (!str) return '';
    let result = str.length > maxLen ? str.substring(0, maxLen) : str;
    result = result.trimEnd();
    if (result.length === maxLen && !result.endsWith(' ') && result.includes(' ')) {
        const lastSpace = result.lastIndexOf(' ');
        if (lastSpace > maxLen * 0.7) {
            result = result.substring(0, lastSpace);
        }
    }
    return result;
};

const selectMultipleFromDualList = (controlName: string, maxSelections: number): void => {
    cy.get(`select[formcontrolname="${controlName}"]`).then(($select) => {
        const optionCount = $select.find('option').length;
        const actualMax = Math.min(maxSelections, optionCount);
        const numberOfSelections = Math.floor(Math.random() * actualMax) + 1;

        const selectedIndices = new Set<number>();
        while (selectedIndices.size < numberOfSelections) {
            selectedIndices.add(Math.floor(Math.random() * optionCount));
        }

        selectedIndices.forEach((index: number) => {
            cy.get(`select[formcontrolname="${controlName}"] option`)
                .eq(index)
                .dblclick({ force: true });
        });
    });
};

const limitAndCleanEN = (str: string, maxLen: number): string => {
    return limit(cleanEnglishText(str), maxLen);
};

const limitAndCleanTH = (str: string, maxLen: number): string => {
    return limit(cleanThaiText(str), maxLen);
};

// ====================================================================
// WORDING POOLS
// ====================================================================

const fillServicePOFields = (Module: Module, PriceType: string, projectName?: string, poName?: string, subModule?: string): void => {
    const promotionLevels = ['Mobile', 'Account', 'Non-Mobile'] as const;
    const randomPromotion = promotionLevels[Math.floor(Math.random() * promotionLevels.length)];

    cy.get('select[formcontrolname="promotionLevel"]')
        .select(randomPromotion)
        .should('have.value', randomPromotion);

    const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
    const pOName = poName || 'ServicePO';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);

    cy.get('textarea[formcontrolname="wordingInStatementEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.wordingInStatement.EN), 250));
    cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.wordingInStatement.TH), 250));

    const smsFlags = ['Send', "Don't Send"];
    const randomSmsFlag = smsFlags[Math.floor(Math.random() * smsFlags.length)];
    cy.get('select[formcontrolname="smsGreetingSendFlag"]').select(randomSmsFlag);

    if (randomSmsFlag === 'Send') {
        cy.get('textarea[formcontrolname="smsGreetingEn"]')
            .clear().type(limitAndCleanEN(pickRandom(pools.smsGreeting.EN), 400));
        cy.get('textarea[formcontrolname="smsGreetingTh"]')
            .clear().type(limitAndCleanTH(pickRandom(pools.smsGreeting.TH), 400));
    }

    const randomDeleteFlag = smsFlags[Math.floor(Math.random() * smsFlags.length)];
    cy.get('select[formcontrolname="smsDeleteSendFlag"]').select(randomDeleteFlag);

    if (randomDeleteFlag === 'Send') {
        cy.get('textarea[formcontrolname="smsDeleteEn"]')
            .clear().type(limitAndCleanEN(pickRandom(pools.smsDelete.EN), 250));
        cy.get('textarea[formcontrolname="smsDeleteTh"]')
            .clear().type(limitAndCleanTH(pickRandom(pools.smsDelete.TH), 250));
    }

    cy.get('textarea[formcontrolname="descriptionEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.description.EN), 500));
    cy.get('textarea[formcontrolname="descriptionTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.description.TH), 500));

    cy.get('input[formcontrolname="discountRevenueCode"]').clear().type('APCP-009');

    selectMultipleFromDualList('availableListBox', Math.floor(Math.random() * 3) + 1);

    const conditionCount = Math.floor(Math.random() * 5) + 2;
    const selectedConditions = pickMultiple(pools.otherCondition.EN, conditionCount);
    cy.get('textarea[formcontrolname="otherCondition"]')
        .clear().type(limitAndCleanEN(selectedConditions.join(' '), 1000));

    cy.get('textarea[formcontrolname="memoDescription"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

const fillCashBackPOFields = (Module: Module, PriceType: string, projectName?: string, poName?: string, subModule?: string): void => {
    const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
    const pOName = poName || 'CashBackPO';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);

    cy.get('textarea[formcontrolname="shortPromotionNameEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.shortPromotionName.EN), 100));
    cy.get('textarea[formcontrolname="shortPromotionNameTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.shortPromotionName.TH), 100));

    cy.get('textarea[formcontrolname="promotionDescriptionEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.promotionDescription.EN), 500));
    cy.get('textarea[formcontrolname="promotionDescriptionTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.promotionDescription.TH), 500));

    cy.get('textarea[formcontrolname="greetingLetterEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.greetingLetter.EN), 500));
    cy.get('textarea[formcontrolname="greetingLetterTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.greetingLetter.TH), 500));

    cy.get('textarea[formcontrolname="yourPackageNameEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.yourPackageName.EN), 100));
    cy.get('textarea[formcontrolname="yourPackageNameTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.yourPackageName.TH), 100));

    selectMultipleFromDualList('availableListBox', Math.floor(Math.random() * 3) + 1);
};

const fillStandardPOFields = (Module: Module, PriceType: string, projectName?: string, poName?: string, subModule?: string): void => {
    const productTypes = ['FBB', 'Fixline', 'Mobile', 'Non Mobile'] as const;
    const randomValue = productTypes[Math.floor(Math.random() * productTypes.length)];
    cy.get('select[formcontrolname="productType"]').select(randomValue).should('have.value', randomValue);

    const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
    const pOName = poName || 'StandardPO';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);

    cy.get('textarea[formcontrolname="wordingInStatementEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.wordingInStatement.EN), 250));
    cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.wordingInStatement.TH), 250));

    cy.get('textarea[formcontrolname="descriptionEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.description.EN), 500));
    cy.get('textarea[formcontrolname="descriptionTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.description.TH), 500));

    cy.get('input[formcontrolname="discountRevenueCode"]').clear().type('APCP-009');
    selectMultipleFromDualList('availableListBox', Math.floor(Math.random() * 3) + 1);

    const conditionCount = Math.floor(Math.random() * 5) + 2;
    const selectedConditions = pickMultiple(pools.otherCondition.EN, conditionCount);
    cy.get('textarea[formcontrolname="otherCondition"]')
        .clear().type(limitAndCleanEN(selectedConditions.join(' '), 1000));

    cy.get('textarea[formcontrolname="memoDescription"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

const fillCashBackDiscountConfig = (Module: Module, PriceType: string, projectName?: string, poName?: string): void => {
    const pName = projectName || `${Module} ${PriceType}${day}${month}${hours}${minutes}`;
    const pOName = poName || 'CashBackDiscount';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType);

    const durationOptions = [1, 3, 6, 12, 24, 36];
    const randomDuration = durationOptions[Math.floor(Math.random() * durationOptions.length)];
    cy.get('input[formcontrolname="duration"]').clear().type(randomDuration.toString());
    cy.get('button[class*="btn-primary"][type="button"]').first().click();

    const durationFromOptions = [0, 1, 2, 3];
    const randomDurationFrom = durationFromOptions[Math.floor(Math.random() * durationFromOptions.length)];
    cy.get('input[formcontrolname="durationFrom"]').clear().type(randomDurationFrom.toString());

    cy.get('select[formcontrolname="discountType"]')
        .find('option:not([disabled])')
        .then(($options) => {
            if ($options.length > 0) {
                const randomIndex = Math.floor(Math.random() * $options.length);
                cy.get('select[formcontrolname="discountType"]').select(($options[randomIndex] as HTMLOptionElement).value);
            }
        });

    cy.get('textarea[formcontrolname="discountNameEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.discountName.EN), 100));
    cy.get('textarea[formcontrolname="discountNameTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.discountName.TH), 100));

    const randomIndex = Math.floor(Math.random() * 2);
    cy.get('input[formcontrolname="marginalDiscount"]').eq(randomIndex).check({ force: true });
    cy.get('button[class*="btn-primary"][type="button"]').eq(1).click();
    cy.get('input[formcontrolname="prorate"]').eq(randomIndex).check({ force: true });

    const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

    if (randomIndex === 0) {
        const cashbackTypes = Math.floor(Math.random() * 2);

        if (cashbackTypes === 0) {
            cy.get('input[formcontrolname="cashBackType"]').first().check({ force: true });
            const totalUsage = getRandomNumber(1000, 5000);
            const cashBackExc = getRandomNumber(50, 500);
            cy.get('input[formcontrolname="totalUsageFromExcVat"]').clear().type(totalUsage.toString());
            cy.get('input[formcontrolname="cashBackExcVat"]').clear().type(cashBackExc.toString());
            cy.get('input[formcontrolname="cashBackIncVat"]').clear().type(Math.round(cashBackExc * 1.07).toString());
        } else {
            cy.get('input[formcontrolname="cashBackType"]').last().check({ force: true });
            cy.get('input[formcontrolname="totalUsageFromExcVat"]').clear().type(getRandomNumber(1000, 5000).toString());
            cy.get('input[formcontrolname="cashBackPercent"]').clear().type(getRandomNumber(1, 20).toString());
        }
    } else {
        cy.get('input[formcontrolname="cashBackType"]').last().check({ force: true });
        cy.get('input[formcontrolname="totalUsageFromExcVat"]').clear().type(getRandomNumber(1000, 5000).toString());
        cy.get('input[formcontrolname="cashBackPercent"]').clear().type(getRandomNumber(1, 20).toString());
    }
    cy.wait(2000);
    cy.get('button.btn.btn-primary').contains('Add').should('be.visible').click();
    cy.wait(2000);
    cy.get('button.btn.btn-primary').contains('Add').should('be.visible').click();
};

const setPriceVAT = (): void => {
    const getRandomCharge = (min = 100, max = 2000) => (Math.random() * (max - min) + min).toFixed(2);
    const randomCharge = getRandomCharge();

    cy.get('.modal-container').should('not.exist');

    cy.get('input[formcontrolname="priceExcludingVAT"]')
        .should('be.visible')
        .type(randomCharge, { force: true });

};
// ========================
// BACK BASIC INFO
// ========================

export const backBacicInfo = (): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getRequest4');
    cy.get('.sidebar-nav > :nth-child(2) > a').click({ timeout: 1000000 });

    cy.wait(1500); 

    cy.get('body').then(($body) => {
        const $btn = $body.find('.modal-body > .col-md-12 > :nth-child(1) > .btn');

        if ($btn.length > 0 && $btn.is(':visible')) {
            cy.log('⚠️ พบ unsaved-changes modal — คลิกเพื่อยืนยันออกจากหน้า');
            cy.wrap($btn).should('be.visible').and('not.be.disabled').click();
        } else {
            cy.log('✅ ไม่มี unsaved-changes modal (PO สุดท้ายถูก Save ไปแล้ว) — ข้ามการคลิก');
        }
    });

    cy.wait('@getRequest4', { timeout: 600000000 });

    cy.get('.loading-curtain', { timeout: 30000 }).should('not.exist');
    cy.contains('li.sidebar-brand', 'List of Product Offering:', { timeout: 30000 }).should('be.visible');
};

// ========================
// ADD FILE
// ========================

export const addFile = (): void => {

    cy.get('input[type="file"]', { timeout: 30000 }).should('exist');

    cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/1.txt', 'binary').then((fileContent) => {
        cy.get('input[type="file"][id="files"]', { timeout: 15000 }).selectFile(
            {
                contents: Cypress.Buffer.from(fileContent, 'binary'),
                fileName: '1.txt',
                mimeType: 'text/plain',
            },
            { force: true }
        );
    });


    beforeapproveMKT();
};

// ========================
// PROJECT BASIC INFORMATION COMPLETE
// ========================

export const ProjectBasicInformationComplete = (
    PriceType: PriceType,
    ProductClass: ProductClass,
    options: ProjectBasicOptions
): void => {
    const { Module, subModule, autoSetDuration = false, Plugin, runHumanTouchPoint = false, runNonHumanTouchPoint = false } = options;
    const credentials = getCredentials(Module);
    const prefix = (Module === 'ENTER' || Module === 'MUSIC') ? Module : 'MOB';

    const { projectName, poName, prefixName } = generateProjectNames(
        prefix,
        Module,
        subModule,
        PriceType,
        ProductClass,
        undefined,
        Plugin,
        { runHumanTouchPoint, runNonHumanTouchPoint }
    );

    const projectIndex = ProductClass === 'main' ? 0 : 1;
    createProjectBase(credentials, projectName, Module, subModule, 'Create', projectIndex);

    const envKey = ProductClass === 'main' ? 'formattedDateMain' : 'formattedDate';
    Cypress.env(envKey, projectName);
    registerProjectName(projectName, projectIndex);

    Cypress.env('hasYoutubePremium', false);
    Cypress.env('hasCloudGame', false);

    const poCount = 2;

    const poEnvKey = ProductClass === 'main' ? 'formattedDateMainPONAME' : 'formattedDateOntopPONAME';
    const poNames: string[] = [];

    cy.log(`🎲 Randomly selected to create ${poCount} PO(s)`);

    const sharedTimeId = generateUniqueId();

    for (let i = 0; i < poCount; i++) {
        const poIdentifier = `PO${i + 1} ${sharedTimeId}`;
        const currentPoName = buildUniqueName(prefixName, poIdentifier, 30);

        poNames.push(currentPoName);
        cy.log(`📦 [${i + 1}/${poCount}] Processing PO: ${currentPoName}`);

        createPOBase(currentPoName, 'Product Offering');
        cy.wait(3000);

        const priceTypeMap: Record<PriceType, string> = { onetime: '1: One-Time', recurring: '2: Recurring', usage: '3: Usage' };

        const productClassMapMobile: Record<ProductClass, string> = { main: '1: Main', ontop: '2: On-Top', ontopextra: '3: On-Top Extra' };
        const productClassMapEnterMusic: Record<'ontop' | 'ontopextra', string> = { ontop: '1: On-Top', ontopextra: '2: On-Top Extra' };
        const productValue = (Module === 'ENTER' || Module === 'MUSIC')
            ? productClassMapEnterMusic[ProductClass as 'ontop' | 'ontopextra']
            : productClassMapMobile[ProductClass];

        selectOptionSafely('select[formcontrolname="productClass"]', productValue);
        selectOptionSafely('select[formcontrolname="priceType"]', priceTypeMap[PriceType]);

        if (ProductClass === 'main') {
            const defaultItems = ['Internet', 'MMS', 'SMS', 'Voice'];
            const retrySelectProductClass = (attemptsLeft: number) => {
                cy.contains('.panel-heading', '*Product Specification').scrollIntoView().closest('.panel').within(() => {
                    cy.get('select[formcontrolname="selectedListBox"]').then($select => {
                        const selected = [...$select.find('option')].map(el => el.textContent?.trim() || '');
                        const hasAllDefaults = defaultItems.every(d => selected.includes(d));
                        cy.wrap(hasAllDefaults).as('defaultsReady');
                    });
                });

                cy.get('@defaultsReady').then(hasAllDefaults => {
                    if (hasAllDefaults) {
                        cy.log(`✅ default items confirmed`);
                    } else if (attemptsLeft > 0) {
                        cy.log(`⚠️ default items missing (${attemptsLeft} retries left)`);
                        selectOptionSafely('select[formcontrolname="productClass"]', productClassMapMobile['ontop']);
                        selectOptionSafely('select[formcontrolname="productClass"]', productValue);
                        cy.get('select[formcontrolname="priceType"]').should('exist').and('not.be.disabled');
                        selectOptionSafely('select[formcontrolname="priceType"]', priceTypeMap[PriceType]);
                        retrySelectProductClass(attemptsLeft - 1);
                    } else {
                        cy.log(`❌ default items still missing after retries`);
                    }
                });
            };
            cy.wait(500);
            retrySelectProductClass(3);
        }

        if (autoSetDuration) {
            const realisticDurations: Record<string, number[]> = {
                'hours': [2, 3, 4, 6, 8, 12, 18, 24, 36, 48, 72, 96, 120],
                'days': [2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365],
                'months': [2, 3, 4, 6, 9, 12, 18, 24, 36, 48, 60],
                'month_midnight': [2, 3, 4, 6, 9, 12, 18, 24, 36, 48, 60],
                'bill cycle': [2, 3, 4, 6, 9, 12, 18, 24],
                'year': [2, 3, 4, 5, 6, 7, 8, 9, 10],
            };

            cy.log(`⏱️ autoSetDuration=true, entering packageDurationUnit selection`);

            const stripIndexPrefix = (raw: string): string => raw.replace(/^\d+:\s*/, '').trim();

            const waitForStableOptions = (attemptsLeft: number, prevSignature: string | null): void => {
                cy.get('select[formcontrolname="packageDurationUnit"]')
                    .filter(':visible')
                    .should('have.length', 1)
                    .find('option:not([disabled])')
                    .should('have.length.greaterThan', 0)
                    .then($options => {
                        const labels = [...$options].map(o => stripIndexPrefix((o as HTMLOptionElement).text));
                        const signature = labels.join('|');

                        if (signature === prevSignature) {
                            cy.log(`✅ packageDurationUnit options stable: [${labels.join(', ')}]`);
                            pickAndSelect(labels);
                        } else if (attemptsLeft > 0) {
                            cy.log(`⏳ packageDurationUnit options still changing, waiting... (${attemptsLeft} left)`);
                            cy.wait(400);
                            waitForStableOptions(attemptsLeft - 1, signature);
                        } else {
                            cy.log(`⚠️ options never stabilized after retries, proceeding anyway with: [${labels.join(', ')}]`);
                            pickAndSelect(labels);
                        }
                    });
            };

            const pickAndSelect = (stableLabels: string[]): void => {
                const targetLabel = stableLabels[Math.floor(Math.random() * stableLabels.length)];
                const unitText = targetLabel.toLowerCase();

                const matchedKey = Object.keys(realisticDurations).find(key =>
                    unitText.includes(key) || key.includes(unitText)
                );
                const possibleDurations = matchedKey ? realisticDurations[matchedKey] : [2, 3, 7, 14, 30, 60, 90];
                const randomDuration = possibleDurations[Math.floor(Math.random() * possibleDurations.length)];

                const selectAndVerify = (attemptsLeft: number): void => {
                    cy.get('select[formcontrolname="packageDurationUnit"]')
                        .filter(':visible')
                        .should('have.length', 1)
                        .find('option:not([disabled])')
                        .then($options => {
                            const match = [...$options].find(
                                o => stripIndexPrefix((o as HTMLOptionElement).text) === targetLabel
                            ) as HTMLOptionElement | undefined;

                            if (!match) {
                                if (attemptsLeft > 0) {
                                    cy.log(`⚠️ "${targetLabel}" not found in current options, retrying — ${attemptsLeft} left`);
                                    cy.wait(400);
                                    selectAndVerify(attemptsLeft - 1);
                                    return;
                                }
                                throw new Error(`packageDurationUnit: "${targetLabel}" never reappeared in options after retries`);
                            }

                            cy.get('select[formcontrolname="packageDurationUnit"]')
                                .filter(':visible')
                                .select(match.value, { force: true });

                            cy.get('select[formcontrolname="packageDurationUnit"]')
                                .filter(':visible')
                                .then($select => {
                                    const currentRaw = $select.val() as string;
                                    const currentLabelMatches = currentRaw != null && stripIndexPrefix(currentRaw) === targetLabel;
                                    if (currentRaw === match.value || currentLabelMatches) {
                                        cy.log(`✅ packageDurationUnit confirmed: ${targetLabel}`);
                                    } else if (attemptsLeft > 0) {
                                        cy.log(`⚠️ packageDurationUnit not set yet (got "${currentRaw}"), retrying — ${attemptsLeft} left`);
                                        cy.wait(400);
                                        selectAndVerify(attemptsLeft - 1);
                                    } else {
                                        throw new Error(
                                            `packageDurationUnit: failed to select "${targetLabel}" after retries — stuck at "${currentRaw}"`
                                        );
                                    }
                                });
                        });
                };

                selectAndVerify(4);

                cy.get('input[formcontrolname="packageDuration"]').clear().type(randomDuration.toString());
                cy.log(`🗓️ Package Duration set to: ${randomDuration} ${targetLabel}`);
            };

            waitForStableOptions(5, null);

            cy.get('.col-md-8 > .btn').click();
        }

        if (subModule === 'PRE') {
            const shouldRandomizeBillCycle = Math.random() < 0.8;

            if (!shouldRandomizeBillCycle) {
                cy.log('📌 Keeping default Bill Cycle value (no randomization this run)');
            } else {
                const realisticBillCycles = [1, 5, 7, 10, 15, 20, 25, 28];
                const randomBillCycle = realisticBillCycles[Math.floor(Math.random() * realisticBillCycles.length)];

                cy.get('input[formcontrolname="packageBillCycle"]')
                    .should('be.visible')
                    .clear()
                    .type(randomBillCycle.toString());

                const realisticBillCycleUnits = ['Day', 'Days', 'Date', 'Month', 'Months'];

                cy.get('select[formcontrolname="packageBillCycleUnit"] option:not([disabled])')
                    .should('have.length.greaterThan', 0)
                    .then($options => {
                        const availableOptions = $options.map((_, el) => (el as HTMLOptionElement).value).get();
                        let matchedUnit = realisticBillCycleUnits.find(unit =>
                            availableOptions.includes(unit) ||
                            availableOptions.includes(unit.toLowerCase()) ||
                            availableOptions.includes(unit.toUpperCase())
                        );

                        if (!matchedUnit) {
                            matchedUnit = availableOptions[0];
                            cy.log(`⚠️ No realistic unit found. Fallback to: ${matchedUnit}`);
                        }

                        cy.get('select[formcontrolname="packageBillCycleUnit"]').select(matchedUnit);
                        cy.log(`🗓️ Bill Cycle set to: ${randomBillCycle} ${matchedUnit}`);
                    });
            }
        }
        const isMultiDurationEligible =
            PriceType?.toString().trim().toLowerCase() === 'recurring' ||
            PriceType?.toString().trim().toLowerCase() === 'usage';

        const randomValue = Math.random();
        const useMultiDuration = isMultiDurationEligible && randomValue < 0.5;

        cy.log(`🔍 PriceType="${PriceType}" | isMultiDurationEligible=${isMultiDurationEligible} | randomValue=${randomValue.toFixed(3)} | useMultiDuration=${useMultiDuration}`);

        if (useMultiDuration) {
            cy.log(`🎲 Multi Duration randomly selected: Yes (PriceType=${PriceType})`);
            RandomMultiDuration();
        } else {
            PriceExcluding();
        }

        RandomFixedDates();
        Randomdropdown();
        selectTargetGroup('random');
        dropdownPromotionGroup();
        RandomProductSpecification(ProductClass, subModule, Module);

        if (Module === 'PRE' && (ProductClass === 'ontop' || ProductClass === 'ontopextra')) {
            cy.get('input[formcontrolname="allowMvpn"]').should('exist').then(($radios) => {
                cy.wrap($radios).eq(Math.floor(Math.random() * $radios.length)).check();
            });
        }
        targetgroup();
        InternalShare();
        SharingPartner();
        RevenueSharing();
        ChargePartner();
        RunMassMktTabs();

        if (runHumanTouchPoint) {
            cy.log(`🤝 Running RandomHumanTouchPoint for subModule: ${subModule}`);
            RandomHumanTouchPoint(subModule);
        }

        if (runNonHumanTouchPoint) {
            cy.log(`🤖 Running RandomNonHumanTouchPoint for subModule: ${subModule}`);
            RandomNonHumanTouchPoint(subModule);
        }
        if ((Module !== 'POST') && subModule === 'PRE' && PriceType === 'recurring') {
            RetryPattern();
        }

        if (Module === 'PRE' && PriceType === 'recurring' && ProductClass === 'main') {
            CopyDeductFail('mass-market');
        }
        RandomRemark(projectName, currentPoName, PriceType, ProductClass, subModule);
        smsWording();

        if (i < poCount - 1) {
            cy.log(`🔙 PO ${currentPoName} done. Navigating back for next PO...`);
            backBacicInfo();
            cy.wait(1000);
        }
    }

    Cypress.env('currentModule', Module);
    Cypress.env('currentSubModule', subModule);
    Cypress.env('currentPriceType', PriceType);
    Cypress.env('currentProductClass', ProductClass);
    Cypress.env('currentProjectName', projectName);
    Cypress.env('currentPoName', poNames[0] || poName);

    cy.log(`✅ All ${poCount} PO(s) processed. Finalizing...`);

    Cypress.env('allPoNames', poNames);
    Cypress.env('poCount', poCount);

    backBacicInfo();
    addFile();

};

// ========================
// PROJECT BASIC INFORMATION OTHER PO SUB
// ========================

export const ProjectBasicInformationCompleteOtherPOSub = (
    PriceType: 'onetime' | 'recurring' | 'usage',
    PoSubGroup: 'AccountFee' | 'OrderFee' | 'CashBack' | 'Service' | 'GroupPoFee',
    Module: 'POST' | 'PRE'
): void => {
    const credentials = getCredentials(Module);
    const { projectName, poName, prefixName } = generateProjectNames('MOB', Module, undefined, PriceType, undefined, PoSubGroup);

    login(credentials.user, credentials.pass);
    cy.get('.col-md-10 > .btn').should('be.visible').click();

    cy.get('input[formcontrolname="projectName"]').type(projectName);
    Cypress.env('projectName', projectName);

    const date = new Date();
    date.setDate(date.getDate() + 1);
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.get('input[aria-label="Date input field"]').type(formattedDate);
    cy.get('input[aria-label="Date input field"]').should('have.value', formattedDate);
    cy.get('input[formcontrolname="phoneNo"]').type(getRandomPhone());

    RandomProjectDescription(projectName, Module);
    cy.get('button[type="button"]').contains('Save').click();
    cy.wait('@getRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.get('.modal-body > :nth-child(1) > div > .btn').click({ force: true });

    // ✅ เก็บ Project Code ลง ENV + ProjectManager (มี project เดียวต่อรัน ไม่ต้องส่ง index)
    cy.get('input[formcontrolname="projectCode"]', { timeout: 15000 })
        .should('be.visible')
        .invoke('val')
        .should('not.be.empty')
        .then((code) => {
            const projectCode = String(code).trim();
            cy.log(`📌 Captured Project Code: "${projectCode}"`);
            Cypress.env('currentProjectCode', projectCode);
            registerProjectCode(projectCode);
        });

    const poCount = 2;
    const poNames: string[] = [];
    const sharedTimeId = generateUniqueId();

    const subGroupMap: Record<string, string> = {
        AccountFee: 'Account Fee', OrderFee: 'Order Fee', CashBack: 'Cash Back',
        Service: 'Service', GroupPoFee: 'Group PO Fee'
    };

    cy.log(`🎲 Randomly selected to create ${poCount} PO(s)`);

    for (let i = 0; i < poCount; i++) {
        const poIdentifier = `PO${i + 1} ${sharedTimeId}`;
        const currentPoName = buildUniqueName(prefixName, poIdentifier, 30);
        poNames.push(currentPoName);

        cy.log(`📦 [${i + 1}/${poCount}] Processing PO: ${currentPoName}`);

        cy.get(':nth-child(4) > .btn').click({ force: true });
        cy.get('input[formcontrolname="productName"]').type(currentPoName);
        Cypress.env('poName', currentPoName);

        cy.get('select[formcontrolname="promotionSubGroupFrom"]').select(subGroupMap[PoSubGroup]);

        cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
        cy.contains('button', 'Create', { timeout: 10000 }).click();
        cy.wait('@postRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
        cy.wait('@getRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');
        cy.wait('@getProject', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
        cy.wait(5000);

        if (Module === 'PRE' && (PoSubGroup === 'OrderFee' || PoSubGroup === 'Service')) {
            const priceTypeMap: Record<string, string> = { onetime: 'One-Time', recurring: 'Recurring', usage: 'Usage' };
            // ✅ FIX: ใช้ selectOptionSafely แทน .select() ตรงๆ (จุดเสี่ยงเดียวกัน)
            selectOptionSafely('select[formcontrolname="priceType"]', priceTypeMap[PriceType]);
        }

        if (Module === 'POST' && PoSubGroup === 'CashBack') {
            fillCashBackDiscountConfig(Module, PriceType);
        }

        if (!(Module === 'POST' && PoSubGroup === 'CashBack')) {
            setPriceVAT();
        }

        const fieldFillers: Record<string, () => void> = {
            Service: () => fillServicePOFields(Module, PriceType),
            CashBack: () => fillCashBackPOFields(Module, PriceType),
        };

        if (fieldFillers[PoSubGroup]) {
            fieldFillers[PoSubGroup]();
        } else if (PoSubGroup !== 'CashBack' || Module !== 'POST') {
            fillStandardPOFields(Module, PriceType);
        }

        if (i < poCount - 1) {
            cy.log(`🔙 PO ${currentPoName} done. Navigating back for next PO...`);
            backBacicInfo();
            cy.wait(1000);
        }
    }

    Cypress.env('allPoNames', poNames);
    Cypress.env('poCount', poCount);
    Cypress.env('poName', poNames[0] || poName);

    cy.log(`✅ All ${poCount} PO(s) processed. Finalizing...`);
};

interface SelectedPORow {
    poName: string;
    projectName: string;
}

const selectAvailablePORows = (
    count: number = 1,
    PriceType?: PriceType,
    ProductClass?: ProductClass
): Cypress.Chainable<SelectedPORow[]> => {
    return cy.get('table tbody tr').then(($rows) => {
        const priceTypeToken = PriceType ? getAbbreviation(PriceType).toUpperCase() : null;
        const productClassToken = ProductClass ? getAbbreviation(ProductClass).toUpperCase() : null;

        const availableRows = $rows.filter((_, row) => {
            const $row = Cypress.$(row);
            const $firstCell = $row.find('td').eq(0);
            const hasLockIcon = $firstCell.find('i.material-icons').length > 0;
            const hasCheckbox = $firstCell.find('input[formcontrolname="checkbox"]').length > 0;

            if (!hasCheckbox || hasLockIcon) return false;

            if (!priceTypeToken && !productClassToken) return true;

            const cells = $row.find('td');
            const rowText = (
                Cypress.$(cells[2]).text() + ' ' + Cypress.$(cells[3]).text()
            ).toUpperCase().replace(/\s+/g, ' ');

            const matchesPriceType = priceTypeToken ? rowText.includes(priceTypeToken) : true;
            const matchesProductClass = productClassToken ? rowText.includes(productClassToken) : true;

            return matchesPriceType && matchesProductClass;
        });

        if (availableRows.length === 0) {
            throw new Error(
                `❌ No available (non-locked) PO rows found matching PriceType="${PriceType}" ProductClass="${ProductClass}"`
            );
        }

        const actualCount = Math.min(count, availableRows.length);
        if (actualCount < count) {
            cy.log(`⚠️ Requested ${count} rows but only ${availableRows.length} matched — selecting ${actualCount}`);
        }

        const shuffled = Cypress._.shuffle(Array.from(availableRows));
        const targetRows = shuffled.slice(0, actualCount);

        const selected: SelectedPORow[] = [];

        targetRows.forEach((row) => {
            const $targetRow = Cypress.$(row);
            const cells = $targetRow.find('td');
            const poName = Cypress.$(cells[2]).text().trim().replace(/\s+/g, ' ');
            const projectName = Cypress.$(cells[3]).text().trim().replace(/\s+/g, ' ');

            selected.push({ poName, projectName });
            cy.log(`📦 Selected PO: "${poName}" | Project: "${projectName}"`);

            cy.wrap($targetRow.find('input[formcontrolname="checkbox"]')).check({ force: true });
        });

        return cy.wrap(selected, { log: false });
    });
};

const searchProductOfferingByPO = (
    poCount: number = 1,
    PriceType?: PriceType,
    ProductClass?: ProductClass
): Cypress.Chainable<SelectedPORow[]> => {
    cy.contains('button', 'Search Product Offering')
        .should('be.visible')
        .click();

    cy.get('select[formcontrolname="poSubGroup"]')
        .should('be.visible')
        .select('Product Offering')
        .should('have.value', 'Product Offering');

    const monthsBackOptions = [1, 3, 6, 12];

    const trySearchWithMonthsBack = (attemptIndex: number): Cypress.Chainable<SelectedPORow[]> => {
        const monthsBack = monthsBackOptions[attemptIndex];
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - monthsBack);
        const formattedFromDate = fromDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        cy.log(`🔍 Searching with Commercial Launch Date from ${monthsBack} month(s) back`);

        cy.get('my-date-picker[formcontrolname="commercialLaunchDateFrom"] input[aria-label="Date input field"]')
            .should('be.visible')
            .clear()
            .type(formattedFromDate, { delay: 30 });
        cy.get('my-date-picker[formcontrolname="commercialLaunchDateFrom"] input[aria-label="Date input field"]')
            .should('have.value', formattedFromDate);

        cy.get('.col-md-2.text-right > button.btn.btn-default')
            .should('be.visible')
            .and('not.be.disabled')
            .click();

        cy.get('body').then(($body) => {
            if ($body.find('.loading-curtain').length > 0) {
                cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
            }
        });

        return cy.get('table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0).then(($rows) => {
            const matchCount = countMatchingRows($rows, PriceType, ProductClass);
            const isLastAttempt = attemptIndex >= monthsBackOptions.length - 1;

            if (matchCount < poCount && !isLastAttempt) {
                cy.log(
                    `⚠️ Found only ${matchCount}/${poCount} matching PO within ${monthsBack} month(s), widening search...`
                );
                return trySearchWithMonthsBack(attemptIndex + 1);
            }

            if (matchCount === 0) {
                const priceTypeToken = PriceType ? getAbbreviation(PriceType).toUpperCase() : null;
                const productClassToken = ProductClass ? getAbbreviation(ProductClass).toUpperCase() : null;

                cy.log(`🔎 Expected priceTypeToken: "${priceTypeToken}" | productClassToken: "${productClassToken}"`);

                $rows.slice(0, 8).each((_, row) => {
                    const cells = Cypress.$(row).find('td');
                    const poName = Cypress.$(cells[2]).text().trim().replace(/\s+/g, ' ');
                    const projectName = Cypress.$(cells[3]).text().trim().replace(/\s+/g, ' ');
                    cy.log(`Sample → PO: "${poName}" | Project: "${projectName}"`);
                });

                throw new Error(
                    `❌ No available PO found matching PriceType="${PriceType}" ProductClass="${ProductClass}" even after searching back ${monthsBack} months`
                );
            }

            if (matchCount < poCount) {
                cy.log(
                    `⚠️ Requested ${poCount} PO(s) but only found ${matchCount} even after searching back ${monthsBack} months (max range) — proceeding with ${matchCount}`
                );
            }

            return selectAvailablePORows(poCount, PriceType, ProductClass);
        });
    };
    return trySearchWithMonthsBack(0).then((selected) => {
        cy.contains('button', 'Modify')
            .should('be.visible')
            .and('not.be.disabled')
            .click();

        return cy.wrap(selected, { log: false });
    });
};

const countMatchingRows = (
    $rows: JQuery<HTMLElement>,
    PriceType?: PriceType,
    ProductClass?: ProductClass
): number => {
    const priceTypeToken = PriceType ? getAbbreviation(PriceType).toUpperCase() : null;
    const productClassToken = ProductClass ? getAbbreviation(ProductClass).toUpperCase() : null;

    let count = 0;
    $rows.each((_, row) => {
        const $row = Cypress.$(row);
        const $firstCell = $row.find('td').eq(0);
        const hasLockIcon = $firstCell.find('i.material-icons').length > 0;
        const hasCheckbox = $firstCell.find('input[formcontrolname="checkbox"]').length > 0;

        if (!hasCheckbox || hasLockIcon) return;

        if (!priceTypeToken && !productClassToken) {
            count++;
            return;
        }

        const cells = $row.find('td');
        const rowText = (
            Cypress.$(cells[2]).text() + ' ' + Cypress.$(cells[3]).text()
        ).toUpperCase().replace(/\s+/g, ' ');

        const matchesPriceType = priceTypeToken ? rowText.includes(priceTypeToken) : true;
        const matchesProductClass = productClassToken ? rowText.includes(productClassToken) : true;

        if (matchesPriceType && matchesProductClass) count++;
    });

    return count;
};

const closeSuccessModal = (): void => {
    cy.contains('.modal-title', 'Save Result', { timeout: 600000 })
        .closest('.modal-content')
        .find('.modal-footer button.btn-danger')
        .should('be.visible')
        .and('not.be.disabled')
        .click();
};

export const ProjectBasicInformationCompleteModify = (
    PriceType: PriceType,
    ProductClass: ProductClass,
    options: ProjectBasicOptions,
    poCount: number = 1
): void => {
    const { Module, subModule, Plugin } = options;
    const credentials = getCredentials(Module);
    const prefix = (Module === 'ENTER' || Module === 'MUSIC') ? Module : 'MOB';

    const { projectName, poName, prefixName } = generateProjectNames(prefix, Module, subModule, PriceType, ProductClass, undefined, Plugin);

    const projectIndex = ProductClass === 'main' ? 0 : 1;
    const actualProjectName = createProjectBase(credentials, projectName, Module, subModule, 'Modify By PO', projectIndex);

    const envKey = ProductClass === 'main' ? 'formattedDateMain' : 'formattedDate';
    Cypress.env(envKey, actualProjectName);
    registerProjectName(actualProjectName, projectIndex);

    searchProductOfferingByPO(poCount, PriceType, ProductClass).then((selected) => {
        Cypress.env('modifyTargetPoNames', selected.map(s => s.poName));
        Cypress.env('modifyTargetProjectNames', selected.map(s => s.projectName));
        Cypress.env('allPoNames', selected.map(s => s.poName));
        Cypress.env('poCount', selected.length);

        if (selected.length < poCount) {
            cy.log(`⚠️ Requested ${poCount} PO(s) but only found ${selected.length} available — proceeding with ${selected.length}`);
        }

        Cypress.env('currentModule', Module);
        Cypress.env('currentSubModule', subModule);
        Cypress.env('currentPriceType', PriceType);
        Cypress.env('currentProductClass', ProductClass);
        Cypress.env('currentProjectName', actualProjectName);

        cy.location('hash', { timeout: 6000000 }).should('include', 'product-offering-detail');

        // รอ loading curtain หาย
        cy.get('body').then(($body) => {
            if ($body.find('.loading-curtain').length > 0) {
                cy.get('.loading-curtain', { timeout: 600000 }).should('not.exist');
            }
        });

        cy.wait(3000); // รอ UI settle

        cy.get('div.drawer1', { timeout: 30000 })
            .should('exist')
            .find('a.button')
            .then($allPOs => {
                const actualPOCount = $allPOs.length;
                cy.log(`📋 Found ${actualPOCount} PO(s) in sidebar to modify`);

                if (actualPOCount === 0) {
                    throw new Error('❌ ไม่พบ PO ใน Sidebar หลังคลิก Modify');
                }

                cy.wrap(Array.from({ length: actualPOCount })).each((_: any, index: number) => {
                    cy.log(`🔄 [${index + 1}/${actualPOCount}] Processing PO in sidebar...`);

                    if (index > 0) {
                        cy.log(`🔀 Switching to PO at index ${index}...`);

                        cy.get('body').then(($body) => {
                            if ($body.find('.loading-curtain').length > 0) {
                                cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
                            }
                        });
                        cy.wait(2000);

                        cy.get('div.drawer1')
                            .find('a.button')
                            .then($links => {
                                if (index < $links.length) {
                                    const targetText = Cypress.$($links[index]).text().trim();
                                    cy.log(`✅ Clicking PO at index ${index}: "${targetText}"`);
                                    cy.wrap($links.eq(index)).should('be.visible').click({ force: true });
                                } else {
                                    throw new Error(
                                        `❌ Index ${index} out of range. มี PO ${$links.length} ตัวใน Sidebar`
                                    );
                                }
                            });

                        cy.wait(3000);
                        cy.get('body').then(($body) => {
                            if ($body.find('.loading-curtain').length > 0) {
                                cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
                            }
                        });
                    }

                    selectModifySections(1, 3).then((sections) => {
                        cy.log(`📝 Selected sections for PO ${index + 1}: ${sections.join(', ')}`);

                        fillSelectedModifySections(sections, index);
                    });

                    if (index < actualPOCount - 1) {
                        cy.contains('button', 'Save')
                            .should('be.visible')
                            .and('not.be.disabled')
                            .click();

                        closeSuccessModal();
                        cy.wait(2000);
                    }
                });
            }).then(() => {
                cy.log(`✅ Modify By PO complete — processed all POs in sidebar`);
                backBacicInfo();
                addFile();
            });
    });
};