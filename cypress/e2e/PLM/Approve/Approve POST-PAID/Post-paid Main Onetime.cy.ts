import * as Master from '../../Master';
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

describe('Mobile', () => {
  it('MKT POSTPAID role', () => {
    Master.ProjectBasicInformationComplete('onetime', 'main', { ProductClass1: 'Main', Module: 'POST',subModule:'POST' ,autoSetDuration: true });
    // Master.InternetRandom('notrecurring');
    // Master.backBacicInfo();
    // Master.addFile();
  });
  Master.afterMKTMAINPOST();
});

