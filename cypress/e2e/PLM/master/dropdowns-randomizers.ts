import { scrollAndWait } from './helpers';


// closeSuccessModal is used by Tariff — copied exactly from Master.ts
const closeSuccessModal = (): void => {
    cy.contains('.modal-title', 'Save Result', { timeout: 20000 })
        .closest('.modal-content')
        .find('.modal-footer button.btn-danger')
        .should('be.visible')
        .and('not.be.disabled')
        .click();
};
export const Randomdropdown = () => {
    cy.get('body').then(($body) => {
        const selector = 'select[formcontrolname="ontopConditionGroup"]';
        if ($body.find(selector).length > 0) {
            cy.get(selector)
                .find('option:not([disabled])')
                .then($options => {
                    const validOptions = [...$options].map(o => (o as HTMLOptionElement).value);
                    const randomIndex = Math.floor(Math.random() * validOptions.length);
                    cy.get(selector).select(validOptions[randomIndex]);
                });
        } else {
            cy.log(`Skipped: ${selector} not found`);
        }
    });

    cy.get('body').then(($body) => {
        const selector = 'select[formcontrolname="billPeriod"]';

        if ($body.find(selector).length > 0) {
            cy.get(selector)
                .find('option:not([disabled])')
                .then($options => {
                    const validOptions = [...$options].map(o => (o as HTMLOptionElement).value);
                    const randomIndex = Math.floor(Math.random() * validOptions.length);
                    const selectedValue = validOptions[randomIndex];

                    cy.log(`🎲 Randomly selected Bill Period: ${selectedValue}`);

                    cy.get(selector).select(selectedValue, { force: true });
                });
        } else {
            cy.log(`⏭️ Skipped: ${selector} not found`);
        }
    });

    cy.get('body').then(($body) => {
        const tabSelector = 'a:contains("Money / Validity")';

        if ($body.find(tabSelector).length > 0) {
            cy.get(tabSelector).click();

            // คลิกปุ่ม +
            cy.get('button .glyphicon-plus').parent().click();

            // --- 1. Main Balance ---
            const randomBalance1 = Math.floor(Math.random() * 1000) + 100;
            cy.get('input[formcontrolname="balanceFirstPocket"]').type(randomBalance1.toString());

            // --- 2. Validity Main Balance & Unit ---
            cy.get('input[formcontrolname="validityFirstPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());

            cy.get('select[formcontrolname="validityFirstPocketUnit"]').then($select => {
                const options = $select.find('option:not([disabled])');
                const randomIndex = Math.floor(Math.random() * options.length);
                // แก้ไข: Cast เป็น HTMLOptionElement เพื่อเรียกใช้ .value ได้
                const randomOption = options[randomIndex] as HTMLOptionElement;
                cy.wrap($select).select(randomOption.value);
            });

            // --- 3. Reward Balance ---
            const randomBalance2 = Math.floor(Math.random() * 500) + 50;
            cy.get('input[formcontrolname="balanceSecondPocket"]').type(randomBalance2.toString());

            // --- 4. Validity Reward Balance & Unit ---
            cy.get('input[formcontrolname="validitySecondPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());

            cy.get('select[formcontrolname="validitySecondPocketUnit"]').then($select => {
                const options = $select.find('option:not([disabled])');
                const randomIndex = Math.floor(Math.random() * options.length);
                // แก้ไข: Cast เป็น HTMLOptionElement
                const randomOption = options[randomIndex] as HTMLOptionElement;
                cy.wrap($select).select(randomOption.value);
            });

            // --- 5. Usage Types (Dual List Box) ---
            cy.get('select[formcontrolname="availableListBox"]').then($select => {
                const options = $select.find('option');
                if (options.length > 0) {
                    const randomIndex = Math.floor(Math.random() * options.length);
                    // แก้ไข: Cast เป็น HTMLOptionElement
                    const val = (options[randomIndex] as HTMLOptionElement).value;

                    cy.get('select[formcontrolname="availableListBox"]').select(val);
                    cy.get('button.str').click(); // ปุ่มเลื่อนไปขวา
                }
            });

            // --- 6. Description ---
            const randomDesc = `AutoTest_${Math.random().toString(36).substring(7)}`;
            cy.get('textarea[formcontrolname="balanceDescription"]').type(randomDesc);

            // --- กด Add ---
            cy.get('button').contains('Add').click();

        } else {
            cy.log('Skipped: Tab Money / Validity not found');
        }
    });

    cy.get('body').then(($body) => {
        const selector = 'select[formcontrolname="packageDataType"]';

        if ($body.find(selector).length > 0) {
            cy.get(selector)
                .find('option')
                .then($options => {
                    const validOptions = [...$options]
                        .map(o => (o as HTMLOptionElement).value)
                        .filter(val => val !== '0: null');
                    if (validOptions.length > 0) {
                        const randomIndex = Math.floor(Math.random() * validOptions.length);
                        cy.get(selector).select(validOptions[randomIndex]);
                    }
                });
        }
    });

    cy.get('body').then(($body) => {
        const selector = 'select[formcontrolname="recurringFeeDeduction"]';
        const $element = $body.find(selector);
        if ($element.length > 0 && $element.is(':visible')) {
            cy.get(selector)
                .find('option:not([disabled])')
                .then(($options) => {
                    const randomIndex = Math.floor(Math.random() * $options.length);
                    const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
                    cy.get(selector).select(valueToSelect);
                });
        } else {
            cy.log(`Skipped: ${selector} is not visible or not found`);
        }
    });
    cy.get('body').then(($body) => {
        const selector = 'select[formcontrolname="earlyRenewOfferingFlag"]';

        if ($body.find(selector).length > 0) {
            cy.get(selector)
                .find('option')
                .not('[value="0: null"]')
                .then(($options) => {
                    if ($options.length > 0) {
                        const randomIndex = Math.floor(Math.random() * $options.length);
                        const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
                        cy.get(selector).select(valueToSelect);
                    }
                });
        }
    });

    cy.get('body').then(($body) => {
        const selector = 'select[formcontrolname="poType"]';

        if ($body.find(selector).length > 0) {
            cy.get(selector)
                .find('option')
                .not('[value="0: null"]')
                .then(($options) => {
                    if ($options.length > 0) {
                        const randomIndex = Math.floor(Math.random() * $options.length);
                        const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
                        cy.get(selector).select(valueToSelect);
                    }
                });
        }
    });


    cy.get('body').then(($body) => {
        const selector = 'select[formcontrolname="packageDataType"]';

        if ($body.find(selector).length > 0) {
            cy.get(selector)
                .find('option')
                .not('[value="0: null"]')
                .then(($options) => {
                    if ($options.length > 0) {
                        const randomIndex = Math.floor(Math.random() * $options.length);
                        const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;

                        cy.get(selector).select(valueToSelect, { force: true });
                    }
                });
        }
    });

}

// ========================
// INTERNAL: SELECT RANDOM DROPDOWN RECURRING
// ========================

const selectRandomDropdownRecurring = (): void => {
    cy.get('.mat-select-value')
        .contains('Please Select')
        .click({ force: true });

    cy.get('mat-option').then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        const selectedText = $options.eq(randomIndex).text().trim();

        cy.wrap($options[randomIndex]).click({ force: true });
        cy.get('.mat-select-value').should('contain.text', selectedText);
    });

    cy.get('.mat-select-value')
        .contains('Please Select')
        .click({ force: true });

    cy.get('mat-option .mat-option-text').then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        const selectedText = $options.eq(randomIndex).text().trim();
        cy.wrap($options.eq(randomIndex)).click({ force: true });

        cy.get('.mat-select-value').should('contain.text', selectedText);
    });
};

// ========================
// INTERNAL: SELECT RANDOM DROPDOWN RECURRING (MAIN VARIANT)
// ========================

const selectRandomDropdownRecurringMain = (): void => {
    cy.get('.mat-select-value').eq(1).click({ force: true });

    cy.get('mat-option .mat-option-text').then(($options) => {
        const randomIndex = Math.floor(Math.random() * $options.length);

        // capture text ก่อน click — ป้องกัน CDK overlay re-render สลับ index
        const selectedText = $options.eq(randomIndex).text().trim();
        cy.log(`🎲 Selected: "${selectedText}"`);

        // click ด้วย text แทน index เพื่อความ stable
        cy.contains('mat-option .mat-option-text', selectedText).click({ force: true });

        // assert จาก text ที่ capture ไว้
        cy.get('.mat-select-value').eq(1).should('contain.text', selectedText);
    });
};

// ========================
// CORE: DROPDOWN RECURRING (รวมเป็นฟังก์ชันแกนเดียว)
// ========================
type DropdownRecurringMode = 'normal' | 'main';

const dropdownRecurringCore = (mode: DropdownRecurringMode): void => {
    if (mode === 'main') {
        selectRandomDropdownRecurringMain();
    } else {
        selectRandomDropdownRecurring();
    }
};

// ========================
// PUBLIC EXPORTS (คงชื่อเดิมไว้ทั้งหมด เพื่อไม่กระทบไฟล์อื่นที่เรียกใช้อยู่)
// ========================

export const dropdownRecurringCKS = (): void => {
    dropdownRecurringCore('normal');
};

export const dropdownRecurringPreMainCKS = (): void => {
    dropdownRecurringCore('normal');
};

export const dropdownRecurringCKSMain = (): void => {
    dropdownRecurringCore('main');
};
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
        // 🎯 สุ่มราคาโดยยึดหลักความจริงของแพ็กเกจอินเทอร์เน็ต/มือถือในไทย (บาท)
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

// ============================================================
// RandomMultiDuration()
// ============================================================

export const RandomMultiDuration = (): void => {
    function getRandomRealisticCharge(min = 10, max = 2000): string {
        // 🎯 สุ่มราคาโดยยึดหลักความจริงของแพ็กเกจอินเทอร์เน็ต/มือถือในไทย (บาท)
        const realisticPrices = [
            15, 19, 25, 29, 35, 39, 45, 49, 55, 59, 69, 79, 89, 99, 
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

    // ✅ FIX 1: ดึงที่ input โดยตรงและใช้ .first() เพื่อเลือกช่อง "Yes"
    cy.get('input[formcontrolname="multiDurationFlag"]').first().check({ force: true });

    // 2) สุ่มจำนวนแถว 2-5
    const rowCount = Math.floor(Math.random() * 4) + 2; // 2,3,4,5
    cy.log(`🎲 Multi Duration: randomly creating ${rowCount} row(s)`);

    let previousFrom = 1; // ✅ แก้ไข: กำหนดค่าเริ่มต้นเป็น 1

    for (let row = 0; row < rowCount; row++) {
        cy.log(`📦 Multi Duration row ${row + 1}/${rowCount}`);
        
        // กดปุ่ม + เพื่อเพิ่มแถวใหม่
        cy.get('.col-md-8.col-md-offset-2 > .btn-primary').click();

        // 🎯 แก้ไข: สุ่มการขยับระยะเวลาให้สมจริงกับแพ็กเกจอินเทอร์เน็ต (เช่น ขยับทีละ 1, 2, 3, 6, 12)
        const realisticJumps = [1, 2, 3, 6, 12]; 
        const currentFrom = row === 0 
            ? 1 
            : previousFrom + realisticJumps[Math.floor(Math.random() * realisticJumps.length)]; 

        cy.get('input[formcontrolname="durationFrom"]').last()
            .should('be.visible')
            .clear()
            .type(currentFrom.toString())
            .should('have.value', currentFrom.toString());

        cy.get('input[formcontrolname="durationTo"]').last().then($durationTo => {
            if (!$durationTo.is(':disabled')) {
                cy.log(`⚠️ durationTo NOT disabled on row ${row + 1} (expected disabled) — verify behavior, value may need manual fill`);
            }
        });
        
        cy.get('select[formcontrolname="durationUnit"]').last().then($durationUnit => {
            if (!$durationUnit.is(':disabled')) {
                cy.log(`⚠️ durationUnit NOT disabled on row ${row + 1} (expected disabled) — verify behavior, may need manual select`);
            }
        });

        const randomChargeExc = getRandomRealisticCharge();
        const randomChargeInc = getRandomRealisticCharge();

        cy.get('input[formcontrolname="chargeExcVat"]').last()
            .should('be.visible')
            .clear()
            .type(randomChargeExc)
            .should('have.value', randomChargeExc);

        // ✅ FIX 3: Scope เฉพาะปุ่ม Add ในโซนของ Multi Duration 
        cy.get('.col-md-8.col-md-offset-2').contains('button', 'Add').last().click();

        // เตรียมค่าไว้ใช้คำนวณแถวถัดไป
        previousFrom = currentFrom;
    }

    // ยืนยันว่า alert "must have more than one row" ไม่ปรากฏอีก
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

    cy.wait(1500);

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
