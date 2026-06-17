import * as Master from '../../Master';

type PriceType = 'onetime' | 'recurring' | 'usage';

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

describe('POST-PAID Main', () => {
  const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

  priceTypes.forEach((priceType) => {
    describe(`MKT POSTPAID ${priceType}`, () => {
      it('MKT POSTPAID role', () => {
        Master.ProjectBasicInformationComplete(priceType, 'main', { Module: 'POST', subModule: 'POST', autoSetDuration: true });
      });
      if (priceType === 'usage') {
        Master.afterMKTMainUsagePOST();
      } else {
        Master.afterMKTMAINPOST();
      }
    });
  });
});
