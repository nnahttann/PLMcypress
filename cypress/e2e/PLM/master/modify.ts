const closeSuccessModal = (): void => {
    cy.contains('.modal-title', 'Save Result', { timeout: 600000 })
        .closest('.modal-content')
        .find('.modal-footer button.btn-danger')
        .should('be.visible')
        .and('not.be.disabled')
        .click();
};
export const selectAndModifyPO = (poTitle: string): void => {
    cy.get('body').then(($body) => {
        if ($body.find('.modal-backdrop, .loading-curtain').length > 0) {
            cy.get('.modal-backdrop, .loading-curtain', { timeout: 15000 }).should('not.exist');
        }
    });
    const clickModifyAndVerify = (): void => {
        cy.contains('a.button', poTitle, { timeout: 20000 })
            .should('be.visible')
            .click({ force: true });
        cy.location('hash', { timeout: 5000 }).then((beforeHash) => {
            cy.contains('button', 'Modify', { timeout: 20000 })
                .should('be.visible')
                .and('not.be.disabled')
                .click({ force: true });
            cy.location('hash', { timeout: 15000 }).then((afterHash) => {
                if (afterHash === beforeHash || !afterHash.includes('product-offering-detail')) {
                    cy.log('⚠️ Hash ไม่ขยับหลังคลิก Modify — reload แล้วลองใหม่ 1 ครั้ง');
                    cy.reload();
                    cy.get('body').then(($body) => {
                        if ($body.find('.loading-curtain').length > 0) {
                            cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
                        }
                    });
                    cy.contains('a.button', poTitle, { timeout: 20000 })
                        .should('be.visible')
                        .click({ force: true });
                    cy.contains('button', 'Modify', { timeout: 20000 })
                        .should('be.visible')
                        .and('not.be.disabled')
                        .click({ force: true });
                }
            });
        });
    };
    clickModifyAndVerify();
    cy.location('hash', { timeout: 30000 }).should('include', 'product-offering-detail');
};
export const generateUniqueId = (): string => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${month}${day} ${h}${mm}`;
};
// export const MODIFY_SECTION_PAIRS: Record<string, string[]> = {
//     'Product Definition': ['SMS Wording'],
//     'SMS Wording': ['Product Definition'],
// };
const PRODUCT_DEFINITION = 'Product Definition';
const SMS_WORDING = 'SMS Wording';
export const selectModifySections = (minCount: number = 1, maxCount: number = 3): Cypress.Chainable<string[]> => {
    cy.get('body').then(($body) => {
        if ($body.find('.loading-curtain').length > 0) {
            cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
        }
    });
    cy.contains('h2', 'Modify Section', { timeout: 30000 }).should('be.visible');
    const dualListBox = () => cy.get('ng2-dual-list-box[formcontrolname="modifySection"]');
    dualListBox()
        .find('select[formcontrolname="availableListBox"] option, select[formcontrolname="selectedListBox"] option', { timeout: 30000 })
        .should('have.length.greaterThan', 0);
    return dualListBox().then(($box) => {
        const $available = $box.find('select[formcontrolname="availableListBox"]');
        const $selected = $box.find('select[formcontrolname="selectedListBox"]');
        const availableTexts = $available.find('option').map((_, el) => Cypress.$(el).text().trim()).get();
        const selectedTexts = $selected.find('option').map((_, el) => Cypress.$(el).text().trim()).get();
        const allTexts = [...new Set([...availableTexts, ...selectedTexts])];
        const hasProductDefinition = allTexts.includes(PRODUCT_DEFINITION);
        const hasSmsWording = allTexts.includes(SMS_WORDING);
        let primarySections: string[] = [];
        if (hasProductDefinition && hasSmsWording) {
            primarySections = Math.random() < 0.5 ? [PRODUCT_DEFINITION] : [SMS_WORDING];
        }
        else if (hasProductDefinition) {
            primarySections = [PRODUCT_DEFINITION];
        }
        else if (hasSmsWording) {
            primarySections = [SMS_WORDING];
        }
        else {
            cy.log('⚠️ ไม่พบทั้ง "Product Definition" และ "SMS Wording" ในระบบ — ไม่มี section ให้เลือก');
        }
        const finalSections: string[] = [];
        primarySections.forEach((primary) => {
            if (!finalSections.includes(primary))
                finalSections.push(primary);
            const pairs = MODIFY_SECTION_PAIRS[primary] || [];
            pairs.forEach((pair) => {
                if (!finalSections.includes(pair))
                    finalSections.push(pair);
            });
        });
        const validFinalSections = finalSections.filter(sec => allTexts.includes(sec));
        cy.log(`🎯 Modify Sections expected to be active: ${validFinalSections.join(', ') || '(none)'}`);
        const needsSelection = validFinalSections.filter(sec => availableTexts.includes(sec));
        if (needsSelection.length > 0) {
            needsSelection.forEach((sectionText) => {
                dualListBox()
                    .find('select[formcontrolname="availableListBox"]')
                    .then(($sel) => {
                        const opt = Cypress.$($sel)
                            .find('option')
                            .filter((_, el) => Cypress.$(el).text().trim() === sectionText);
                        if (opt.length > 0) {
                            const value = opt.first().attr('value')!;
                            cy.wrap($sel).select(value, { force: true });
                            dualListBox()
                                .find('button.str')
                                .should('not.be.disabled')
                                .click();
                        }
                    });
            });
        }
        else {
            cy.log('ℹ️ Sections ที่ต้องการเลือก ถูกย้ายไปช่อง Selected (ขวา) อยู่แล้วจาก PO ก่อนหน้า');
        }
        validFinalSections.forEach((sectionText) => {
            dualListBox()
                .find('select[formcontrolname="selectedListBox"] option')
                .should('contain.text', sectionText);
        });
        return cy.wrap(validFinalSections, { log: false });
    });
};
import { sanitizePoName } from './project-creation';

export const fillProductDefinitionSection = (poIndex: number = 0): void => {
    cy.contains('h3', 'Product Offering Definition').should('be.visible');
    cy.get('body').then(($body) => {
        if ($body.find('input[formcontrolname="productName"]').length > 0) {
            cy.get('input[formcontrolname="productName"]').then(($input) => {
                const currentName = String($input.val() || '').trim();
                const baseName = currentName
                    .replace(/\s+MOD\b.*$/i, '')
                    .replace(/\s+\d{4}\s+\d{4}.*$/, '')
                    .trim();
                const modSuffix = ` MOD ${generateUniqueId()}`;
                // determine maxlength from UI counter (sibling <small>) if available
                let maxLen = Number($input.attr('maxlength') || 255);
                const siblingText = $input.siblings('small').text() || '';
                const match = siblingText.match(/(\d+)\s*\/\s*(\d+)/);
                if (match) {
                    const uiMax = parseInt(match[2], 10);
                    if (Number.isFinite(uiMax) && uiMax > 0) {
                        maxLen = uiMax;
                    }
                }
                let newProductName = `${baseName}${modSuffix}`;
                if (newProductName.length > maxLen) {
                    const allowedBaseLen = maxLen - modSuffix.length;
                    const truncatedBase = allowedBaseLen > 0 ? baseName.substring(0, allowedBaseLen) : '';
                    newProductName = `${truncatedBase}${modSuffix}`.substring(0, maxLen);
                }
                const sanitized = sanitizePoName(newProductName, maxLen);
                // ensure sanitized does not exceed maxLen (sanitization may remove chars)
                const finalVal = sanitized.length > maxLen ? sanitized.substring(0, maxLen).trimEnd() : sanitized;
                cy.wrap($input)
                    .clear()
                    .type(finalVal, { delay: 30 });
                cy.log(`✏️ productName: "${currentName}" → "${finalVal}"`);
                const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
                allPoNames[poIndex] = finalVal;
                Cypress.env('allPoNames', allPoNames);
                cy.log(`🔄 Synced allPoNames[${poIndex}] = "${finalVal}"`);
            });
        }
        if ($body.find('select[formcontrolname="packageDurationUnit"]').length > 0) {
            cy.get('select[formcontrolname="packageDurationUnit"]')
                .filter(':visible')
                .then(($selects) => {
                    if (!$selects.length) {
                        cy.log('⚠️ [SKIP] ไม่พบ packageDurationUnit select ที่ visible');
                        return;
                    }

                    const $opts = $selects.first().find('option:not([disabled])');

                    if (!$opts.length) {
                        cy.log('⚠️ [SKIP] packageDurationUnit ไม่มี option ที่เลือกได้');
                        return;
                    }
                    const { selectRandomFromSelect } = require('./helpers');

                    selectRandomFromSelect('select[formcontrolname="packageDurationUnit"]').then(() => {
                        cy.log('✅ packageDurationUnit selected');
                    });
                });
        }
        if ($body.find('input[formcontrolname="packageDuration"]').length > 0) {
            cy.get('input[formcontrolname="packageDuration"]')
                .clear()
                .type(String(Math.floor(Math.random() * 24) + 1), { delay: 30 });
        }
        if ($body.find('select[formcontrolname="targetGroup"]').length > 0) {
            cy.get('select[formcontrolname="targetGroup"] option:not([disabled])').then(($opts) => {
                if ($opts.length > 0) {
                    const randomOpt = $opts[Math.floor(Math.random() * $opts.length)] as HTMLOptionElement;
                    cy.get('select[formcontrolname="targetGroup"]').select(randomOpt.value);
                }
            });
        }
        if ($body.find('textarea[formcontrolname="remark"]').length > 0) {
            cy.get('textarea[formcontrolname="remark"]')
                
                .type(`modify remark ${generateUniqueId()}`, { delay: 30 });
        }
    });
};
interface SmsTextFieldConfig {
    selector: string;
    maxLen: number;
    required?: boolean;
}
interface DeductionExtraConfig {
    numberSelector: string;
    unitSelector: string;
    radioSelector: string;
    textSelector: string;
    textMaxLen: number;
}
interface SmsFlagFieldConfig {
    flagSelector: string;
    required?: boolean;
    textSelector?: string;
    textMaxLen?: number;
    radioSelector?: string;
    deduction?: DeductionExtraConfig;
}
const SMS_PLAIN_TEXT_FIELDS: SmsTextFieldConfig[] = [
    { selector: 'textarea[formcontrolname="shortPromotionName"]', maxLen: 50, required: true },
    { selector: 'textarea[formcontrolname="cmsDisplay"]', maxLen: 250 },
    { selector: 'textarea[formcontrolname="promotionDescription"]', maxLen: 255 },
    { selector: 'textarea[formcontrolname="smsCheckCurrent"]', maxLen: 50 },
    { selector: 'textarea[formcontrolname="marketingName"]', maxLen: 40 },
    { selector: 'textarea[formcontrolname="yourPackage"]', maxLen: 100 },
    { selector: 'textarea[formcontrolname="greetingLetter"]', maxLen: 250 },
    { selector: 'textarea[formcontrolname="smsReponseSuccessForROM"]', maxLen: 250 },
    { selector: 'textarea[formcontrolname="smsReponseSuccessForPAY"]', maxLen: 250 },
];
const SMS_FLAG_FIELDS: SmsFlagFieldConfig[] = [
    {
        flagSelector: 'select[formcontrolname="smsGreetingSendFlag"]',
        textSelector: 'textarea[formcontrolname="smsGreeting"]',
        textMaxLen: 250,
        required: true,
    },
    {
        flagSelector: 'select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]',
    },
    {
        flagSelector: 'select[formcontrolname="smsDeleteSendFlag"]',
        textSelector: 'textarea[formcontrolname="smsDelete"]',
        textMaxLen: 250,
        radioSelector: 'input[formcontrolname="SmsDeletedefaultWordingFlag"]',
        required: true,
    },
    {
        flagSelector: 'select[formcontrolname="smsPromotePackSendFlag"]',
        textSelector: 'textarea[formcontrolname="smsPromotePack"]',
        textMaxLen: 250,
    },
    {
        flagSelector: 'select[formcontrolname="lastMinuteAlertSendFlag"]',
        textSelector: 'textarea[formcontrolname="smsNotificationLastMinuteAlert"]',
        textMaxLen: 250,
        radioSelector: 'input[formcontrolname="lastMinuteAlertDefaultWordingFlag"]',
    },
    {
        flagSelector: 'select[formcontrolname="smsBeforeFeeDeductSendFlag"]',
        deduction: {
            numberSelector: 'input[formcontrolname="beforeFeeDeduction"]',
            unitSelector: 'select[formcontrolname="beforeFeeDeductionUnit"]',
            radioSelector: 'input[formcontrolname="defaultWordingFlag"]',
            textSelector: 'textarea[formcontrolname="smsNotificationBeforeFeeDeduction"]',
            textMaxLen: 250,
        },
    },
    {
        flagSelector: 'select[formcontrolname="recurringDeductSuccessAlertSendFlag"]',
        textSelector: 'textarea[formcontrolname="recurringFeeDeductSuccessAlert"]',
        textMaxLen: 250,
        radioSelector: 'input[formcontrolname="recurringDeductSuccessAlertDefaultWordingFlag"]',
    },
    {
        flagSelector: 'select[formcontrolname="recurringDeductFailAlertSendFlag"]',
        textSelector: 'textarea[formcontrolname="recurringFeeDeductFailAlert"]',
        textMaxLen: 250,
        radioSelector: 'input[formcontrolname="recurringDeductFailAlertDefaultWordingFlag"]',
    },
    {
        flagSelector: 'select[formcontrolname="beforePromotionExpAlertSendFlag"]',
        deduction: {
            numberSelector: 'input[formcontrolname="beforePromotionExpAlertDeduction"]',
            unitSelector: 'select[formcontrolname="beforePromotionExpAlertDeductionUnit"]',
            radioSelector: 'input[formcontrolname="beforePromotionExpAlertDefaultWordingFlag"]',
            textSelector: 'textarea[formcontrolname="beforePromotionExpAlert"]',
            textMaxLen: 250,
        },
    },
    {
        flagSelector: 'select[formcontrolname="promotionExpAlertSendFlag"]',
        textSelector: 'textarea[formcontrolname="promotionExpAlert"]',
        textMaxLen: 250,
        radioSelector: 'input[formcontrolname="promotionExpAlertDefaultWordingFlag"]',
    },
];
const SMS_SEND_FLAG_VALUES = ['Send', "Don't Send"] as const;
type SmsSendFlagValue = (typeof SMS_SEND_FLAG_VALUES)[number];
const randomSendFlag = (): SmsSendFlagValue => SMS_SEND_FLAG_VALUES[Math.floor(Math.random() * SMS_SEND_FLAG_VALUES.length)];
const SMS_WORDING_PANEL_PROBE = 'textarea[formcontrolname="shortPromotionName"], select[formcontrolname="smsGreetingSendFlag"]';
const findVisibleSmsWordingTab = ($body: JQuery<HTMLElement>): JQuery<HTMLElement> => $body
    .find('ul.nav.nav-tabs a, .scrollmenu > .nav a')
    .filter(':visible')
    .filter((_, el) => Cypress.$(el).text().trim().includes('SMS Wording'));
const activateSmsWordingTab = (): void => {
    cy.get('body').then(($body) => {
        const $tab = findVisibleSmsWordingTab($body);
        if ($tab.length > 0) {
            cy.wrap($tab.first()).scrollIntoView().click({ force: true });
        }
        else {
            cy.log('ℹ️ No visible "SMS Wording" tab found — assuming panel is already active');
        }
    });
};
const waitForPanelToSettle = (): void => {
    let lastCount = -1;
    let stableStreak = 0;
    const check = (roundsLeft: number): void => {
        cy.get('body').then(($body) => {
            const count = $body.find('textarea, select').filter(':visible').length;
            if (count > 0 && count === lastCount) {
                stableStreak += 1;
            }
            else {
                stableStreak = 0;
            }
            lastCount = count;
            if (stableStreak >= 2 || roundsLeft <= 0) {
                return;
            }
            cy.wait(400);
            check(roundsLeft - 1);
        });
    };
    check(15);
};
const ensureSmsWordingPanelReady = (): void => {
    cy.get('body').then(($body) => {
        if ($body.find('.loading-curtain').length > 0) {
            cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
        }
    });
    cy.get('body').then(($body) => {
        const panelVisible = $body.find(SMS_WORDING_PANEL_PROBE).filter(':visible').length > 0;
        if (panelVisible)
            return;
        const $tab = findVisibleSmsWordingTab($body);
        if ($tab.length === 0) {
            cy.log('ℹ️ SMS Wording panel not visible and no tab to re-click — continuing');
            return;
        }
        cy.log('⚠️ SMS Wording panel disappeared — re-clicking tab to reactivate');
        cy.wrap($tab.first()).scrollIntoView().click({ force: true });
        cy.wait(500);
        waitForPanelToSettle();
    });
};
const buildModValue = (currentVal: string, maxLen: number): string => {
    const modSuffix = ` MOD ${generateUniqueId()}`;
    let base = currentVal.replace(/\s*MOD\s.*$/, '').trim();
    if (!base)
        base = 'Auto Text';
    let newVal = `${base}${modSuffix}`;
    if (newVal.length > maxLen) {
        const allowedBaseLen = maxLen - modSuffix.length;
        newVal = allowedBaseLen > 0 ? `${base.substring(0, allowedBaseLen)}${modSuffix}` : modSuffix.substring(0, maxLen);
    }
    return newVal;
};
const fillTextAreaWithModSuffix = (selector: string, maxLen: number, required: boolean): void => {
    ensureSmsWordingPanelReady();
    cy.get('body').then(($body) => {
        const count = $body.find(selector).filter(':visible').length;
        if (count === 0) {
            if (required) {
                cy.get(selector, { timeout: 20000 }).should('be.visible');
            }
            else {
                cy.log(`ℹ️ ${selector} not present — skipping (optional field)`);
            }
            return;
        }
        for (let i = 0; i < count; i += 1) {
            cy.get(selector, { timeout: 20000 })
                .filter(':visible')
                .eq(i)
                .then(($el) => {
                    const newVal = buildModValue(String($el.val() || '').trim(), maxLen);
                    cy.wrap($el).type(newVal, { delay: 0 });
                });
        }
    });
};
const applyDefaultWordingRadioThenText = (radioSelector: string, textSelector: string, textMaxLen: number): void => {
    cy.get('body').then(($body) => {
        const $radios = $body.find(radioSelector).filter(':visible');
        if ($radios.length === 0) {
            fillTextAreaWithModSuffix(textSelector, textMaxLen, false);
            return;
        }
        const useDefaultWording = Math.random() < 0.5;
        const labelText: 'Yes' | 'No' = useDefaultWording ? 'Yes' : 'No';
        let target: HTMLElement | null = null;
        $radios.each((_, radioEl) => {
            const $label = Cypress.$(radioEl).closest('label, div');
            if ($label.text().trim() === labelText) {
                target = radioEl;
                return false;
            }
            return undefined;
        });
        if (!target) {
            cy.log(`⚠️ Radio labelled "${labelText}" not found for ${radioSelector} — skipping`);
            return;
        }
        cy.wrap(target).click({ force: true });
        cy.log(`✅ Clicked radio "${labelText}" on ${radioSelector}`);
        if (!useDefaultWording) {
            cy.get(textSelector, { timeout: 20000 }).filter(':visible').should('not.be.disabled');
            fillTextAreaWithModSuffix(textSelector, textMaxLen, false);
        }
    });
};
const fillDeductionExtra = (extra: DeductionExtraConfig): void => {
    ensureSmsWordingPanelReady();
    cy.get('body').then(($body) => {
        if ($body.find(extra.numberSelector).filter(':visible').length > 0) {
            cy.get(extra.numberSelector, { timeout: 20000 })
                .filter(':visible')
                
                .type(String(Math.floor(Math.random() * 30) + 1), { delay: 0 });
        }
        const $unit = $body.find(extra.unitSelector).filter(':visible').first();
        if ($unit.length > 0) {
            const $opts = Cypress.$($unit).find('option').not('[disabled]');
            if ($opts.length > 0) {
                const value = String($opts.eq(Math.floor(Math.random() * $opts.length)).val());
                cy.get(extra.unitSelector, { timeout: 20000 }).filter(':visible').select(value, { force: true });
            }
        }
        applyDefaultWordingRadioThenText(extra.radioSelector, extra.textSelector, extra.textMaxLen);
    });
};
const handleFlagField = (config: SmsFlagFieldConfig): void => {
    ensureSmsWordingPanelReady();
    cy.get('body').then(($body) => {
        const $flag = $body.find(config.flagSelector).filter(':visible').first();
        if ($flag.length === 0) {
            if (config.required) {
                cy.get(config.flagSelector, { timeout: 20000 }).should('be.visible');
            }
            else {
                cy.log(`ℹ️ ${config.flagSelector} not present — skipping (optional field)`);
            }
            return;
        }
        const domEl = $flag[0];
        if (!(domEl instanceof HTMLSelectElement)) {
            cy.log(`⚠️ ${config.flagSelector} did not resolve to a select element — skipping`);
            return;
        }
        const options = Array.from(domEl.options);
        const label = randomSendFlag();
        const match = options.find((o) => o.text.trim().toLowerCase() === label.toLowerCase()) ??
            options.find((o) => o.value.trim().toLowerCase() === label.toLowerCase());
        if (!match) {
            cy.log(`⚠️ ${config.flagSelector}: no option matching "${label}" — skipping`);
            return;
        }
        cy.get(config.flagSelector, { timeout: 20000 })
            .filter(':visible')
            .select(match.value, { force: true });
        cy.log(`✅ Selected "${label}" on ${config.flagSelector}`);
        if (label !== 'Send')
            return;
        if (config.deduction) {
            fillDeductionExtra(config.deduction);
            return;
        }
        if (config.textSelector) {
            if (config.radioSelector) {
                applyDefaultWordingRadioThenText(config.radioSelector, config.textSelector, config.textMaxLen ?? 250);
            }
            else {
                fillTextAreaWithModSuffix(config.textSelector, config.textMaxLen ?? 250, false);
            }
        }
    });
};
export const fillSmsWordingSection = (): void => {
    cy.scrollTo('bottom');
    cy.get('body', { timeout: 180000 }).should(($body) => {
        const hasTab = findVisibleSmsWordingTab($body).length > 0;
        const hasField = $body.find(SMS_WORDING_PANEL_PROBE).length > 0;
        expect(hasTab || hasField, 'SMS Wording tab or panel fields should exist in DOM').to.be.true;
    });
    activateSmsWordingTab();
    cy.get('textarea, select', { timeout: 30000 }).should('exist');
    waitForPanelToSettle();
    SMS_PLAIN_TEXT_FIELDS.forEach(({ selector, maxLen, required }) => {
        fillTextAreaWithModSuffix(selector, maxLen, !!required);
    });
    SMS_FLAG_FIELDS.forEach((config) => handleFlagField(config));
    cy.contains('button', 'Save', { timeout: 120000 })
        .should('be.visible')
        .and('not.be.disabled')
        .click();
    closeSuccessModal();
};

// ============ Target Customer ============
export const fillTargetCustomerSection = (): void => {
    cy.get('body').then(($body) => {
        if ($body.find('.loading-curtain').length > 0) {
            cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
        }
    });

    cy.contains('h3.h3-panel-header.text-danger', 'Target Customer', { timeout: 20000 })
        .should('exist')
        .scrollIntoView()
        .closest('.panel')
        .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').then(($select) => {
                const $opts = $select.find('option:not([disabled])');

                if (!$opts.length) {
                    cy.log('ℹ️ [SKIP] ไม่มี option เหลือให้เลือกใน Target Customer (อาจถูกเลือกไว้หมดแล้ว)');
                    return;
                }

                const count = Math.floor(Math.random() * $opts.length) + 1;
                const values = Cypress._.shuffle(
                    [...$opts].map((o) => (o as HTMLOptionElement).value)
                ).slice(0, count);

                cy.wrap($select).select(values, { force: true });

                cy.get('button.atr')
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click({ force: true });

                cy.log(`✅ Target Customer: เลือก ${count} รายการ`);
            });
        });
};

const navigateToDetailTab = (tabLabel: string): void => {
    cy.get('body').then(($body) => {
        const $tab = $body
            .find('app-mass-enh-product-offering-detail-tab ul.nav-tabs a')
            .filter(':visible')
            .filter((_, el) => Cypress.$(el).text().trim().replace(/\s+/g, ' ').includes(tabLabel));

        if (!$tab.length) {
            cy.log(`⚠️ [SKIP] ไม่พบ tab "${tabLabel}" ที่ visible`);
            return;
        }

        cy.wrap($tab.first()).scrollIntoView().click({ force: true });

        cy.get('body').then(($b) => {
            if ($b.find('.loading-curtain').length > 0) {
                cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
            }
        });
    });
};

export const fillPoRelationSection = (): void => {
    navigateToDetailTab('PO Relation');
    // TODO: เติม logic กรอกฟอร์มเมื่อได้ DOM ของ tab นี้
    cy.log('ℹ️ [TODO] fillPoRelationSection: รอ DOM ของ field ใน tab PO Relation');
};

export const fillCommuTouchPointSection = (): void => {
    navigateToDetailTab('Commu Touch Point');
    // TODO: เติม logic กรอกฟอร์มเมื่อได้ DOM ของ tab นี้
    cy.log('ℹ️ [TODO] fillCommuTouchPointSection: รอ DOM ของ field ใน tab Commu Touch Point');
};

export const fillHumanTouchPointSection = (): void => {
    cy.log('ℹ️ [TODO] fillHumanTouchPointSection: ยังไม่มี DOM อ้างอิง');
};

export const fillNonHumanTouchPointSection = (): void => {
    cy.log('ℹ️ [TODO] fillNonHumanTouchPointSection: ยังไม่มี DOM อ้างอิง');
};
const TARGET_CUSTOMER = 'Target Customer';
const PO_RELATION = 'PO Relation';
const COMMU_TOUCH_POINT = 'Commu Touch Point';
const HUMAN_TOUCH_POINT = 'Human Touch Point';
const NON_HUMAN_TOUCH_POINT = 'Non Human Touch Point';

export const MODIFY_SECTION_PAIRS: Record<string, string[]> = {
    [PRODUCT_DEFINITION]: [SMS_WORDING],
    [SMS_WORDING]: [PRODUCT_DEFINITION],
};
export const fillSelectedModifySections = (sections: string[], poIndex: number = 0): void => {
    cy.get('body').then(($body) => {
        const isVisible = (probe: string) => $body.find(probe).filter(':visible').length > 0;

        const shouldFillProdDef = sections.includes(PRODUCT_DEFINITION) ||
            isVisible('input[formcontrolname="productName"]');

        const shouldFillSmsWording = sections.includes(SMS_WORDING) ||
            isVisible('textarea[formcontrolname="shortPromotionName"]');

        // const shouldFillTargetCustomer = sections.includes(TARGET_CUSTOMER) ||
        //     $body.find('h3.h3-panel-header.text-danger:contains("Target Customer")').length > 0;

        // const shouldFillPoRelation = sections.includes(PO_RELATION);
        // const shouldFillCommuTouchPoint = sections.includes(COMMU_TOUCH_POINT);
        // const shouldFillHumanTouchPoint = sections.includes(HUMAN_TOUCH_POINT);
        // const shouldFillNonHumanTouchPoint = sections.includes(NON_HUMAN_TOUCH_POINT);

        // if (
        //     !shouldFillProdDef && !shouldFillSmsWording && !shouldFillTargetCustomer &&
        //     !shouldFillPoRelation && !shouldFillCommuTouchPoint &&
        //     !shouldFillHumanTouchPoint && !shouldFillNonHumanTouchPoint
        // ) {
        //     cy.log('⚠️ No Modify Sections were selected or visible on the page — nothing to fill');
        //     return;
        // }

        cy.log(`📝 Processing sections for PO ${poIndex + 1}: ${sections.join(', ') || '(auto-detected from UI)'}`);

        if (shouldFillProdDef) fillProductDefinitionSection(poIndex);
        // if (shouldFillTargetCustomer) fillTargetCustomerSection();
        if (shouldFillSmsWording) fillSmsWordingSection();
        // if (shouldFillPoRelation) fillPoRelationSection();
        // if (shouldFillCommuTouchPoint) fillCommuTouchPointSection();
        // if (shouldFillHumanTouchPoint) fillHumanTouchPointSection();
        else if (shouldFillProdDef) {
            cy.contains('button', 'Save', { timeout: 120000 })
                .should('be.visible')
                .and('not.be.disabled')
                .click();
            closeSuccessModal();
        }
        // if (shouldFillNonHumanTouchPoint) fillNonHumanTouchPointSection();
    });
};