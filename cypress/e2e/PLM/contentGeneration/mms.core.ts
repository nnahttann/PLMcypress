// ========================
// MMS
// ========================

export const Mms = (fillRating = true): void => {
  const processFreeResource = () => {
    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.get('.collapse-panel').first().then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading').first().click({ force: true });
          cy.get('.collapse-panel').first().should('be.visible');
        }
      });
      cy.get('button:has(.glyphicon-plus)').click({ force: true });
    });

    cy.get('app-mass-mkt-mms-free-resource mat-select .mat-select-trigger')
      .should('be.visible')
      .click({ force: true });

    cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
      .should('have.length.gt', 0)
      .then(($options) => {
        const randomIndex = Cypress._.random(0, $options.length - 1);
        cy.wrap($options.eq(randomIndex)).scrollIntoView().click({ force: true });
      });

    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.contains('button', 'Add').should('be.visible').click({ force: true });
    });
  };

  const fillMmsRatingInput = (controlName: string) => {
    cy.get(`input[formcontrolname="${controlName}"]`)
      .should('exist')
      .clear({ force: true })
      .type(Cypress._.random(0.5, 10.0).toFixed(2), { force: true })
      .blur({ force: true });
  };

  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^MMS$/)
        .click({ force: true });

      // ✅ Free Resource กรอกเสมอ ไม่ว่าจะ main หรือ ontop
      processFreeResource();

      // ✅ Rating: ข้ามเมื่อ fillRating=false (main), กรอกเมื่อ fillRating=true (ontop/ontop extra)
      if (fillRating) {
        cy.get('app-mass-mkt-mms-rating').within(() => {
          cy.get('.panel-heading').first().click({ force: true });
        });
        cy.get('app-mass-mkt-mms-rating').within(() => {
          fillMmsRatingInput('mmsExcludingVat');
          fillMmsRatingInput('mmsdrExcludingVat');
          fillMmsRatingInput('mmsrrExcludingVat');
        });
      } else {
        cy.log('⏭️ Mms Rating skipped (fillRating=false / main)');
      }
    }
  });
};

