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
