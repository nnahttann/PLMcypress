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
      const selectElement = $select[0] as HTMLSelectElement;
      cy.log(`✅ Found select element`);
      cy.log(`📝 Current value: "${selectElement.value}"`);

      // หา option ที่มี text ตรงกับที่ต้องการ โดยใช้ JavaScript ปกติ
      let selectedValue = '';
      let found = false;

      for (let i = 0; i < selectElement.options.length; i++) {
        const option = selectElement.options[i];
        if (option.text === randomOption) {
          selectedValue = option.value;
          found = true;
          cy.log(`🔍 Found option: YES`);
          cy.log(`📌 Option value: "${selectedValue}", text: "${option.text}"`);
          break;
        }
      }

      if (found) {
        // เลือกค่าโดยใช้ Cypress .select() ซึ่งจัดการ event ได้ดีกว่า
        cy.wrap($select).select(selectedValue);
        cy.log(`✅ Successfully selected: ${randomOption}`);
      } else {
        cy.log(`❌ Option not found: ${randomOption}`);
        throw new Error(`Option "${randomOption}" not found in dropdown`);
      }
    })
    .should('have.value', randomOption)
    .then(() => {
      cy.log(`🎉 Target Group selection verified!`);
    });
};
