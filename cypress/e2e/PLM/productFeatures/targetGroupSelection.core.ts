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

  // เนื่องจากมี select หลายตัวในหน้า (availableListBox และ selectedListBox)
  // ให้ใช้ cy.contains('option', ...) เพื่อหา option ที่ต้องการก่อน แล้วค่อยเลือก
  cy.contains('option', randomOption)
    .should('exist')
    .then(($option) => {
      const $select = $option.parent('select');
      
      cy.log(`✅ Found option in select: ${$select.attr('formcontrolname')}`);
      
      // ตรวจสอบว่าเป็น availableListBox จริงๆ
      if ($select.attr('formcontrolname') === 'availableListBox') {
        cy.log(`📝 Current value before select: "${$select.val()}"`);
        
        // ใช้ jQuery val() เพื่อเลือกค่า แล้ว trigger change event สำหรับ Angular
        // เนื่องจาก dual-list-box บางครั้งไม่ตอบสนองต่อ cy.select() มาตรฐาน
        $select.val(randomOption).trigger('change');
        
        cy.log(`✅ Successfully selected: ${randomOption}`);
        cy.log(`📝 New value: "${$select.val()}"`);
        
        // ยืนยันผล
        cy.wrap($select).should('have.value', randomOption);
        cy.log(`🎉 Target Group selection verified!`);
      } else {
        cy.log(`❌ Found option in wrong select box: ${$select.attr('formcontrolname')}`);
        throw new Error(`Found option in wrong list box: ${$select.attr('formcontrolname')}`);
      }
    });
};
