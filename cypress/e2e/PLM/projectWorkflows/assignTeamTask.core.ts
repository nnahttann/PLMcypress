// ========================
// ASSIGN TEAM TASK
// ========================

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
