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

export const dropdownRecurringCKS = (): void => {
  selectRandomDropdownRecurring();
};

export const dropdownRecurringCKSMain = (): void => {
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
export const dropdownRecurringPreMainCKS = (): void => {
  selectRandomDropdownRecurring();
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
// MUSIC ROLES
// ========================

