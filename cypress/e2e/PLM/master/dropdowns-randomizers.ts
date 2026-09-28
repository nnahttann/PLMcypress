import { scrollAndWait } from './helpers';
const closeSuccessModal = (): void => {
    cy.contains('.modal-title', 'Save Result', { timeout: 600000 })
        .closest('.modal-content')
        .find('.modal-footer button.btn-danger')
        .should('be.visible')
        .and('not.be.disabled')
        .click();
};
const formatDate = (d: Date): string => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
const parseDate = (val: any): Date | null => {
    const strVal = String(val ?? '');
    if (!strVal || strVal.trim() === '')
        return null;
    const parts = strVal.trim().split('/');
    if (parts.length !== 3)
        return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year))
        return null;
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    return d;
};
const randomDateBetween = (min: Date, max: Date): Date | null => {
    if (min.getTime() > max.getTime())
        return null;
    const ms = min.getTime() + Math.random() * (max.getTime() - min.getTime());
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d;
};
const typeDatePicker = (formcontrolname: string, date: Date) => {
    const formatted = formatDate(date);
    cy.get(`my-date-picker[formcontrolname="${formcontrolname}"] input[aria-label="Date input field"]`)
        .click()
        .type('{selectall}{backspace}')
        .type(formatted, { delay: 30 });
    cy.get(`my-date-picker[formcontrolname="${formcontrolname}"] input[aria-label="Date input field"]`)
        .should('have.value', formatted);
};
const readDatePicker = (formcontrolname: string): Cypress.Chainable<Date | null> => {
    return cy
        .get(`my-date-picker[formcontrolname="${formcontrolname}"] input[aria-label="Date input field"]`)
        .invoke('val')
        .then((val) => {
            const parsed = parseDate(val);
            if (!parsed) {
                cy.log(`⚠️ ${formcontrolname}: อ่านค่าไม่ได้ (val="${val}")`);
            }
            else {
                cy.log(`📅 ${formcontrolname}: ${formatDate(parsed)}`);
            }
            return cy.wrap(parsed);
        });
};
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
                if (!hasFixedEnd) {
                    cy.log('⚠️ fixedEndDate: ไม่พบ element แต่ fixedStartDate ถูกกรอกแล้ว — อาจทำให้ฟอร์ม invalid');
                    return cy.wrap(null);
                }
                const pickedEnd = randomDateBetween(pickedStart, exp);
                if (!pickedEnd) {
                    cy.log(`⚠️ fixedEndDate: ช่วงไม่ valid (${formatDate(pickedStart)} → ${formatDate(exp)}) — ใช้ fallback = fixedStartDate`);
                    typeDatePicker('fixedEndDate', pickedStart);
                    cy.log(`🎲 fixedEndDate (fallback): ${formatDate(pickedStart)}`);
                }
                else {
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
const maybeRandomSelect = (selector: string, filterFn: (val: string) => boolean = () => true) => {
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
            const hasCurrentValue = currentValue !== '' &&
                currentValue !== '0: null' &&
                allOptions.includes(currentValue);
            let pool = hasCurrentValue
                ? allOptions.filter((v) => v !== currentValue)
                : allOptions;
            if (pool.length === 0) {
                cy.log(`⏭️ Skipped: ${selector} ไม่มี option อื่นให้เลือก`);
                return;
            }
            const picked = pool[Math.floor(Math.random() * pool.length)];
            cy.log(`🎲 ${selector}: ${hasCurrentValue ? 'เปลี่ยนจาก' : 'เลือก'} → "${picked}"`);
            cy.get(selector).select(picked, { force: true });
        });
    });
};
export const Randomdropdown = () => {
    maybeRandomSelect('select[formcontrolname="ontopConditionGroup"]', (v) => v !== '0: null');
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
        }
        else {
            cy.log(`⏭️ Skipped: ${selector} not found`);
        }
    });
    cy.get('body').then(($body) => {
        const tabSelector = 'a:contains("Money / Validity")';
        if ($body.find(tabSelector).length > 0) {
            cy.get(tabSelector).click();
            cy.get('button .glyphicon-plus').parent().click();
            const randomBalance1 = Math.floor(Math.random() * 1000) + 100;
            cy.get('input[formcontrolname="balanceFirstPocket"]').type(randomBalance1.toString());
            cy.get('input[formcontrolname="validityFirstPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());
            cy.get('select[formcontrolname="validityFirstPocketUnit"]').then(($select) => {
                const options = $select.find('option:not([disabled])');
                const randomIndex = Math.floor(Math.random() * options.length);
                cy.wrap($select).select((options[randomIndex] as HTMLOptionElement).value);
            });
            const randomBalance2 = Math.floor(Math.random() * 500) + 50;
            cy.get('input[formcontrolname="balanceSecondPocket"]').type(randomBalance2.toString());
            cy.get('input[formcontrolname="validitySecondPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());
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
        }
        else {
            cy.log('Skipped: Tab Money / Validity not found');
        }
    });
    maybeRandomSelect('select[formcontrolname="packageDataType"]', (v) => v !== '0: null');
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
        }
        else {
            cy.log(`Skipped: ${selector} is not visible or not found`);
        }
    });
    maybeRandomSelect('select[formcontrolname="earlyRenewOfferingFlag"]', (v) => v !== '0: null');
    maybeRandomSelect('select[formcontrolname="poType"]', (v) => v !== '0: null');
    maybeRandomSelect('select[formcontrolname="groupPackage"]', (v) => v !== '0: null');
    maybeRandomSelect('select[formcontrolname="promotionGroup"]', (v) => v !== '0: null');
    maybeRandomSelect('select[formcontrolname="promotionSubGroup"]', (v) => v !== '0: null');
};
const normalizeText = (t: string) => t.replace(/\s+/g, ' ').trim();
const findMatSelectByLabel = ($body: JQuery<HTMLElement>, fieldLabel: string): JQuery<HTMLElement> | null => {
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
                return false;
            }
        }
        return undefined;
    });
    return foundSelect;
};
const selectRandomOption = ($select: JQuery<HTMLElement>, fieldLabel: string, currentValueToAvoid?: string): void => {
    cy.get('body').then(($body) => {
        const panelOpen = $body.find('.cdk-overlay-container mat-option').length > 0;
        if (!panelOpen) {
            cy.log(`⚠️ "${fieldLabel}" panel did not open — skipping`);
            return;
        }
        cy.get('.cdk-overlay-container mat-option:not([aria-disabled="true"])')
            .should('have.length.greaterThan', 0)
            .then(($options) => {
                const validOptions = $options.filter((_, el) => {
                    const text = normalizeText(Cypress.$(el).text());
                    return (text !== 'Please Select' &&
                        text !== '' &&
                        (currentValueToAvoid == null ||
                            text !== normalizeText(currentValueToAvoid)));
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
                cy.wrap($select)
                    .find('.mat-select-value-text span')
                    .invoke('text')
                    .then((val) => {
                        expect(normalizeText(val)).to.equal(selectedText);
                    });
            });
    });
};
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
        if (isEmpty) {
            cy.log(`📭 "${fieldLabel}" is empty → picking a new value`);
            cy.wrap($select).find('.mat-select-trigger').click({ force: true });
            cy.wait(300);
            selectRandomOption($select, fieldLabel);
        }
        else {
            const shouldChange = Math.random() < 0.5;
            cy.log(`🔍 "${fieldLabel}" = "${currentText}" → ${shouldChange ? 'changing' : 'keeping'}`);
            if (shouldChange) {
                cy.wrap($select).find('.mat-select-trigger').click({ force: true });
                cy.wait(300);
                selectRandomOption($select, fieldLabel, currentText);
            }
        }
    });
};
const handleRecurringDropdowns = (): void => {
    handleDropdownField('Recurring Promotion / Service Group');
    handleDropdownField('Recurring Fee Item');
};
export const dropdownRecurringCKS = (): void => handleRecurringDropdowns();
export const dropdownRecurringCKSMain = (): void => handleRecurringDropdowns();
export const dropdownRecurringPreMainCKS = (): void => handleRecurringDropdowns();
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
        }
        else {
            cy.log('UnRegister (Hold) not found, skipping...');
        }
    });
};
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
        }
        else {
            cy.log('ℹ️ autoAddService5g not found — skipping');
        }
    });
};
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
    cy.get('.cdk-overlay-container mat-option:not(.mat-option-disabled)')
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
export const PriceExcluding = (): void => {
    cy.contains('th', 'Charge Excluding VAT')
        .closest('.col-md-8')
        .find('.btn-primary')
        .click();
    function getRandomRealisticCharge(min = 10, max = 2000): string {
        const realisticPrices = [
            10, 12, 15, 19, 20, 25, 29, 30, 35, 39, 40, 45, 49, 50,
            55, 59, 60, 65, 69, 70, 75, 79, 80, 85, 89, 90, 95, 99,
            109, 119, 129, 139, 149, 159, 169, 179, 189, 199,
            219, 229, 239, 249, 259, 269, 279, 289, 299,
            319, 329, 339, 349, 359, 369, 379, 389, 399,
            419, 429, 439, 449, 459, 469, 479, 489, 499,
            519, 529, 539, 549, 559, 569, 579, 589, 599,
            619, 629, 639, 649, 659, 669, 679, 689, 699,
            719, 729, 739, 749, 759, 769, 779, 789, 799,
            819, 829, 839, 849, 859, 869, 879, 889, 899,
            919, 929, 939, 949, 959, 969, 979, 989, 999,
            1049, 1099, 1149, 1199, 1249, 1299, 1349, 1399,
            1449, 1499, 1549, 1599, 1649, 1699, 1749, 1799,
            1849, 1899, 1949, 1999
        ];
        const validPrices = realisticPrices.filter(p => p >= min && p <= max);
        const price = validPrices.length > 0
            ? validPrices[Math.floor(Math.random() * validPrices.length)]
            : Math.floor(Math.random() * (max - min) + min);
        return price.toFixed(2);
    }
    const randomCharge = getRandomRealisticCharge();
    cy.get('input[formcontrolname="chargeExcVat"]')

        .type(randomCharge)
        .should('have.value', randomCharge);
    cy.get('input[formcontrolname="chargeExcVat"]')
        .closest('.panel-body')
        .find('button.btn-primary')
        .contains('Add')
        .should('not.be.disabled')
        .click();
};
export const RandomMultiDuration = (): void => {
    function getRandomRealisticCharge(min = 100, max = 2000): string {
        const realisticPrices = [
            109, 119, 129, 139, 149, 159, 169, 179, 189, 199,
            219, 229, 239, 249, 259, 269, 279, 289, 299,
            319, 329, 339, 349, 359, 369, 379, 389, 399,
            419, 429, 439, 449, 459, 469, 479, 489, 499,
            519, 529, 539, 549, 559, 569, 579, 589, 599,
            619, 629, 639, 649, 659, 669, 679, 689, 699,
            719, 729, 739, 749, 759, 769, 779, 789, 799,
            819, 829, 839, 849, 859, 869, 879, 889, 899,
            919, 929, 939, 949, 959, 969, 979, 989, 999,
            1049, 1099, 1149, 1199, 1249, 1299, 1349, 1399,
            1449, 1499, 1549, 1599, 1649, 1699, 1749, 1799,
            1849, 1899, 1949, 1999,
        ];
        const valid = realisticPrices.filter(p => p >= min && p <= max);
        const price = valid.length > 0
            ? valid[Math.floor(Math.random() * valid.length)]
            : Math.floor(Math.random() * (max - min) + min);
        return price.toFixed(2);
    }
    const countTableRows = (): Cypress.Chainable<number> => cy.get('body').then($body => {
        const $rows = $body
            .find('.col-md-8.col-md-offset-2 table.table-hover tbody tr')
            .filter((_, el) => !/No data to display/i.test(el.textContent || ''));
        return $rows.length;
    });
    const isFormOpen = (): Cypress.Chainable<boolean> => cy.get('body').then($body => $body.find('input[formcontrolname="durationFrom"]:visible').length > 0);
    const typeInto = (selector: string, value: string): void => {
        cy.get(`${selector}:visible`)
            .first()
            .should('be.visible')
            .and('not.be.disabled')
            .type('{selectall}{backspace}')
            .type(value)
            .trigger('input')
            .trigger('change')
            .should('have.value', value);
    };
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
            const addRow = (row: number, currentFrom: number): void => {
                if (row >= rowCount) {
                    cy.log('✅ Multi Duration: เพิ่มครบทุกแถวแล้ว');
                    return;
                }
                cy.log(`📦 Multi Duration row ${row + 1}/${rowCount}`);
                countTableRows().then((before) => {
                    isFormOpen().then((open) => {
                        if (!open) {
                            cy.get('.col-md-8.col-md-offset-2 > .btn-primary')
                                .filter(':visible')
                                .first()
                                .click();
                        }
                        else {
                            cy.log('ℹ️ ฟอร์มเปิดอยู่แล้ว — ไม่กดปุ่ม +');
                        }
                    });
                    cy.get('input[formcontrolname="durationFrom"]:visible', { timeout: 15000 })
                        .should('have.length.at.least', 1);
                    const fromValue = Math.min(currentFrom, packageDuration);
                    cy.log(`   durationFrom: ${fromValue}`);
                    typeInto('input[formcontrolname="durationFrom"]', fromValue.toString());
                    const toValue = Math.min(fromValue + step - 1, packageDuration);
                    cy.get('input[formcontrolname="durationTo"]:visible').first().then(($to) => {
                        if ($to.prop('disabled')) {
                            cy.log('🔒 durationTo disabled (auto-calculated) — skip');
                        }
                        else {
                            cy.log(`   durationTo: ${toValue}`);
                            typeInto('input[formcontrolname="durationTo"]', toValue.toString());
                        }
                    });
                    cy.get('select[formcontrolname="durationUnit"]:visible')
                        .first()
                        .then(($sel) => {
                            const current = String($sel.val() ?? '').trim();
                            if (current && !/please select/i.test(current)) {
                                cy.log(`✅ durationUnit มีค่าแล้ว: ${current} — ไม่ทับ`);
                                return;
                            }
                            const opts = $sel
                                .find('option:not([disabled])')
                                .toArray()
                                .map(o => (o as HTMLOptionElement).value)
                                .filter(Boolean);
                            if (opts.length === 0) {
                                cy.log('⚠️ durationUnit ไม่มี option ให้เลือก');
                                return;
                            }
                            const pick = opts[Math.floor(Math.random() * opts.length)];
                            cy.wrap($sel).select(pick, { force: true });
                            cy.log(`🗓️ durationUnit = ${pick}`);
                        });
                    const exc = getRandomRealisticCharge();
                    // const inc = (parseFloat(exc) * 1.07).toFixed(2);
                    // cy.log(`   chargeExcVat: ${exc}, chargeIncVat: ${inc}`);
                    typeInto('input[formcontrolname="chargeExcVat"]', exc);
                    // typeInto('input[formcontrolname="chargeIncVat"]', inc);
                    cy.contains('button', 'Add')
                        .filter(':visible')
                        .first()
                        .should('not.be.disabled')
                        .click();
                    cy.get('.col-md-8.col-md-offset-2 table.table-hover tbody tr', { timeout: 15000 })
                        .should(($rows) => {
                            const real = $rows.toArray()
                                .filter(el => !/No data to display/i.test(el.textContent || ''));
                            expect(real.length, `แถวควรเพิ่มจาก ${before}`).to.be.greaterThan(before);
                        })
                        .then(() => {
                            const nextFrom = Math.min(currentFrom + step, packageDuration);
                            addRow(row + 1, nextFrom);
                        });
                });
            };
            addRow(0, 1);
        })
        .then(() => {
            cy.get('body').then($body => {
                const hasAlert = $body
                    .find('.alert-danger label')
                    .toArray()
                    .some(el => el.textContent?.includes('must have more than one row'));
                cy.log(hasAlert
                    ? '⚠️ ยังมี validation "must have more than one row"'
                    : '✅ Multi Duration row count requirement satisfied');
            });
        });
};
export const selectTargetGroup = (type: 'mass' | 'massDisabled' | 'massStudents' | 'save' | 'fmc' | 'specialCondition' | 'cvm' | 'staff' | 'test' | 'netGift' | 'nbtc' | 'dummy' | 'traveller' | 'fbb' | 'random'): void => {
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
        const availableTypes = Object.keys(targetGroupMap).filter(key => key !== 'fbb' && key !== 'traveller' && key !== 'netGift') as Array<keyof typeof targetGroupMap>;
        selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        value = targetGroupMap[selectedType as keyof typeof targetGroupMap];
    }
    else {
        selectedType = type;
        value = targetGroupMap[type as keyof typeof targetGroupMap];
    }
    cy.get('select[formcontrolname="targetGroup"]')
        .select(value)
        .should('have.value', value);
};
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
        }
        else {
            cy.log('Skipped a dropdown because it had no valid options');
        }
    });
};
export const targetgroup = (forceOptions?: string[]): void => {
    const optionsToSelect = [
        'Change Charge Type (Convert)',
        'Existing',
        'New',
        'Port In (Mobile Number Port)',
        'Renew / Recall from Terminate'
    ];
    cy.get('select[formcontrolname="availableListBox"]')
        .should('exist')
        .and('be.visible');
    const selectedOptions = forceOptions ?? (() => {
        const minCount = 1;
        const maxCount = optionsToSelect.length;
        const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
        const shuffled = [...optionsToSelect].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    })();
    cy.log(`🎯 targetgroup เลือก ${selectedOptions.length} ตัว: ${selectedOptions.join(', ')}`);
    selectedOptions.forEach((optionText) => {
        cy.get('select[formcontrolname="availableListBox"]')
            .contains('option', optionText)
            .should('exist')
            .and('be.visible')
            .then($option => {
                cy.wrap($option).dblclick({ force: true });
            });
    });
};
export const RetryPattern = (): void => {
    cy.get('.scrollmenu > .nav')
        .contains('Retry Pattern')
        .scrollIntoView()
        .should('be.visible')
        .click();
    cy.get('input[formcontrolname="maxRetryPeriod"]')
        .filter(':visible')
        .then(($input) => {
            const currentValue = ($input.val() as string) ?? '';
            const isValidInteger = /^\d+$/.test(currentValue.trim());
            if (!isValidInteger) {
                const randomPeriod = String(Math.floor(Math.random() * 999) + 1);
                cy.wrap($input)

                    .type(randomPeriod)
                    .blur({ force: true });
                cy.log(`Max Retry Period was empty/invalid, typed random value: ${randomPeriod}`);
            }
            else {
                cy.log(`Max Retry Period already has a valid value: ${currentValue}`);
            }
        });
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
export const Topup = (): void => {
    cy.get('body').then(($body) => {
        if ($body.find('select[formcontrolname="topupPlanType"]').length > 0) {
            cy.get('select[formcontrolname="topupPlanType"]').then(($select) => {
                const selectedValue = $select.val() as string;
                const hasValue = selectedValue &&
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
                }
                else {
                    cy.log(`Top up Plan Type already has value: "${selectedValue}"`);
                }
            });
        }
        else {
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
            Topup();
        }
        else {
            cy.log('No "Top up" tab found, skipping...');
        }
    });
};
export const RomID = (): void => {
    const TAB_SELECTOR = 'ul.nav.nav-tabs a';
    const TARGET_CHANNELS = ['ROM', 'Easy App ROM'];
    const DATA_ROW_SELECTOR = 'tbody tr';
    cy.get('body').then($body => {
        const hasSellingLocationTab = $body.find(TAB_SELECTOR).filter((_, el) => Cypress.$(el).text().trim() === 'Selling Location & Channel').length > 0;
        if (!hasSellingLocationTab) {
            cy.log('ℹ️ Tab "Selling Location & Channel" not found, skipping RomID function');
            return;
        }
        cy.contains(TAB_SELECTOR, 'Selling Location & Channel', { timeout: 30000 })
            .scrollIntoView()
            .click({ force: true });
        cy.get('app-mass-enh-human-touch-point', { timeout: 30000 })
            .should('exist')
            .and('be.visible');
        cy.wait(2000);
        cy.get('app-mass-enh-human-touch-point').then($component => {
            const $rows = $component.find(DATA_ROW_SELECTOR);
            const hasValidText = $rows.toArray().some(row => Cypress.$(row).text().trim().length > 0);
            if ($rows.length > 0 && hasValidText) {
                cy.log(`✅ Data is loaded and has values (${$rows.length} rows). Starting processNextRomRow...`);
                processNextRomRow(TARGET_CHANNELS.slice());
            }
            else {
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
        const $rows = $body
            .find('app-mass-enh-human-touch-point table tbody tr.ng-star-inserted')
            .filter((_, el) => Cypress.$(el).find('td').length > 0);
        let matchedRow: JQuery<HTMLElement> | null = null;
        let matchedChannel = '';
        $rows.each((_, el) => {
            if (matchedRow)
                return;
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
        const shouldGenerate = Math.random() > 0.5;
        if (shouldGenerate) {
            cy.log('🎲 Logic: Generate ROM ID');
            cy.get('app-mass-enh-human-touch-point', { timeout: 10000 })
                .contains('button', 'Generate ROM ID')
                .filter(':visible')
                .should('be.visible')
                .click({ force: true });
            cy.wait(1000);
        }
        else {
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
                .should('have.length', 1)

                .type(romIdValue);
            cy.log(`📝 ROM ID typed: ${romIdValue}`);
        }
        cy.get('app-mass-enh-human-touch-point', { timeout: 20000 })
            .contains('button', 'Update')
            .filter(':visible')
            .should('be.visible')
            .click({ force: true });
        cy.log(`✅ ${matchedChannel} updated successfully`);
        cy.wait(500);
        const nextRemaining = remainingChannels.filter(c => c !== matchedChannel);
        processNextRomRow(nextRemaining);
    });
}
export const RunMassMktTabs = (): void => {
    const tabConfigs: {
        label: string;
        action: () => void;
    }[] = [
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
                }
                catch (err) {
                    cy.log(`Action for "${label}" threw an error: ${err}`);
                }
            });
        });
    });
};
export const ChangePromotionFee = (): void => {
    cy.get('app-mass-mkt-change-promotion-fee').within(() => {
        const isYes = Math.random() < 0.5;
        cy.get('input[formcontrolname="changePromotionFee"]')
            .eq(isYes ? 0 : 1)
            .check({ force: true });
        if (!isYes) {
            cy.log('Change Promotion Fee = No, no further action');
            return;
        }
        cy.get('input[formcontrolname="freeforFirstTimeChangePromotionFlag"]')
            .eq(0)
            .check({ force: true });
        const shouldTypeDays = Math.random() < 0.5;
        if (shouldTypeDays) {
            const randomDays = Math.floor(Math.random() * 30) + 1;
            cy.get('input[formcontrolname="daysForFreeFirstTime"]')

                .type(randomDays.toString());
        }
        else {
            cy.log('Skipping Number of Days input this run');
        }
    });
};
export const SpecialCondition = (): void => {
    const targetLabel = 'Unsubscribe not Allowed';
    cy.get('app-mass-mkt-special-condition').within(() => {
        cy.get('select[formcontrolname="availableListBox"] option').then($options => {
            const options = Array.from($options);
            const randomIndex = Math.floor(Math.random() * options.length);
            const randomOption = options[randomIndex];
            const randomLabel = randomOption.textContent?.trim() ?? '';
            cy.get('select[formcontrolname="availableListBox"]').select(Cypress.$(randomOption).val() as string);
            cy.get('button.atr').click();
            if (randomLabel === targetLabel) {
                cy.log(`${targetLabel} was selected -> editing detail`);
                cy.contains('td', targetLabel)
                    .parents('tr')
                    .find('button[title="Edit"]')
                    .click();
                const randomDays = Math.floor(Math.random() * 30) + 1;
                cy.get('input[formcontrolname="unsubscribeNotAllow"]')

                    .type(randomDays.toString());
                cy.contains('button', 'Update').click();
            }
            else {
                cy.log(`${targetLabel} was not selected, skipping detail edit`);
            }
        });
    });
};
export const MarketSegment = (): void => {
    cy.get('app-mass-mkt-market-segment').within(() => {
        const dblClickOptionSafely = (selector: string, label: string, attempt = 1): void => {
            cy.get(selector)
                .contains('option', label)
                .then($opt => {
                    cy.wrap($opt).dblclick({ force: true });
                });
            cy.get(selector).then($select => {
                const stillThere = $select
                    .find('option')
                    .toArray()
                    .some(el => Cypress.$(el).text().trim() === label);
                if (stillThere) {
                    if (attempt >= 3) {
                        throw new Error(`"${label}" did not leave "${selector}" after ${attempt} attempts`);
                    }
                    cy.log(`"${label}" still present — retrying dblclick (attempt ${attempt + 1})`);
                    dblClickOptionSafely(selector, label, attempt + 1);
                }
            });
        };
        const shouldRemoveResidential = Math.random() < 0.5;
        if (shouldRemoveResidential) {
            dblClickOptionSafely('select[formcontrolname="selectedListBox"]', 'Residential');
            cy.log('Residential moved back to Available items (double click)');
        }
        else {
            cy.log('Keeping default Residential in Selected items');
        }
        const shouldAddExtra = shouldRemoveResidential ? true : Math.random() < 0.5;
        if (!shouldAddExtra) {
            cy.log('No extra Market Segment added');
            return;
        }
        cy.get('select[formcontrolname="availableListBox"]').then($select => {
            const count = $select.find('option').length;
            if (count === 0) {
                if (shouldRemoveResidential) {
                    cy.log('WARNING: Residential removed but no available items to select — selection will be empty!');
                }
                else {
                    cy.log('No available Market Segment items to select');
                }
                return;
            }
            const numToPick = Math.max(1, Math.floor(Math.random() * count) + 1);
            cy.log(`Adding ${numToPick} extra Market Segment item(s)`);
            const pickOnce = () => {
                cy.get('select[formcontrolname="availableListBox"]').then($currentSelect => {
                    const $currentOptions = $currentSelect.find('option');
                    if ($currentOptions.length === 0) {
                        cy.log('No more available items to pick — stopping early');
                        return;
                    }
                    const idx = Math.floor(Math.random() * $currentOptions.length);
                    const label = $currentOptions.eq(idx).text().trim();
                    cy.log(`Double-clicking: ${label}`);
                    dblClickOptionSafely('select[formcontrolname="availableListBox"]', label);
                });
            };
            for (let i = 0; i < numToPick; i++) {
                pickOnce();
            }
        });
    });
};
export const CommuTouchPoint = (): void => {
    cy.get('app-mass-mkt-commu-touch-point').within(() => {
        cy.get('input[formcontrolname="poNameCommu"]')

            .type('Test PO Name Commu');
        const selectDualListItems = (formControlName: string, selectCount: number = 1) => {
            cy.get(`ng2-dual-list-box[formcontrolname="${formControlName}"]`).within(() => {
                cy.get('select[formcontrolname="availableListBox"]', { timeout: 20000 })
                    .then($select => {
                        const $options = $select.find('option');
                        if ($options.length === 0) {
                            cy.log(`⏭️ ${formControlName}: no options available, skipping`);
                            return;
                        }
                        const numToPick = Math.min(selectCount, $options.length);
                        const valuesToSelect: string[] = [];
                        const indices = new Set<number>();
                        while (indices.size < numToPick) {
                            indices.add(Math.floor(Math.random() * $options.length));
                        }
                        indices.forEach(idx => {
                            const val = $options.eq(idx).val() as string;
                            valuesToSelect.push(val);
                            cy.log(`Selecting: ${$options.eq(idx).text().trim()}`);
                        });
                        cy.wrap($select).select(valuesToSelect as any);
                        cy.get('button.str').should('not.be.disabled').then($els => {
                            if ($els.length === 0) {
                                cy.log(`⏭️ transfer button (.str) not found for ${formControlName}`);
                            } else {
                                cy.wrap($els.eq(0)).click({ force: true });
                            }
                        });
                    });
            });
        };
        const catCount = Math.floor(Math.random() * 3) + 1;
        selectDualListItems('customerCatergoryBox', catCount);
        const shouldAddTarget = Math.random() < 0.5;
        if (shouldAddTarget) {
            const targetCount = Math.floor(Math.random() * 2) + 1;
            selectDualListItems('targetCustomerBox', targetCount);
        }
        cy.get('button.btn-primary.btn-xs').then($els => {
            if ($els.length === 0) cy.log('⏭️ primary small button not found in CommuTouchPoint');
            else cy.wrap($els.eq(0)).click({ force: true });
        });
        cy.get('select[formcontrolname="customerSegment"]', { timeout: 10000 })
            .should('be.visible')
            .then($select => {
                const segments = ['Emerald', 'Gold', 'Platinum'];
                const randomSegment = segments[Math.floor(Math.random() * segments.length)];
                cy.wrap($select).select(randomSegment);
                cy.wrap($select).closest('.panel').within(() => {
                    cy.get('textarea[formcontrolname="remarkSegment"]')

                        .type('Auto remark for ' + randomSegment);
                    cy.contains('button', 'Add').filter(':visible').then($els => {
                        if ($els.length === 0) cy.log('⏭️ Add button not found in segment panel');
                        else cy.wrap($els.eq(0)).click({ force: true });
                    });
                });
            });
        cy.get('textarea[formcontrolname="remark"]')

            .type('remark for Communication Touch Point');
    });
};
export const OtherPrivilege = (): void => {
    cy.get('body').then($body => {
        if ($body.find('app-mass-mkt-other-privilege').length === 0) {
            cy.log('⏭️ app-mass-mkt-other-privilege not found — skipping OtherPrivilege');
            return;
        }
        cy.get('app-mass-mkt-other-privilege').within(() => {
            cy.get('button.btn-primary.btn-xs').first().click({ force: true });

            cy.get('select[formcontrolname="privilegeType"]').then($sel => {
                const $opts = $sel.find('option:not([disabled])').filter((_, el) => String((el as HTMLOptionElement).value).trim() !== '');
                if ($opts.length === 0) {
                    cy.log('⏭️ privilegeType: no valid options found');
                }
                else {
                    const idx = Math.floor(Math.random() * $opts.length);
                    const $opt = $opts.eq(idx);
                    const val = ($opt.val() as string) || $opt.text().trim();
                    cy.wrap($sel).select(val, { force: true });
                }
            });

            cy.get('input[formcontrolname="privilegeDesc"]').then($el => {
                if ($el.length > 0 && $el.is(':visible')) {
                    cy.wrap($el).clear({ force: true }).type('Auto Privilege Description', { force: true });
                }
                else {
                    cy.log('⏭️ privilegeDesc input not found or not visible');
                }
            });

            if (Math.random() < 0.5) {
                cy.get('input[formcontrolname="channelToApply"]').then($el => {
                    if ($el.length > 0 && $el.is(':visible')) {
                        cy.wrap($el).clear({ force: true }).type('Auto Channel', { force: true });
                    }
                    else {
                        cy.log('⏭️ channelToApply input not found or not visible');
                    }
                });
            }

            // Remark input for Other Privilege removed per request

            cy.contains('button', 'Add').filter(':visible').then($els => {
                if ($els.length === 0) {
                    cy.log('⏭️ Add button not found or not visible');
                }
                else {
                    cy.wrap($els.eq(0)).click({ force: true });
                }
            });
        });
    });
};
const selectRandomFromDualListBox = (scopeSelector: string, formControlName?: string): void => {
    const dualListBoxSelector = formControlName
        ? `ng2-dual-list-box[formcontrolname="${formControlName}"]`
        : 'ng2-dual-list-box';
    cy.get(scopeSelector).within(() => {
        cy.get(dualListBoxSelector).within(() => {
            cy.get('select[formcontrolname="availableListBox"]', { timeout: 20000 })
                .should('exist')
                .then($select => {
                    const $opts = Cypress.$($select).find('option:not([disabled])').filter((_, el) => String((el as HTMLOptionElement).value).trim() !== '');
                    if ($opts.length === 0) {
                        cy.log('⏭️ availableListBox: no valid options to pick');
                        return;
                    }
                    const options = Array.from($opts);
                    const numToPick = Math.min(options.length, Math.floor(Math.random() * 2) + 2);
                    const shuffled = [...options].sort(() => 0.5 - Math.random());
                    const chosen = shuffled.slice(0, numToPick);
                    const chosenValues = chosen.map(o => (o as HTMLOptionElement).value || (o as HTMLOptionElement).text.trim());
                    cy.log(`Selecting from ${formControlName ?? scopeSelector}: ${chosenValues.join(', ')}`);
                    cy.wrap($select).select(chosenValues, { force: true });
                    // click transfer button (arrow to right)
                    cy.get('button.atr').then($btn => {
                        if ($btn.length > 0) {
                            cy.wrap($btn).click({ force: true });
                        }
                        else {
                            cy.log('⏭️ transfer button (.atr) not found — skipping click');
                        }
                    });
                });
        });
    });
};
export const MatchingFeeAndCashBack = (): void => {
    selectRandomFromDualListBox('app-mass-mkt-matching-fee', 'matchingFee');
    selectRandomFromDualListBox('app-mass-mkt-matching-fee', 'matchingOrderFee');
    cy.get('app-mass-mkt-matching-cash-back').within(() => {
        cy.get('select[formcontrolname="availableListBox"]', { timeout: 20000 })
            .should('exist')
            .then($select => {
                const $opts = Cypress.$($select).find('option:not([disabled])').filter((_, el) => String((el as HTMLOptionElement).value).trim() !== '');
                if ($opts.length === 0) {
                    cy.log('⏭️ matching-cash-back: no valid options to pick');
                    return;
                }
                const options = Array.from($opts);
                const numToPick = Math.min(options.length, Math.floor(Math.random() * 2) + 2);
                const shuffled = [...options].sort(() => 0.5 - Math.random());
                const chosen = shuffled.slice(0, numToPick);
                const chosenValues = chosen.map(o => (o as HTMLOptionElement).value || (o as HTMLOptionElement).text.trim());
                cy.log(`Selecting Cash Back: ${chosenValues.join(', ')}`);
                cy.wrap($select).select(chosenValues, { force: true });
                cy.get('button.atr').then($btn => {
                    if ($btn.length > 0) cy.wrap($btn).click({ force: true });
                    else cy.log('⏭️ transfer button (.atr) not found in matching-cash-back');
                });
            });
    });
};
export const BalanceWarningAndTransfer = (): void => {
    cy.get('app-mass-mkt-balance-warning-and-transfer').within(() => {
        cy.get('app-mass-mkt-balance-warning').within(() => {
            cy.get('input[formcontrolname="balanceWarningByPrompt"]')

                .type((Math.floor(Math.random() * 500) + 1).toString());
            cy.get('input[formcontrolname="balanceWarningBySMS1"]')

                .type((Math.floor(Math.random() * 500) + 1).toString());
            const shouldFillSMS2 = Math.random() < 0.5;
            if (shouldFillSMS2) {
                cy.get('input[formcontrolname="balanceWarningBySMS2"]')

                    .type((Math.floor(Math.random() * 500) + 1).toString());
            }
            else {
                cy.log('Balance Warning By SMS2 left as default');
            }
            const alertTypes = ['Every Time', 'One time per day', 'One time only'];
            const randomPromptAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
            const randomSMSAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
            cy.get('select[formcontrolname="promptAlertType"]').select(randomPromptAlert);
            cy.get('select[formcontrolname="SMSAlertType"]').select(randomSMSAlert);
        });
        cy.get('app-mass-mkt-transfer').within(() => {
            const isYes = Math.random() < 0.5;
            cy.get('input[formcontrolname="allowTransferForm"]')
                .eq(isYes ? 0 : 1)
                .check({ force: true });
            if (!isYes) {
                cy.log('Allow Transfer = No, no further action');
                return;
            }
            cy.log('Allow Transfer = Yes -> Transfer Detail fields revealed');
            const maybeType = (formcontrolname: string, randomValueFn: () => string, label: string) => {
                const shouldType = Math.random() < 0.5;
                if (shouldType) {
                    const value = randomValueFn();
                    cy.get(`input[formcontrolname="${formcontrolname}"]`)

                        .type(value);
                    cy.log(`${label}: typed new value ${value}`);
                }
                else {
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
            const shouldEditChannel = Math.random() < 0.5;
            if (shouldEditChannel) {
                const channels = ['IVR', 'USSD', 'O2CWEB', 'ACCWEB'];
                const randomChannel = channels[Math.floor(Math.random() * channels.length)];
                cy.log(`Editing discount rate for channel: ${randomChannel}`);
                cy.contains('td', randomChannel)
                    .parents('tr')
                    .find('button[title="Edit"]')
                    .click();
                cy.get('select[formcontrolname="channel"]').select(randomChannel);
                const randomRate = (Math.random() * 100).toFixed(2);
                cy.get('input[formcontrolname="discountRate"]')

                    .type(randomRate);
                cy.contains('button', 'Update').click();
            }
            else {
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
                const randomDays = Math.floor(Math.random() * 365) + 1;
                cy.get(`input[formcontrolname="${name}"]`)

                    .type(randomDays.toString());
                cy.log(`${label}: changed to ${randomDays} days`);
            }
            else {
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
        cy.get('button.btn-primary.btn-xs').first().click();
        selectRandomDualListBox(() => cy.get('ng2-dual-list-box[formcontrolname="rewardPerTargetCustomer"]'));
        const shouldSetRewardType = Math.random() < 0.5;
        if (shouldSetRewardType) {
            const isImmediate = Math.random() < 0.5;
            cy.get('input[formcontrolname="rewardType"]')
                .eq(isImmediate ? 0 : 1)
                .check({ force: true });
            if (!isImmediate) {
                cy.get('textarea[formcontrolname="rewardCondition"]')

                    .type('Auto-generated reward condition text');
            }
        }
        const shouldFillFirstPocket = Math.random() < 0.5;
        if (shouldFillFirstPocket) {
            cy.get('input[formcontrolname="rewardBalanceFirstPocket"]')

                .type((Math.random() * 1000).toFixed(2));
            cy.get('input[formcontrolname="rewardValidityFirstPocket"]')

                .type((Math.floor(Math.random() * 90) + 1).toString());
        }
        const shouldFillSecondPocket = Math.random() < 0.5;
        if (shouldFillSecondPocket) {
            cy.get('input[formcontrolname="rewardBalanceSecondPocket"]')

                .type((Math.random() * 1000).toFixed(2));
            cy.get('input[formcontrolname="rewardValiditySecondPocket"]')

                .type((Math.floor(Math.random() * 90) + 1).toString());
            selectRandomDualListBox(() => cy.get('ng2-dual-list-box[formcontrolname="secondPocketUsage"]'));
        }
        const shouldFillDescription = Math.random() < 0.5;
        if (shouldFillDescription) {
            cy.get('textarea[formcontrolname="rewardDescription"]')

                .type('Auto-generated reward description');
        }
        const shouldFillRewardOffering = Math.random() < 0.5;
        if (shouldFillRewardOffering) {
            selectRandomDualListBox(() => cy.get('ng2-dual-list-box[formcontrolname="rewardOffering"]'));
        }
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
    const { brandCount = 1, productGroupCount = 1, productPackageCount = 1, classAttributeCount = 3, } = options || {};
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
    addMultiple('Brand', brandCount);
    addMultiple('Product Group', productGroupCount);
    addMultiple('Product Package', productPackageCount);
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
    }
    else {
        cy.get('.cdk-overlay-container mat-option:not([aria-disabled="true"])').then(($options) => {
            const validOptions = $options.filter((_, el) => {
                const text = Cypress.$(el).text().trim();
                return text !== 'Please Select' && text !== '';
            });
            if (validOptions.length === 0) {
                cy.log(`⚠️ No valid options for ${rowLabel}`);
                return;
            }
            const idx = Cypress._.random(0, validOptions.length - 1);
            cy.wrap(validOptions.eq(idx)).click({ force: true });
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
        cy.wait(300);
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
                .sort((a, b) => b - a)
                .forEach((idx) => {
                    cy.get('ng2-dual-list-box')
                        .find('select[formcontrolname="availableListBox"] option')
                        .eq(idx)
                        .dblclick({ force: true });
                });
        });
}
