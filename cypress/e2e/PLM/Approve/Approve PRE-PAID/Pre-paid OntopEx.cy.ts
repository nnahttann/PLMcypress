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

describe('PRE-PAID OntopEx', () => {
  const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

  priceTypes.forEach((priceType) => {
    describe(`Standard ${priceType}`, () => {
      describe('Mobile', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTontopPRE();
      });
      describe('ENTER', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'ENTER', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTontopPREENTER();
      });
      describe('MUSIC', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'MUSIC', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTontopPREMUSIC();
      });
    });
  });

  priceTypes.forEach((priceType) => {
    describe(`PlugIN ${priceType}`, () => {
      describe('Mobile', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true, Plugin: 'Pl' });
        });
        Master.afterMKTontopPRE();
      });
      describe('ENTER', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'MUSIC', subModule: 'PRE', autoSetDuration: true, Plugin: 'Pl' });
        });
        Master.afterMKTontopPREENTER();
      });
      describe('MUSIC', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'MUSIC', subModule: 'PRE', autoSetDuration: true, Plugin: 'Pl' });
        });
        Master.afterMKTontopPREMUSIC();
      });
    });
  });
});
