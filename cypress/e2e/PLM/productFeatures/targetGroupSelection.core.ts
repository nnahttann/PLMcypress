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

  // หา select element ที่มี formcontrolname="availableListBox" โดยเฉพาะ
  cy.get('select[formcontrolname="availableListBox"]')
    .should('exist')
    .and('be.visible')
    .then(($select) => {
      cy.log(`✅ Found select element with formcontrolname="availableListBox"`);
      cy.log(`📝 Current value: "${$select.val()}"`);

      // วนลูปหา option ที่มี text ตรงกับที่ต้องการ
      let selectedValue: string | null = null;
      $select.find('option').each((_, option) => {
        const optionElement = option as HTMLOptionElement;
        if (optionElement.text === randomOption) {
          selectedValue = optionElement.value;
          cy.log(`📌 Found option: "${optionElement.text}" with value: "${selectedValue}"`);
        }
      });

      if (selectedValue) {
        // ใช้ jQuery เพื่อเลือกค่าและ trigger event สำหรับ Angular
        $select.val(selectedValue).trigger('change');
        
        cy.log(`✅ Successfully selected: ${randomOption}`);
        cy.log(`📝 New value after selection: "${$select.val()}"`);
        
        // ยืนยันผลโดยรอให้ค่าถูกเซ็ต
        cy.wrap($select)
          .should(($el) => {
            const val = $el.val();
            expect(val).to.not.be.empty;
            expect(val).to.include(randomOption);
          })
          .then(() => {
            cy.log(`🎉 Target Group selection verified!`);
          });
      } else {
        cy.log(`❌ Option not found: ${randomOption}`);
        throw new Error(`Option "${randomOption}" not found in the list box`);
      }
    });
};
