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
      const $option = $select.find('option').filter(function() {
        return $(this).text() === randomOption;
      });

      cy.log(`🔍 Found option: ${$option.length > 0 ? 'YES' : 'NO'}`);
      if ($option.length > 0) {
        cy.log(`📌 Option value: "${$option.val()}", text: "${$option.text()}"`);
        
        // เลือกค่าโดยใช้ jQuery เพื่อ trigger change event สำหรับ Angular
        $select.val($option.val()).trigger('change');
        
        cy.log(`✅ Successfully selected: ${randomOption}`);
        cy.log(`📝 New value: "${$select.val()}"`);
      } else {
        cy.log(`❌ Option not found: ${randomOption}`);
      }
    })
    .should('have.value', randomOption)
    .then(() => {
      cy.log(`🎉 Target Group selection verified!`);
    });
};
