/// <reference types="cypress" />

const closeSuccessModal = (): void => {
    cy.contains('.modal-title', 'Save Result', { timeout: 600000 })
        .closest('.modal-content')
        .find('.modal-footer button.btn-danger')
        .should('be.visible')
        .and('not.be.disabled')
        .click();

    cy.get('body', { timeout: 15000 }).should(($body) => {
        expect($body.find('.modal-backdrop').length, 'modal-backdrop should be gone').to.eq(0);
        expect($body.find('.modal.show, .modal.in').length, 'modal should be closed').to.eq(0);
    });

    cy.get('body').then(($body) => {
        if ($body.find('.loading-curtain').length > 0) {
            cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
        }
    });
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

export const MODIFY_SECTION_PAIRS: Record<string, string[]> = {
    'Product Definition': ['SMS Wording'],
    'SMS Wording': ['Product Definition'],
};

const PRODUCT_DEFINITION = 'Product Definition';
const SMS_WORDING = 'SMS Wording';

// ✅ selectModifySections - มองทั้งช่องซ้ายและขวา (แก้เคส UI จำค่าจาก PO ก่อนหน้า)
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
        } else if (hasProductDefinition) {
            primarySections = [PRODUCT_DEFINITION];
        } else if (hasSmsWording) {
            primarySections = [SMS_WORDING];
        } else {
            cy.log('⚠️ ไม่พบทั้ง "Product Definition" และ "SMS Wording" ในระบบ — ไม่มี section ให้เลือก');
        }

        const finalSections: string[] = [];
        primarySections.forEach((primary) => {
            if (!finalSections.includes(primary)) finalSections.push(primary);
            const pairs = MODIFY_SECTION_PAIRS[primary] || [];
            pairs.forEach((pair) => {
                if (!finalSections.includes(pair)) finalSections.push(pair);
            });
        });

        const validFinalSections = finalSections.filter(sec => allTexts.includes(sec));
        cy.log(`🎯 Modify Sections expected to be active: ${validFinalSections.join(', ') || '(none)'}`);

        // กดปุ่มย้ายช่อง เฉพาะตัวที่ยังค้างอยู่ในช่อง Available เท่านั้น
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
        } else {
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
                const maxLen = Number($input.attr('maxlength') || 255);

                let newProductName = `${baseName}${modSuffix}`;

                if (newProductName.length > maxLen) {
                    const allowedBaseLen = maxLen - modSuffix.length;
                    const truncatedBase = allowedBaseLen > 0 ? baseName.substring(0, allowedBaseLen) : '';
                    newProductName = `${truncatedBase}${modSuffix}`.substring(0, maxLen);
                }

                cy.wrap($input)
                    .clear()
                    .type(newProductName, { delay: 30 });
                cy.log(`✏️ productName: "${currentName}" → "${newProductName}"`);

                const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
                allPoNames[poIndex] = newProductName;
                Cypress.env('allPoNames', allPoNames);
                cy.log(`🔄 Synced allPoNames[${poIndex}] = "${newProductName}"`);
            });
        }

        // if ($body.find('select[formcontrolname="promotionLevel"]').length > 0) {
        //     cy.get('select[formcontrolname="promotionLevel"] option:not([disabled])').then(($opts) => {
        //         if ($opts.length > 0) {
        //             const randomOpt = $opts[Math.floor(Math.random() * $opts.length)] as HTMLOptionElement;
        //             cy.get('select[formcontrolname="promotionLevel"]').select(randomOpt.value);
        //         }
        //     });
        // }

        if ($body.find('select[formcontrolname="packageDurationUnit"]').length > 0) {
            cy.get('select[formcontrolname="packageDurationUnit"] option:not([disabled])').then(($opts) => {
                if ($opts.length > 0) {
                    const randomOpt = $opts[Math.floor(Math.random() * $opts.length)] as HTMLOptionElement;
                    cy.get('select[formcontrolname="packageDurationUnit"]').select(randomOpt.value);
                }
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
                .clear()
                .type(`modify remark ${generateUniqueId()}`, { delay: 30 });
        }
    });
};

// ============================================================================
// SMS Wording section
//
// Refactored to:
//  1. Describe every field as data (SMS_PLAIN_TEXT_FIELDS / SMS_FLAG_FIELDS)
//     instead of one hand-written block of near-identical code per field.
//  2. Fail the test with a real Cypress error when a `required: true` field
//     is missing, instead of silently skipping it.
//  3. Use native Cypress commands (.select/.type/.click) so Cypress's
//     built-in retry-ability does the waiting, instead of hand-rolled
//     30-iteration retry loops that manually dispatch DOM events.
// ============================================================================

interface SmsTextFieldConfig {
    selector: string;
    maxLen: number;
    /** If true, a missing/invisible field fails the test instead of being skipped. */
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
    /** If true, a missing/invisible flag fails the test instead of being skipped. */
    required?: boolean;
    /** Linked free-text field, filled only when the flag resolves to "Send". */
    textSelector?: string;
    textMaxLen?: number;
    /** Yes/No "use default wording" radio gating the linked text field. */
    radioSelector?: string;
    /** Fields with a numeric deduction + unit dropdown ahead of the radio/text. */
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
        // Flag only — no linked text field.
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
const randomSendFlag = (): SmsSendFlagValue =>
    SMS_SEND_FLAG_VALUES[Math.floor(Math.random() * SMS_SEND_FLAG_VALUES.length)];

const SMS_WORDING_PANEL_PROBE =
    'textarea[formcontrolname="shortPromotionName"], select[formcontrolname="smsGreetingSendFlag"]';

const findVisibleSmsWordingTab = ($body: JQuery<HTMLElement>): JQuery<HTMLElement> =>
    $body
        .find('ul.nav.nav-tabs a, .scrollmenu > .nav a')
        .filter(':visible')
        .filter((_, el) => Cypress.$(el).text().trim().includes('SMS Wording'));

const activateSmsWordingTab = (): void => {
    cy.get('body').then(($body) => {
        const $tab = findVisibleSmsWordingTab($body);
        if ($tab.length > 0) {
            cy.wrap($tab.first()).scrollIntoView().click({ force: true });
        } else {
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
            } else {
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

// Angular occasionally tears the panel down and rebuilds it; re-click the tab
// when that happens instead of relying purely on cy's default retry timeout.
const ensureSmsWordingPanelReady = (): void => {
    cy.get('body').then(($body) => {
        if ($body.find('.loading-curtain').length > 0) {
            cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
        }
    });

    cy.get('body').then(($body) => {
        const panelVisible = $body.find(SMS_WORDING_PANEL_PROBE).filter(':visible').length > 0;
        if (panelVisible) return;

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
    if (!base) base = 'Auto Text';

    let newVal = `${base}${modSuffix}`;
    if (newVal.length > maxLen) {
        const allowedBaseLen = maxLen - modSuffix.length;
        newVal = allowedBaseLen > 0 ? `${base.substring(0, allowedBaseLen)}${modSuffix}` : modSuffix.substring(0, maxLen);
    }
    return newVal;
};

// Fills a single textarea (or all matching instances) with a "<base> MOD <id>" value.
// `required: true` fields fail the test via cy's normal retry+assert if they never appear;
// optional fields are skipped with a log line when genuinely absent from this PO's form.
const fillTextAreaWithModSuffix = (selector: string, maxLen: number, required: boolean): void => {
    ensureSmsWordingPanelReady();

    cy.get('body').then(($body) => {
        const count = $body.find(selector).filter(':visible').length;

        if (count === 0) {
            if (required) {
                cy.get(selector, { timeout: 20000 }).should('be.visible'); // throws a real Cypress failure
            } else {
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
                    cy.wrap($el).clear().type(newVal, { delay: 0 });
                });
        }
    });
};

// Clicks the Yes/No "use default wording" radio (matched by its label text) and, when
// "No" is chosen (or there's no radio at all), fills the linked free-text field.
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
                .clear()
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

// Picks a random Send/Don't Send value for one flag field and, when "Send" is chosen,
// fills whatever is linked to it (plain text, radio-gated text, or a deduction block).
const handleFlagField = (config: SmsFlagFieldConfig): void => {
    ensureSmsWordingPanelReady();

    cy.get('body').then(($body) => {
        const $flag = $body.find(config.flagSelector).filter(':visible').first();

        if ($flag.length === 0) {
            if (config.required) {
                cy.get(config.flagSelector, { timeout: 20000 }).should('be.visible'); // real failure, not a silent skip
            } else {
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
        const match =
            options.find((o) => o.text.trim().toLowerCase() === label.toLowerCase()) ??
            options.find((o) => o.value.trim().toLowerCase() === label.toLowerCase());

        if (!match) {
            cy.log(`⚠️ ${config.flagSelector}: no option matching "${label}" — skipping`);
            return;
        }

        cy.get(config.flagSelector, { timeout: 20000 })
            .filter(':visible')
            .select(match.value, { force: true });
        cy.log(`✅ Selected "${label}" on ${config.flagSelector}`);

        if (label !== 'Send') return;

        if (config.deduction) {
            fillDeductionExtra(config.deduction);
            return;
        }

        if (config.textSelector) {
            if (config.radioSelector) {
                applyDefaultWordingRadioThenText(config.radioSelector, config.textSelector, config.textMaxLen ?? 250);
            } else {
                fillTextAreaWithModSuffix(config.textSelector, config.textMaxLen ?? 250, false);
            }
        }
    });
};

export const fillSmsWordingSection = (): void => {
    cy.scrollTo('bottom');

    // The panel (or at least its tab) must show up somewhere before we go further.
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

// ✅ fillSelectedModifySections - ลบ guard poIndex > 0, เพิ่ม auto-detect panel
export const fillSelectedModifySections = (sections: string[], poIndex: number = 0): void => {
    // ❌ ลบ Guard เดิมที่บังคับให้ทำแค่ PO เดี่ยว (index 0) ออก
    // เดิม: if (poIndex > 0) { cy.log('ข้าม...'); return; }

    cy.get('body').then(($body) => {
        // ✅ FIX: เช็คว่า Panel ของ Section นั้นๆ โผล่ขึ้นมาในหน้าหรือยัง 
        // (กรณี UI จำค่าจาก PO ก่อนหน้า ทำให้ Panel โผล่มาเลยโดยไม่ต้อง select ใหม่)
        const isProdDefVisible = $body.find('h3:contains("Product Offering Definition")').length > 0 ||
            $body.find('input[formcontrolname="productName"]').filter(':visible').length > 0;

        const isSmsWordingVisible = $body.find('textarea[formcontrolname="shortPromotionName"]').filter(':visible').length > 0 ||
            $body.find('h4:contains("SMS Wording")').length > 0 ||
            $body.find('a:contains("SMS Wording")').filter('.active, [style*="background-color"]').length > 0;

        const shouldFillProdDef = sections.includes('Product Definition') || isProdDefVisible;
        const shouldFillSmsWording = sections.includes('SMS Wording') || isSmsWordingVisible;

        if (!shouldFillProdDef && !shouldFillSmsWording) {
            cy.log('⚠️ No Modify Sections were selected or visible on the page — nothing to fill');
            return;
        }

        cy.log(`📝 Processing sections for PO ${poIndex + 1}: ${sections.join(', ') || '(auto-detected from UI)'}`);

        if (shouldFillProdDef) {
            fillProductDefinitionSection(poIndex);
        }
        if (shouldFillSmsWording) {
            fillSmsWordingSection();
        }
    });
};