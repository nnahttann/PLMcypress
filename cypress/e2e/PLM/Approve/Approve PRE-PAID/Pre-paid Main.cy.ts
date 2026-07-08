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

describe('PRE-PAID Main', () => {
  const priceTypes: PriceType[] = ['onetime'];
  priceTypes.forEach((priceType) => {
    describe(`Standard ${priceType}`, () => {
      describe('Mobile', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'main', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTMainPRE_FullSpadFlow();
      });
    });
  });

});
