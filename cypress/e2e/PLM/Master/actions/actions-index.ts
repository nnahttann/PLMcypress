// ========================
// ACTION FUNCTIONS
// Claim, Approve, Assign
// ========================

import { searchInTableWithPagination } from '../core/core-index';

export const ClaimProject = (projectName: string, options?: { claimBy?: 'project' | 'po' }): void => {
  const poCount: number = Cypress.env('poCount') ?? 1;
  const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
  const claimBy = options?.claimBy ?? 'po';

  cy.log(`🔁 Total PO to Claim: ${poCount}`);
  cy.log(`🔑 Claim mode: ${claimBy}`);

  const MAX_PAGES = 3;

  const waitForUnassignedReady = (): Cypress.Chainable => {
    return cy
      .get('h3:contains("Unassigned Task")', { timeout: 10000 })
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

              cy.get('h3:contains("Unassigned Task")', { timeout: 10000 })
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

            cy.get('h3:contains("Unassigned Task")', { timeout: 10000 })
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

export const approveProject = (projectName: string): void => {
  searchInTableWithPagination(
    'To Do List',
    projectName,
    (_$row: JQuery<HTMLElement>, _index: number) => {
      cy.get('h3:contains("To Do List")')
        .parent()
        .contains('td[colspan="2"]', projectName)
        .closest('tr.cursor-point')
        .as('approveRow');

      cy.get('@approveRow').should('be.visible');
      cy.get('@approveRow').click();

      cy.log(`✅ Successfully entered approval page: ${projectName}`);
    },
    {
      waitAfterNext: 2000,
      filterCallback: ($row: JQuery<HTMLElement>) => {
        const rowText = $row.text().trim();
        return rowText.includes(projectName) && !rowText.includes('Fetching data');
      }
    }
  );
};

export function assignTeamTask(
  projectName: string,
  assignee: string,
  billingSystem: string = '',
  taskHeader: 'To Do List' | 'Unassigned Task' = 'To Do List'
): void {
  cy.log(`🎯 Starting assignTeamTask for project: ${projectName}`);
  cy.log(`👤 Assign to: ${assignee}`);
  cy.log(`💳 Billing System: ${billingSystem || '(none)'}`);

  const retrySearch = (maxRetries: number = 3, delayMs: number = 1500): void => {
    if (maxRetries <= 0) {
      cy.log(`❌ Failed to find project after multiple retries`);
      return;
    }

    cy.wait(delayMs);
    cy.reload();
    cy.get('app-workspace', { timeout: 30000 }).should('be.visible');

    cy.get(`h3:contains("${taskHeader}")`, { timeout: 10000 })
      .parent()
      .find('tbody tr')
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
      })
      .then(($rows) => {
        let found = false;
        let foundRowIndex = -1;

        $rows.each((index: number, row: HTMLElement) => {
          if (found) return;
          const rowText = Cypress.$(row).text().trim();
          if (rowText.includes(projectName) && !rowText.includes('Fetching data')) {
            found = true;
            foundRowIndex = index;
          }
        });

        if (found) {
          cy.log(`✅ Found at retry - Row ${foundRowIndex}`);
          cy.get(`h3:contains("${taskHeader}")`)
            .parent()
            .find('tbody tr')
            .eq(foundRowIndex)
            .find('button.assign-task-top')
            .click({ force: true });

          cy.get('mat-dialog-container', { timeout: 10000 })
            .should('be.visible')
            .within(() => {
              cy.get('mat-form-field')
                .contains('label', /Assign to|User/i)
                .parent()
                .next('div')
                .find('mat-select')
                .click();

              cy.get('mat-option')
                .contains(assignee)
                .click({ force: true });

              if (billingSystem) {
                cy.get('mat-form-field')
                  .contains('label', /Billing System/i)
                  .parent()
                  .next('div')
                  .find('mat-select')
                  .click();

                cy.get('mat-option')
                  .contains(billingSystem)
                  .click({ force: true });
              }

              cy.contains('button', /Save|Confirm|ตกลง/i).click();
            });

          cy.get('h3:contains("Unassigned Task")', { timeout: 15000 })
            .parent()
            .find('tbody tr')
            .should(($rows) => {
              expect($rows.text()).not.to.contain('Fetching data');
              expect($rows.text()).not.to.include(projectName);
            });

          cy.log(`✅ Assigned successfully`);
        } else {
          cy.log(`⚠️ Not found, retries left: ${maxRetries - 1}`);
          retrySearch(maxRetries - 1, delayMs);
        }
      });
  };

  cy.get(`h3:contains("${taskHeader}")`, { timeout: 10000 })
    .parent()
    .find('tbody tr')
    .should(($rows) => {
      expect($rows.text()).not.to.contain('Fetching data');
    })
    .then(($rows) => {
      let found = false;
      let foundRowIndex = -1;

      $rows.each((index: number, row: HTMLElement) => {
        if (found) return;
        const rowText = Cypress.$(row).text().trim();
        if (rowText.includes(projectName) && !rowText.includes('Fetching data')) {
          found = true;
          foundRowIndex = index;
        }
      });

      if (found) {
        cy.log(`✅ Found immediately - Row ${foundRowIndex}`);
        cy.get(`h3:contains("${taskHeader}")`)
          .parent()
          .find('tbody tr')
          .eq(foundRowIndex)
          .find('button.assign-task-top')
          .click({ force: true });

        cy.get('mat-dialog-container', { timeout: 10000 })
          .should('be.visible')
          .within(() => {
            cy.get('mat-form-field')
              .contains('label', /Assign to|User/i)
              .parent()
              .next('div')
              .find('mat-select')
              .click();

            cy.get('mat-option')
              .contains(assignee)
              .click({ force: true });

            if (billingSystem) {
              cy.get('mat-form-field')
                .contains('label', /Billing System/i)
                .parent()
                .next('div')
                .find('mat-select')
                .click();

              cy.get('mat-option')
                .contains(billingSystem)
                .click({ force: true });
            }

            cy.contains('button', /Save|Confirm|ตกลง/i).click();
          });

        cy.get('h3:contains("Unassigned Task")', { timeout: 15000 })
          .parent()
          .find('tbody tr')
          .should(($rows) => {
            expect($rows.text()).not.to.contain('Fetching data');
            expect($rows.text()).not.to.include(projectName);
          });

        cy.log(`✅ Assigned successfully`);
      } else {
        cy.log(`⚠️ Not found initially, starting retry...`);
        retrySearch();
      }
    });
}
