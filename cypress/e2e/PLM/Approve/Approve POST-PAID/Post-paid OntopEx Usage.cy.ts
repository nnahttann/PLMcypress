import * as Master from '../../../Master';
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
  it('MKT PREPAID role', () => {
    Master.ProjectBasicInformationComplete('onetime', 'main', {
      ProductClass1: 'Main',
      Module: 'PRE',
      autoSetDuration: true,
      Plugin: 'Pl'
    });
  });
  Master.afterMKTMainPRE_NotComplex();
});

