import { searchInTableWithPagination } from '../helpers/pagination';

// ========================================
// CLAIM PROJECT
// ========================================

/**
 * Claims a project from Unassigned Task
 * Searches through pages and claims the project matching formattedDate
 */
export const ClaimProject = (formattedDate: string): void => {
  let currentPage = 1;
  const MAX_PAGES = 5;

  const searchAndClaim = (): void => {
    if (currentPage > MAX_PAGES) {
      cy.log(`⚠️ Checked ${MAX_PAGES} pages in Unassigned Task, checking To Do List...`);
      checkToDoList();
      return;
    }

    cy.log(`🔍 [Claim] Searching Unassigned Task - Page ${currentPage}...`);

    cy.get('h3').contains('Unassigned Task', { timeout: 100000 })
      .parent()
      .find('tbody tr')
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
      });

    cy.get('h3').contains('Unassigned Task', { timeout: 100000 })
      .parent()
      .find('tbody tr')
      .then(($rows) => {
        cy.log(`📊 Unassigned Task Page ${currentPage} - ${$rows.length} rows`);

        let found = false;

        $rows.each((index, row) => {
          if (found) return;

          const $row = Cypress.$(row);
          const rowText = $row.text().trim();

          if (rowText.includes(formattedDate) && !rowText.includes('Fetching data')) {
            found = true;
            cy.log(`✅ Found in Unassigned Task - Page ${currentPage}, Row ${index}`);

            cy.wrap($row)
              .find('button.claim-top')
              .should('be.visible')
              .click();

            cy.log(`✅ Successfully clicked claim: ${formattedDate}`);

            // 1. รอให้ server process การ claim และ UI เริ่ม re-render
            cy.wait(4000);

            // 2. รอให้ To Do List โหลดข้อมูลใหม่เสร็จ (หาย Fetching data)
            cy.get('h3').contains('To Do List', { timeout: 100000 })
              .parent()
              .find('tbody tr')
              .should(($todoRows) => {
                expect($todoRows.text()).not.to.contain('Fetching data');
              });

            // 3. Assert ว่า project ขึ้น To Do List จริงๆ ก่อนทำต่อ
            cy.get('h3').contains('To Do List', { timeout: 100000 })
              .parent()
              .find('tbody tr')
              .should(($todoRows) => {
                expect($todoRows.text()).to.contain(formattedDate);
              });

            cy.log(`✅ Project confirmed in To Do List: ${formattedDate}`);
          }
        });

        if (found) return;

        // ไม่เจอในหน้านี้ → ไปหน้าถัดไป
        cy.get('body').then(($body) => {
          const $section = $body.find('h3:contains("Unassigned Task")').parent();
          const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

          if ($nextBtn.length > 0) {
            cy.log(`➡️ Unassigned Task Page ${currentPage} - Not found, going to next page...`);
            cy.wrap($nextBtn).click();

            cy.get('h3').contains('Unassigned Task', { timeout: 100000 })
              .parent()
              .find('tbody tr')
              .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
              });

            cy.wait(4000);
            currentPage++;
            searchAndClaim();
          } else {
            cy.log(`📋 Not found in Unassigned Task, checking To Do List...`);
            checkToDoList();
          }
        });
      });
  };

  // เช็ค To Do List หลังจากค้นหา Unassigned Task ครบแล้ว
  const checkToDoList = (): void => {
    cy.get('body').then(($body) => {
      const $todoSection = $body.find('h3:contains("To Do List")').parent();
      const todoText = $todoSection.find('tbody tr').text();

      if (todoText.includes(formattedDate)) {
        cy.log(`✅ Project already in To Do List! (claimed by someone else or previously)`);
      } else {
        cy.log(`⚠️ Project "${formattedDate}" not found in Unassigned Task or To Do List`);
        cy.log(`💡 Possible reasons:`);
        cy.log(`   1. Project name mismatch`);
        cy.log(`   2. Project already processed by someone else`);
        cy.log(`   3. Project is in different status`);
      }
    });
  };

  searchAndClaim();
};

// ========================================
// APPROVE PROJECT
// ========================================

/**
 * Approves a project by finding it in To Do List
 * and clicking the approve button
 */
export const approveProject = (projectName: string): void => {
  searchInTableWithPagination(
    'To Do List',
    projectName,
    ($row) => {
      cy.wrap($row)
        .find('span')
        .should('be.visible')
        .click();
      cy.log(`✅ Successfully approved project: ${projectName}`);
    },
    {
      waitAfterNext: 2000,
      filterCallback: ($row) => {
        const rowText = $row.text().trim();
        return rowText.includes(projectName) && !rowText.includes('Fetching data');
      }
    }
  );
};

// ========================================
// ASSIGN TEAM TASK
// ========================================

/**
 * Assigns a team task to a specific assignee
 * Searches through pages and assigns the task with given identifier and keyword
 */
export function assignTeamTask(taskIdentifier: string, assignee: string, uniqueKeyword: string = ''): void {

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  cy.get('h3').contains('Team Task').should('be.visible');
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  const partialIdentifier = taskIdentifier.split('_')[0];
  cy.log(`🔍 Searching for: "${partialIdentifier}" keyword: "${uniqueKeyword}"`);

  if (!partialIdentifier) {
    throw new Error(`❌ taskIdentifier is empty — cannot search`);
  }

  const findAndAssignOnCurrentPage = (): void => {
    cy.get('tbody tr').then(($rows) => {
      const matchedRow = $rows.filter((_, el) => {
        const $el = Cypress.$(el);
        const projectCode = $el.find('td:nth-child(1)').text().trim();
        const productName = $el.find('td:nth-child(2)').text().trim();

        const hasProject = productName.includes(partialIdentifier) || projectCode.includes(partialIdentifier);

        // ✅ ค้นหา keyword ใน ALL cells — รองรับ column layout ต่างกันระหว่าง role
        const hasKeyword = uniqueKeyword
          ? $el.find('td').toArray().some(td => Cypress.$(td).text().trim().includes(uniqueKeyword))
          : true;

        return hasProject && hasKeyword;
      });

      if (matchedRow.length > 0) {
        cy.log(`✅ Found row — Product: "${Cypress.$(matchedRow[0]).find('td:nth-child(2)').text().trim()}"`);
        cy.wrap(matchedRow.first()).as('taskRow');
        cy.get('@taskRow').scrollIntoView().should('be.visible');

        cy.get('@taskRow').within(() => {
          cy.get('select.form-control.input-sm').as('assigneeDropdown');

          // ✅ click parent <td> เพื่อ trigger Angular API load options (ไม่ใช่ select โดยตรง)
          cy.get('@assigneeDropdown').parent().click();

          // dispatch events เพื่อให้ Angular change detection รับรู้
          cy.get('@assigneeDropdown').then(($select) => {
            const el = $select[0];
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            el.dispatchEvent(new FocusEvent('focus', { bubbles: true, cancelable: true }));
          });

          // รอ option โหลดเข้ามาใน DOM
          cy.get('@assigneeDropdown')
            .find(`option[value="${assignee}"]`, { timeout: 30000 })
            .should('have.length.gte', 1);

          cy.get('@assigneeDropdown').then(($select) => {
            $select.val(assignee);
            $select[0].dispatchEvent(new Event('change', { bubbles: true }));
          });

          cy.get('@assigneeDropdown').should('have.value', assignee);
          cy.contains('span', 'Set')
            .closest('button')
            .should('not.be.disabled')
            .click();

          // ✅ ไม่มี cy.* ใน callback — resolve ทันทีที่ alert มา
          const alertPromise = new Cypress.Promise<void>((resolve, reject) => {
            cy.once('window:alert', (text) => {
              if (text.includes('Reassign success')) {
                resolve();
              } else {
                reject(new Error(`❌ Unexpected alert: "${text}"`));
              }
            });
          });

          cy.wrap(alertPromise, { timeout: 60000 });
          cy.log('🔔 Alert confirmed: Reassign success');
        });

      } else {
        cy.get('ul.pagination li').then(($items) => {
          const nextItem = $items.filter((_, li) => {
            return Cypress.$(li).text().trim() === 'Next' &&
              !Cypress.$(li).hasClass('disabled');
          });

          if (nextItem.length > 0) {
            cy.log(`➡️ Not found — going to next page`);
            cy.wrap(nextItem.first()).find('a').click();
            cy.wait('@getRequest', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
            findAndAssignOnCurrentPage();
          } else {
            throw new Error(`❌ "${partialIdentifier}" (keyword: "${uniqueKeyword}") not found on any page`);
          }
        });
      }
    });
  };

  findAndAssignOnCurrentPage();
}
