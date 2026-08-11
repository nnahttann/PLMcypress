import * as Master from '../../Master';

type PriceType = 'onetime' | 'recurring' | 'usage';

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
    onBeforeLoad: (win) => {
      win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
    }
  });
  
  // Reset env variables
  Cypress.env('formattedDateMain', undefined);
  Cypress.env('formattedDateOntop', undefined);
  Cypress.env('formattedDateOntopExtra', undefined);
  Cypress.env('formattedDateMainPONAME', undefined);
  Cypress.env('formattedDateOntopPONAME', undefined);
  Cypress.env('formattedDateOntopExtraPONAME', undefined);
});

describe('PRE-PAID PO Sub Group', () => {
  const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

  describe('OrderFee', () => {
    priceTypes.forEach((priceType) => {
      describe(`${priceType}`, () => {
        describe('Mobile', () => {
          it('MKT PRE-PAID role', () => {
            Master.ProjectBasicInformationCompleteOtherPOSub(priceType, 'OrderFee', 'PRE');
            Master.backBacicInfo();
            Master.addFile();
          });
          Master.afterMKTothersubgroup('OrderFee', 'PRE');
        });
      });
    });
  });

  describe('Service', () => {
    priceTypes.forEach((priceType) => {
      describe(`${priceType}`, () => {
        describe('Mobile', () => {
          it('MKT PRE-PAID role', () => {
            Master.ProjectBasicInformationCompleteOtherPOSub(priceType, 'Service', 'PRE');
            Master.backBacicInfo();
            Master.addFile();
          });
          Master.afterMKTothersubgroup('Service', 'PRE');
        });
      });
    });
  });
});
