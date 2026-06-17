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
  it('MKT PRE-PAID role', () => {
    Master.ProjectBasicInformationComplete('recurring', 'main', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true,Plugin: 'Pl'});
  });
  Master.afterMKTMainPRE_FullSpadFlow();
});