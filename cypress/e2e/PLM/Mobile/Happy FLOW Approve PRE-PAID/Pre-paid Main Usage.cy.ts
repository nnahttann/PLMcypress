import * as Master from '../../Master';
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

describe('Mobile', () => {
  it('MKT POSTPAID role', () => {
    Master.ProjectBasicInformationComplete('usage', 'main', { type: 'Main', segment: 'PRE', autoSetDuration: true });

    //targetgroup
    Master.selectTargetGroup('mass');

    //Remark 
    cy.get('textarea[formcontrolname="remark"]').type('This is a new remark.');

    Master.PriceExcluding();

    //*Target group
    Master.targetgroup();

    //ProductSpec
    const optionsToSelectProductSpec = [
      // "AI IP Camera",
      "AIS Secure Net",
      // "Apple Care",
      // "Cloud Game",
      // "Cloud PC",
      // "Content VDO",
      // "Flowaccount",
      // "Internet",
      // "MMS",
      // "Mobile Care",
      // "SMS",
      // "Vertical App",
      // "Voice",
      // "WiFi",
      // "Youtube Premium"
    ];

    optionsToSelectProductSpec.forEach(option => {
      cy.get('select[formcontrolname="availableListBox"]')
        .contains(option)
        .then($option => {
          cy.wrap($option).dblclick();
        });
    });
    cy.scrollTo('top');
    //allowMvpn
    // cy.get('input[formcontrolname="allowMvpn"]').eq(1).check({ force: true });
    // Auto Add Service 5G Select the second option ('Auto Add')
    // cy.get('#service-options').select(1);

    Master.InternetLimitedDataOnly();

    Master.smsWordingpre();

    Master.backBacicInfo();

    //Add File
    cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
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
  Master.afterMKTMainPRE_FullSpadFlow();
});

