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
                // Step 2: Fixed Start Date — กรอกเสมอ (ตัดการสุ่ม 50% ออกแล้ว)
                // =============================
                if (!hasFixedStart) {
                    cy.log('⏭️ Skipped: fixedStartDate not found');
                    if (hasFixedEnd) {
                        cy.log('⏭️ fixedEndDate: ข้าม เพราะ fixedStartDate ไม่มีใน DOM');
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

                const pickedEnd = randomDateBetween(pickedStart, exp);

                if (!pickedEnd) {
                    cy.log(`⚠️ fixedEndDate: ช่วงไม่ valid (${formatDate(pickedStart)} → ${formatDate(exp)}) — ใช้ fallback = fixedStartDate`);
                    typeDatePicker('fixedEndDate', pickedStart);
                    cy.log(`🎲 fixedEndDate (fallback): ${formatDate(pickedStart)}`);
                } else {
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
        return undefined;
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
    cy.get('.scrollmenu > .nav').contains('Tariff Plan & Discount')
        .scrollIntoView({ offset: { top: -100, left: 0 } })
        .should('be.visible')
        .click();

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
    let selectedType: string;

    if (type === 'random') {
        const availableTypes = Object.keys(targetGroupMap).filter(
            key => key !== 'fbb' && key !== 'traveller' && key !== 'netGift'
        ) as Array<keyof typeof targetGroupMap>;

        selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        value = targetGroupMap[selectedType as keyof typeof targetGroupMap];
    } else {
        selectedType = type;
        value = targetGroupMap[type as keyof typeof targetGroupMap];
    }

    cy.get('select[formcontrolname="targetGroup"]')
        .select(value)
        .should('have.value', value);

    // if (selectedType === 'traveller') {
    //     const firstUseYes = Math.random() < 0.5;

    //     cy.get('input[formcontrolname="firstUseFeature"]')
    //         .eq(firstUseYes ? 0 : 1) // 0 = Yes, 1 = No
    //         .check({ force: true });

    //     if (firstUseYes) {
    //         const randomDuration = Math.floor(Math.random() * 99999) + 1;

    //         cy.get('input[formcontrolname="durationFirstUse"]')
    //             .clear()
    //             .type(randomDuration.toString());
    //     }
    // }

    // if (selectedType === 'netGift') {
    //     const useExisting = Math.random() < 0.5;

    //     if (useExisting) {
    //         selectRandomExistingCostCode();
    //     } else {
    //         addNewCostCode();
    //     }
    // }
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

// ========================
// Rom ID
// ========================
export const RomID = (): void => {
    // ✅ ใช้ selector เดียวกันทั้ง check และ click กัน mismatch ระหว่าง 2 selector คนละตัว
    const TAB_SELECTOR = 'ul.nav.nav-tabs a';
    const TARGET_CHANNELS = ['ROM', 'Easy App ROM'];
    const DATA_ROW_SELECTOR = 'tbody tr';

    cy.get('body').then($body => {
        const hasSellingLocationTab =
            $body.find(TAB_SELECTOR).filter((_, el) => Cypress.$(el).text().trim() === 'Selling Location & Channel').length > 0;

        if (!hasSellingLocationTab) {
            cy.log('ℹ️ Tab "Selling Location & Channel" not found, skipping RomID function');
            return;
        }

        // 1. คลิกเปิด Tab
        cy.contains(TAB_SELECTOR, 'Selling Location & Channel', { timeout: 30000 })
            .scrollIntoView()
            .click({ force: true });

        // 2. รอให้ Component หลักปรากฏ
        cy.get('app-mass-enh-human-touch-point', { timeout: 30000 })
            .should('exist')
            .and('be.visible');

        cy.wait(2000); // เวลา settle สำหรับ Angular data binding หลัง tab เปิด

        cy.get('app-mass-enh-human-touch-point').then($component => {
            const $rows = $component.find(DATA_ROW_SELECTOR);
            const hasValidText = $rows.toArray().some(row => Cypress.$(row).text().trim().length > 0);

            if ($rows.length > 0 && hasValidText) {
                cy.log(`✅ Data is loaded and has values (${$rows.length} rows). Starting processNextRomRow...`);
                processNextRomRow(TARGET_CHANNELS.slice());
            } else {
                cy.log('ℹ️ No ROM/Easy App ROM data in table — likely not selected in Human Touch Point this run. Skipping RomID processing.');
            }
        });
    });
};

function processNextRomRow(remainingChannels: string[]): void {
    if (remainingChannels.length === 0) {
        return;
    }

    cy.get('body').then($body => {
        // หา row แรกที่ยัง match กับ channel ที่เหลืออยู่ — query สดทุกครั้งที่เรียกฟังก์ชันนี้
        const $rows = $body
            .find('app-mass-enh-human-touch-point table tbody tr.ng-star-inserted')
            .filter((_, el) => Cypress.$(el).find('td').length > 0);

        let matchedRow: JQuery<HTMLElement> | null = null;
        let matchedChannel = '';

        $rows.each((_, el) => {
            if (matchedRow) return; // already found one this pass
            const $el = Cypress.$(el);
            const channel = $el.find('td').first().text().trim();
            if (remainingChannels.includes(channel)) {
                matchedRow = $el;
                matchedChannel = channel;
            }
        });

        if (!matchedRow) {
            cy.log('ℹ️ No more ROM / Easy App ROM rows found, done');
            return;
        }

        cy.log(`✏️ Found ${matchedChannel}, proceeding to edit`);

        cy.wrap(matchedRow)
            .find('button[title="Edit"]')
            .should('be.visible')
            .click({ force: true });

        // -----------------------------------------------------------
        // สุ่มเลือกระหว่าง Generate ROM ID หรือ Type เอง
        // Scope ทุก selector ให้อยู่ใน component + :visible เพื่อกัน
        // การ match ฟอร์มของ row อื่นที่แค่ถูกซ่อนด้วย CSS ไม่ได้ destroy
        // -----------------------------------------------------------
        const shouldGenerate = Math.random() > 0.5;

        if (shouldGenerate) {
            cy.log('🎲 Logic: Generate ROM ID');
            cy.get('app-mass-enh-human-touch-point', { timeout: 10000 })
                .contains('button', 'Generate ROM ID')
                .filter(':visible')
                .should('be.visible')
                .click({ force: true });

            cy.wait(1000);
        } else {
            cy.log('🎲 Logic: Type ROM ID manually (numbers only)');

            const romIdFormats: (() => string)[] = [
                () => Math.floor(Math.random() * 90000 + 10000).toString(),
                () => Math.floor(Math.random() * 900000 + 100000).toString(),
                () => Math.floor(Math.random() * 9000000 + 1000000).toString(),
                () => Math.floor(Math.random() * 90000000 + 10000000).toString(),
                () => Math.floor(Math.random() * 900000000 + 100000000).toString(),
                () => (Math.floor(Math.random() * 9000000000 + 1000000000)).toString(),
                () => Math.floor(Math.random() * 9000 + 1000).toString(),
                () => (Math.floor(Math.random() * 900000000000 + 100000000000)).toString(),
            ];

            const randomFormat = romIdFormats[Math.floor(Math.random() * romIdFormats.length)];
            const romIdValue = randomFormat();

            cy.get('app-mass-enh-human-touch-point', { timeout: 10000 })
                .find('input[formcontrolname="romID"]')
                .filter(':visible')
                .should('have.length', 1) // fail loud instead of silently acting on wrong row's input
                .clear()
                .type(romIdValue);

            cy.log(`📝 ROM ID typed: ${romIdValue}`);
        }

        cy.get('app-mass-enh-human-touch-point', { timeout: 20000 })
            .contains('button', 'Update')
            .filter(':visible')
            .should('be.visible')
            .click({ force: true });

        cy.log(`✅ ${matchedChannel} updated successfully`);

        // รอให้ UI ปิดฟอร์ม + tbody re-render เสร็จก่อนไป row ถัดไป
        cy.wait(500);

        // ตัด channel ที่เพิ่ง process ออก แล้วเรียกตัวเองใหม่เพื่อ re-query DOM สดๆ
        const nextRemaining = remainingChannels.filter(c => c !== matchedChannel);
        processNextRomRow(nextRemaining);
    });
}

export const RunMassMktTabs = (): void => {
    const tabConfigs: { label: string; action: () => void }[] = [
        { label: 'Change Promotion Fee', action: ChangePromotionFee },
        { label: 'Market Segment', action: MarketSegment },
        { label: 'Special Condition', action: SpecialCondition },
        { label: 'Commu Touch Point', action: CommuTouchPoint },
        { label: 'Other Privilege', action: OtherPrivilege },
        { label: 'Matching Fee / Cash Back', action: MatchingFeeAndCashBack },
    ];

    cy.get('ul.nav.nav-tabs').then($tabs => {
        tabConfigs.forEach(({ label, action }) => {
            const $tabLink = $tabs.find('a').filter((_, el) => Cypress.$(el).text().trim().includes(label));

            if ($tabLink.length === 0) {
                cy.log(`Tab "${label}" not found, skipping`);
                return;
            }

            const shouldRun = Math.random() < 0.5;

            if (!shouldRun) {
                cy.log(`Tab "${label}" found but randomly skipped`);
                return;
            }

            cy.log(`Tab "${label}" found -> running action`);

            cy.contains('ul.nav.nav-tabs a', label).click({ force: true });

            cy.then(() => {
                try {
                    action();
                } catch (err) {
                    cy.log(`Action for "${label}" threw an error: ${err}`);
                }
            });
        });
    });
};
// ========================
// Change Promotion Fee
// ========================
export const ChangePromotionFee = (): void => {
    cy.get('app-mass-mkt-change-promotion-fee').within(() => {
        // Randomly choose Yes/No for Change Promotion Fee (Switching Fee)
        const isYes = Math.random() < 0.5;

        cy.get('input[formcontrolname="changePromotionFee"]')
            .eq(isYes ? 0 : 1) // 0 = Yes, 1 = No
            .check({ force: true });

        if (!isYes) {
            cy.log('Change Promotion Fee = No, no further action');
            return;
        }

        // Yes -> default "Free for First Time Change Promotion" to Yes
        cy.get('input[formcontrolname="freeforFirstTimeChangePromotionFlag"]')
            .eq(0) // 0 = Yes
            .check({ force: true });

        // Randomly decide whether to type "Number of Days for Free First Time Change Promotion"
        const shouldTypeDays = Math.random() < 0.5;

        if (shouldTypeDays) {
            const randomDays = Math.floor(Math.random() * 30) + 1;
            cy.get('input[formcontrolname="daysForFreeFirstTime"]')
                .clear()
                .type(randomDays.toString());
        } else {
            cy.log('Skipping Number of Days input this run');
        }
    });
};

export const SpecialCondition = (): void => {
    const targetLabel = 'Unsubscribe not Allowed';

    cy.get('app-mass-mkt-special-condition').within(() => {
        // Get all available options and pick one at random
        cy.get('select[formcontrolname="availableListBox"] option').then($options => {
            const options = Array.from($options);
            const randomIndex = Math.floor(Math.random() * options.length);
            const randomOption = options[randomIndex];
            const randomLabel = randomOption.textContent?.trim() ?? '';

            // Select that option in the Available items list box
            cy.get('select[formcontrolname="availableListBox"]').select(
                Cypress.$(randomOption).val() as string
            );

            // Click the "add to right" (atr) button to move it to Selected items
            cy.get('button.atr').click();

            // If the randomly picked item was "Unsubscribe not Allowed", edit it
            if (randomLabel === targetLabel) {
                cy.log(`${targetLabel} was selected -> editing detail`);

                cy.contains('td', targetLabel)
                    .parents('tr')
                    .find('button[title="Edit"]')
                    .click();

                const randomDays = Math.floor(Math.random() * 30) + 1;
                cy.get('input[formcontrolname="unsubscribeNotAllow"]')
                    .clear()
                    .type(randomDays.toString());

                cy.contains('button', 'Update').click();
            } else {
                cy.log(`${targetLabel} was not selected, skipping detail edit`);
            }
        });
    });
};

export const MarketSegment = (): void => {
    cy.get('app-mass-mkt-market-segment').within(() => {
        // Randomly decide whether to move Residential (default selected) back to Available
        const shouldRemoveResidential = Math.random() < 0.5;

        if (shouldRemoveResidential) {
            cy.get('select[formcontrolname="selectedListBox"] option')
                .contains('Residential')
                .dblclick();
            cy.log('Residential moved back to Available items (double click)');
        } else {
            cy.log('Keeping default Residential in Selected items');
        }

        // If Residential was removed, we MUST add at least one item from Available
        // to satisfy "must select at least 1 value" — otherwise it's optional.
        const shouldAddExtra = shouldRemoveResidential ? true : Math.random() < 0.5;

        if (!shouldAddExtra) {
            cy.log('No extra Market Segment added');
            return;
        }

        cy.get('select[formcontrolname="availableListBox"] option').then($options => {
            const options = Array.from($options);

            if (options.length === 0) {
                // Edge case: Residential was removed but nothing is available to replace it —
                // this would leave the field empty. Log loudly so it's not silently invalid.
                if (shouldRemoveResidential) {
                    cy.log('WARNING: Residential removed but no available items to select — selection will be empty!');
                } else {
                    cy.log('No available Market Segment items to select');
                }
                return;
            }

            // If Residential was removed, force at least 1 pick (minimum 1);
            // otherwise keep the original random range.
            const minPick = shouldRemoveResidential ? 1 : 1;
            const numToPick = Math.max(minPick, Math.floor(Math.random() * options.length) + 1);
            const shuffled = [...options].sort(() => 0.5 - Math.random());
            const chosenLabels = shuffled
                .slice(0, Math.min(numToPick, options.length))
                .map(opt => opt.textContent?.trim() || '')
                .filter(label => label.length > 0);

            cy.log(`Adding extra Market Segment items (double click): ${chosenLabels.join(', ')}`);

            chosenLabels.forEach(label => {
                cy.get('select[formcontrolname="availableListBox"] option')
                    .contains(label)
                    .dblclick();
            });
        });
    });
};

export const CommuTouchPoint = (): void => {
    cy.get('app-mass-mkt-commu-touch-point').within(() => {
        // 1. PO Name for Commu (TH)
        cy.get('input[formcontrolname="poNameCommu"]')
            .clear()
            .type('Test PO Name Commu');

        // Helper Function สำหรับจัดการ ng2-dual-list-box
        // เปลี่ยนจากการ dblclick เป็นการเลือกค่าแล้วกดปุ่มย้าย (Add Selected) ซึ่งเสถียรกว่ามาก
        const selectDualListItems = (formControlName: string, selectCount: number = 1) => {
            cy.get(`ng2-dual-list-box[formcontrolname="${formControlName}"]`).within(() => {
                cy.get('select[formcontrolname="availableListBox"] option').then($options => {
                    if ($options.length === 0) return;

                    // สุ่มจำนวน Item ที่จะเลือก
                    const numToPick = Math.min(selectCount, $options.length);
                    const valuesToSelect: string[] = [];
                    
                    const indices = new Set<number>();
                    while (indices.size < numToPick) {
                        indices.add(Math.floor(Math.random() * $options.length));
                    }
                    
                    // เก็บค่า (value) ของ Item ที่สุ่มได้
                    indices.forEach(idx => {
                        const val = $options.eq(idx).val() as string;
                        valuesToSelect.push(val);
                        cy.log(`Selecting: ${$options.eq(idx).text().trim()}`);
                    });

                    // เลือกค่าใน Available Listbox (รองรับ Multiple Select)
                    cy.get('select[formcontrolname="availableListBox"]').select(valuesToSelect as any);
                    
                    // กดปุ่ม "Add Selected" (class 'str' = single to right)
                    // รอให้ปุ่มสามารถกดได้ (ปุ่มจะ disabled อยู่ถ้าไม่ได้เลือก item ไว้)
                    cy.get('button.str').should('not.be.disabled').click();
                });
            });
        };

        // 2. ประเภทลูกค้า (customerCatergoryBox)
        const catCount = Math.floor(Math.random() * 3) + 1;
        selectDualListItems('customerCatergoryBox', catCount);

        // 3. กลุ่มเป้าหมายลูกค้า (targetCustomerBox)
        const shouldAddTarget = Math.random() < 0.5;
        if (shouldAddTarget) {
            const targetCount = Math.floor(Math.random() * 2) + 1;
            selectDualListItems('targetCustomerBox', targetCount);
        }

        // 4. ลูกค้าได้รับเมื่อสมัครแพ็ก - click "+" to add a Serenade Segment row
        cy.get('button.btn-primary.btn-xs').first().click();

        // รอให้ Hidden Panel แสดงผลออกมา (Angular จะลบ hidden attribute ออก)
        // การ .should('be.visible') จะช่วยหยุดรอจนกว่าฟอร์มจะพร้อมใช้งาน
        cy.get('select[formcontrolname="customerSegment"]', { timeout: 10000 })
            .should('be.visible')
            .then($select => {
                const segments = ['Emerald', 'Gold', 'Platinum'];
                const randomSegment = segments[Math.floor(Math.random() * segments.length)];
                
                cy.wrap($select).select(randomSegment);
                
                // Scope การทำงานให้อยู่เฉพาะใน .panel ที่เพิ่งเปิดขึ้นมา
                // เพื่อป้องกันการกดปุ่ม Add ของส่วนอื่นบนหน้าเว็บ
                cy.wrap($select).closest('.panel').within(() => {
                    cy.get('textarea[formcontrolname="remarkSegment"]')
                        .clear()
                        .type('Auto remark for ' + randomSegment);
                    
                    // กดปุ่ม Add ที่อยู่ใน Panel นี้เท่านั้น
                    cy.contains('button', 'Add').click();
                });
            });

        // 5. Final Remark textarea
        cy.get('textarea[formcontrolname="remark"]')
            .clear()
            .type('remark for Communication Touch Point');
    });
};
export const OtherPrivilege = (): void => {
    cy.get('app-mass-mkt-other-privilege').within(() => {
        // Click "+" to reveal the "Other Privilege Detail" panel
        cy.get('button.btn-primary.btn-xs').first().click();

        // Select a random Privilege Type (skip the disabled "Please Select" placeholder)
        cy.get('select[formcontrolname="privilegeType"] option:not([disabled])').then($options => {
            const options = Array.from($options);
            if (options.length === 0) return;

            const randomOption = options[Math.floor(Math.random() * options.length)];
            const value = Cypress.$(randomOption).val() as string;

            cy.get('select[formcontrolname="privilegeType"]').select(value);
        });

        // Privilege Description (required)
        cy.get('input[formcontrolname="privilegeDesc"]')
            .clear()
            .type('Auto Privilege Description');

        // Channel to apply (optional)
        const shouldFillChannel = Math.random() < 0.5;
        if (shouldFillChannel) {
            cy.get('input[formcontrolname="channelToApply"]')
                .clear()
                .type('Auto Channel');
        }

        // Remark (optional)
        const shouldFillRemark = Math.random() < 0.5;
        if (shouldFillRemark) {
            cy.get('textarea[formcontrolname="remark"]')
                .clear()
                .type('Auto remark for Other Privilege');
        }

        // Click Add to confirm the row
        cy.contains('button', 'Add').click();
    });
};
const selectRandomFromDualListBox = (
    scopeSelector: string,
    formControlName?: string
): void => {
    const dualListBoxSelector = formControlName
        ? `ng2-dual-list-box[formcontrolname="${formControlName}"]`
        : 'ng2-dual-list-box';

    cy.get(scopeSelector).within(() => {
        cy.get(dualListBoxSelector).within(() => {
            // Wait until the Available items list box actually has options loaded (async data)
            cy.get('select[formcontrolname="availableListBox"] option', { timeout: 20000 })
                .should('have.length.greaterThan', 0)
                .then($options => {
                    const options = Array.from($options);

                    // Randomly pick 2 to 3 items (or fewer if not enough options)
                    const numToPick = Math.min(
                        options.length,
                        Math.floor(Math.random() * 2) + 2
                    );

                    const shuffled = [...options].sort(() => 0.5 - Math.random());
                    const chosenOptions = shuffled.slice(0, numToPick);
                    const chosenLabels = chosenOptions.map(opt => opt.textContent?.trim());

                    cy.log(`Selecting from ${formControlName ?? scopeSelector}: ${chosenLabels.join(', ')}`);

                    // Double-click each chosen option individually to move it to
                    // "Selected items". Deliberately NOT using the .atr button here —
                    // .atr (glyphicon-list + chevron-right) is "Add ALL to Right",
                    // not "Add Selected to Right". The correct single-select button
                    // is .str, but double-click per option is more robust than
                    // depending on either button's enabled/disabled state.
                    chosenOptions.forEach(opt => {
                        cy.wrap(opt).dblclick({ force: true });
                    });
                });
        });
    });
};

export const MatchingFeeAndCashBack = (): void => {
    // Account Fee
    selectRandomFromDualListBox(
        'app-mass-mkt-matching-fee',
        'matchingFee'
    );

    // Order Fee
    selectRandomFromDualListBox(
        'app-mass-mkt-matching-fee',
        'matchingOrderFee'
    );

    // Cash Back (no formcontrolname on the ng2-dual-list-box tag itself in this HTML,
    // so we scope by component + the inner list-box CSS class instead)
    cy.get('app-mass-mkt-matching-cash-back').within(() => {
        cy.get('select[formcontrolname="availableListBox"] option', { timeout: 20000 })
            .should('have.length.greaterThan', 0)
            .then($options => {
                const options = Array.from($options);
                const numToPick = Math.min(options.length, Math.floor(Math.random() * 2) + 2);

                const shuffled = [...options].sort(() => 0.5 - Math.random());
                const chosenOptions = shuffled.slice(0, numToPick);
                const chosenLabels = chosenOptions.map(opt => opt.textContent?.trim());

                cy.log(`Selecting Cash Back: ${chosenLabels.join(', ')}`);

                chosenOptions.forEach(opt => {
                    cy.wrap(opt).dblclick({ force: true });
                });
            });
    });
};
export const BalanceWarningAndTransfer = (): void => {
    cy.get('app-mass-mkt-balance-warning-and-transfer').within(() => {
        // ===== Balance Warning =====
        cy.get('app-mass-mkt-balance-warning').within(() => {
            cy.get('input[formcontrolname="balanceWarningByPrompt"]')
                .clear()
                .type((Math.floor(Math.random() * 500) + 1).toString());

            cy.get('input[formcontrolname="balanceWarningBySMS1"]')
                .clear()
                .type((Math.floor(Math.random() * 500) + 1).toString());

            // Optional field - randomly decide to fill or leave default
            const shouldFillSMS2 = Math.random() < 0.5;
            if (shouldFillSMS2) {
                cy.get('input[formcontrolname="balanceWarningBySMS2"]')
                    .clear()
                    .type((Math.floor(Math.random() * 500) + 1).toString());
            } else {
                cy.log('Balance Warning By SMS2 left as default');
            }

            const alertTypes = ['Every Time', 'One time per day', 'One time only'];
            const randomPromptAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
            const randomSMSAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];

            cy.get('select[formcontrolname="promptAlertType"]').select(randomPromptAlert);
            cy.get('select[formcontrolname="SMSAlertType"]').select(randomSMSAlert);
        });

        // ===== Transfer =====
        cy.get('app-mass-mkt-transfer').within(() => {
            // Randomly choose Yes/No for Allow Transfer
            const isYes = Math.random() < 0.5;

            cy.get('input[formcontrolname="allowTransferForm"]')
                .eq(isYes ? 0 : 1) // 0 = Yes, 1 = No
                .check({ force: true });

            if (!isYes) {
                cy.log('Allow Transfer = No, no further action');
                return;
            }

            cy.log('Allow Transfer = Yes -> Transfer Detail fields revealed');

            // Helper: for each required Days/Baht field, randomly decide "keep default" vs "type new value"
            const maybeType = (
                formcontrolname: string,
                randomValueFn: () => string,
                label: string
            ) => {
                const shouldType = Math.random() < 0.5;
                if (shouldType) {
                    const value = randomValueFn();
                    cy.get(`input[formcontrolname="${formcontrolname}"]`)
                        .clear()
                        .type(value);
                    cy.log(`${label}: typed new value ${value}`);
                } else {
                    cy.log(`${label}: left as default`);
                }
            };

            const randomDays = () => (Math.floor(Math.random() * 30) + 1).toString();
            const randomBaht = () => (Math.floor(Math.random() * 100) + 1).toString();

            maybeType('transferBalanceAfterForm', randomDays, 'Transfer Balance After');
            maybeType('transferValidityAfterForm', randomDays, 'Transfer Validity After');
            maybeType('receiveBalanceAfterForm', randomDays, 'Receive Balance After');
            maybeType('receiveValidityAfterForm', randomDays, 'Receive Validity After');
            maybeType('transferFee', randomBaht, 'Transfer Fee');
            maybeType('balanceTransferLimit', randomBaht, 'Balance Transfer Limit');
            maybeType('validityTransferLimit', randomDays, 'Validity Transfer Limit');

            // Channel Discount Rate table - randomly decide whether to edit one channel's rate
            const shouldEditChannel = Math.random() < 0.5;

            if (shouldEditChannel) {
                const channels = ['IVR', 'USSD', 'O2CWEB', 'ACCWEB'];
                const randomChannel = channels[Math.floor(Math.random() * channels.length)];

                cy.log(`Editing discount rate for channel: ${randomChannel}`);

                cy.contains('td', randomChannel)
                    .parents('tr')
                    .find('button[title="Edit"]')
                    .click();

                // The hidden panel becomes visible with channel + discountRate fields
                cy.get('select[formcontrolname="channel"]').select(randomChannel);

                const randomRate = (Math.random() * 100).toFixed(2);
                cy.get('input[formcontrolname="discountRate"]')
                    .clear()
                    .type(randomRate);

                cy.contains('button', 'Update').click();
            } else {
                cy.log('Channel Discount Rate table left as default');
            }
        });
    });
};
export const ManageSim = (): void => {
    cy.get('app-mass-mkt-manage-sim').within(() => {
        const durationFields = [
            { name: 'suspendDuration', label: 'Suspend Duration' },
            { name: 'disableDuration', label: 'Disable Duration' },
            { name: 'poolDuration', label: 'Pool Duration' },
            { name: 'terminateDuration', label: 'Terminate Duration' },
        ];

        durationFields.forEach(({ name, label }) => {
            const shouldChange = Math.random() < 0.5;

            if (shouldChange) {
                const randomDays = Math.floor(Math.random() * 365) + 1; // maxlength=3, keep <= 999

                cy.get(`input[formcontrolname="${name}"]`)
                    .clear()
                    .type(randomDays.toString());

                cy.log(`${label}: changed to ${randomDays} days`);
            } else {
                cy.log(`${label}: keeping default value`);
            }
        });
    });
};

const selectRandomDualListBox = (scopeAlias: () => Cypress.Chainable): void => {
    scopeAlias().within(() => {
        cy.get('select[formcontrolname="availableListBox"] option', { timeout: 15000 })
            .should('have.length.greaterThan', 0)
            .then($options => {
                const options = Array.from($options);
                const numToPick = Math.min(options.length, Math.floor(Math.random() * 2) + 1);
                const shuffled = [...options].sort(() => 0.5 - Math.random());
                const chosenValues = shuffled.slice(0, numToPick).map(opt => Cypress.$(opt).val() as string);

                cy.get('select[formcontrolname="availableListBox"]').select(chosenValues);
                cy.get('button.atr').click();
            });
    });
};

export const RewardPerTargetCustomer = (): void => {
    cy.get('app-mass-reward-per-target-customer').within(() => {
        // Click "+" to reveal the "Reward per Target Customer Detail" panel
        cy.get('button.btn-primary.btn-xs').first().click();

        // --- Reward per Target Customer (required dual-list-box) ---
        selectRandomDualListBox(() =>
            cy.get('ng2-dual-list-box[formcontrolname="rewardPerTargetCustomer"]')
        );

        // --- Reward Type (optional radio: Immediate / With condition) ---
        const shouldSetRewardType = Math.random() < 0.5;
        if (shouldSetRewardType) {
            const isImmediate = Math.random() < 0.5;
            cy.get('input[formcontrolname="rewardType"]')
                .eq(isImmediate ? 0 : 1)
                .check({ force: true });

            if (!isImmediate) {
                cy.get('textarea[formcontrolname="rewardCondition"]')
                    .clear()
                    .type('Auto-generated reward condition text');
            }
        }

        // --- Reward 1st Pocket ---
        const shouldFillFirstPocket = Math.random() < 0.5;
        if (shouldFillFirstPocket) {
            cy.get('input[formcontrolname="rewardBalanceFirstPocket"]')
                .clear()
                .type((Math.random() * 1000).toFixed(2));
            cy.get('input[formcontrolname="rewardValidityFirstPocket"]')
                .clear()
                .type((Math.floor(Math.random() * 90) + 1).toString());
        }

        // --- Reward 2nd Pocket ---
        const shouldFillSecondPocket = Math.random() < 0.5;
        if (shouldFillSecondPocket) {
            cy.get('input[formcontrolname="rewardBalanceSecondPocket"]')
                .clear()
                .type((Math.random() * 1000).toFixed(2));
            cy.get('input[formcontrolname="rewardValiditySecondPocket"]')
                .clear()
                .type((Math.floor(Math.random() * 90) + 1).toString());

            // 2nd Pocket Usage dual-list-box
            selectRandomDualListBox(() =>
                cy.get('ng2-dual-list-box[formcontrolname="secondPocketUsage"]')
            );
        }

        // --- Reward Description ---
        const shouldFillDescription = Math.random() < 0.5;
        if (shouldFillDescription) {
            cy.get('textarea[formcontrolname="rewardDescription"]')
                .clear()
                .type('Auto-generated reward description');
        }

        // --- Reward Offering (optional dual-list-box) ---
        const shouldFillRewardOffering = Math.random() < 0.5;
        if (shouldFillRewardOffering) {
            selectRandomDualListBox(() =>
                cy.get('ng2-dual-list-box[formcontrolname="rewardOffering"]')
            );
        }

        // Finally click "Add" to submit the Reward per Target Customer Detail
        cy.contains('button', 'Add').click();
    });
};

export function runMassEnhConfigurationIfPresent(options?: {
    brandCount?: number;
    productGroupCount?: number;
    productPackageCount?: number;
    classAttributeCount?: number;
}) {
    cy.get('body').then(($body) => {
        const exists = $body.find('app-mass-enh-configuration').length > 0;

        if (!exists) {
            cy.log('app-mass-enh-configuration tab not found - skipping');
            return;
        }

        cy.get('app-mass-enh-configuration')
            .find('.panel-body')
            .then(($panelBody) => {
                const isVisible = $panelBody.is(':visible');
                if (!isVisible) {
                    cy.log('Mass Enh Configuration panel exists but is collapsed - expanding');
                    cy.get('app-mass-enh-configuration')
                        .find('.panel-heading')
                        .click({ force: true });
                }

                randomizeMassEnhConfiguration(options);
            });
    });
}

function randomizeMassEnhConfiguration(options?: {
    brandCount?: number;
    productGroupCount?: number;
    productPackageCount?: number;
    classAttributeCount?: number;
}) {
    const {
        brandCount = 1,
        productGroupCount = 1,
        productPackageCount = 1,
        classAttributeCount = 3,
    } = options || {};

    // ---- Target Value (single mat-select, required, no Add button) ----
    cy.contains('.form-group', 'Target Value')
        .parents('.row')
        .first()
        .within(() => {
            cy.get('.mat-select-trigger').click({ force: true });
        });
    cy.get('.cdk-overlay-container mat-option').then(($options) => {
        const idx = Cypress._.random(0, $options.length - 1);
        cy.wrap($options.eq(idx)).click({ force: true });
    });

    // ---- Brand / Product Group / Product Package (mat-select + Add) ----
    addMultiple('Brand', brandCount);
    addMultiple('Product Group', productGroupCount);
    addMultiple('Product Package', productPackageCount);

    // ---- Class Attribute (dual-list-box, double-click to move) ----
    selectRandomClassAttributes(classAttributeCount);

}

function selectAndAdd(rowLabel: string, optionText?: string) {
    cy.contains('.form-group', rowLabel)
        .parents('.row')
        .first()
        .within(() => {
            cy.get('.mat-select-trigger').click({ force: true });
        });

    if (optionText) {
        cy.get('.cdk-overlay-container mat-option')
            .contains(optionText)
            .click({ force: true });
    } else {
        cy.get('.cdk-overlay-container mat-option').then(($options) => {
            const idx = Cypress._.random(0, $options.length - 1);
            cy.wrap($options.eq(idx)).click({ force: true });
        });
    }

    cy.contains('.form-group', rowLabel)
        .parents('.row')
        .first()
        .find('button[title="Add"]')
        .click({ force: true });
}

function addMultiple(rowLabel: string, count: number) {
    for (let i = 0; i < count; i++) {
        selectAndAdd(rowLabel);
        cy.wait(300); // let Angular re-render the added-value list before next open
    }
}


function selectRandomClassAttributes(count: number) {
    cy.get('ng2-dual-list-box')
        .find('select[formcontrolname="availableListBox"]')
        .then(($select) => {
            const options = Cypress.$($select).find('option');
            const total = options.length;
            const indices = Array.from({ length: total }, (_, i) => i);

            Cypress._.shuffle(indices)
                .slice(0, Math.min(count, total))
                .sort((a, b) => b - a) // descending, so earlier dblclicks don't shift later indices
                .forEach((idx) => {
                    cy.get('ng2-dual-list-box')
                        .find('select[formcontrolname="availableListBox"] option')
                        .eq(idx)
                        .dblclick({ force: true });
                });
        });
}
