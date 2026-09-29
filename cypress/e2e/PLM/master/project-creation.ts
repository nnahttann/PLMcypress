import {
    Module,
    PriceType,
    ProductClass,
    ProjectBasicOptions,
    MKTpre,
    MKTpre1,
    MKTpost,
    MKTpost1,
    enter,
    enterpass,
    music,
    musicpass,
} from './config';

import { login, getRandomPhone } from './helpers';
import { registerProjectName, registerProjectCode } from './project-manager';
import { createPOWordingPools, RandomProjectDescription, RandomRemark } from '../Approve/po-wording-pools';

import {
    PriceExcluding,
    selectTargetGroup,
    dropdownPromotionGroup,
    targetgroup,
    RetryPattern,
    RandomMultiDuration,
    Randomdropdown,
    RandomFixedDates,
    RunMassMktTabs,
} from './dropdowns-randomizers';

import { CopyDeductFail } from './priority-updaters';
import { smsWordingAuto } from './sms-wording';
import { RandomProductSpecification } from './product-specs';
import { beforeapproveMKT } from './flows';
import { ChargePartner, InternalShare, RevenueSharing, SharingPartner } from './MKT_Share';
import { RandomHumanTouchPoint } from './human-touch-point';
import { RandomNonHumanTouchPoint } from './non-human-touch-point';
import { selectModifySections, fillSelectedModifySections } from './modify';

const getCredentials = (module: Module): { user: string; pass: string } => {
    const credMap: Record<Module, { user: string; pass: string }> = {
        POST: { user: MKTpost, pass: MKTpost1 },
        PRE: { user: MKTpre, pass: MKTpre1 },
        ENTER: { user: enter, pass: enterpass },
        MUSIC: { user: music, pass: musicpass },
    };

    return credMap[module] || credMap['POST'];
};

const getTimeParts = (): { day: string; month: string; hours: string; minutes: string } => {
    const d = new Date();

    return {
        day: String(d.getDate()).padStart(2, '0'),
        month: String(d.getMonth() + 1).padStart(2, '0'),
        hours: String(d.getHours()).padStart(2, '0'),
        minutes: String(d.getMinutes()).padStart(2, '0'),
    };
};
const LOADER_SELECTOR = '.loading-curtain, .spinner, [class*="loading"]:visible';
const waitForLoadingState = (): void => {
    cy.get('body').then(($body) => {
        const hasActiveLoader = $body.find(LOADER_SELECTOR).length > 0;
        if (hasActiveLoader) {
            cy.get(LOADER_SELECTOR, { timeout: 50000 }).should('not.exist');
        }
        else {
            cy.wait(500);
        }
    });
};
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
    const nowDate = new Date();

    const h = String(nowDate.getHours()).padStart(2, '0');
    const mm = String(nowDate.getMinutes()).padStart(2, '0');
    const d = String(nowDate.getDate()).padStart(2, '0');
    const m = String(nowDate.getMonth() + 1).padStart(2, '0');

    return `${m}${d} ${h}${mm}`;
};

const buildUniqueName = (baseName: string, identifier: string, maxLength: number): string => {
    const id = String(identifier ?? '').trim().replace(/\s+/g, ' ');
    const sep = id ? 1 : 0;
    const maxBaseLength = Math.max(0, maxLength - id.length - sep);

    let cleanBase = String(baseName ?? '').trim().replace(/\s+/g, ' ');

    if (cleanBase.length > maxBaseLength) {
        cleanBase = cleanBase.substring(0, maxBaseLength).trimEnd();
    }

    const out = (cleanBase ? `${cleanBase} ${id}` : id).trim();

    return out.length > maxLength ? out.substring(0, maxLength).trimEnd() : out;
};

const ensureUniqueAllPoNames = (poNames: string[]): void => {
    const seen = new Set<string>();
    const duplicated = new Set<string>();

    poNames.forEach((name) => {
        const normalized = String(name ?? '').trim();

        if (!normalized) {
            throw new Error('❌ allPoNames มีค่าว่าง — ตรวจสอบการสร้างชื่อ PO');
        }

        if (seen.has(normalized)) {
            duplicated.add(normalized);
        }

        seen.add(normalized);
    });

    if (duplicated.size > 0) {
        throw new Error(
            `❌ allPoNames ซ้ำกันก่อน set Cypress.env: [${[...duplicated].join(', ')}]\n` +
            `poNames = ${JSON.stringify(poNames, null, 2)}`
        );
    }
};

const limit = (str: string, maxLen: number): string => {
    if (!str) return '';

    if (str.length <= maxLen) return str.trimEnd();

    const hard = str.substring(0, maxLen);
    const lastSpace = hard.lastIndexOf(' ');

    return (lastSpace > maxLen * 0.7 ? hard.substring(0, lastSpace) : hard).trimEnd();
};

const pickRandom = <T>(arr?: T[]): T =>
    arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : ('' as unknown as T);

const pickMultiple = <T>(arr: T[], count: number): T[] =>
    Cypress._.shuffle([...(arr ?? [])]).slice(0, Math.max(0, count));

const safeType = (selector: string, value: string, fallback = 'Auto Test'): void => {
    const val = (value ?? '').trim() || fallback;
    cy.get(selector).type('{selectall}{backspace}').type(val, { delay: 0 });
};

const clickIfExists = (selector: string, label: string): void => {
    cy.get('body').then(($b) => {
        const $el = $b.find(selector).filter(':visible');

        if (!$el.length) {
            cy.log(`⚠️ [SKIP] ไม่พบปุ่ม ${label} (${selector})`);
            return;
        }

        cy.get(selector).filter(':visible').first().click({ force: true });
    });
};

const generateProjectNames = (
    prefix: string,
    Module: Module,
    subModule: string | undefined,
    PriceType: string,
    ProductClass?: string,
    PoSubGroup?: string,
    Plugin?: string,
    touchPoint?: {
        runHumanTouchPoint?: boolean;
        runNonHumanTouchPoint?: boolean;
    }
): {
    projectName: string;
    poName: string;
    prefixName: string;
} => {
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
        const ModulePart =
            Module === 'ENTER' || Module === 'MUSIC'
                ? `${getAbbreviation(prefix)} ${getAbbreviation(subModule)}`
                : `${getAbbreviation(prefix)} ${getAbbreviation(Module)}`;

        const parts = [
            ModulePart,
            getAbbreviation(PriceType),
            getAbbreviation(ProductClass),
            getAbbreviation(Plugin),
        ].filter(Boolean);

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

    const projectIdentifier = touchPointTag ? `PRJ ${touchPointTag} ${timeId}` : `PRJ ${timeId}`;
    const poIdentifier = `PO ${timeId}`;

    const projectName = buildUniqueName(prefixName, projectIdentifier, 40);
    const poName = buildUniqueName(prefixName, poIdentifier, 60);

    return { projectName, poName, prefixName };
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
    return str.replace(/[^\u0E00-\u0E7F\u0020-\u007F\s-]/g, '').replace(/\s+/g, ' ').trim();
};

const limitAndCleanEN = (str: string, maxLen: number): string => limit(cleanEnglishText(str), maxLen);
const limitAndCleanTH = (str: string, maxLen: number): string => limit(cleanThaiText(str), maxLen);

export const sanitizePoName = (raw: string, maxLen = 255): string => {
    if (!raw) return '';

    let val = String(raw).replace(/\s+$/g, '');
    const hasThai = /[\u0E00-\u0E7F]/.test(val);

    val = hasThai ? limitAndCleanTH(val, maxLen) : limitAndCleanEN(val, maxLen);

    try {
        if (hasThai) {
            val = val.replace(/[^\u0E00-\u0E7F0-9A-Za-z\s-_]/g, '');
        } else {
            val = val.replace(/[^\w\s-_]/g, '');
        }
    } catch (e) { }

    val = val.replace(/\s+$/g, '');

    if (val.length > maxLen) val = val.substring(0, maxLen).trimEnd();

    return val;
};

const closeVisibleModalIfAny = (timeoutMs: number = 30000): void => {
    const startedAt = Date.now();

    const tryClose = (): void => {
        cy.get('body').then(($body) => {
            const $modal = $body.find('modal-container, .modal.in, .modal.show').filter(':visible').first();

            if (!$modal.length) {
                if (Date.now() - startedAt < timeoutMs) {
                    cy.wait(300);
                    tryClose();
                    return;
                }

                cy.log('ℹ️ No visible save-success modal detected within timeout; continuing without forced close');
                return;
            }

            const $closeBtn = $modal
                .find('button, .btn, .close')
                .filter(':visible')
                .filter((_, el) => {
                    const text = Cypress.$(el).text().trim();
                    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
                    const title = (el.getAttribute('title') || '').toLowerCase();

                    const matchesText = /^(ok|close|yes|confirm|done)$/i.test(text);
                    const matchesLabel =
                        /close|dismiss|cancel|ok|done/i.test(aria) || /close|dismiss|cancel|ok|done/i.test(title);

                    return matchesText || matchesLabel;
                })
                .first();

            if ($closeBtn.length > 0) {
                cy.wrap($closeBtn).click({ force: true });
                return;
            }

            const $fallback = $modal.find('.close').first();

            if ($fallback.length > 0) {
                cy.wrap($fallback).click({ force: true });
                return;
            }

            cy.wrap($modal).find('button').first().click({ force: true });
        });
    };

    tryClose();
};

const selectOptionSafely = (
    selector: string,
    targetText: string,
    options: { timeout?: number } = {}
): void => {
    const { timeout = 15000 } = options;

    const normalize = (s: string) => (s || '').trim().replace(/\s+/g, ' ');
    const target = normalize(targetText);
    const startedAt = Date.now();

    const waitForOptions = (): Cypress.Chainable<HTMLOptionElement[]> => {
        return cy
            .get(selector, { timeout })
            .should('be.visible')
            .and('not.be.disabled')
            .find('option')
            .then(($opts: JQuery<HTMLOptionElement>) => {
                const optArr = Array.from($opts) as HTMLOptionElement[];
                const texts = optArr.map((o: HTMLOptionElement) => normalize(o.textContent || ''));

                const onlyPleaseSelect = optArr.length === 1 && /please select/i.test(texts[0]);

                if (onlyPleaseSelect && Date.now() - startedAt < timeout) {
                    return cy.wait(500, { log: false }).then(waitForOptions);
                }

                return cy.wrap(optArr as HTMLOptionElement[]);
            });
    };

    waitForOptions().then((optArr: HTMLOptionElement[]) => {
        const arr = Array.isArray(optArr)
            ? (optArr as HTMLOptionElement[])
            : Array.from(optArr as any) as HTMLOptionElement[];

        const normalizeValue = (o: HTMLOptionElement) =>
            normalize(o.textContent || '') || normalize(String(o.value || ''));

        let match =
            arr.find((o) => normalize(o.textContent || '') === target) ||
            arr.find((o) => normalize(o.value || '') === target) ||
            arr.find((o) => normalize(o.textContent || '').includes(target));

        if (!match) {
            const stripped = target.replace(/^\d+[:.)\s-]+/, '').trim();

            if (stripped !== target) {
                match = arr.find((o) => normalize(o.textContent || '').includes(stripped));
            }
        }

        if (!match) {
            const dump = arr
                .map((o) => `value="${o.value}" text="${normalize(o.textContent || '')}"`)
                .join(' | ');

            throw new Error(`❌ selectOptionSafely: could not find "${targetText}" in ${selector}. Available: ${dump}`);
        }

        const selectedValue = String(match.value ?? normalize(match.textContent || '')).trim();

        if (!selectedValue) {
            const dump = arr
                .map((o) => `value="${o.value}" text="${normalize(o.textContent || '')}"`)
                .join(' | ');

            throw new Error(
                `❌ selectOptionSafely: resolved empty value for "${targetText}" in ${selector}. Available: ${dump}`
            );
        }

        cy.log(`Selecting '${selectedValue}' for ${selector}`);
        cy.get(selector).select(selectedValue);

        cy.get(selector).find('option:selected').then(($sel) => {
            const selText = normalize($sel.text());
            const selVal = String($sel.val() ?? '').trim();

            if (!(selVal === selectedValue || selText === target || selText.includes(target))) {
                cy.log(
                    `⚠️ Selected option mismatch: text='${selText}' value='${selVal}' expected='${selectedValue}' target='${target}'`
                );
            }
        });
    });
};

const selectDurationUnitByLabel = (label: string, timeout = 15000): void => {
    const normalize = (s: string) => (s || '').trim().replace(/\s+/g, ' ');
    const stripIndexPrefix = (raw: string): string => raw.replace(/^\d+:\s*/, '').trim();
    const startedAt = Date.now();

    const attempt = (): void => {
        cy.get('select[formcontrolname="packageDurationUnit"]')
            .filter(':visible')
            .then(($selects) => {
                if (!$selects.length) {
                    if (Date.now() - startedAt < timeout) {
                        cy.wait(300, { log: false });
                        attempt();
                        return;
                    }

                    throw new Error('❌ selectDurationUnitByLabel: no visible packageDurationUnit select found');
                }

                const $select = $selects.last();
                const el = $select.get(0) as HTMLSelectElement;
                const opts = [...el.querySelectorAll('option:not([disabled])')] as HTMLOptionElement[];

                const match = opts.find((o) => normalize(stripIndexPrefix(o.text)) === normalize(label));

                if (!match) {
                    if (Date.now() - startedAt < timeout) {
                        cy.wait(300, { log: false });
                        attempt();
                        return;
                    }

                    const dump = opts.map((o) => `value="${o.value}" text="${o.text}"`).join(' | ');

                    throw new Error(`❌ selectDurationUnitByLabel: "${label}" not found. Available: ${dump}`);
                }

                el.value = match.value;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('input', { bubbles: true }));

                cy.wrap($select, { log: false }).should('have.value', match.value);
            });
    };

    attempt();
};

const createProjectBase = (
    credentials: { user: string; pass: string },
    projectName: string,
    Module: Module,
    subModule?: string,
    projectObject: string = 'Create',
    projectIndex: number = 0
): string => {
    login(credentials.user, credentials.pass);
    waitForLoadingState();
    cy.intercept('POST', '/PLMSpringBoot/api/**').as('saveRequest');

    cy.get('.col-md-10 > .btn').should('be.visible').click();
    waitForLoadingState();

    cy.url().then((url) => {
        if (url.includes('authenticationendpoint') || url.includes('login.do') || url.includes('/login')) {
            cy.log('⚠️ Session หลุด! เด้งไปหน้า SSO Login — กำลัง Login ใหม่และกดปุ่มสร้างโปรเจคอีกครั้ง');

            login(credentials.user, credentials.pass);
            cy.get('.col-md-10 > .btn', { timeout: 30000 }).should('be.visible').click();
        }
    });

    const finalProjectName = projectObject !== 'Create' ? `MOD ${projectName}` : projectName;

    cy.get('input[formcontrolname="projectName"]', { timeout: 30000 })
        .should('be.visible')
        .should('not.be.disabled')
        .click()
        .type(finalProjectName, { delay: 30 });

    const date = new Date();
    date.setDate(date.getDate() + 1);

    const formattedDateString = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    cy.get('input[formcontrolname="projectName"]').blur();

    cy.get('input[aria-label="Date input field"]')
        .click()
        .type('{selectall}{backspace}')
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

    cy.get('input[formcontrolname="phoneNo"]').click().type(getRandomPhone(), { delay: 30 });

    cy.get('input[formcontrolname="projectCode"]', { timeout: 30000 })
        .should('be.visible')
        .should(($input) => {
            const value = String($input.val() || '').trim();
            expect(value, 'Project Code should be generated and visible after save').to.not.be.empty;
        })
        .invoke('val')
        .then((code) => {
            const projectCode = String(code || '').trim();
            cy.log(`📌 Captured Project Code: "${projectCode}" (index: ${projectIndex})`);

            const existingCodes = (Cypress.env('allProjectCodes') as string[]) || [];
            if (projectCode && !existingCodes.includes(projectCode)) {
                existingCodes.push(projectCode);
            }
            Cypress.env('allProjectCodes', existingCodes);
            Cypress.env('currentProjectCode', projectCode);

            registerProjectCode(projectCode, projectIndex);
        });

    RandomProjectDescription(finalProjectName, subModule, Module);

    cy.contains('button', 'Save', { timeout: 30000 })
        .scrollIntoView()
        .should('be.visible')
        .and('not.be.disabled')
        .click();
    waitForLoadingState();
    cy.wait('@saveRequest', { timeout: 60000000 }).its('response.statusCode').should('eq', 200);
    cy.wait(2000);

    closeVisibleModalIfAny();

    return finalProjectName;
};

const createPOBase = (poName: string, promotionSubGroupValue: string): void => {
    waitForLoadingState();
    cy.get('body').then(($body) => {
        const $modal = $body.find('modal-container').filter(':visible');
        const $bootstrapModal = $body.find('.modal.in, .modal.show').filter(':visible');

        if ($modal.length > 0 || $bootstrapModal.length > 0) {
            cy.log('⚠️ Save-success modal detected before creating PO — closing it first');

            if ($modal.length > 0) {
                cy.get('modal-container').filter(':visible').first().then(($m) => {
                    const $button = $m.find('button, .btn').filter(':visible').last();

                    if ($button.length > 0) {
                        cy.wrap($button).click({ force: true });
                    } else {
                        cy.wrap($m).click('topRight', { force: true });
                    }
                });
            } else {
                cy.get('.modal.in, .modal.show').filter(':visible').first().then(($m) => {
                    const $button = $m.find('button, .btn').filter(':visible').filter((_, el) => {
                        const text = Cypress.$(el).text().trim();
                        const aria = el.getAttribute('aria-label') || '';

                        const matchesText = /^(OK|Close|Yes|Confirm|Done)$/i.test(text);
                        const matchesAria = /close|dismiss/i.test(aria);

                        return matchesText || matchesAria;
                    }).first();

                    if ($button.length > 0) {
                        cy.wrap($button).click({ force: true });
                    } else {
                        cy.wrap($m).find('.close').first().click({ force: true });
                    }
                });
            }

            cy.get('body').find('modal-container, .modal.in, .modal.show').should('not.be.visible', {
                timeout: 30000,
            });
        }
    });
    waitForLoadingState();
    cy.contains('li.sidebar-brand', 'List of Product Offering:')
        .find('button.btn')
        .first()
        .should('be.visible')
        .click();

    cy.get('input[formcontrolname="productName"]').then(($input) => {
        const attr = $input.attr('maxlength');
        const maxLen = attr ? parseInt(String(attr), 10) || 255 : 255;

        let val = String(poName ?? '').replace(/\s+$/g, '');
        const hasThai = /[\u0E00-\u0E7F]/.test(val);

        val = hasThai ? limitAndCleanTH(val, maxLen) : limitAndCleanEN(val, maxLen);

        if (val.length > maxLen) {
            cy.log(`⚠️ PO name too long (max ${maxLen}) — truncating`);
            val = val.substring(0, maxLen).trimEnd();
        }

        val = val.replace(/\s+$/g, '');

        if (!val) {
            throw new Error('❌ PO name is empty after sanitization');
        }

        cy.wrap($input).type(val, { delay: 0 });
    });

    cy.get('select[formcontrolname="promotionSubGroupFrom"]').select(promotionSubGroupValue);

    cy.intercept('POST', '**/plm-po/addUpdate/**').as('createPO');

    cy.contains('button', 'Create').should('be.visible').click();
    waitForLoadingState();
    cy.wait('@createPO', { timeout: 60000000 }).its('response.statusCode').should('eq', 200);

    cy.get('body').then(($body) => {
        if ($body.find('.loading-curtain').length > 0) {
            cy.get('.loading-curtain', { timeout: 120000 }).should('not.exist');
        }
    });

    cy.location('hash', { timeout: 120000 }).should((hash) => {
        expect(hash).to.include('/project-home/');
        expect(hash).to.include('projectId=');
        expect(hash).to.include('productId=');
    });

    cy.get('body').then(($body) => {
        if ($body.find('select[formcontrolname="priceType"]').length > 0) {
            cy.get('select[formcontrolname="priceType"]', { timeout: 60000000 }).should('be.visible');
        }
    });
};

const selectMultipleFromDualList = (controlName: string, maxSelections: number): void => {
    cy.get(`select[formcontrolname="${controlName}"]`).then(($select) => {
        const $opts = $select
            .find('option:not([disabled])')
            .filter((_, el) => String((el as HTMLOptionElement).value).trim() !== '');

        const optionCount = $opts.length;

        if (!optionCount) {
            cy.log(`⚠️ [SKIP] ไม่มี option ใน ${controlName}`);
            return;
        }

        // สุ่มจำนวน 1..maxSelections (สุ่มครั้งเดียวที่นี่)
        const actualMax = Math.min(maxSelections, optionCount);
        const numberOfSelections = Math.floor(Math.random() * actualMax) + 1;

        const allValues = [...$opts].map(
            (o) => (o as HTMLOptionElement).value || (o as HTMLOptionElement).text.trim()
        );

        const shuffledValues = Cypress._.shuffle(allValues).slice(0, numberOfSelections);

        cy.log(`🎲 [${controlName}] สุ่มเลือก ${numberOfSelections} รายการ`);
        cy.wrap($select).select(shuffledValues, { force: true });

        const $container = $select.closest('ng2-dual-list-box');

        if ($container && $container.length > 0) {
            // ❗ button.atr = "Add all" (ย้ายทั้งหมด) -> ต้องใช้ button.str = "ย้ายเฉพาะที่เลือก"
            cy.wrap($container)
                .find('button.str')
                .should('not.be.disabled')
                .click({ force: true });

            // ตรวจว่าฝั่ง Selected items มีจำนวนตรงกับที่สุ่ม
            cy.wrap($container)
                .find('select[formcontrolname="selectedListBox"] option')
                .should('have.length', numberOfSelections);
        } else {
            cy.log(`⏭️ container ng2-dual-list-box not found for ${controlName}`);
        }
    });
};

const getEntropySeed = (): number => {
    const timeEntropy = (Date.now() % 100000) / 100000;
    const perfEntropy = (typeof performance !== 'undefined' ? performance.now() % 1000 : 0) / 1000;
    const combined = (Math.random() + timeEntropy + perfEntropy) % 1;

    return combined;
};

const getRandomInt = (min: number, max: number): number => {
    const combined = getEntropySeed();
    return Math.floor(combined * (max - min + 1)) + min;
};

const fillServicePOFields = (
    Module: Module,
    PriceType: string,
    projectName?: string,
    poName?: string,
    subModule?: string
): void => {
    const promotionLevels = ['Mobile', 'Account', 'Non-Mobile'] as const;
    const randomPromotion = promotionLevels[Math.floor(Math.random() * promotionLevels.length)];

    cy.get('select[formcontrolname="promotionLevel"]')
        .select(randomPromotion)
        .should('have.value', randomPromotion);

    const { day, month, hours, minutes } = getTimeParts();

    const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
    const pOName = poName || 'ServicePO';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);
    waitForLoadingState();
    cy.get('textarea[formcontrolname="wordingInStatementEn"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.wordingInStatement.EN), 250));

    cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.wordingInStatement.TH), 250));

    const smsFlags = ['Send', "Don't Send"];
    const randomSmsFlag = smsFlags[Math.floor(Math.random() * smsFlags.length)];

    cy.get('select[formcontrolname="smsGreetingSendFlag"]').select(randomSmsFlag);

    if (randomSmsFlag === 'Send') {
        cy.get('textarea[formcontrolname="smsGreetingEn"]')
            .type('{selectall}{backspace}')
            .type(limitAndCleanEN(pickRandom(pools.smsGreeting.EN), 400));

        cy.get('textarea[formcontrolname="smsGreetingTh"]')
            .type('{selectall}{backspace}')
            .type(limitAndCleanTH(pickRandom(pools.smsGreeting.TH), 400));
    }

    const randomDeleteFlag = smsFlags[Math.floor(Math.random() * smsFlags.length)];

    cy.get('select[formcontrolname="smsDeleteSendFlag"]').select(randomDeleteFlag);

    if (randomDeleteFlag === 'Send') {
        cy.get('textarea[formcontrolname="smsDeleteEn"]')
            .type('{selectall}{backspace}')
            .type(limitAndCleanEN(pickRandom(pools.smsDelete.EN), 250));

        cy.get('textarea[formcontrolname="smsDeleteTh"]')
            .type('{selectall}{backspace}')
            .type(limitAndCleanTH(pickRandom(pools.smsDelete.TH), 250));
    }

    cy.get('textarea[formcontrolname="descriptionEn"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.description.EN), 500));

    cy.get('textarea[formcontrolname="descriptionTh"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.description.TH), 500));

    cy.get('input[formcontrolname="discountRevenueCode"]')
        .type('{selectall}{backspace}')
        .type('APCP-009');

    selectMultipleFromDualList('availableListBox', 3);

    const conditionCount = Math.floor(Math.random() * 5) + 2;
    const selectedConditions = pickMultiple(pools.otherCondition.EN, conditionCount);

    cy.get('textarea[formcontrolname="otherCondition"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(selectedConditions.join(' '), 1000));

    cy.get('textarea[formcontrolname="memoDescription"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

const fillCashBackPOFields = (
    Module: Module,
    PriceType: string,
    projectName?: string,
    poName?: string,
    subModule?: string
): void => {
    const { day, month, hours, minutes } = getTimeParts();

    const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
    const pOName = poName || 'CashBackPO';
    waitForLoadingState();
    const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);

    cy.get('textarea[formcontrolname="shortPromotionNameEn"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.shortPromotionName.EN), 100));

    cy.get('textarea[formcontrolname="shortPromotionNameTh"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.shortPromotionName.TH), 100));

    cy.get('textarea[formcontrolname="promotionDescriptionEn"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.promotionDescription.EN), 500));

    cy.get('textarea[formcontrolname="promotionDescriptionTh"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.promotionDescription.TH), 500));

    cy.get('textarea[formcontrolname="greetingLetterEn"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.greetingLetter.EN), 500));

    cy.get('textarea[formcontrolname="greetingLetterTh"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.greetingLetter.TH), 500));

    cy.get('textarea[formcontrolname="yourPackageNameEn"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.yourPackageName.EN), 100));

    cy.get('textarea[formcontrolname="yourPackageNameTh"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.yourPackageName.TH), 100));

    selectMultipleFromDualList('availableListBox', 3);
};

const fillStandardPOFields = (
    Module: Module,
    PriceType: string,
    projectName?: string,
    poName?: string,
    subModule?: string
): void => {
    const productTypes = ['FBB', 'Fixline', 'Mobile', 'Non Mobile'] as const;
    const randomValue = productTypes[Math.floor(Math.random() * productTypes.length)];

    cy.get('select[formcontrolname="productType"]').select(randomValue).should('have.value', randomValue);

    const { day, month, hours, minutes } = getTimeParts();

    const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
    const pOName = poName || 'StandardPO';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);
    waitForLoadingState();
    cy.get('textarea[formcontrolname="wordingInStatementEn"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.wordingInStatement.EN), 250));

    cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.wordingInStatement.TH), 250));

    cy.get('textarea[formcontrolname="descriptionEn"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.description.EN), 500));

    cy.get('textarea[formcontrolname="descriptionTh"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.description.TH), 500));

    cy.get('input[formcontrolname="discountRevenueCode"]')
        .type('{selectall}{backspace}')
        .type('APCP-009');

    selectMultipleFromDualList('availableListBox', 3);

    const conditionCount = Math.floor(Math.random() * 5) + 2;
    const selectedConditions = pickMultiple(pools.otherCondition.EN, conditionCount);

    cy.get('textarea[formcontrolname="otherCondition"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(selectedConditions.join(' '), 1000));

    cy.get('textarea[formcontrolname="memoDescription"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

const addOneCashBackPlanRow = (
    pools: ReturnType<typeof createPOWordingPools>,
    durationFrom: number,
    maxDuration: number
): void => {
    const cashBackPlan = () => cy.get('app-mass-mkt-cash-back-plan');
    waitForLoadingState();
    const getRandomNumber = (min: number, max: number): number =>
        Math.floor(Math.random() * (max - min + 1)) + min;

    const forceFill = (selector: string, value: string) => {
        cashBackPlan().find(selector).invoke('removeAttr', 'disabled').clear({ force: true }).type(value, { force: true });
    };

    const forceSelect = (selector: string) => {
        cashBackPlan().find(selector).then(($select) => {
            cy.wrap($select).invoke('removeAttr', 'disabled');

            const options = $select.find('option:not([disabled])').filter((_: number, opt: HTMLElement) => {
                const val = (opt as HTMLOptionElement).value;
                return Boolean(val) && val !== '0: null';
            });

            if (options.length > 0) {
                const randomIndex = Math.floor(Math.random() * options.length);
                cy.wrap($select).select(options.eq(randomIndex).val() as string, { force: true });
            }
        });
    };

    cy.log(`🎯 Creating Cash Back Plan: durationFrom=${durationFrom}, maxDuration=${maxDuration}`);

    cashBackPlan()
        .find('div.collapse-panel > div.row > div.col-md-11 > button.btn-primary.btn-xs')
        .click();

    cashBackPlan().find('input[formcontrolname="durationFrom"]').should('be.visible');

    forceFill('input[formcontrolname="durationFrom"]', durationFrom.toString());
    forceFill('input[formcontrolname="durationTo"]', maxDuration.toString());
    forceSelect('select[formcontrolname="durationUnit"]');
    forceSelect('select[formcontrolname="discountType"]');

    cashBackPlan().find('input[formcontrolname="prorate"]').eq(Math.floor(Math.random() * 2)).check({ force: true });
    cashBackPlan().find('input[formcontrolname="marginalDiscount"]').eq(Math.floor(Math.random() * 2)).check({ force: true });

    cashBackPlan()
        .find('textarea[formcontrolname="discountNameEn"]')
        .clear({ force: true })
        .type(limitAndCleanEN(pickRandom(pools.discountName.EN), 70), { force: true });

    cashBackPlan()
        .find('textarea[formcontrolname="discountNameTh"]')
        .clear({ force: true })
        .type(limitAndCleanTH(pickRandom(pools.discountName.TH), 70), { force: true });

    const detailAddButtonSelector =
        'div.panel.panel-default.ng-star-inserted > div.panel-body > div.row div.col-md-11 > button.btn-primary.btn-xs';

    const outerRowAddButtonSelector =
        'div.panel.panel-default.ng-star-inserted > div.panel-body > div.row > div.col-md-11 > div.pull-right > button.btn.btn-primary';

    cashBackPlan().find(detailAddButtonSelector).click();

    cashBackPlan().find('input[formcontrolname="totalUsageFromExcVat"]').should('exist');

    const detailRowCount = Math.floor(Math.random() * 3) + 1;
    const usageForThisRow = 1;

    const getActiveCashBackDetailPanel = () => {
        return cashBackPlan().then(($plan) => {
            const $visibleForms = $plan.find('form').filter((_: number, form: HTMLElement) => {
                const $form = Cypress.$(form);
                const hasInput = $form.find('input[formcontrolname="totalUsageFromExcVat"]').length > 0;
                const isVisible = $form.is(':visible');

                return hasInput && isVisible;
            });

            if ($visibleForms.length > 0) {
                return cy.wrap($visibleForms.last());
            }

            const $directField = $plan.find('input[formcontrolname="totalUsageFromExcVat"]');

            if ($directField.length > 0) {
                return cy.wrap($directField.last().closest('form'));
            }

            return cy.wrap(
                $plan
                    .find('.panel-body form')
                    .filter((_: number, form: HTMLElement) => {
                        return Cypress.$(form).find('input[formcontrolname="totalUsageFromExcVat"]').length > 0;
                    })
                    .last()
            );
        });
    };

    for (let rowIndex = 0; rowIndex < detailRowCount; rowIndex++) {
        const isConstant = Math.random() < 0.5;
        const cashBackExc = getRandomNumber(1, 500);
        const cashBackPercent = getRandomNumber(1, 20);

        if (rowIndex > 0) {
            cashBackPlan().find(detailAddButtonSelector).click({ force: true });
            cy.wait(500);
        }

        getActiveCashBackDetailPanel().then(($panel) => {
            const radioIndex = isConstant ? 0 : 1;

            cy.wrap($panel).find('input[formcontrolname="cashBackType"]').eq(radioIndex).check({ force: true });
        });

        cy.wait(500);

        getActiveCashBackDetailPanel().then(($refreshedPanel) => {
            cy.wrap($refreshedPanel)
                .find('input[formcontrolname="totalUsageFromExcVat"]')
                .should('exist')
                .clear({ force: true })
                .type(usageForThisRow.toString(), { force: true });

            if (isConstant) {
                cy.wrap($refreshedPanel)
                    .find('input[formcontrolname="cashBackExcVat"]')
                    .should('exist')
                    .clear({ force: true })
                    .type(cashBackExc.toString(), { force: true });
            } else {
                cy.wrap($refreshedPanel)
                    .find('input[formcontrolname="cashBackPercent"]')
                    .should('exist')
                    .clear({ force: true })
                    .type(cashBackPercent.toString(), { force: true });
            }

            cy.wrap($refreshedPanel).contains('button', 'Add').filter(':visible').then($els => {
                if ($els.length === 0) {
                    cy.log('⏭️ Add button not found in refreshed panel');
                } else {
                    cy.wrap($els.eq(0)).click({ force: true });
                }
            });
        });

        cy.wait(500);
    }

    cashBackPlan().find(outerRowAddButtonSelector).should('be.visible').click({ force: true });

    cy.wait(500);
    cy.log(`✅ Cash Back Plan with durationFrom=${durationFrom} completed`);
};

const fillCashBackDiscountConfig = (
    Module: Module,
    PriceType: string,
    projectName?: string,
    poName?: string,
    rowCount: number = getRandomInt(2, 4)
): void => {
    const { day, month, hours, minutes } = getTimeParts();

    const pName = projectName || `${Module} ${PriceType}${day}${month}${hours}${minutes}`;
    const pOName = poName || 'CashBackDiscount';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType);
    waitForLoadingState();
    cy.log(`📋 fillCashBackDiscountConfig called with rowCount=${rowCount}`);

    cy.get('input[formcontrolname="duration"]')
        .invoke('val')
        .then((val) => {
            let maxDuration = parseInt(String(val ?? ''), 10);

            cy.log(`🔍 Current duration value: ${maxDuration}`);

            if (!maxDuration || maxDuration < 3) {
                cy.log(`⚠️ Duration too low (${maxDuration}), setting to 12`);

                cy.get('input[formcontrolname="duration"]').clear({ force: true }).type('12', { force: true });

                cy.wait(500);

                maxDuration = 12;
            }

            if (!maxDuration || maxDuration < 1) {
                cy.log('Main Duration is empty/invalid — skipping Cash Back Plan rows');
                return;
            }

            const availableDurations = Array.from({ length: maxDuration }, (_, i) => i + 1);

            const minRows = Math.min(2, maxDuration);
            const rowsToAdd = Math.max(minRows, Math.min(rowCount, maxDuration));

            cy.log(`📊 Debug: maxDuration=${maxDuration}, rowCount=${rowCount}, rowsToAdd=${rowsToAdd}`);
            cy.log(`📊 Available durations: [${availableDurations.join(', ')}]`);

            const selectedDurations = availableDurations.sort(() => Math.random() - 0.5).slice(0, rowsToAdd);

            cy.log(`✅ Will create ${selectedDurations.length} Plans: [${selectedDurations.join(', ')}]`);

            selectedDurations.forEach((durationFrom) => {
                cy.log(`➡️ Starting Plan creation for durationFrom=${durationFrom}`);
                addOneCashBackPlanRow(pools, durationFrom, maxDuration);
            });
        });
};

const fillGroupPoFeePOFields = (
    Module: Module,
    PriceType: string,
    projectName?: string,
    poName?: string,
    subModule?: string
): void => {
    const groupFee = () => cy.get('app-mass-mkt-group-fee-definition');

    const { day, month, hours, minutes } = getTimeParts();

    const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
    const pOName = poName || 'GroupPoFeePO';

    const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);

    const getRandomCharge = (min = 100, max = 2000) => (Math.random() * (max - min) + min).toFixed(2);

    const checkRandomSubset = ($checks: JQuery<HTMLElement>, min = 1, max = $checks.length): void => {
        const count = Math.floor(Math.random() * Math.min(max, $checks.length)) + min;
        const indices = Cypress._.shuffle([...Array($checks.length).keys()]).slice(0, count);

        indices.forEach((i) => cy.wrap($checks.eq(i)).check({ force: true }));
    };

    groupFee()
        .find('input[formcontrolname="groupPOFeeName"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.description.EN) || pOName, 255), { force: true });

    const productTypes = ['1: FBB', '2: Mobile', '3: Fixline', '4: Non Mobile'];

    groupFee().find('select[formcontrolname="productType"]').select(pickRandom(productTypes));

    const priceTypeMap: Record<string, string> = {
        onetime: '1: One-Time',
        recurring: '2: Recurring',
        usage: '3: Usage',
    };

    groupFee()
        .find('select[formcontrolname="priceType"]')
        .select(priceTypeMap[PriceType] ?? pickRandom(Object.values(priceTypeMap)));

    groupFee().find('input[formcontrolname="installmentFlag"]').eq(Math.floor(Math.random() * 2)).check({ force: true });
    groupFee().find('input[formcontrolname="notCalCreditLimit"]').eq(Math.floor(Math.random() * 2)).check({ force: true });
    groupFee().find('input[formcontrolname="requireImei"]').eq(Math.floor(Math.random() * 2)).check({ force: true });

    const excVat = getRandomCharge();

    groupFee().find('input[formcontrolname="priceExcludingVAT"]').type('{selectall}{backspace}').type(excVat, { force: true });

    groupFee().find('[formarrayname="channel"] input[type="checkbox"]').then(($checks) => {
        if ($checks.length) checkRandomSubset($checks, 1, 3);
    });

    groupFee().find('input[formcontrolname="revenueCode"]').type('{selectall}{backspace}').type('APCP-009', { force: true });

    groupFee()
        .find('input[formcontrolname="revenueCodeDescription"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.description.EN), 255), { force: true });

    groupFee().find('[formarrayname="generatePoSubGroup"] input[type="checkbox"]').then(($checks) => {
        checkRandomSubset($checks, 1, $checks.length);
    });

    groupFee().find('input[formcontrolname="priceWording"]').eq(Math.floor(Math.random() * 2)).check({ force: true });
    groupFee().find('input[formcontrolname="showOnBillWording"]').eq(Math.floor(Math.random() * 2)).check({ force: true });

    const durations = [1, 3, 6, 12, 24];
    const durationUnits = ['1: Hours', '2: Days', '3: Months', '4: Month_Midnight', '5: Bill Cycle', '6: Year'];

    groupFee()
        .find('input[formcontrolname="packageDurationWording"]')
        .type('{selectall}{backspace}')
        .type(pickRandom(durations).toString(), { force: true });

    groupFee().find('select[formcontrolname="packageDurationUnitWording"]').select(pickRandom(durationUnits));

    groupFee().find('input[formcontrolname="getDiscountWording"]').type('{selectall}{backspace}').type(getRandomCharge(50, 500), { force: true });

    groupFee().find('input[formcontrolname="applyCampaignWording"]').type('{selectall}{backspace}').type(limitAndCleanEN(pOName, 50), { force: true });
    groupFee().find('input[formcontrolname="useForPONameWording"]').type('{selectall}{backspace}').type(limitAndCleanEN(pOName, 100), { force: true });

    cy.contains('.panel-heading', 'Price of Product Offering')
        .closest('.panel')
        .within(() => {
            cy.get('button.btn-primary.btn-xs').filter(':visible').first().click({ force: true });
        });

    cy.wait(300);

    cy.contains('.panel-heading', 'Price of Product Offering')
        .closest('.panel')
        .within(() => {
            cy.get('table tbody tr').first().find('input').eq(0).type('{selectall}{backspace}').type(excVat, { force: true });
        });

    groupFee().contains('button', 'Generate Wording').click({ force: true });

    cy.wait(300);

    groupFee()
        .find('textarea[formcontrolname="exGreetingLetterEN"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.greetingLetter.EN), 100), { force: true });

    groupFee()
        .find('textarea[formcontrolname="exGreetingLetterTH"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.greetingLetter.TH), 100), { force: true });

    groupFee()
        .find('textarea[formcontrolname="exDescriptionEN"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanEN(pickRandom(pools.description.EN), 255), { force: true });

    groupFee()
        .find('textarea[formcontrolname="exDescriptionTH"]')
        .type('{selectall}{backspace}')
        .type(limitAndCleanTH(pickRandom(pools.description.TH), 255), { force: true });

    groupFee().contains('button', 'Generate PO Fee').click({ force: true });

    cy.wait(500);
};

const setPriceVAT = (): void => {
    const getRandomCharge = (min = 100, max = 2000) => (Math.random() * (max - min) + min).toFixed(2);
    const randomCharge = getRandomCharge();

    cy.get('.modal-container').should('not.exist');

    cy.get('input[formcontrolname="priceExcludingVAT"]')
        .should('be.visible')
        .type(randomCharge, { force: true });
};

const OPEN_MODAL = 'modal-container.modal.in, modal-container.modal.show';

export const backBacicInfo = (savePO: boolean = true): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getRequest4');
    cy.get('.sidebar-nav > :nth-child(2) > a').click({ timeout: 1000000 });

    const handleModals = (attempt = 0, closedCount = 0): void => {
        cy.get('body', { log: false }).then(($body) => {
            const $modal = $body.find(OPEN_MODAL).filter(':visible').last();

            if ($modal.length === 0) {
                const maxAttempts = closedCount === 0 ? 16 : 6;   // x250ms
                if (attempt < maxAttempts) {
                    cy.wait(250, { log: false }).then(() => handleModals(attempt + 1, closedCount));
                } else {
                    cy.log(closedCount ? `✅ ปิด modal ครบ ${closedCount} ตัว` : '✅ ไม่มี modal ค้างอยู่');
                }
                return;
            }

            const title = $modal.find('.modal-title').first().text().trim();
            cy.log(`⚠️ พบ modal: "${title}"`);

            if (/save po/i.test(title) && !/save result/i.test(title)) {
                const label = savePO ? 'Yes' : 'No';
                cy.wrap($modal).find('.modal-body button.btn')
                    .contains(new RegExp(`^\\s*${label}\\s*$`))
                    .should('be.visible').and('not.be.disabled')
                    .click();
            }
            else if (/save result/i.test(title)) {
                cy.wrap($modal)
                    .find('.modal-footer button, .modal-body button')
                    .filter(':visible').first()
                    .should('not.be.disabled')
                    .click({ force: true });
            }

            else {
                cy.wrap($modal).find('button, .btn, .close').filter(':visible').then(($btns) => {
                    const preferred = $btns.filter((_, el) =>
                        /^(ok|yes|confirm|done|close|×)$/i.test(Cypress.$(el).text().trim())
                    );
                    cy.wrap((preferred.length ? preferred : $btns).first()).click({ force: true });
                });
            }
            cy.wait(300, { log: false }).then(() => {
                if (attempt < 10) handleModals(0, closedCount + 1);
            });
        });
    };
    handleModals();

    cy.wait('@getRequest4', { timeout: 60000000 });
    cy.get('.loading-curtain', { timeout: 30000 }).should('not.exist');
    cy.contains('li.sidebar-brand', 'List of Product Offering:', { timeout: 30000 }).should('be.visible');
};
export const addFile = (): void => {
    cy.get('input[type="file"]', { timeout: 30000 }).should('exist');

    cy.readFile('cypress/e2e/fixtures/1.txt', 'binary').then((fileContent) => {
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

export const ProjectBasicInformationComplete = (
    PriceType: PriceType,
    ProductClass: ProductClass,
    options: ProjectBasicOptions
): void => {
    const {
        Module,
        subModule,
        autoSetDuration = false,
        Plugin,
        runHumanTouchPoint = false,
        runNonHumanTouchPoint = false,
    } = options;

    const credentials = getCredentials(Module);

    const prefix = Module === 'ENTER' || Module === 'MUSIC' ? Module : 'MOB';

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

    waitForLoadingState();

    const projectIndex = ProductClass === 'main' ? 0 : 1;
    const actualProjectName = createProjectBase(credentials, projectName, Module, subModule, 'Create', projectIndex);

    const envKey = ProductClass === 'main' ? 'formattedDateMain' : 'formattedDate';

    Cypress.env(envKey, actualProjectName);
    registerProjectName(actualProjectName, projectIndex);

    waitForLoadingState();

    Cypress.env('hasYoutubePremium', false);
    Cypress.env('hasCloudGame', false);
    Cypress.env('currentModule', Module);
    Cypress.env('currentSubModule', subModule);
    Cypress.env('currentPriceType', PriceType);
    Cypress.env('currentProductClass', ProductClass);
    Cypress.env('currentProjectName', actualProjectName);
    Cypress.env('currentPlugin', Plugin ?? null);

    const targetGroupOptions = [
        'Change Charge Type (Convert)',
        'Existing',
        'New',
        'Port In (Mobile Number Port)',
        'Renew / Recall from Terminate',
    ];

    const isPrepaidMain = Module === 'PRE' && ProductClass === 'main';
    const isMainProductClass = ProductClass === 'main';

    const poCount = Math.max(1, Number((options as ProjectBasicOptions & { poCount?: number }).poCount ?? 2));

    cy.log(`📦 Creating ${poCount} PO(s)`);

    const poNames: string[] = [];
    const poTargetGroupsMap: string[][] = [];
    const sharedTimeId = generateUniqueId();

    for (let i = 0; i < poCount; i++) {
        const poIdentifier = `PO${i + 1} ${sharedTimeId}`;
        const currentPoName = buildUniqueName(prefixName, poIdentifier, 60);

        poNames.push(currentPoName);

        Cypress.env('currentPoName', currentPoName);
        Cypress.env('currentPoIndex', i);

        cy.log(`📦 [${i + 1}/${poCount}] Processing PO: ${currentPoName}`);

        createPOBase(currentPoName, 'Product Offering');
        cy.wait(5000);

        const priceTypeMap: Record<PriceType, string> = {
            onetime: '1: One-Time',
            recurring: '2: Recurring',
            usage: '3: Usage',
        };

        const productClassMapMobile: Record<ProductClass, string> = {
            main: '1: Main',
            ontop: '2: On-Top',
            ontopextra: '3: On-Top Extra',
        };

        const productClassMapEnterMusic: Record<'ontop' | 'ontopextra', string> = {
            ontop: '1: On-Top',
            ontopextra: '2: On-Top Extra',
        };

        let productValue: string;

        if (Module === 'ENTER' || Module === 'MUSIC') {
            if (ProductClass === 'main') {
                throw new Error(`❌ Module "${Module}" ไม่รองรับ ProductClass "main" — ใช้ได้เฉพาะ ontop / ontopextra`);
            }

            productValue = productClassMapEnterMusic[ProductClass as 'ontop' | 'ontopextra'];
        } else {
            productValue = productClassMapMobile[ProductClass];
        }

        selectOptionSafely('select[formcontrolname="productClass"]', productValue);
        selectOptionSafely('select[formcontrolname="priceType"]', priceTypeMap[PriceType]);

        if (ProductClass === 'main') {
            waitForLoadingState();

            cy.get('body').then(($body) => {
                const $panel = $body.find('.panel-heading').filter((_, el) =>
                    Cypress.$(el).text().trim().includes('Product Specification')
                );

                if ($panel.length === 0) {
                    cy.log(
                        `ℹ️ [SKIP] ไม่พบ panel "Product Specification" สำหรับ PriceType=${PriceType} — ข้ามการตรวจสอบ`
                    );
                    return;
                }

                cy.wrap($panel.first())
                    .scrollIntoView()
                    .closest('.panel')
                    .within(() => {
                        cy.get('select[formcontrolname="selectedListBox"]', { timeout: 15000 }).should('exist');
                    });
            });
        }
        // ─────────────────────────────────────────────────────────────

        const keepMainDefaults = isMainProductClass && getRandomInt(1, 10) <= 8;

        if (autoSetDuration) {
            cy.get('input[formcontrolname="packageDuration"]')
                .invoke('val')
                .then((durationVal) => {
                    const hasDurationValue = !!String(durationVal ?? '').trim();

                    cy.get('select[formcontrolname="packageDurationUnit"]')
                        .filter(':visible')
                        .invoke('val')
                        .then((unitVal) => {
                            const hasUnitValue = !!String(unitVal ?? '').trim();
                            const hasDefault = hasDurationValue && hasUnitValue;
                            const shouldRandomizeDuration = !hasDefault || (isMainProductClass ? !keepMainDefaults : true);

                            if (!shouldRandomizeDuration) {
                                cy.log('✅ Keeping default packageDuration/Unit (main, 80% roll)');
                                return;
                            }

                            const realisticDurations: Record<string, number[]> = {
                                hours: [2, 3, 4, 6, 8, 12, 18, 24, 36, 48, 72, 96, 120],
                                days: [2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365],
                                months: [2, 3, 4, 6, 9, 12, 18, 24, 36, 48, 60],
                                month_midnight: [2, 3, 4, 6, 9, 12, 18, 24, 36, 48, 60],
                                'bill cycle': [2, 3, 4, 6, 9, 12, 18, 24],
                                year: [2, 3, 4, 5, 6, 7, 8, 9, 10],
                            };

                            cy.log(`⏱️ autoSetDuration=true → randomize${!hasDefault ? ' (no default, forced)' : ''}`);

                            const stripIndexPrefix = (raw: string): string => raw.replace(/^\d+:\s*/, '').trim();

                            cy.get('select[formcontrolname="packageDurationUnit"]')
                                .filter(':visible')
                                .then(($selects) => {
                                    if (!$selects.length) {
                                        cy.log('⚠️ [SKIP] ไม่พบ packageDurationUnit select ที่ visible');
                                        return;
                                    }

                                    const $select = $selects.last();
                                    const $options = $select.find('option:not([disabled])');

                                    const opts = ([...$options] as HTMLOptionElement[]).filter(
                                        (o) => o.value && o.value !== 'null' && stripIndexPrefix(o.text)
                                    );

                                    if (!opts.length) {
                                        cy.log('⚠️ [SKIP] ไม่มี option ที่ใช้ได้ใน packageDurationUnit');
                                        return;
                                    }

                                    const target = opts[getRandomInt(0, opts.length - 1)];
                                    const targetLabel = stripIndexPrefix(target.text);
                                    const unitText = targetLabel.toLowerCase();

                                    const matchedKey = Object.keys(realisticDurations).find(
                                        (key) => unitText.includes(key) || key.includes(unitText)
                                    );

                                    const possibleDurations = matchedKey
                                        ? realisticDurations[matchedKey]
                                        : [2, 3, 7, 14, 30, 60, 90];

                                    const randomDuration = possibleDurations[getRandomInt(0, possibleDurations.length - 1)];

                                    selectDurationUnitByLabel(targetLabel);

                                    cy.get('input[formcontrolname="packageDuration"]')
                                        .type('{selectall}{backspace}')
                                        .type(randomDuration.toString());

                                    cy.log(`🗓️ Package Duration = ${randomDuration} ${targetLabel}`);
                                });

                            clickIfExists('.col-md-8 > .btn', 'Add Duration');
                        });
                });
        }

        if (subModule === 'PRE') {
            const shouldRandomizeBillCycle = isMainProductClass ? !keepMainDefaults : getRandomInt(1, 10) <= 8;

            if (shouldRandomizeBillCycle) {
                const realisticBillCycles = [1, 5, 7, 10, 15, 20, 25, 28];
                const randomBillCycle = realisticBillCycles[getRandomInt(0, realisticBillCycles.length - 1)];

                cy.get('input[formcontrolname="packageBillCycle"]')
                    .should('be.visible')
                    .type('{selectall}{backspace}')
                    .type(randomBillCycle.toString());

                cy.get('select[formcontrolname="packageBillCycleUnit"] option:not([disabled])')
                    .should('have.length.greaterThan', 0)
                    .then(($options) => {
                        const availableOptions = ([...$options] as HTMLOptionElement[])
                            .map((o) => o.value)
                            .filter((v) => v && v !== 'null');

                        if (!availableOptions.length) {
                            cy.log('⚠️ [SKIP] ไม่มี option ที่ใช้ได้ใน packageBillCycleUnit');
                            return;
                        }

                        const realisticBillCycleUnits = ['Day', 'Days', 'Date', 'Month', 'Months'];

                        const matchedUnit =
                            realisticBillCycleUnits.find((unit) =>
                                availableOptions.some((v) => v.toLowerCase() === unit.toLowerCase())
                            ) ?? availableOptions[0];

                        cy.get('select[formcontrolname="packageBillCycleUnit"]').select(matchedUnit, { force: true });

                        cy.log(`🗓️ Bill Cycle = ${randomBillCycle} ${matchedUnit}`);
                    });
            } else if (isMainProductClass) {
                cy.log('✅ Keeping default packageBillCycle/Unit (main, 80% roll)');
            }
        }

        const normalizedPriceType = String(PriceType ?? '').trim().toLowerCase();
        const isMultiDurationEligible = normalizedPriceType === 'recurring' || normalizedPriceType === 'usage';
        const useMultiDuration = isMultiDurationEligible && getEntropySeed() < 0.5;

        if (useMultiDuration) {
            cy.log(`🎲 Multi Duration = Yes (PriceType=${PriceType})`);
            RandomMultiDuration();
        } else {
            PriceExcluding();
        }

        RandomFixedDates();
        Randomdropdown();
        selectTargetGroup('random');
        dropdownPromotionGroup();

        let groupsForThisPo: string[] = [];
        if (isPrepaidMain) {
            const groupCountForThisPo = getRandomInt(1, targetGroupOptions.length);
            groupsForThisPo = pickMultiple(targetGroupOptions, groupCountForThisPo);

            cy.log(`🎯 PO [${i + 1}/${poCount}] เลือก ${groupsForThisPo.length} targetgroup: ${groupsForThisPo.join(', ')}`);
        }

        poTargetGroupsMap.push(groupsForThisPo);
        Cypress.env('currentPoTargetGroups', groupsForThisPo);

        targetgroup(isPrepaidMain ? groupsForThisPo : undefined);

        RandomProductSpecification(ProductClass, subModule, Module);

        if (Module === 'PRE' && (ProductClass === 'ontop' || ProductClass === 'ontopextra')) {
            cy.get('body').then(($b) => {
                const $radios = $b.find('input[formcontrolname="allowMvpn"]');

                if (!$radios.length) {
                    cy.log('⚠️ [SKIP] ไม่พบ allowMvpn radio');
                    return;
                }

                const idx = getRandomInt(0, $radios.length - 1);

                cy.get('input[formcontrolname="allowMvpn"]').eq(idx).check({ force: true });
            });
        }
        RandomRemark(actualProjectName, currentPoName, PriceType, ProductClass, subModule);
        smsWordingAuto();
        RunMassMktTabs();
        if (runHumanTouchPoint) RandomHumanTouchPoint(subModule);
        if (runNonHumanTouchPoint) RandomNonHumanTouchPoint(subModule);
        InternalShare();
        SharingPartner();
        RevenueSharing();
        ChargePartner();

        if ((Module === 'PRE' || Module === 'ENTER' || Module === 'MUSIC') && PriceType === 'recurring') {
            RetryPattern();
        }

        if (Module === 'PRE' && PriceType === 'recurring' && ProductClass === 'main') {
            CopyDeductFail('mass-market');
        }

        if (i < poCount - 1) {
            cy.log(`🔙 PO ${currentPoName} done. Navigating back for next PO...`);
            backBacicInfo();
            cy.wait(1000);
        }
    }

    ensureUniqueAllPoNames(poNames);

    Cypress.env('allPoNames', poNames);
    Cypress.env('poCount', poCount);
    Cypress.env('poTargetGroupsMap', poTargetGroupsMap);
    Cypress.env('currentPoName', poNames[0] || poName);

    cy.log(`✅ All ${poCount} PO(s) created under "${actualProjectName}"`);

    backBacicInfo();
    addFile();
};

export const ProjectBasicInformationCompleteOtherPOSub = (
    PriceType: 'onetime' | 'recurring' | 'usage',
    PoSubGroup: 'AccountFee' | 'OrderFee' | 'CashBack' | 'Service' | 'GroupPoFee',
    Module: 'POST' | 'PRE'
): void => {
    const credentials = getCredentials(Module);

    const { projectName, poName, prefixName } = generateProjectNames(
        'MOB',
        Module,
        undefined,
        PriceType,
        undefined,
        PoSubGroup
    );

    login(credentials.user, credentials.pass);

    cy.get('.col-md-10 > .btn').should('be.visible').click();
    cy.get('input[formcontrolname="projectName"]').type(projectName);

    Cypress.env('projectName', projectName);

    const date = new Date();
    date.setDate(date.getDate() + 1);

    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    cy.get('input[aria-label="Date input field"]').type('{selectall}{backspace}').type(formattedDate);
    cy.get('input[aria-label="Date input field"]').should('have.value', formattedDate);

    cy.get('input[formcontrolname="phoneNo"]').click().type(getRandomPhone(), { delay: 30 });

    RandomProjectDescription(projectName, undefined, Module);

    cy.get('button[type="button"]').contains('Save').click();

    cy.wait('@getRequest', { timeout: 60000000 }).its('response.statusCode').should('eq', 200);

    closeVisibleModalIfAny();

    cy.get('input[formcontrolname="projectCode"]', { timeout: 30000 })
        .should('be.visible')
        .should(($input) => {
            const value = String($input.val() || '').trim();
            expect(value, 'Project Code should be generated and visible after save').to.not.be.empty;
        })
        .invoke('val')
        .then((code) => {
            const projectCode = String(code || '').trim();
            cy.log(`📌 Captured Project Code: "${projectCode}"`);
            const existingCodes = (Cypress.env('allProjectCodes') as string[]) || [];
            if (projectCode && !existingCodes.includes(projectCode)) {
                existingCodes.push(projectCode);
            }
            Cypress.env('allProjectCodes', existingCodes);
            Cypress.env('currentProjectCode', projectCode);

            registerProjectCode(projectCode);
        });


    const poCount = 2;
    const poNames: string[] = [];
    const sharedTimeId = generateUniqueId();

    const subGroupMap: Record<string, string> = {
        AccountFee: 'Account Fee',
        OrderFee: 'Order Fee',
        CashBack: 'Cash Back',
        Service: 'Service',
        GroupPoFee: 'Group PO Fee',
    };

    cy.log(`📦 Creating ${poCount} PO(s)`);

    for (let i = 0; i < poCount; i++) {
        const poIdentifier = `PO${i + 1} ${sharedTimeId}`;
        const currentPoName = buildUniqueName(prefixName, poIdentifier, 60);

        poNames.push(currentPoName);

        cy.log(`📦 [${i + 1}/${poCount}] Processing PO: ${currentPoName}`);

        createPOBase(currentPoName, subGroupMap[PoSubGroup]);

        Cypress.env('poName', currentPoName);
        Cypress.env('currentPoName', currentPoName);

        cy.wait(2000);

        if (Module === 'PRE' && (PoSubGroup === 'OrderFee' || PoSubGroup === 'Service')) {
            const priceTypeMap: Record<string, string> = {
                onetime: 'One-Time',
                recurring: 'Recurring',
                usage: 'Usage',
            };

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
            GroupPoFee: () => fillGroupPoFeePOFields(Module, PriceType),
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

    ensureUniqueAllPoNames(poNames);

    Cypress.env('allPoNames', poNames);
    Cypress.env('poCount', poCount);
    Cypress.env('poName', poNames[0] || poName);
    Cypress.env('currentModule', Module);
    Cypress.env('currentPriceType', PriceType);
    Cypress.env('currentProjectName', projectName);

    cy.log(`✅ All ${poCount} PO(s) processed. Finalizing...`);

    backBacicInfo();
    addFile();
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
            const rowText = (Cypress.$(cells[2]).text() + ' ' + Cypress.$(cells[3]).text())
                .toUpperCase()
                .replace(/\s+/g, ' ');

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
        const rowText = (Cypress.$(cells[2]).text() + ' ' + Cypress.$(cells[3]).text())
            .toUpperCase()
            .replace(/\s+/g, ' ');

        if (
            (priceTypeToken ? rowText.includes(priceTypeToken) : true) &&
            (productClassToken ? rowText.includes(productClassToken) : true)
        ) {
            count++;
        }
    });

    return count;
};

const searchProductOfferingByPO = (
    poCount: number = 1,
    PriceType?: PriceType,
    ProductClass?: ProductClass
): Cypress.Chainable<SelectedPORow[]> => {
    closeVisibleModalIfAny();

    cy.contains('button', 'Search Product Offering').should('be.visible').click({ force: true });

    cy.get('select[formcontrolname="poSubGroup"]')
        .should('be.visible')
        .select('Product Offering')
        .should('have.value', 'Product Offering');

    const monthsBackOptions = [1, 3, 6, 12];

    const trySearchWithMonthsBack = (attemptIndex: number): Cypress.Chainable<SelectedPORow[]> => {
        const monthsBack = monthsBackOptions[attemptIndex];

        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - monthsBack);

        const formattedFromDate = fromDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });

        cy.log(`🔍 Searching with Commercial Launch Date from ${monthsBack} month(s) back`);

        cy.get('my-date-picker[formcontrolname="commercialLaunchDateFrom"] input[aria-label="Date input field"]')
            .should('be.visible')
            .type('{selectall}{backspace}')
            .type(formattedFromDate, { delay: 30 });

        cy.get('my-date-picker[formcontrolname="commercialLaunchDateFrom"] input[aria-label="Date input field"]')
            .should('have.value', formattedFromDate);

        cy.get('.col-md-2.text-right > button.btn.btn-default')
            .should('be.visible')
            .and('not.be.disabled')
            .click();

        cy.get('body').then(($body) => {
            if ($body.find('.loading-curtain').length > 0) {
                cy.get('.loading-curtain', { timeout: 60000000 }).should('not.exist');
            }
        });

        return cy.get('table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0).then(($rows) => {
            const matchCount = countMatchingRows($rows, PriceType, ProductClass);
            const isLastAttempt = attemptIndex >= monthsBackOptions.length - 1;

            if (matchCount < poCount && !isLastAttempt) {
                cy.log(`⚠️ Found only ${matchCount}/${poCount} matching PO within ${monthsBack} month(s), widening search...`);
                return trySearchWithMonthsBack(attemptIndex + 1);
            }

            if (matchCount === 0) {
                const priceTypeToken = PriceType ? getAbbreviation(PriceType).toUpperCase() : null;
                const productClassToken = ProductClass ? getAbbreviation(ProductClass).toUpperCase() : null;

                cy.log(`🔎 Expected priceTypeToken: "${priceTypeToken}" | productClassToken: "${productClassToken}"`);

                $rows.slice(0, 8).each((_, row) => {
                    const cells = Cypress.$(row).find('td');

                    cy.log(`Sample → PO: "${Cypress.$(cells[2]).text().trim()}" | Project: "${Cypress.$(cells[3]).text().trim()}"`);
                });

                throw new Error(`❌ No available PO found matching criteria even after searching back ${monthsBack} months`);
            }

            if (matchCount < poCount) {
                cy.log(`⚠️ Requested ${poCount} PO(s) but only found ${matchCount} — proceeding with ${matchCount}`);
            }

            return selectAvailablePORows(poCount, PriceType, ProductClass);
        });
    };

    return trySearchWithMonthsBack(0).then((selected) => {
        cy.contains('button', 'Modify').should('be.visible').and('not.be.disabled').click();

        cy.location('hash', { timeout: 120000 }).should((hash) => {
            expect(hash, 'URL should navigate to the PO detail page after clicking Modify').to.match(
                /product-offering-detail|mass-enh-product-offering-detail/i
            );
        });

        return cy.wrap(selected, { log: false });
    });
};

const closeSuccessModal = (): void => {
    cy.contains('.modal-title', 'Save Result', { timeout: 60000000 })
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

    const prefix = Module === 'ENTER' || Module === 'MUSIC' ? Module : 'MOB';

    const { projectName } = generateProjectNames(prefix, Module, subModule, PriceType, ProductClass, undefined, Plugin);

    const projectIndex = ProductClass === 'main' ? 0 : 1;
    const actualProjectName = createProjectBase(credentials, projectName, Module, subModule, 'Modify By PO', projectIndex);

    const envKey = ProductClass === 'main' ? 'formattedDateMain' : 'formattedDate';

    Cypress.env(envKey, actualProjectName);
    registerProjectName(actualProjectName, projectIndex);

    searchProductOfferingByPO(poCount, PriceType, ProductClass).then((selected) => {
        Cypress.env('modifyTargetPoNames', selected.map((s) => s.poName));
        Cypress.env('modifyTargetProjectNames', selected.map((s) => s.projectName));
        ensureUniqueAllPoNames(selected.map((s) => s.poName));
        Cypress.env('allPoNames', selected.map((s) => s.poName));
        Cypress.env('poCount', selected.length);

        if (selected.length < poCount) {
            cy.log(`⚠️ Requested ${poCount} PO(s) but only found ${selected.length} available — proceeding with ${selected.length}`);
        }

        Cypress.env('currentModule', Module);
        Cypress.env('currentSubModule', subModule);
        Cypress.env('currentPriceType', PriceType);
        Cypress.env('currentProductClass', ProductClass);
        Cypress.env('currentProjectName', actualProjectName);

        cy.location('hash', { timeout: 120000 }).should((hash) => {
            expect(hash, 'URL should be on the PO detail page before modifying').to.match(
                /product-offering-detail|mass-enh-product-offering-detail/i
            );
        });

        cy.get('body').then(($body) => {
            if ($body.find('.loading-curtain').length > 0) {
                cy.get('.loading-curtain', { timeout: 60000000 }).should('not.exist');
            }
        });

        cy.wait(2000);

        cy.get('div.drawer1', { timeout: 30000 }).should('exist').find('a.button').then(($allPOs) => {
            const actualPOCount = $allPOs.length;

            cy.log(`📋 Found ${actualPOCount} PO(s) in sidebar to modify`);

            if (actualPOCount === 0) {
                throw new Error('❌ ไม่พบ PO ใน Sidebar หลังคลิก Modify');
            }

            Cypress._.times(actualPOCount, (index: number) => {
                cy.log(`🔄 [${index + 1}/${actualPOCount}] Processing PO in sidebar...`);

                if (index > 0) {
                    cy.get('body').then(($body) => {
                        if ($body.find('.loading-curtain').length > 0) {
                            cy.get('.loading-curtain', { timeout: 60000000 }).should('not.exist');
                        }
                    });

                    cy.wait(1000);

                    cy.get('div.drawer1').find('a.button').eq(index).should('be.visible').click({ force: true });

                    cy.wait(1000);
                }

                selectModifySections(1, 3).then((sections) => {
                    cy.log(`📝 Selected sections for PO ${index + 1}: ${sections.join(', ')}`);
                    fillSelectedModifySections(sections, index);
                });

                if (index < actualPOCount - 1) {
                    // cy.contains('button', 'Save').should('be.visible').and('not.be.disabled').click();
                    // closeSuccessModal();
                    cy.wait(1000);
                }
            });
        }).then(() => {
            cy.log('✅ Modify By PO complete — processed all POs in sidebar');

            backBacicInfo();
            addFile();
        });
    });
};