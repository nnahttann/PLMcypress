import * as Master from '../../../Master';
beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit(Master.urlsit);
    cy.viewport(1920, 1080);
});

describe('Mobile', () => {
    it('MKT POSTPAID role', () => {
        Master.ProjectBasicInformationCompleteOtherPOSub('onetime','OrderFee','POST');

        Master.backBacicInfo();

        //Add File
        cy.get('input[type="file"]', { timeout: 1000000 }).should('exist');
        cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
        cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

        cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/file.pdf', 'binary').then((fileContent) => {
            cy.get('input[type="file"][id="files"]').selectFile(
                {
                    contents: Cypress.Buffer.from(fileContent, 'binary'),
                    fileName: 'file.pdf',
                    mimeType: 'application/pdf',
                },
                { force: true }
            );
            Master.beforeapproveMKT();
        });
    });
    Master.afterMKTothersubgroup('OrderFee','POST');

});

