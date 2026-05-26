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

