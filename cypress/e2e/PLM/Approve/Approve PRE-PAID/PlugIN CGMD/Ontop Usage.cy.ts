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

const runMKTprepaidFlow = (Module: 'pre' | 'PRE' | 'ENTER' | 'MUSIC', subModule?: string) => {
  const config: any = {
    type: 'Ontop',
    Module: Module,
    autoSetDuration: true,
    Plugin: 'Pl'
  };
  if (subModule) {
    config.subModule = subModule;
  }

  Master.ProjectBasicInformationComplete('usage', 'ontop', config);
};

describe('PLM', () => {
  describe('Scenario: Mob', () => {
    it('MKT PREPAIDrole', () => {
      runMKTprepaidFlow('PRE');
    });
    Master.afterMKTOntop_NotComplex();
  });
  describe('Scenario: ENTER', () => {
    it('MKT PREPAIDrole', () => {
      runMKTprepaidFlow('ENTER', 'PRE');
    });
    Master.afterMKTontopPREENTERPlugin();
  });
  describe('Scenario: MUSIC', () => {
    it('MKT PREPAIDrole', () => {
      runMKTprepaidFlow('MUSIC', 'PRE');
    });
    Master.afterMKTontopPREMusicPlugin();
  });
});