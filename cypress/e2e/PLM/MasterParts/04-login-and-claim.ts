// ========================
// LOGIN AND CLAIM FUNCTIONS
// ========================

export const login = (username: string, password: string): void => {
  cy.get('app-login', { timeout: 3000000 }).should('be.visible');
  cy.get('form', { timeout: 2000000 }).should('be.visible');

  cy.get('input[name="userId"]', { timeout: 2000000 })
    .should('exist')
    .should('be.visible')
    .should('not.be.disabled')
    .clear()
    .type(username, { delay: 150 });

  cy.get('input[name="pwd"]')
    .should('be.visible')
    .clear()
    .type(password, { delay: 150 });

  cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');

  cy.get('button[name="login"], button[type="submit"]')
    .contains('Login')
    .should('be.visible')
    .click();

  cy.wait('@getErrorCodes', { timeout: 30000 })
    .its('response.statusCode')
    .should('eq', 200);
};

export const loginAndWaitReady = (username: string, password: string): void => {
  login(username, password);
  cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
  cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
};

// ========================
// PAGINATION HELPER
// ========================

const searchInTableWithPagination = (
  sectionHeader: string,
  searchText: string,
  rowCallback: ($row: JQuery<HTMLElement>, index: number) => void,
  options: {
    waitAfterNext?: number;
    filterCallback?: ($row: JQuery<HTMLElement>, index: number) => boolean;
  } = {}
): void => {
  const { waitAfterNext = 4000, filterCallback } = options;

  const searchInCurrentPage = (): Cypress.Chainable<boolean> => {
    return cy.get('h3').contains(sectionHeader, { timeout: 100000 })
      .parent()
      .find('tbody tr')
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
      })
      .then(($rows) => {
        cy.log(`📊 ${sectionHeader} - Current page rows: ${$rows.length}`);

        let found = false;
        let matchingIndex = -1;

        $rows.each((index: number, row: HTMLElement) => {
          if (found) return;

          const $row = Cypress.$(row);
          const rowText = $row.text().trim();

          const matches = filterCallback
            ? filterCallback($row, index)
            : rowText.includes(searchText);

          if (matches) {
            matchingIndex = index;
            found = true;
            cy.log(`✅ Found match at row ${index}`);
          }
        });

        if (found && matchingIndex >= 0) {
          rowCallback(Cypress.$(), matchingIndex);
        }

        return cy.wrap(found);
      });
  };

  const clickNextAndWait = (): Cypress.Chainable<boolean> => {
    return cy.get('body').then(($body) => {
      const $section = $body.find(`h3:contains("${sectionHeader}")`).parent();
      const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

      if ($nextBtn.length > 0) {
        cy.log(`➡️ ${sectionHeader} - Going to next page...`);

        const firstRowTextBefore = $section.find('tbody tr').first().text().trim();

        cy.wrap($nextBtn).click();

        cy.get('h3').contains(sectionHeader, { timeout: 100000 })
          .parent()
          .find('tbody tr')
          .should(($rows) => {
            expect($rows.first().text().trim()).not.to.equal(firstRowTextBefore);
            expect($rows.text()).not.to.contain('Fetching data');
          });

        cy.wait(waitAfterNext);
        return cy.wrap(true);
      }
      return cy.wrap(false);
    });
  };

  const searchPage = (pageNum: number = 1): void => {
    cy.log(`🔍 Searching page ${pageNum}...`);

    searchInCurrentPage().then((found) => {
      if (found) {
        cy.log(`✅ Found on page ${pageNum}!`);
        return;
      }

      clickNextAndWait().then((hasNext) => {
        if (hasNext) {
          searchPage(pageNum + 1);
        } else {
          cy.log(`❌ "${searchText}" not found after ${pageNum} page(s)`);
        }
      });
    });
  };

  searchPage();
};

// ========================
// CLAIM PROJECT
// ========================

export const ClaimProject = (projectName: string, options?: { claimBy?: 'project' | 'po' }): void => {
  const poCount: number = Cypress.env('poCount') ?? 1;
  const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
  const claimBy = options?.claimBy ?? 'po';

  cy.log(`🔁 Total PO to Claim: ${poCount}`);
  cy.log(`🔑 Claim mode: ${claimBy}`);

  const MAX_PAGES = 3;

  const waitForUnassignedReady = (): Cypress.Chainable => {
    return cy
      .get('h3:contains("Unassigned Task")', { timeout: 15000 })
      .parent()
      .find('tbody tr')
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
        expect($rows.length).to.be.greaterThan(0);
      });
  };

  const claimOnce = (keyword: string): void => {
    const searchAndClaimOnce = (currentPage: number = 1): void => {
      if (currentPage > MAX_PAGES) {
        cy.log(`⚠️ Checked ${MAX_PAGES} pages, not found: "${keyword}"`);
        return;
      }

      cy.log(`🔍 [Claim-Project] Page ${currentPage} keyword: "${keyword}"`);

      waitForUnassignedReady().then(($rows) => {
        let found = false;
        let foundRowIndex = -1;

        $rows.each((index: number, row: HTMLElement) => {
          if (found) return;
          const rowText = Cypress.$(row).text().trim();
          if (rowText.includes(keyword) && !rowText.includes('Fetching data')) {
            found = true;
            foundRowIndex = index;
          }
        });

        if (found) {
          cy.log(`✅ Found - Page ${currentPage}, Row ${foundRowIndex}`);

          cy.get('h3:contains("Unassigned Task")')
            .parent()
            .find('tbody tr')
            .eq(foundRowIndex)
            .find('button.claim-top')
            .click({ force: true });

          cy.log(`✅ Claimed project (once)`);

          cy.get('h3:contains("To Do List")', { timeout: 30000 })
            .parent()
            .find('tbody tr')
            .should(($todoRows) => {
              expect($todoRows.text()).not.to.contain('Fetching data');
              expect($todoRows.text()).to.include(keyword);
            });

          cy.log(`✅ Confirmed in To Do List`);

        } else {
          cy.get('body').then(($body) => {
            const $section = $body.find('h3:contains("Unassigned Task")').parent();
            const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

            if ($nextBtn.length > 0) {
              cy.log(`➡️ Page ${currentPage} - Not found, going next...`);
              const firstRowTextBefore = $section.find('tbody tr').first().text().trim();
              cy.wrap($nextBtn).click();

              cy.get('h3:contains("Unassigned Task")', { timeout: 15000 })
                .parent()
                .find('tbody tr')
                .should(($r) => {
                  expect($r.first().text().trim()).not.to.equal(firstRowTextBefore);
                  expect($r.text()).not.to.contain('Fetching data');
                });

              searchAndClaimOnce(currentPage + 1);
            } else {
              cy.log(`📋 No more pages, "${keyword}" not found`);
            }
          });
        }
      });
    };

    searchAndClaimOnce();
  };

  const claimByPO = (remainingPOs: number, poIndex: number = 0, currentPage: number = 1): void => {
    if (remainingPOs <= 0) {
      cy.log('✅ All POs claimed and moved to To Do List');
      return;
    }

    if (currentPage > MAX_PAGES) {
      cy.log(`⚠️ Checked ${MAX_PAGES} pages, checking To Do List...`);
      return;
    }

    const keyword = allPoNames[poIndex] ?? `${projectName}_PO${poIndex + 1}`;
    cy.log(`🔍 [Claim-PO] Page ${currentPage} (Remaining: ${remainingPOs}) keyword: "${keyword}"`);

    waitForUnassignedReady().then(($rows) => {
      let found = false;
      let foundRowIndex = -1;

      $rows.each((index: number, row: HTMLElement) => {
        if (found) return;
        const rowText = Cypress.$(row).text().trim();
        if (rowText.includes(keyword) && !rowText.includes('Fetching data')) {
          found = true;
          foundRowIndex = index;
        }
      });

      if (found) {
        cy.log(`✅ Found - Page ${currentPage}, Row ${foundRowIndex}, keyword: "${keyword}"`);

        cy.get('h3:contains("Unassigned Task")')
          .parent()
          .find('tbody tr')
          .eq(foundRowIndex)
          .find('button.claim-top')
          .click({ force: true });

        cy.log(`✅ Claimed 1 PO`);

        cy.get('h3:contains("To Do List")', { timeout: 30000 })
          .parent()
          .find('tbody tr')
          .should(($todoRows) => {
            expect($todoRows.text()).not.to.contain('Fetching data');
            expect($todoRows.text()).to.include(keyword);
          });

        cy.log(`✅ PO confirmed in To Do List`);
        claimByPO(remainingPOs - 1, poIndex + 1, 1);

      } else {
        cy.get('body').then(($body) => {
          const $section = $body.find('h3:contains("Unassigned Task")').parent();
          const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

          if ($nextBtn.length > 0) {
            cy.log(`➡️ Page ${currentPage} - Not found, going next...`);
            const firstRowTextBefore = $section.find('tbody tr').first().text().trim();
            cy.wrap($nextBtn).click();

            cy.get('h3:contains("Unassigned Task")', { timeout: 15000 })
              .parent()
              .find('tbody tr')
              .should(($r) => {
                expect($r.first().text().trim()).not.to.equal(firstRowTextBefore);
                expect($r.text()).not.to.contain('Fetching data');
              });

            claimByPO(remainingPOs, poIndex, currentPage + 1);
          } else {
            cy.log(`📋 No more pages, "${keyword}" not found`);
          }
        });
      }
    });
  };

  if (claimBy === 'project') {
    claimOnce(projectName);
  } else {
    claimByPO(poCount);
  }
};
