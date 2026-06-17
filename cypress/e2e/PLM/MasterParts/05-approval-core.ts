export const approveProject = (projectName: string): void => {
  searchInTableWithPagination(
    'To Do List',
    projectName,
    (_$row, _index) => {
      // ✅ re-query ใหม่ทั้งหมด ไม่แตะ _$row
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
      filterCallback: ($row) => {
        const rowText = $row.text().trim();
        return rowText.includes(projectName) && !rowText.includes('Fetching data');
      }
    }
  );
};
// ========================
// ASSIGN TEAM TASK
// ========================

export function assignTeamTask(
  taskIdentifier: string,
  assignee: string,
  uniqueKeyword: string = ''
): void {
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  cy.get('h3').contains('Team Task').should('be.visible');
  cy.wait('@getRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  const partialIdentifier = taskIdentifier.split('_')[0];
  cy.log(`🔍 Searching for: "${partialIdentifier}" keyword: "${uniqueKeyword}"`);

  if (!partialIdentifier) {
    throw new Error(`❌ taskIdentifier is empty — cannot search`);
  }

  const findAndAssignOnCurrentPage = (): void => {
    cy.get('tbody tr').then(($rows) => {
      const matchedRow = $rows.filter((_, el) => {
        const $el = Cypress.$(el);
        const projectCode = $el.find('td:nth-child(1) div').text().trim();
        const productName = $el.find('td:nth-child(2) div').text().trim();

        const hasProject =
          productName.includes(partialIdentifier) ||
          projectCode.includes(partialIdentifier);

        const hasKeyword = uniqueKeyword
          ? $el
            .find('td')
            .toArray()
            .some((td) => Cypress.$(td).text().trim().includes(uniqueKeyword))
          : true;

        return hasProject && hasKeyword;
      });

      if (matchedRow.length > 0) {
        const productNameText = Cypress.$(matchedRow[0])
          .find('td:nth-child(2) div')
          .text()
          .trim();
        cy.log(`✅ Found row — Product: "${productNameText}"`);

        const $row = matchedRow.first();
        cy.wrap($row).scrollIntoView().should('be.visible');

        // Focus + trigger Angular population ก่อน
        cy.wrap($row)
          .find('select.form-control.input-sm')
          .as('assigneeDropdown')
          .scrollIntoView()
          .focus()
          .trigger('mousedown', { force: true })
          .wait(1000); // รอ Angular populate options

        // ตรวจว่า option มีแล้ว
        cy.get('@assigneeDropdown')
          .find(`option`)
          .should('have.length.greaterThan', 1); // มากกว่า placeholder

        // set value ผ่าน jQuery + dispatch change
        cy.get('@assigneeDropdown').then(($select) => {
          $select.val(assignee);
          $select[0].dispatchEvent(new Event('change', { bubbles: true }));
        });

        cy.get('@assigneeDropdown').should('have.value', assignee);
        cy.log(`✅ Selected assignee: "${assignee}"`);

        // register alert BEFORE click
        cy.on('window:alert', (text) => {
          cy.log(`🔔 Alert: "${text}"`);
          expect(text).to.include('success');
        });

        cy.wrap($row)
          .find('button.btn-info')
          .filter((_, el) => {
            const txt = Cypress.$(el).text().trim();
            return txt === 'Set' || txt === 'Reassign';
          })
          .first()
          .should('not.be.disabled')
          .click({ force: true });

        cy.wait('@getRequest', { timeout: 30000 })
          .its('response.statusCode')
          .should('eq', 200);
        cy.log('✅ assignTeamTask complete');
      } else {
        cy.get('ul.pagination li').then(($items) => {
          const nextItem = $items.filter((_, li) => {
            return (
              Cypress.$(li).text().trim() === 'Next' &&
              !Cypress.$(li).hasClass('disabled')
            );
          });

          if (nextItem.length > 0) {
            cy.log(`➡️ Not found on this page — going next`);
            cy.wrap(nextItem.first()).find('a').click();
            cy.wait('@getRequest', { timeout: 30000 })
              .its('response.statusCode')
              .should('eq', 200);
            findAndAssignOnCurrentPage();
          } else {
            throw new Error(
              `❌ "${partialIdentifier}" (keyword: "${uniqueKeyword}") not found on any page`
            );
          }
        });
      }
    });
  };

  findAndAssignOnCurrentPage();
}
// ========================
// APPROVAL FLOW BASE FUNCTIONS
// ========================

const createFullPageApprovalFlow = (
  projectName: string,
  taskListHeader: TaskListHeader,
  expectedUrl: string,
  coreTaskCallback: CoreTaskCallback,
  finalAction: FinalAction
): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains(taskListHeader).parent().within(() => {
    cy.get('tbody tr').then(($rows) => {
      $rows.each((index, row) => {
        const text = Cypress.$(row).text().trim();
        cy.log(`Row ${index}: ${text.substring(0, 100)}`);
        if (text.includes(projectName)) {
          cy.log(`✅✅✅ MATCH at row ${index}`);
        }
      });
    });
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span').contains('Approve').click();
      });
  });

  cy.url({ timeout: 600000 }).should('include', expectedUrl);

  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        expect(interception.response).to.exist;
        expect(interception.response!.statusCode).to.eq(200);
      });
    });

  coreTaskCallback();

  switch (finalAction) {
    case 'AlertAndLogout':
      cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').click();
      break;
    case 'ComplexLogout':
      cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').click();
      break;
    case 'StopAfterCore':
      cy.log('Core task finished. Stopping as requested.');
      break;
  }
};

const createSimplePageApprovalFlow = (
  projectName: string,
  taskListHeader: TaskListHeader,
  expectedUrl: string,
  coreTaskCallback: CoreTaskCallback
): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');

  cy.get('h3').contains(taskListHeader).parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span').contains('Approve').click();
      });
  });

  cy.url({ timeout: 60000 }).should('include', expectedUrl);
  coreTaskCallback();
  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.contains('button', 'Logout').click();
};

// ========================
// PROJECT NAME GETTERS
// ========================

