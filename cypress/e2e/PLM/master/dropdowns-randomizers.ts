import { scrollAndWait } from './helpers';

const closeSuccessModal = (): void => {
    cy.contains('.modal-title', 'Save Result', { timeout: 600000 })
        .closest('.modal-content')
        .find('.modal-footer button.btn-danger')
        .should('be.visible')
        .and('not.be.disabled')
        .click();
};
// =============================
// Helper: format Date → dd/mm/yyyy
// =============================
const formatDate = (d: Date): string =>
    `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

// =============================
// Helper: parse dd/mm/yyyy → Date
// =============================
const parseDate = (val: string): Date | null => {
    if (!val || val.trim() === '') return null;
    const parts = val.trim().split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return d;
};

// =============================
// Helper: random Date ระหว่าง min และ max (inclusive)
// =============================
const randomDateBetween = (min: Date, max: Date): Date | null => {
    if (min.getTime() > max.getTime()) return null;
    const ms = min.getTime() + Math.random() * (max.getTime() - min.getTime());
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d;
};

// =============================
// Helper: type date ลง my-date-picker
// =============================
const typeDatePicker = (formcontrolname: string, date: Date) => {
    const formatted = formatDate(date);
    cy.get(`my-date-picker[formcontrolname="${formcontrolname}"] input[aria-label="Date input field"]`)
        .click()
        .clear()
        .type(formatted, { delay: 30 });
    cy.get(`my-date-picker[formcontrolname="${formcontrolname}"] input[aria-label="Date input field"]`)
        .should('have.value', formatted);
};

// =============================
// Helper: อ่านค่าจาก my-date-picker (ทั้ง disabled และ enabled)
// =============================
const readDatePicker = (formcontrolname: string): Cypress.Chainable<Date | null> => {
    return cy
        .get(`my-date-picker[formcontrolname="${formcontrolname}"] input[aria-label="Date input field"]`)
        .invoke('val')
        .then((val) => {
            const parsed = parseDate(val as string);
            if (!parsed) {
                cy.log(`⚠️ ${formcontrolname}: อ่านค่าไม่ได้ (val="${val}")`);
            } else {
                cy.log(`📅 ${formcontrolname}: ${formatDate(parsed)}`);
            }

            // ✅ ใช้ cy.wrap() เพื่อ return ค่าแบบ Async
            return cy.wrap(parsed);
        });
};

// =============================
// Main: Random Fixed Start Date / Fixed End Date
// =============================
export const RandomFixedDates = () => {

    cy.log('🚀 START RandomFixedDates');

    return readDatePicker('commercialLaunchDate').then((cldDate) => {
        cy.log(`✅ ได้ commercialLaunchDate: ${cldDate ? formatDate(cldDate) : 'null'}`);

        return readDatePicker('expireDate').then((expDate) => {
            cy.log(`✅ ได้ expireDate: ${expDate ? formatDate(expDate) : 'null'}`);

            const cld = cldDate ?? new Date();
            const exp = expDate ?? new Date(cld.getTime() + 365 * 86400000);

            cy.log(`📌 ช่วงที่ใช้คำนวณ: ${formatDate(cld)} → ${formatDate(exp)}`);

            return cy.get('body').then(($body) => {
                const hasFixedStart = $body.find('my-date-picker[formcontrolname="fixedStartDate"]').length > 0;
                const hasFixedEnd = $body.find('my-date-picker[formcontrolname="fixedEndDate"]').length > 0;

                cy.log(`🔍 hasFixedStart=${hasFixedStart}, hasFixedEnd=${hasFixedEnd}`);

                // =============================
                // Step 2: Fixed Start Date — 50/50
                // =============================
                if (!hasFixedStart) {
                    cy.log('⏭️ Skipped: fixedStartDate not found');
                    if (hasFixedEnd) {
                        cy.log('⏭️ fixedEndDate: ข้าม เพราะ fixedStartDate ไม่มีใน DOM');
                    }
                    return cy.wrap(null);
                }

                if (Math.random() >= 0.5) {
                    cy.log('🎲 fixedStartDate: ข้าม (50% chance)');
                    if (hasFixedEnd) {
                        cy.log('⏭️ fixedEndDate: ข้าม เพราะ fixedStartDate ไม่ได้ถูก set');
                    }
                    return cy.wrap(null);
                }

                const pickedStart = randomDateBetween(cld, exp);
                if (!pickedStart) {
                    cy.log(`⚠️ fixedStartDate: ช่วงไม่ valid (${formatDate(cld)} → ${formatDate(exp)}) — ข้าม`);
                    if (hasFixedEnd) {
                        cy.log('⏭️ fixedEndDate: ข้าม เพราะ fixedStartDate set ไม่ได้');
                    }
                    return cy.wrap(null);
                }

                cy.log(`🎲 fixedStartDate: ${formatDate(pickedStart)} (ช่วง ${formatDate(cld)} → ${formatDate(exp)})`);
                typeDatePicker('fixedStartDate', pickedStart);

                // =============================
                // Step 3: Fixed End Date — บังคับกรอกเสมอถ้า Start ถูกกรอก
                // ⚠️ ห้าม End < Start
                // =============================
                if (!hasFixedEnd) {
                    cy.log('⚠️ fixedEndDate: ไม่พบ element แต่ fixedStartDate ถูกกรอกแล้ว — อาจทำให้ฟอร์ม invalid');
                    return cy.wrap(null);
                }

                // ไม่มี 50/50 อีกต่อไป เพราะ Start ถูกกรอกแล้วจึงต้องกรอก End ด้วยเสมอ
                const pickedEnd = randomDateBetween(pickedStart, exp);

                if (!pickedEnd) {
                    // ถ้าสุ่มไม่ได้ (เช่น pickedStart >= exp พอดี) ให้ fallback เป็น pickedStart เอง
                    // เพื่อการันตีว่า End >= Start เสมอ และฟอร์มยังคง valid
                    cy.log(`⚠️ fixedEndDate: ช่วงไม่ valid (${formatDate(pickedStart)} → ${formatDate(exp)}) — ใช้ fallback = fixedStartDate`);
                    typeDatePicker('fixedEndDate', pickedStart);
                    cy.log(`🎲 fixedEndDate (fallback): ${formatDate(pickedStart)}`);
                } else {
                    // การันตีอีกชั้นว่า pickedEnd >= pickedStart (กันกรณี randomDateBetween มีบั๊ก)
                    const safeEnd = pickedEnd.getTime() < pickedStart.getTime() ? pickedStart : pickedEnd;

                    cy.log(`🎲 fixedEndDate: ${formatDate(safeEnd)} (ช่วง fixedStart (${formatDate(pickedStart)}) → ${formatDate(exp)})`);
                    typeDatePicker('fixedEndDate', safeEnd);
                }

                cy.log('🏁 END RandomFixedDates');
                return cy.wrap(null);
            });
        });
    });
};
// ========================
// RANDOM DROPDOWN PRE-PAID ONTOP/MAIN
// ========================
const maybeRandomSelect = (
    selector: string,
    filterFn: (val: string) => boolean = () => true
) => {
    cy.get('body').then(($body) => {
        if ($body.find(selector).length === 0) {
            cy.log(`⏭️ Skipped: ${selector} not found`);
            return;
        }

        const $el = $body.find(selector);
        if (!$el.is(':visible')) {
            cy.log(`⏭️ Skipped: ${selector} not visible`);
            return;
        }

        cy.get(selector).then(($select) => {
            const currentValue = ($select[0] as HTMLSelectElement).value;
            const allOptions = [...$select.find('option')]
                .map((o) => (o as HTMLOptionElement).value)
                .filter(filterFn);

            if (allOptions.length === 0) {
                cy.log(`⏭️ Skipped: ${selector} has no valid options`);
                return;
            }

            const shouldAct = Math.random() < 0.5;
            if (!shouldAct) {
                cy.log(`🎲 ${selector}: ข้าม (50% chance)`);
                return;
            }

            const hasCurrentValue =
                currentValue !== '' &&
                currentValue !== '0: null' &&
                allOptions.includes(currentValue);

            let pool = hasCurrentValue
                ? allOptions.filter((v) => v !== currentValue) // ต้องต่างจากค่าเดิม
                : allOptions;

            if (pool.length === 0) {
                cy.log(`⏭️ Skipped: ${selector} ไม่มี option อื่นให้เลือก`);
                return;
            }

            const picked = pool[Math.floor(Math.random() * pool.length)];
            cy.log(
                `🎲 ${selector}: ${hasCurrentValue ? 'เปลี่ยนจาก' : 'เลือก'} → "${picked}"`
            );
            cy.get(selector).select(picked, { force: true });
        });
    });
};

export const Randomdropdown = () => {
    // =============================
    // On Top Condition Group (ไม่ required)
    // =============================
    maybeRandomSelect('select[formcontrolname="ontopConditionGroup"]', (v) => v !== '0: null');

    // =============================
    // Bill Period (required แต่อยู่ใน original — คงไว้ตามเดิม ไม่ใช้ logic ใหม่)
    // =============================
    cy.get('body').then(($body) => {
        const selector = 'select[formcontrolname="billPeriod"]';
        if ($body.find(selector).length > 0) {
            cy.get(selector)
                .find('option:not([disabled])')
                .then(($options) => {
                    const validOptions = [...$options].map((o) => (o as HTMLOptionElement).value);
                    const randomIndex = Math.floor(Math.random() * validOptions.length);
                    cy.log(`🎲 Bill Period: ${validOptions[randomIndex]}`);
                    cy.get(selector).select(validOptions[randomIndex], { force: true });
                });
        } else {
            cy.log(`⏭️ Skipped: ${selector} not found`);
        }
    });

    // =============================
    // Money / Validity (คงไว้ตามเดิม — มี logic ซับซ้อนของตัวเอง)
    // =============================
    cy.get('body').then(($body) => {
        const tabSelector = 'a:contains("Money / Validity")';
        if ($body.find(tabSelector).length > 0) {
            cy.get(tabSelector).click();

            cy.get('button .glyphicon-plus').parent().click();

            const randomBalance1 = Math.floor(Math.random() * 1000) + 100;
            cy.get('input[formcontrolname="balanceFirstPocket"]').type(randomBalance1.toString());

            cy.get('input[formcontrolname="validityFirstPocket"]').type(
                (Math.floor(Math.random() * 30) + 1).toString()
            );

            cy.get('select[formcontrolname="validityFirstPocketUnit"]').then(($select) => {
                const options = $select.find('option:not([disabled])');
                const randomIndex = Math.floor(Math.random() * options.length);
                cy.wrap($select).select((options[randomIndex] as HTMLOptionElement).value);
            });

            const randomBalance2 = Math.floor(Math.random() * 500) + 50;
            cy.get('input[formcontrolname="balanceSecondPocket"]').type(randomBalance2.toString());

            cy.get('input[formcontrolname="validitySecondPocket"]').type(
                (Math.floor(Math.random() * 30) + 1).toString()
            );

            cy.get('select[formcontrolname="validitySecondPocketUnit"]').then(($select) => {
                const options = $select.find('option:not([disabled])');
                const randomIndex = Math.floor(Math.random() * options.length);
                cy.wrap($select).select((options[randomIndex] as HTMLOptionElement).value);
            });

            cy.get('select[formcontrolname="availableListBox"]').then(($select) => {
                const options = $select.find('option');
                if (options.length > 0) {
                    const randomIndex = Math.floor(Math.random() * options.length);
                    const val = (options[randomIndex] as HTMLOptionElement).value;
                    cy.get('select[formcontrolname="availableListBox"]').select(val);
                    cy.get('button.str').click();
                }
            });

            const randomDesc = `AutoTest_${Math.random().toString(36).substring(7)}`;
            cy.get('textarea[formcontrolname="balanceDescription"]').type(randomDesc);

            cy.get('button').contains('Add').click();
        } else {
            cy.log('Skipped: Tab Money / Validity not found');
        }
    });

    // =============================
    // Package Data Type (ไม่ required)
    // =============================
    maybeRandomSelect('select[formcontrolname="packageDataType"]', (v) => v !== '0: null');

    // =============================
    // Recurring Fee Deduction (required แต่อยู่ใน original — คงไว้ตามเดิม)
    // =============================
    cy.get('body').then(($body) => {
        const selector = 'select[formcontrolname="recurringFeeDeduction"]';
        const $element = $body.find(selector);
        if ($element.length > 0 && $element.is(':visible')) {
            cy.get(selector)
                .find('option:not([disabled])')
                .then(($options) => {
                    const randomIndex = Math.floor(Math.random() * $options.length);
                    cy.get(selector).select(($options[randomIndex] as HTMLOptionElement).value);
                });
        } else {
            cy.log(`Skipped: ${selector} is not visible or not found`);
        }
    });

    // =============================
    // Early Renew Offering Flag (ไม่ required)
    // =============================
    maybeRandomSelect('select[formcontrolname="earlyRenewOfferingFlag"]', (v) => v !== '0: null');

    // =============================
    // PO Type (ไม่ required)
    // =============================
    maybeRandomSelect('select[formcontrolname="poType"]', (v) => v !== '0: null');

    // =============================
    // Group Package (ไม่ required)
    // =============================
    maybeRandomSelect('select[formcontrolname="groupPackage"]', (v) => v !== '0: null');

    // =============================
    // Promotion Group (ไม่ required)
    // =============================
    maybeRandomSelect('select[formcontrolname="promotionGroup"]', (v) => v !== '0: null');

    // =============================
    // Promotion Sub Group (ไม่ required)
    // =============================
    maybeRandomSelect('select[formcontrolname="promotionSubGroup"]', (v) => v !== '0: null');
};
// ========================
// HELPER: normalize whitespace
// ========================
const normalizeText = (t: string) => t.replace(/\s+/g, ' ').trim();

// ========================
// INTERNAL: FIND mat-select BY LABEL (รองรับ * นำหน้า, : ท้าย, whitespace)
// ========================
const findMatSelectByLabel = (
    $body: JQuery<HTMLElement>,
    fieldLabel: string
): JQuery<HTMLElement> | null => {
    const allLabels = $body.find('label');
    let foundSelect: JQuery<HTMLElement> | null = null;

    allLabels.each((_, el) => {
        const labelText = normalizeText(Cypress.$(el).text())
            .replace(/^\*/, '')
            .replace(/:$/, '')
            .trim();

        if (labelText === fieldLabel) {
            const $row = Cypress.$(el).closest('.row, .form-group');
            const $select = $row.find('mat-select');
            if ($select.length > 0) {
                foundSelect = $select;
                return false; // break
            }
        }
    });

    return foundSelect;
};

// ========================
// INTERNAL: SELECT RANDOM OPTION FROM ALREADY-OPEN DROPDOWN
// ========================
const selectRandomOption = (
    $select: JQuery<HTMLElement>,
    fieldLabel: string,
    currentValueToAvoid?: string
): void => {
    cy.get('body').then(($body) => {
        const panelOpen = $body.find('.cdk-overlay-container mat-option').length > 0;

        if (!panelOpen) {
            cy.log(`⚠️ "${fieldLabel}" panel did not open — skipping`);
            return;
        }

        // กรอง disabled (search box wrapper) ออกด้วย :not([aria-disabled="true"])
        cy.get('.cdk-overlay-container mat-option:not([aria-disabled="true"])')
            .should('have.length.greaterThan', 0)
            .then(($options) => {
                const validOptions = $options.filter((_, el) => {
                    const text = normalizeText(Cypress.$(el).text());
                    return (
                        text !== 'Please Select' &&
                        text !== '' &&
                        (currentValueToAvoid == null ||
                            text !== normalizeText(currentValueToAvoid))
                    );
                });

                if (validOptions.length === 0) {
                    cy.log(`⚠️ No alternative options for "${fieldLabel}" — keeping current value`);
                    cy.get('body').click(0, 0, { force: true });
                    return;
                }

                const randomIndex = Math.floor(Math.random() * validOptions.length);
                const $chosen = validOptions.eq(randomIndex);
                const selectedText = normalizeText($chosen.text());

                cy.log(`🎲 "${fieldLabel}" → selecting: "${selectedText}"`);
                cy.wrap($chosen).click({ force: true });

                // verify ด้วย normalized text
                cy.wrap($select)
                    .find('.mat-select-value-text span')
                    .invoke('text')
                    .then((val) => {
                        expect(normalizeText(val)).to.equal(selectedText);
                    });
            });
    });
};

// ========================
// INTERNAL: HANDLE A SINGLE DROPDOWN FIELD
// ========================
const handleDropdownField = (fieldLabel: string): void => {
    cy.get('body').then(($body) => {
        if ($body.find('.cdk-overlay-container mat-option').length > 0) {
            cy.get('body').click(0, 0, { force: true });
        }
    });

    cy.get('body').then(($body) => {
        const $select = findMatSelectByLabel($body, fieldLabel);

        if (!$select || $select.length === 0) {
            cy.log(`❌ "${fieldLabel}" not found on screen — skipping`);
            return;
        }

        const isPlaceholder = $select.find('.mat-select-placeholder').length > 0;
        const currentText = normalizeText($select.find('.mat-select-value-text').text());
        const isEmpty = isPlaceholder || currentText === '' || currentText === 'Please Select';

        // ✅ ใช้ id หรือ ng-tns class เพื่อ re-query ใหม่แทน cy.wrap($select)
        const selectId = $select.attr('id');

        if (isEmpty) {
            cy.log(`📭 "${fieldLabel}" is empty → picking a new value`);
            // ✅ re-query จาก DOM ใหม่ แล้ว click ที่ .mat-select-trigger
            cy.get(`#${selectId} .mat-select-trigger`).click({ force: true });
            cy.wait(300);
            // ✅ re-query $select ใหม่สำหรับ verify
            cy.get(`#${selectId}`).then(($freshSelect) => {
                selectRandomOption($freshSelect, fieldLabel);
            });
        } else {
            const shouldChange = Math.random() < 0.5;
            cy.log(
                `🔍 "${fieldLabel}" = "${currentText}" → ${shouldChange ? 'changing' : 'keeping'}`
            );
            if (shouldChange) {
                cy.get(`#${selectId} .mat-select-trigger`).click({ force: true });
                cy.wait(300);
                cy.get(`#${selectId}`).then(($freshSelect) => {
                    selectRandomOption($freshSelect, fieldLabel, currentText);
                });
            }
        }
    });
};

// ========================
// INTERNAL: MAIN LOGIC
// ========================
const handleRecurringDropdowns = (): void => {
    handleDropdownField('Recurring Promotion / Service Group');
    handleDropdownField('Recurring Fee Item');
};

// ========================
// EXPORTS
// ========================
export const dropdownRecurringCKS = (): void => handleRecurringDropdowns();

export const dropdownRecurringCKSMain = (): void => handleRecurringDropdowns();

export const dropdownRecurringPreMainCKS = (): void => handleRecurringDropdowns();
// ========================
// UNREGISTER
// ========================

export const unregister = (): void => {
    cy.get('body').then(($body) => {
        if ($body.text().includes('UnRegister (Hold)')) {
            cy.contains('label', 'UnRegister (Hold)')
                .closest('.form-group')
                .find('input[type="radio"]')
                .then(($radios) => {
                    const randomIndex = Math.floor(Math.random() * $radios.length);
                    cy.wrap($radios[randomIndex]).check({ force: true });
                    const selectedText = $radios[randomIndex].parentElement!.innerText.trim();
                    cy.log(`Randomly selected: ${selectedText}`);
                });
        } else {
            cy.log('UnRegister (Hold) not found, skipping...');
        }
    });
};

// ========================
// ADD AUTO 5G CKS
// ========================

export const addauto5gCKS = (): void => {
    const values = ['1: Y', '2: X', '3: N'];
    const randomValue = values[Math.floor(Math.random() * values.length)];
    const selector = 'select[formcontrolname="autoAddService5g"]';

    cy.get('body').then(($body) => {
        if ($body.find(selector).length > 0) {
            cy.get(selector)
                .select(randomValue, { force: true })
                .should('have.value', randomValue);
            cy.log(`✅ autoAddService5g selected: ${randomValue}`);
        } else {
            cy.log('ℹ️ autoAddService5g not found — skipping');
        }
    });
};

// ========================
// DIY FLAG CKS
// ========================

export const diyflagCKS = (): void => {
    const isDiyYes = Math.random() < 0.5;
    const diyLabelToClick = isDiyYes ? 'Yes' : 'No';

    cy.log(`DIY Flag Decision: ${diyLabelToClick}`);
    cy.get('input[formcontrolname="diyFlag"]')
        .parent('label')
        .contains(diyLabelToClick)
        .click({ force: true });

    if (!isDiyYes) {
        cy.log('DIY Flag is No. Stopping execution.');
        return;
    }

    const isValidityYes = Math.random() < 0.5;
    const validityLabelToClick = isValidityYes ? 'Yes' : 'No';

    cy.log(`Validity Flag Decision: ${validityLabelToClick}`);

    cy.get('input[formcontrolname="validityFlag"]')
        .parent('label')
        .contains(validityLabelToClick)
        .click({ force: true });

    if (!isValidityYes) {
        cy.log('Validity Flag is No. Stopping execution.');
        return;
    }

    const isCBS = Math.random() < 0.5;
    const rewardLabel = isCBS ? 'CBS' : 'PlugIN/PHX';

    cy.log(`Reward Via Decision: ${rewardLabel}`);

    cy.get('input[formcontrolname="rewardVia"]')
        .parent('label')
        .contains(rewardLabel)
        .click({ force: true });

    cy.get('mat-select[formcontrolname="validityPackage"]')
        .filter(':visible')
        .as('activeDropdown')
        .click();

    cy.get('mat-option:not(.mat-option-disabled)')
        .should('have.length.gt', 0)
        .then(($options) => {
            const optionCount = $options.length;
            const randomIndex = Math.floor(Math.random() * optionCount);

            const selectedText = $options.eq(randomIndex).text().trim();
            cy.log(`Expecting to select: ${selectedText}`);

            cy.wrap($options)
                .eq(randomIndex)
                .scrollIntoView()
                .click({ force: true });

            cy.get('@activeDropdown')
                .find('.mat-select-value')
                .should('contain.text', selectedText);
        });
};

// ========================
// TARIFF
// ========================

export const Tariff = (): void => {
    cy.get('.scrollmenu > .nav').contains('Tariff Plan & Discount').scrollIntoView().should('be.visible').click();
    cy.contains('.panel-heading', 'Tariff Plan')
        .scrollIntoView()
        .should('be.visible');

    cy.contains('label', '*Tariff Plan :')
        .closest('.col-md-12')
        .find('mat-select .mat-select-trigger')
        .should('be.visible')
        .click({ force: true });

    cy.get('.cdk-overlay-container .mat-select-panel mat-option', { timeout: 10000 })
        .should('have.length.greaterThan', 0)
        .then(($options) => {
            const totalOptions = $options.length;
            const firstOptionText = $options.eq(0).text().trim();
            const startIndex = (firstOptionText === 'Please Select') ? 1 : 0;
            const randomIndex = Math.floor(Math.random() * (totalOptions - startIndex)) + startIndex;
            const selectedTariffName = $options.eq(randomIndex).text().trim();
            cy.log(`✨ ระบบสุ่มเลือกแพ็กเกจ: ${selectedTariffName}`);
            cy.wrap($options[randomIndex]).click({ force: true });

            cy.contains('label', '*Tariff Plan :')
                .closest('.col-md-12')
                .find('mat-select .mat-select-value')
                .should('contain.text', selectedTariffName);
        });

    cy.contains('button', 'Generate Discount')
        .should('be.visible')
        .click();

    cy.get('select[formcontrolname="actualUsageVoice"]').should('be.visible').select(1);
    cy.get('select[formcontrolname="billPresentment"]').should('be.visible').select(1);

    cy.contains('button', 'Save')
        .should('be.visible')
        .and('not.be.disabled')
        .click();

    closeSuccessModal();
};
// ========================
// PRICE EXCLUDING
// ========================
export const PriceExcluding = (): void => {
    cy.contains('th', 'Charge Excluding VAT')
        .closest('.col-md-8')
        .find('.btn-primary')
        .click();

    function getRandomRealisticCharge(min = 10, max = 2000): string {
        const realisticPrices = [
            15, 19, 25, 29, 35, 39, 45, 49, 55, 59, 69, 79, 89, 99,
            129, 149, 159, 199, 249, 259, 299, 349, 399,
            449, 499, 549, 599, 699, 799, 899, 999,
            1099, 1199, 1299, 1399, 1499, 1599, 1999
        ];
        const validPrices = realisticPrices.filter(p => p >= min && p <= max);
        const price = validPrices.length > 0
            ? validPrices[Math.floor(Math.random() * validPrices.length)]
            : Math.floor(Math.random() * (max - min) + min); // fallback ถ้าไม่มีในช่วง
        return price.toFixed(2);
    }

    const randomCharge = getRandomRealisticCharge();

    cy.get('input[formcontrolname="chargeExcVat"]')
        .clear()
        .type(randomCharge)
        .should('have.value', randomCharge);

    cy.get('.col-md-6 > .btn').click();
};
// ========================
// PRICE EXCLUDING
// ========================
export const RandomMultiDuration = (): void => {
    function getRandomRealisticCharge(min = 100, max = 2000): string {
        const realisticPrices = [
            129, 149, 159, 199, 249, 259, 299, 349, 399,
            449, 499, 549, 599, 699, 799, 899, 999,
            1099, 1199, 1299, 1399, 1499, 1599, 1999
        ];
        const validPrices = realisticPrices.filter(p => p >= min && p <= max);
        const price = validPrices.length > 0
            ? validPrices[Math.floor(Math.random() * validPrices.length)]
            : Math.floor(Math.random() * (max - min) + min);
        return price.toFixed(2);
    }

    cy.contains('label.text-danger.pull-right', 'Multi Duration')
        .closest('.form-group')
        .within(() => {
            cy.contains('label.radio-inline', 'Yes')
                .find('input[formcontrolname="multiDurationFlag"]')
                .check({ force: true });
        });

    cy.get('input[formcontrolname="packageDuration"]')
        .invoke('val')
        .then((val) => {
            const packageDuration = parseInt((val || '0').toString(), 10);
            cy.log(`📦 Package Duration: ${packageDuration}`);

            if (!packageDuration || packageDuration <= 0) {
                cy.log('⚠️ Package Duration ไม่พบหรือเป็น 0 — skip MultiDuration');
                return;
            }

            const maxRows = Math.min(5, packageDuration);
            const rowCount = Math.max(2, Math.floor(Math.random() * maxRows) + 1);
            cy.log(`🎲 Multi Duration: randomly creating ${rowCount} row(s)`);

            const step = Math.max(1, Math.floor(packageDuration / rowCount));
            let currentFrom = 1;

            for (let row = 0; row < rowCount; row++) {
                cy.log(`📦 Multi Duration row ${row + 1}/${rowCount}`);

                // ✅ กด + ทุก row รวม row แรก เพราะ form ไม่ได้เปิดอัตโนมัติ
                cy.get('.col-md-8.col-md-offset-2 > .btn-primary').click();

                const fromValue = Math.min(currentFrom, packageDuration);
                cy.log(`   durationFrom: ${fromValue}`);

                cy.get('input[formcontrolname="durationFrom"]')
                    .should('be.visible')
                    .clear()
                    .type(fromValue.toString())
                    .trigger('input')
                    .trigger('change')
                    .should('have.value', fromValue.toString());

                cy.get('input[formcontrolname="durationTo"]').then($el => {
                    if ($el.prop('disabled')) {
                        cy.log('🔒 POST path — durationTo disabled (auto-calculated)');
                    } else {
                        cy.log('ℹ️ PRE path — durationTo enabled, skipping input');
                    }
                });

                const randomChargeExc = getRandomRealisticCharge();
                const randomChargeInc = (parseFloat(randomChargeExc) * 1.07).toFixed(2);
                cy.log(`   chargeExcVat: ${randomChargeExc}, chargeIncVat: ${randomChargeInc}`);

                cy.get('input[formcontrolname="chargeExcVat"]')
                    .should('be.visible')
                    .clear()
                    .type(randomChargeExc)
                    .trigger('input')
                    .trigger('change')
                    .should('have.value', randomChargeExc);

                cy.get('input[formcontrolname="chargeIncVat"]')
                    .should('be.visible')
                    .clear()
                    .type(randomChargeInc)
                    .trigger('input')
                    .trigger('change')
                    .should('have.value', randomChargeInc);

                cy.contains('button', 'Add').click();

                currentFrom = Math.min(currentFrom + step, packageDuration);
            }

            cy.get('body').then($body => {
                const hasRowCountAlert = $body
                    .find('.alert-danger label')
                    .toArray()
                    .some(el => el.textContent?.includes('must have more than one row'));

                if (hasRowCountAlert) {
                    cy.log('⚠️ Row count validation message still present after adding rows');
                } else {
                    cy.log('✅ Multi Duration row count requirement satisfied');
                }
            });
        });
};
// ========================
// SELECT TARGET GROUP
// ========================

export const selectTargetGroup = (type:
    'mass' | 'massDisabled' | 'massStudents' | 'save' | 'fmc' |
    'specialCondition' | 'cvm' | 'staff' | 'test' | 'netGift' |
    'nbtc' | 'dummy' | 'traveller' | 'fbb' | 'random'
): void => {
    const targetGroupMap = {
        mass: '1: Mass',
        massDisabled: '2: Mass Disabled',
        massStudents: '3: Mass Students',
        save: '4: Save (Save Team, Save Port out)',
        fmc: '5: FMC',
        specialCondition: '6: Special Condition',
        cvm: '7: CVM',
        staff: '8: Staff',
        test: '9: Test',
        netGift: '10: Net Gift',
        nbtc: '11: NBTC',
        dummy: '12: Dummy',
        traveller: '13: Traveller',
        fbb: '14: FBB'
    };

    let value: string;

    if (type === 'random') {
        const availableTypes = Object.keys(targetGroupMap).filter(
            key => key !== 'netGift' && key !== 'traveller' && key !== 'fbb'
        ) as Array<keyof typeof targetGroupMap>;

        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        value = targetGroupMap[randomType];
    } else {
        value = targetGroupMap[type as keyof typeof targetGroupMap];
    }

    cy.get('select[formcontrolname="targetGroup"]')
        .select(value)
        .should('have.value', value);
};

// ========================
// DROPDOWN PROMOTION GROUP
// ========================

export const dropdownPromotionGroup = (): void => {
    cy.get('select[formcontrolname="groupPackage"]').then($select => {
        const options = $select.find('option:not([value="0: null"])');
        if (options.length > 0) {
            const randomIndex = Math.floor(Math.random() * options.length);
            const selectedValue = Cypress.$(options[randomIndex]).prop('value');
            const selectedText = Cypress.$(options[randomIndex]).text().trim();
            cy.log(`Selected Group Package: ${selectedText}`);
            cy.wrap($select).select(selectedValue);
            cy.wrap($select).should('have.value', selectedValue);
        }
    });

    cy.get('select[formcontrolname="promotionGroup"]')
        .find('option')
        .then(($options) => {
            const options = [...$options];
            const validOptions = options.filter(option => option.value !== '0: null');
            const randomIndex = Math.floor(Math.random() * validOptions.length);
            const valueToSelect = validOptions[randomIndex].value;
            cy.get('select[formcontrolname="promotionGroup"]').select(valueToSelect);
        });

    // Wait for promotionGroup to propagate to subGroup
    cy.get('select[formcontrolname="promotionSubGroup"]', { timeout: 5000 }).should('exist');

    cy.get('select[formcontrolname="promotionSubGroup"]').each(($select: JQuery<HTMLElement>) => {
        const options = $select.find('option').toArray() as HTMLOptionElement[];
        const validOptions = options.filter((opt) => opt.value !== '0: null');
        if (validOptions.length > 0) {
            const randomOption = Cypress._.sample(validOptions);
            if (randomOption) {
                cy.wrap($select).select(randomOption.value);
                cy.log(`Selected: ${randomOption.text.trim()}`);
            }
        } else {
            cy.log('Skipped a dropdown because it had no valid options');
        }
    });
};

// ========================
// TARGET GROUP (DUAL LIST)
// ========================

export const targetgroup = (): void => {
    const optionsToSelect = [
        'Change Charge Type (Convert)',
        'Existing',
        'New',
        'Port In (Mobile Number Port)',
        'Renew / Recall from Terminate'
    ];

    const randomOption = optionsToSelect[Math.floor(Math.random() * optionsToSelect.length)];

    cy.get('select[formcontrolname="availableListBox"]')
        .should('exist')
        .and('be.visible');

    cy.get('select[formcontrolname="availableListBox"]')
        .contains('option', randomOption)
        .should('exist')
        .and('be.visible')
        .then($option => {
            cy.wrap($option).dblclick({ force: true });
        });
};

// ========================
// RETRY PATTERN
// ========================

export const RetryPattern = (): void => {
    cy.get('.scrollmenu > .nav')
        .contains('Retry Pattern')
        .scrollIntoView()
        .should('be.visible')
        .click();

    cy.get('select[formcontrolname="actionWhenRetryReachMaxPeriod"]')
        .should(($select) => {
            const options = $select.find('option');
            expect(options.length).to.be.greaterThan(1);
        })
        .find('option:not(:disabled)')
        .then(($options) => {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const randomValue = ($options[randomIndex] as HTMLOptionElement).value;

            cy.get('select[formcontrolname="actionWhenRetryReachMaxPeriod"]')
                .select(randomValue);

            cy.log(`Randomly selected: ${randomValue}`);

            if (randomValue.includes('Change to Other Main Promotion')) {
                cy.contains('label', 'Change to Other Main Promotion Details')
                    .parent()
                    .next()
                    .find('mat-select')
                    .click();

                cy.get('mat-option')
                    .should('be.visible')
                    .then(($matOptions) => {
                        const matRandomIndex = Math.floor(Math.random() * $matOptions.length);
                        cy.wrap($matOptions[matRandomIndex]).click({ force: true });
                        cy.log('Randomly selected sub-promotion');
                    });
            }
        });
};

// ========================
// Top up
// ========================
export const Topup = (): void => {
    cy.get('body').then(($body) => {
        // ✅ ระดับ 2: เช็คว่ามี select "topupPlanType" ไหม
        if ($body.find('select[formcontrolname="topupPlanType"]').length > 0) {
            cy.get('select[formcontrolname="topupPlanType"]').then(($select) => {
                const selectedValue = $select.val() as string;
                const hasValue =
                    selectedValue &&
                    selectedValue !== '' &&
                    !$select.find(`option[value="${selectedValue}"]`).is('[disabled]');

                if (!hasValue) {
                    const options = [
                        '1: 30:60 Topup Plan',
                        '2: No Topup Plan',
                        '3: Other Topup Plan'
                    ];
                    const randomValue = options[Math.floor(Math.random() * options.length)];
                    cy.get('select[formcontrolname="topupPlanType"]').select(randomValue);
                    cy.log(`Selected random Top up Plan Type: "${randomValue}"`);
                } else {
                    cy.log(`Top up Plan Type already has value: "${selectedValue}"`);
                }
            });
        } else {
            cy.log('No "topupPlanType" select found, skipping...');
        }
    });
};

export const ClickTopupTab = (): void => {
    cy.get('.nav.nav-tabs').then(($nav) => {
        const $topupTab = $nav.find('a').filter((_, el) => {
            return Cypress.$(el).text().trim() === 'Top up';
        });
        if ($topupTab.length > 0) {
            cy.log('Found "Top up" tab, clicking it...');
            cy.wrap($topupTab)
                .scrollIntoView()
                .should('be.visible')
                .click();
            cy.wait(500);
            Topup(); // → เช็คต่ออีกชั้นใน Topup()
        } else {
            cy.log('No "Top up" tab found, skipping...');
        }
    });
};