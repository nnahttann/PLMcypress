// ========================
// SELECT TARGET GROUP (NEW - Available List Box)
// ========================

export const targetgroup = (): void => {
  // Note: Update this list based on actual available options in your application
  const optionsToSelect = [
    'Change Charge Type (Convert)',
    'Existing',
    'New',
    'Port In (Mobile Number Port)'
    // 'Renew / Recall from Terminate' - Remove if not available in your UI
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
        
        // คลิกปุ่มลูกศรเพื่อย้ายค่าไปอีกลิสต์ (วิธีที่เสถียรสำหรับ Angular)
        cy.get('.glyphicon-chevron-right')
          .should('exist')
          .and('be.visible')
          .first()
          .click();
        
        cy.log(`➡️ Clicked move button to transfer option`);
        
        // ยืนยันผลโดยรอให้ค่าปรากฏใน selected list
        cy.get('select[formcontrolname="selectedListBox"]')
          .should('contain', randomOption)
          .then(() => {
            cy.log(`🎉 Target Group selection verified!`);
          });
      } else {
        cy.log(`❌ Option not found: ${randomOption}`);
        throw new Error(`Option "${randomOption}" not found in the list box`);
      }
    });
};
