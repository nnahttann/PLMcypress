// ========================
// ADD FILE
// ========================

import { beforeapproveMKT } from '../roleExecution/beforeApproveMkt.core';

export const addFile = (): void => {
  cy.get('input[type="file"]', { timeout: 10000 }).should('exist');

  cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/1.txt', 'binary').then((fileContent) => {
    cy.get('input[type="file"][id="files"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: '1.txt',
        mimeType: 'application/txt',
      },
      { force: true }
    );
  });

  // ✅ wait หลัง selectFile — requests ถูก trigger จาก file upload
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  beforeapproveMKT();
};
