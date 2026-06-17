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
    Master.ProjectBasicInformationComplete('onetime', 'ontopextra', { Module: 'POST', subModule: 'POST', autoSetDuration: true });
  });
  Master.afterMKTontopPOST();
});
describe.only('ENTER', () => {
  it('MKT PRE-PAID role', () => {
    Master.ProjectBasicInformationComplete('onetime', 'ontopextra', { Module: 'MUSIC', subModule: 'POST', autoSetDuration: true });
  });
  Master.afterMKTontopENTER();
});
describe('MUSIC', () => {
  it('MKT PRE-PAID role', () => {
    Master.ProjectBasicInformationComplete('onetime', 'ontopextra', { Module: 'MUSIC', subModule: 'POST', autoSetDuration: true });
  });
  Master.afterMKTontopMUSIC();
});