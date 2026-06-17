// ไฟล์ test.cy.ts
import * as Master from '../../Master';

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
    Master.ProjectBasicInformationComplete('onetime', 'ontop', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true });
  });
  Master.afterMKTontopPRE();
});
describe.only('ENTER', () => {
  it('MKT PRE-PAID role', () => {
    Master.ProjectBasicInformationComplete('onetime', 'ontop', { Module: 'ENTER', subModule: 'PRE', autoSetDuration: true });
  });
  Master.afterMKTontopPREENTER();
});
describe('MUSIC', () => {
  it('MKT PRE-PAID role', () => {
    Master.ProjectBasicInformationComplete('onetime', 'ontop', { Module: 'MUSIC', subModule: 'PRE', autoSetDuration: true });
  });
  Master.afterMKTontopPREMUSIC();
});