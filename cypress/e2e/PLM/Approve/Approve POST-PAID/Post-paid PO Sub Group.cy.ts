import * as Master from '../../Master';

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
  Cypress.env('formattedDateMain', undefined);
  Cypress.env('formattedDateOntop', undefined);
  Cypress.env('formattedDateOntopExtra', undefined);
  Cypress.env('formattedDateMainPONAME', undefined);
  Cypress.env('formattedDateOntopPONAME', undefined);
  Cypress.env('formattedDateOntopExtraPONAME', undefined);
});

describe('POST-PAID PO Sub Group', () => {
  const subTypes = ['AccountFee', 'CashBack', 'OrderFee', 'Service'] as const;

  subTypes.forEach((subType) => {
    describe(subType, () => {
      describe('Mobile', () => {
        it('MKT POSTPAID role', () => {
          Master.ProjectBasicInformationCompleteOtherPOSub('onetime', subType, 'POST');
          Master.backBacicInfo();
          Master.addFile();
        });
        Master.afterMKTothersubgroup(subType, 'POST');
      });
    });
  });
});
