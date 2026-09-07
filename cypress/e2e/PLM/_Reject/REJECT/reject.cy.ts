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
    timeout: 600000,
    onBeforeLoad: (win) => {
      win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
    }
  });

  cy.get('app-login', { timeout: 600000 }).should('be.visible');
  cy.get('input[name="userId"], input[name="pwd"]', { timeout: 600000 }).should('be.visible');
});

describe('PRE-PAID Ontop', () => {
  const priceTypes: PriceType[] = ['onetime'];

  priceTypes.forEach((priceType) => {
    describe(`Standard ${priceType}`, () => {
      describe('Mobile', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontop', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTontopPRE();
      });
      describe('ENTER', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontop', { Module: 'ENTER', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTontopPREENTER();
      });
      describe('MUSIC', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontop', { Module: 'MUSIC', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTontopPREMUSIC();
      });
    });
  });
});

describe('PRE-PAID Ontop Plugig', () => {
const priceTypes: PriceType[] = ['recurring'];

  priceTypes.forEach((priceType) => {
    describe(`Standard ${priceType}`, () => {
      describe('Mobile', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontop', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTontopPREPlugin();
      });
      describe('ENTER', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontop', { Module: 'ENTER', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTontopPREMusicPlugin();
      });
      describe('MUSIC', () => {
        it('MKT PRE-PAID role', () => {
          Master.ProjectBasicInformationComplete(priceType, 'ontop', { Module: 'MUSIC', subModule: 'PRE', autoSetDuration: true });
        });
        Master.afterMKTontopPREENTERPlugin();
      });
    });
  });
});
