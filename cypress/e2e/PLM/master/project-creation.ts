import { Module, PriceType, ProductClass, ProjectBasicOptions, now, MKTpre, MKTpre1, MKTpost, MKTpost1, enter, enterpass, music, musicpass } from './config';
import { getTimeSuffix } from './config';
import { login, getRandomPhone, scrollAndWait } from './helpers';
import { registerProjectName } from './project-manager';
import { createPOWordingPools, RandomProjectDescription, RandomRemark } from '../Approve/po-wording-pools';
import { PriceExcluding, selectTargetGroup, dropdownPromotionGroup, targetgroup, RetryPattern, RandomMultiDuration } from './dropdowns-randomizers';
import { CopyDeductFail } from './priority-updaters';
import { smsWording } from './sms-wording';
import { RandomProductSpecification } from './product-specs';
import { beforeapproveMKT } from './mkt-flows';

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
    // PriceType
    recurring: 'Rec',
    onetime: 'OT',
    usage: 'Usg',
    // ProductClass
    main: 'Main',
    ontop: 'Ontop',
    ontopextra: 'OntopX',
    // Modules
    ENTER: 'ENT',
    MUSIC: 'MUS',
    // PoSubGroup
    AccountFee: 'Account Fee',
    OrderFee: 'Order Fee',
    CashBack: 'Cash Back',
    Service: 'Service',
    GroupPoFee: 'Group Po Fee',
};

const getAbbreviation = (word: string | undefined): string => {
    if (!word) return '';
    return ABBREVIATIONS[word] || word; // ถ้าไม่มีใน dict ให้ใช้คําเดิม
};

const generateUniqueId = (): string => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    // const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${day}${month} ${h}${s}`;
};

const buildUniqueName = (baseName: string, identifier: string, maxLength: number): string => {
    // const separator = '_';
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
    Plugin?: string
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

    const projectIdentifier = `PRJ ${timeId}`; // PRJ143052 (9 ตัว)
    const poIdentifier = `PO ${timeId}`;       // PO143052 (8 ตัว)

    // Project ใช้ Max 40 ตัว
    const projectName = buildUniqueName(prefixName, projectIdentifier, 40);

    const poName = buildUniqueName(prefixName, poIdentifier, 35);

    return { projectName, poName, prefixName };
};

// ========================
// CREATE PROJECT BASE
// ========================

const createProjectBase = (
    credentials: { user: string; pass: string },
    projectName: string,
    Module: Module,
    subModule?: string
): void => {
    login(credentials.user, credentials.pass);
    cy.get('.col-md-10 > .btn').should('be.visible').click();

    cy.get('input[formcontrolname="projectName"]', { timeout: 10000 })
        .should('be.visible').should('not.be.disabled').click().type(projectName);

    const date = new Date();
    date.setDate(date.getDate() + 1);
    const formattedDateString = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/edsOfferingController/getExistPackage/**').as('getExistPackage');

    cy.get('input[aria-label="Date input field"]').click().type(formattedDateString);
    cy.wait(1500);

    if (Module === 'ENTER' || Module === 'MUSIC') {
        if (!subModule) throw new Error(`subModule is required for Module ${Module}`);
        const customerType = subModule === 'POST' ? 'Post-paid' : 'Pre-paid';
        cy.get('select[formcontrolname="customerType"]').select(customerType);
    }

    cy.get('input[formcontrolname="phoneNo"]').type(getRandomPhone());
    RandomProjectDescription(projectName, subModule, Module);

    cy.get('button[type="button"]').contains('Save').click();
    cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getExistPackage', { timeout: 30000 });

    cy.get('.modal-body > :nth-child(1) > div > .btn', { timeout: 15000 })
        .should('be.visible').click({ force: true });

    cy.get('modal-container').should('not.exist');
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

    // 🔹 Narrow intercept to the actual creation endpoint (improves reliability)
    cy.intercept('POST', '**/plm-po/addUpdate/**').as('createPO');
    cy.contains('button', 'Create').should('be.visible').click();
    cy.wait('@createPO').its('response.statusCode').should('eq', 200);

    cy.intercept('GET', '**/getProjectByProjectId/*').as('getProject');
    cy.wait('@getProject', { timeout: 300000 });

    cy.location('hash').should('include', '/project-home/mass-mkt/mass-mkt-product-offering');

    cy.get('select[formcontrolname="priceType"]').should('be.visible');
};

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const pickMultiple = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;


const cleanEnglishText = (str: string): string => {
    if (!str) return '';
    return str
        .replace(/[^\x00-\x7F\s]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

// ===== HELPER: Clean text for Thai fields =====
const cleanThaiText = (str: string): string => {
    if (!str) return '';
    return str
        .replace(/[^\u0E00-\u0E7F\u0020-\u007F\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

// ===== HELPER: Limit string length =====
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

// ===== HELPER: Limit and clean EN =====
const limitAndCleanEN = (str: string, maxLen: number): string => {
    return limit(cleanEnglishText(str), maxLen);
};

// ===== HELPER: Limit and clean TH =====
const limitAndCleanTH = (str: string, maxLen: number): string => {
    return limit(cleanThaiText(str), maxLen);
};

// ====================================================================
// WORDING POOLS สำหรับ PO Fields
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

    // Wording In Statement
    cy.get('textarea[formcontrolname="wordingInStatementEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.wordingInStatement.EN), 250));
    cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.wordingInStatement.TH), 250));

    // SMS Greeting
    const smsFlags = ['Send', "Don't Send"];
    const randomSmsFlag = smsFlags[Math.floor(Math.random() * smsFlags.length)];
    cy.get('select[formcontrolname="smsGreetingSendFlag"]').select(randomSmsFlag);

    if (randomSmsFlag === 'Send') {
        cy.get('textarea[formcontrolname="smsGreetingEn"]')
            .clear().type(limitAndCleanEN(pickRandom(pools.smsGreeting.EN), 400));
        cy.get('textarea[formcontrolname="smsGreetingTh"]')
            .clear().type(limitAndCleanTH(pickRandom(pools.smsGreeting.TH), 400));
    }

    // SMS Delete
    const randomDeleteFlag = smsFlags[Math.floor(Math.random() * smsFlags.length)];
    cy.get('select[formcontrolname="smsDeleteSendFlag"]').select(randomDeleteFlag);

    if (randomDeleteFlag === 'Send') {
        cy.get('textarea[formcontrolname="smsDeleteEn"]')
            .clear().type(limitAndCleanEN(pickRandom(pools.smsDelete.EN), 250));
        cy.get('textarea[formcontrolname="smsDeleteTh"]')
            .clear().type(limitAndCleanTH(pickRandom(pools.smsDelete.TH), 250));
    }

    // Description
    cy.get('textarea[formcontrolname="descriptionEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.description.EN), 500));
    cy.get('textarea[formcontrolname="descriptionTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.description.TH), 500));

    cy.get('input[formcontrolname="discountRevenueCode"]').clear().type('APCP-009');

    selectMultipleFromDualList('availableListBox', Math.floor(Math.random() * 3) + 1);

    // Other Condition
    const conditionCount = Math.floor(Math.random() * 5) + 2;
    const selectedConditions = pickMultiple(pools.otherCondition.EN, conditionCount);
    cy.get('textarea[formcontrolname="otherCondition"]')
        .clear().type(limitAndCleanEN(selectedConditions.join(' '), 1000));

    // Memo Description
    cy.get('textarea[formcontrolname="memoDescription"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

const fillCashBackPOFields = (Module: Module, PriceType: string, projectName?: string, poName?: string, subModule?: string): void => {
    const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
    const pOName = poName || 'CashBackPO';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);

    // Short Promotion Name
    cy.get('textarea[formcontrolname="shortPromotionNameEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.shortPromotionName.EN), 100));
    cy.get('textarea[formcontrolname="shortPromotionNameTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.shortPromotionName.TH), 100));

    // Promotion Description
    cy.get('textarea[formcontrolname="promotionDescriptionEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.promotionDescription.EN), 500));
    cy.get('textarea[formcontrolname="promotionDescriptionTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.promotionDescription.TH), 500));

    // Greeting Letter
    cy.get('textarea[formcontrolname="greetingLetterEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.greetingLetter.EN), 500));
    cy.get('textarea[formcontrolname="greetingLetterTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.greetingLetter.TH), 500));

    // Your Package Name
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

    // Wording In Statement
    cy.get('textarea[formcontrolname="wordingInStatementEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.wordingInStatement.EN), 250));
    cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.wordingInStatement.TH), 250));

    // Description
    cy.get('textarea[formcontrolname="descriptionEn"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.description.EN), 500));
    cy.get('textarea[formcontrolname="descriptionTh"]')
        .clear().type(limitAndCleanTH(pickRandom(pools.description.TH), 500));

    cy.get('input[formcontrolname="discountRevenueCode"]').clear().type('APCP-009');
    selectMultipleFromDualList('availableListBox', Math.floor(Math.random() * 3) + 1);

    // Other Condition
    const conditionCount = Math.floor(Math.random() * 5) + 2;
    const selectedConditions = pickMultiple(pools.otherCondition.EN, conditionCount);
    cy.get('textarea[formcontrolname="otherCondition"]')
        .clear().type(limitAndCleanEN(selectedConditions.join(' '), 1000));

    // Memo Description
    cy.get('textarea[formcontrolname="memoDescription"]')
        .clear().type(limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

const fillCashBackDiscountConfig = (Module: Module, PriceType: string, projectName?: string, poName?: string): void => {
    const pName = projectName || `${Module} ${PriceType}${day}${month}${hours}${minutes}`;
    const pOName = poName || 'CashBackDiscount';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType);

    // Duration
    const durationOptions = [1, 3, 6, 12, 24, 36];
    const randomDuration = durationOptions[Math.floor(Math.random() * durationOptions.length)];
    cy.get('input[formcontrolname="duration"]').clear().type(randomDuration.toString());
    cy.get('button[class*="btn-primary"][type="button"]').first().click();

    // Duration From
    const durationFromOptions = [0, 1, 2, 3];
    const randomDurationFrom = durationFromOptions[Math.floor(Math.random() * durationFromOptions.length)];
    cy.get('input[formcontrolname="durationFrom"]').clear().type(randomDurationFrom.toString());

    // Discount Type
    cy.get('select[formcontrolname="discountType"]')
        .find('option:not([disabled])')
        .then(($options) => {
            if ($options.length > 0) {
                const randomIndex = Math.floor(Math.random() * $options.length);
                cy.get('select[formcontrolname="discountType"]').select(($options[randomIndex] as HTMLOptionElement).value);
            }
        });

    // Discount Name
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
    cy.wait(2000)
    cy.get('button.btn.btn-primary').contains('Add').click();
    cy.wait(2000);
    cy.get('button.btn.btn-primary').contains('Add').click();
};

const setPriceVAT = (): void => {
    const getRandomCharge = (min = 100, max = 2000) => (Math.random() * (max - min) + min).toFixed(2);
    const randomCharge = getRandomCharge();
    const priceIncludingVAT = (parseFloat(randomCharge) * 1.07).toFixed(2);

    cy.get('input[formcontrolname="priceExcludingVAT"]').clear().type(randomCharge);
    cy.get('input[formcontrolname="priceIncludingVAT"]').clear().type(priceIncludingVAT);
};

// ========================
// BACK BASIC INFO
// ========================

export const backBacicInfo = (): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getRequest4');
    cy.get('.sidebar-nav > :nth-child(2) > a').click({ timeout: 100000 });
    cy.get('.modal-body > .col-md-12 > :nth-child(1) > .btn', { timeout: 30000 })
        .should('be.visible')
        .click();
    cy.wait('@getRequest4', { timeout: 100000 }).then((interception) => {
        console.log(`Intercepted request: ${interception.request.method} ${interception.request.url}`);
    });
};

// ========================
// ADD FILE
// ========================

export const addFile = (): void => {
    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // ✅ รอ input ใน DOM — Angular *ngIf อาจ render ช้า
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

    cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

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
    const { Module, subModule, autoSetDuration = false, Plugin } = options;
    const credentials = getCredentials(Module);
    const prefix = (Module === 'ENTER' || Module === 'MUSIC') ? Module : 'MOB';

    const { projectName, poName, prefixName } = generateProjectNames(prefix, Module, subModule, PriceType, ProductClass, undefined, Plugin);

    createProjectBase(credentials, projectName, Module, subModule);
    const envKey = ProductClass === 'main' ? 'formattedDateMain' : 'formattedDate';
    Cypress.env(envKey, projectName);
    registerProjectName(projectName, ProductClass === 'main' ? 0 : 1);

    const poCount = 2;
    // เปลี่ยนเงื่อนไขมาใช้เช็ค ProductClass === 'main' แทน
    const poEnvKey = ProductClass === 'main' ? 'formattedDateMainPONAME' : 'formattedDateOntopPONAME';
    const poNames: string[] = [];

    cy.log(`🎲 Randomly selected to create ${poCount} PO(s)`);

    for (let i = 0; i < poCount; i++) {
        const nextTimeId = generateUniqueId();
        const poIdentifier = `PO${i + 1} ${nextTimeId}`;
        const currentPoName = buildUniqueName(prefixName, poIdentifier, 30);

        poNames.push(currentPoName);
        cy.log(`📦 [${i + 1}/${poCount}] Processing PO: ${currentPoName}`);

        createPOBase(currentPoName, 'Product Offering');

        const priceTypeMap: Record<PriceType, string> = { onetime: '1: One-Time', recurring: '2: Recurring', usage: '3: Usage' };
        cy.get('select[formcontrolname="priceType"]').should('be.visible').and('not.be.disabled').select(priceTypeMap[PriceType]);

        const productClassMapMobile: Record<ProductClass, string> = { main: '1: Main', ontop: '2: On-Top', ontopextra: '3: On-Top Extra' };
        const productClassMapEnterMusic: Record<'ontop' | 'ontopextra', string> = { ontop: '1: On-Top', ontopextra: '2: On-Top Extra' };
        const productValue = (Module === 'ENTER' || Module === 'MUSIC')
            ? productClassMapEnterMusic[ProductClass as 'ontop' | 'ontopextra']
            : productClassMapMobile[ProductClass];

        cy.get('select[formcontrolname="productClass"]').should('be.visible').and('not.be.disabled').select(productValue);

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
                        cy.get('select[formcontrolname="productClass"]').select(productClassMapMobile['ontop']);
                        cy.wait(500);
                        cy.get('select[formcontrolname="productClass"]').select(productValue);
                        cy.wait(500);
                        cy.get('select[formcontrolname="priceType"]').select(priceTypeMap[PriceType]);
                        cy.wait(800);
                        retrySelectProductClass(attemptsLeft - 1);
                    } else {
                        cy.log(`❌ default items still missing after retries`);
                    }
                });
            };
            cy.wait(800);
            retrySelectProductClass(3);
        }

        if (autoSetDuration) {
            // 🎯 สุ่มระยะเวลาแพ็กเกจอินเทอร์เน็ตให้สมจริงตามหน่วย (Day, Month, Year)
            const realisticDurations: Record<string, number[]> = {
                'Day': [1, 3, 7, 14, 30, 60, 90, 180, 365],
                'Month': [1, 2, 3, 6, 12, 24],
                'Year': [1, 2, 3],
                'Week': [1, 2, 4]
            };

            // เลือกหน่วยก่อนเพื่อให้ได้ช่วงเวลาที่สมจริง
            cy.get('select[formcontrolname="packageDurationUnit"] option:not([disabled])').should('have.length.greaterThan', 0).then($options => {
                const randomIndex = Math.floor(Math.random() * $options.length);
                const selectedOption = $options[randomIndex] as HTMLOptionElement;
                const unitText = selectedOption.text.trim().toLowerCase();

                let possibleDurations = [1, 3, 7, 30]; // default fallback
                for (const key in realisticDurations) {
                    if (unitText.includes(key.toLowerCase())) {
                        possibleDurations = realisticDurations[key];
                        break;
                    }
                }

                const randomDuration = possibleDurations[Math.floor(Math.random() * possibleDurations.length)];

                cy.get('select[formcontrolname="packageDurationUnit"]').select(selectedOption.value);
                cy.get('input[formcontrolname="packageDuration"]').clear().type(randomDuration.toString());
            });
            cy.get('.col-md-8 > .btn').click();
        }

  if (subModule === 'PRE') {
    // 🎯 สุ่มรอบบิล (Bill Cycle) ให้สมจริง (ปกติจะเป็นวันที่ 1-28 ของเดือน)
    const realisticBillCycles = [1, 5, 7, 10, 15, 20, 25, 28];
    const randomBillCycle = realisticBillCycles[Math.floor(Math.random() * realisticBillCycles.length)];

    cy.get('input[formcontrolname="packageBillCycle"]')
        .should('be.visible')
        .clear()
        .type(randomBillCycle.toString());

    // 🎯 สุ่มหน่วยรอบบิล (Bill Cycle Unit) ให้สมจริง 
    // (สำหรับเลข 1-28 หน่วยที่ถูกต้องคือ Day, Days หรือ Date)
    const realisticBillCycleUnits = ['Day', 'Days', 'Date', 'Month', 'Months'];

    cy.get('select[formcontrolname="packageBillCycleUnit"] option:not([disabled])')
        .should('have.length.greaterThan', 0)
        .then($options => {
            // 1. ดึงค่า value ที่มีอยู่จริงใน dropdown มาเก็บเป็น array
            const availableOptions = $options.map((_, el) => (el as HTMLOptionElement).value).get();
            
            // 2. หาค่าจาก realisticBillCycleUnits ที่มีอยู่จริงใน dropdown (รองรับทั้งตัวพิมพ์ใหญ่-เล็ก)
            let matchedUnit = realisticBillCycleUnits.find(unit => 
                availableOptions.includes(unit) || 
                availableOptions.includes(unit.toLowerCase()) ||
                availableOptions.includes(unit.toUpperCase())
            );

            // 3. ถ้าหาไม่เจอเลย (เช่น ระบบใช้คำแปลกๆ) ให้ fallback ไปใช้ค่าแรกที่มีในระบบ
            if (!matchedUnit) {
                matchedUnit = availableOptions[0];
                cy.log(`⚠️ No realistic unit found. Fallback to: ${matchedUnit}`);
            }

            // 4. เลือกค่านั้น
            cy.get('select[formcontrolname="packageBillCycleUnit"]').select(matchedUnit);
            cy.log(`🗓️ Bill Cycle set to: ${randomBillCycle} ${matchedUnit}`);
        });
}

        const isMultiDurationEligible = PriceType === 'recurring' || PriceType === 'usage';
        const useMultiDuration = isMultiDurationEligible && Math.random() < 1.0;

        if (useMultiDuration) {
            cy.log(`🎲 Multi Duration randomly selected: Yes (PriceType=${PriceType})`);
            RandomMultiDuration();
        } else {
            PriceExcluding();
        }

        selectTargetGroup('random');
        dropdownPromotionGroup();
        RandomProductSpecification(ProductClass, subModule, Module);

        if (Module === 'PRE' && (ProductClass === 'ontop' || ProductClass === 'ontopextra')) {
            cy.get('input[formcontrolname="allowMvpn"]').should('exist').then(($radios) => {
                cy.wrap($radios).eq(Math.floor(Math.random() * $radios.length)).check();
            });
        }

        targetgroup();
        RandomRemark(projectName, currentPoName, PriceType, ProductClass, subModule);

        if ((Module !== 'POST') && subModule === 'PRE' && PriceType === 'recurring') {
            RetryPattern();
        }

        if (Module === 'PRE' && PriceType === 'recurring' && ProductClass === 'main') {
            CopyDeductFail('mass-market');
        }

        smsWording();

        if (i < poCount - 1) {
            cy.log(`🔙 PO ${currentPoName} done. Navigating back for next PO...`);
            backBacicInfo();
            cy.wait(1500);
        }
    }

    Cypress.env('currentModule', Module);
    Cypress.env('currentSubModule', subModule);
    Cypress.env('currentPriceType', PriceType);
    Cypress.env('currentProductClass', ProductClass);
    Cypress.env('currentProjectName', projectName);
    Cypress.env('currentPoName', poNames[0] || poName);

    cy.log(`✅ All ${poCount} PO(s) processed. Finalizing...`);
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
    const { projectName, poName } = generateProjectNames('MOB', Module, undefined, PriceType, undefined, PoSubGroup);

    login(credentials.user, credentials.pass);
    cy.get('.col-md-10 > .btn').should('be.visible').click();

    cy.get('input[formcontrolname="projectName"]').type(projectName);
    Cypress.env('projectName', projectName);

    const date = new Date();
    date.setDate(date.getDate() + 1);
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.get('input[aria-label="Date input field"]').type(formattedDate);
    cy.wait(1500);
    cy.get('input[formcontrolname="phoneNo"]').type(getRandomPhone());
    RandomProjectDescription(projectName, Module);
    cy.get('button[type="button"]').contains('Save').click();
    cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
    cy.wait(8000);
    cy.get('.modal-body > :nth-child(1) > div > .btn').click({ force: true });

    cy.get(':nth-child(4) > .btn').click({ force: true });
    cy.get('input[formcontrolname="productName"]').type(poName);
    Cypress.env('poName', poName);

    const subGroupMap: Record<string, string> = {
        AccountFee: 'Account Fee', OrderFee: 'Order Fee', CashBack: 'Cash Back',
        Service: 'Service', GroupPoFee: 'Group PO Fee'
    };
    cy.get('select[formcontrolname="promotionSubGroupFrom"]').select(subGroupMap[PoSubGroup]);

    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.contains('button', 'Create', { timeout: 10000 }).click();
    cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');
    cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
    cy.wait(15000);

    if (Module === 'PRE' && (PoSubGroup === 'OrderFee' || PoSubGroup === 'Service')) {
        const priceTypeMap: Record<string, string> = { onetime: 'One-Time', recurring: 'Recurring', usage: 'Usage' };
        cy.get('select[formcontrolname="priceType"]').select(priceTypeMap[PriceType]);
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
};
