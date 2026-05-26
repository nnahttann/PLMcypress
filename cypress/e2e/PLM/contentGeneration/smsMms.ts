// ========================================
// CONTENT GENERATION HELPERS (SMS/MMS)
// ========================================

/**
 * Closes the success modal after saving content
 */
export const closeSuccessModal = (): void => {
  cy.get('.modal-dialog', { timeout: 20000 }).should('be.visible');
  cy.get('.modal-footer', { timeout: 20000 }).should('be.visible');
  cy.get('.modal-footer')
    .find('button.btn-danger')
    .should('be.visible')
    .and('not.be.disabled')
    .click();
};

/**
 * Generate random message code for SMS
 */
const randomMessageCode = (): string => {
  return `PRO${Math.floor(Math.random() * 10000)}`;
};

/**
 * SMS wording for CKS role (POST-PAID)
 */
export const smsCKSPOST = (): void => {
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.get('textarea, select', { timeout: 15000 }).should('exist');
  cy.wait(3500);

  cy.then(() => {
    cy.get('select[formcontrolname="smsPromotePackSendFlag"]')
      .first()
      .scrollIntoView({ duration: 500, offset: { top: -100, left: 0 } });
    cy.wait(2000);

    cy.get('select[formcontrolname="smsPromotePackSendFlag"]').then(($select) => {
      const currentValue = $select.val() as string;

      if (currentValue === 'Send') {
        cy.log('✅ SMS Promote Package = Send, filling messageCode');
        cy.get('input[formcontrolname="messageCode"]')
          .first()
          .type(randomMessageCode(), { force: true });
        cy.wait(2000);
      } else {
        cy.log('⚠️ SMS Promote Package is not "Send", skipping messageCode');
      }
    });

    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.contains('button', 'Save').should('be.visible').click();
    cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    closeSuccessModal();
  });
};

/**
 * SMS wording for CKS role (PRE-PAID)
 */
export const smsCKSPRE = (): void => {
  // Currently PRE-PAID logic is similar or specific
  // Implementation details can be added here if they differ from POST
  smsCKSPOST();
};
