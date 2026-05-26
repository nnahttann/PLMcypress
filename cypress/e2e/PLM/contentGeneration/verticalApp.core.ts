// ========================
// VerticalApp
// ========================
export const VerticalApp = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Vertical App$/)
    .click({ force: true });
  cy.wait(3500);

  cy.get('app-mass-mkt-vertical-app').within(() => {
    cy.get('.collapse-panel').then(($panel) => {
      if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
        cy.get('.panel-heading').click({ force: true });
      }
    });

    cy.get('button:has(.glyphicon-plus)').click({ force: true });
  });

  cy.get('select[formcontrolname="VerticalAppUsageType"]')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const val = $options.eq(randomIndex).val() as string;
      cy.log(`📡 Vertical App Usage Type: ${val}`);
      cy.get('select[formcontrolname="VerticalAppUsageType"]').select(val, { force: true });
    });

  cy.get('select[formcontrolname="VerticalAppQuotaType"]')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const val = $options.eq(randomIndex).val() as string;
      cy.log(`📦 Vertical App Quota Type: ${val}`);
      cy.wrap(val).as('selectedQuotaValue');
      cy.get('select[formcontrolname="VerticalAppQuotaType"]').select(val, { force: true });
    });

  cy.contains('label', '*Vertical App :')
    .closest('.form-group')
    .find('mat-select .mat-select-trigger')
    .should('be.visible')
    .click({ force: true });

  cy.get('body')
    .find('mat-option')
    .not('.mat-option-disabled')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const label = $options.eq(randomIndex).text().trim();
      cy.log(`📱 Vertical App selected: ${label}`);
      cy.wrap($options).eq(randomIndex).scrollIntoView().click({ force: true });
    });

  cy.get('app-mass-mkt-vertical-app').within(() => {
    const scenario = Cypress._.random(0, 2);
    // 0 = 3G only
    // 1 = 4G + 3G  (system default)
    // 2 = 5G + 4G + 3G
    const scenarioLabels = ['3G only', '4G + 3G', '5G + 4G + 3G'];
    cy.log(`🗼 Network Coverage scenario: ${scenarioLabels[scenario]}`);

    cy.get('[formarrayname="vaNetworkCoverageCheckBox"] input[type="checkbox"]')
      .each(($checkbox, index) => {
        // index 0 = 5G, index 1 = 4G, index 2 = 3G
        const shouldCheck =
          (scenario === 0 && index === 2) ||  // 3G only
          (scenario === 1 && index >= 1) ||   // 4G + 3G
          (scenario === 2);                   // 5G + 4G + 3G

        if (shouldCheck) {
          cy.wrap($checkbox).check({ force: true });
        } else {
          cy.wrap($checkbox).uncheck({ force: true });
        }
      });

    cy.get('select[formcontrolname="commuSpeed"]')
      .find('option:not([disabled])')
      .then(($options) => {
        const randomIndex = Cypress._.random(0, $options.length - 1);
        const val = $options.eq(randomIndex).val() as string;
        cy.log(`⚡ Commu Speed: ${val}`);
        cy.get('select[formcontrolname="commuSpeed"]').select(val, { force: true });
      });

    cy.get('@selectedQuotaValue').then((quotaValue) => {
      if (String(quotaValue).includes('Throttling')) {
        cy.log(`🐢 Quota includes Throttling → selecting Throttling Speed`);
        cy.get('select[formcontrolname="commuThrottlingSpeed"]')
          .should('exist')
          .find('option:not([disabled])', { timeout: 10000 })
          .should('have.length.greaterThan', 0)
          .then(($options) => {
            const randomIndex = Cypress._.random(0, $options.length - 1);
            const val = $options.eq(randomIndex).val() as string;
            cy.log(`🐢 Commu Throttling Speed: ${val}`);
            cy.get('select[formcontrolname="commuThrottlingSpeed"]').select(val, { force: true });
          });
      }
    });

    cy.wait(2000);
    cy.contains('button', /^Add$/).click({ force: true });
    cy.log(`✅ Vertical App → Add clicked`);
    cy.wait(2000);
  });
};

