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
// PAGINATION HELPER - FIXED ASYNC CHAIN
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
          // ✅ ส่ง empty jQuery + index เข้า callback
          // callback ต้องไม่ใช้ $row — ให้ re-query เองด้วย sectionHeader/searchText
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

