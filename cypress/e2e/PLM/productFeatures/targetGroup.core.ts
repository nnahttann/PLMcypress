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
// SELECT TARGET GROUP (NEW - Available List Box)
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

  cy.log(`🎯 Selecting Target Group: ${randomOption}`);
  cy.log(`📋 Options available: ${optionsToSelect.join(', ')}`);

  cy.get('select[formcontrolname="availableListBox"]')
    .should('exist')
    .and('be.visible')
    .then($select => {
      cy.log(`✅ Found select element`);
      cy.log(`📝 Current value: "${$select.val()}"`);

      // หา option ที่มี text ตรงกับที่ต้องการ
      const $option = $select.find('option').filter(function(this: HTMLElement) {
        return $(this).text() === randomOption;
      });

      cy.log(`🔍 Found option: ${$option.length > 0 ? 'YES' : 'NO'}`);
      if ($option.length > 0) {
        const optionValue = $option.val();
        cy.log(`📌 Option value: "${optionValue}", text: "${$option.text()}"`);
        
        // เลือกค่าโดยใช้ jQuery เพื่อ trigger change event สำหรับ Angular
        if (optionValue !== undefined && optionValue !== null) {
          $select.val(optionValue.toString()).trigger('change');
          
          cy.log(`✅ Successfully selected: ${randomOption}`);
          cy.log(`📝 New value: "${$select.val()}"`);
        } else {
          cy.log(`❌ Option value is undefined for: ${randomOption}`);
        }
      } else {
        cy.log(`❌ Option not found: ${randomOption}`);
      }
    })
    .should('have.value', randomOption)
    .then(() => {
      cy.log(`🎉 Target Group selection verified!`);
    });
};

