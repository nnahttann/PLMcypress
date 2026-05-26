// ========================
// ENTERTAINMENT PARTNERSHIP
// ========================

export const EntertainmentPartnership = (platforms: Array<'Arcade' | 'TV Plus' | 'Youtube Premium'>): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Entertainment Partnership$/)
    .click({ force: true });

  cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
    .find('option:selected')
    .invoke('val')
    .then((selectedVal) => {
      const rawVal = String(selectedVal);
      const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

      let partnerCustomerType: string;
      if (label === 'Post-paid' || label === 'Hybrid-Post') {
        partnerCustomerType = 'Post-paid';
      } else if (label === 'Pre-paid') {
        partnerCustomerType = 'Pre-paid';
      } else {
        partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
      }

      cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

      cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
          platforms.forEach((platform) => {
            const targetPlatform = platform === 'Youtube Premium' ? 'Google' : platform;

            cy.get('button .glyphicon-plus').first().parent().click();

            const cpOptions = ['Apple', 'GOOGLE IRELAND LIMITED'];
            const randomCp = cpOptions[Math.floor(Math.random() * cpOptions.length)];

            cy.contains('label', 'CP Name')
              .closest('.form-group')
              .find('select[formcontrolname="cpName"]')
              .select(randomCp);

            cy.wait(1500);

            cy.contains('label', 'Platform')
              .closest('.form-group')
              .find('select[formcontrolname="platform"]')
              .select(targetPlatform);

            cy.wait(1500);

            cy.contains('h3', 'Partner App ID')
              .closest('.panel')
              .within(() => {
                cy.get('button .glyphicon-plus').first().parent().click();

                cy.contains('h3', 'Partner App ID Detail')
                  .closest('.panel')
                  .should('be.visible')
                  .within(() => {
                    cy.get('input[formcontrolname="partnerPackageName"]').clear().type('test');

                    cy.get('select[formcontrolname="customerType"]')
                      .should('be.visible')
                      .find('option:not([disabled])')
                      .then(($options) => {
                        const options = $options.toArray() as HTMLOptionElement[];
                        const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                        if (!matched) {
                          throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                        }
                        cy.get('select[formcontrolname="customerType"]')
                          .select(matched.value.trim())
                          .should('have.value', matched.value.trim());
                        cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                      });
                    cy.wait(2000)
                    cy.contains('button', /^Add$/).should('be.visible').click();
                    cy.wait(2000)
                  });

                cy.contains('h3', 'Partner App ID Detail')
                  .closest('.panel')
                  .should(($panel) => {
                    const isHidden = $panel.attr('hidden') !== undefined ||
                      $panel.css('display') === 'none' ||
                      $panel.css('visibility') === 'hidden' ||
                      !$panel.is(':visible');
                    expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                  });
              });

            cy.wait(1500);

            cy.get('button')
              .filter(':visible')
              .contains(/^Add$/)
              .should('be.enabled')
              .click({ force: true });
          });
        });
    });
};
