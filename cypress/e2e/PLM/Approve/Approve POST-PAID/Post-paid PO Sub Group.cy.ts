import * as Master from '../../Master';

let isFirstRun = true;

beforeEach(() => {
  if (isFirstRun) {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    isFirstRun = false;
  }

  cy.visit(Master.urlsit, {
    timeout: 60000,
    onBeforeLoad: (win) => {
      win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
    }
  });

  cy.get('app-login', { timeout: 60000 }).should('be.visible');
  cy.get('input[name="userId"], input[name="pwd"]', { timeout: 60000 }).should('be.visible');

  // Reset env variables
  Cypress.env('formattedDateMain', undefined);
  Cypress.env('formattedDateOntop', undefined);
  Cypress.env('formattedDateOntopExtra', undefined);
  Cypress.env('formattedDateMainPONAME', undefined);
  Cypress.env('formattedDateOntopPONAME', undefined);
  Cypress.env('formattedDateOntopExtraPONAME', undefined);
});

describe('POST-PAID PO Sub Group', () => {
const subTypes = ['Service'] as const;
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
