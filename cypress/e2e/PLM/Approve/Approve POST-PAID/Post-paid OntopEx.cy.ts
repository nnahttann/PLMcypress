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

describe('POST-PAID OntopEx', () => {
  const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

  priceTypes.forEach((priceType) => {
    describe(`${priceType}`, () => {
      describe('Mobile', () => {
        it('MKT POSTPAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'POST', subModule: 'POST', autoSetDuration: true });
        });
        Master.afterMKTontopPOST();
      });
      describe('ENTER', () => {
        it('MKT POSTPAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'MUSIC', subModule: 'POST', autoSetDuration: true });
        });
        Master.afterMKTontopENTER();
      });
      describe('MUSIC', () => {
        it('MKT POSTPAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'MUSIC', subModule: 'POST', autoSetDuration: true });
        });
        Master.afterMKTontopMUSIC();
      });
    });
  });
});
