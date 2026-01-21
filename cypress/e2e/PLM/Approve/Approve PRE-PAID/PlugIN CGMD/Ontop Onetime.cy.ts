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

  Master.ProjectBasicInformationComplete('onetime', 'ontop', config);

  // Target group
  Master.selectTargetGroup('random');

  // Remark
  cy.get('textarea[formcontrolname="remark"]').type('This is a new remark.');

  Master.PriceExcluding();

  // Target group
  Master.targetgroup();

  Master.RandomProductSpecification();
  // ProductSpec
  // const optionsToSelectProductSpec = ["Internet"];

  // optionsToSelectProductSpec.forEach(option => {
  //   cy.get('select[formcontrolname="availableListBox"]')
  //     .contains(option)
  //     .then($option => {
  //       cy.wrap($option).dblclick();
  //     });
  // });

  if (Module === 'PRE') {
    cy.get('input[formcontrolname="allowMvpn"]').eq(1).check({ force: true });
  }
  Master.Randomdropdown();
  Master.dropdownPromotionGroup();
  Master.smsWordingpre();
  // Master.RetryPattern();
  // Master.InternetRandom('notrecurring');
  Master.backBacicInfo();
  Master.addFile();
};

describe('PLM', () => {
  describe.only('Scenario: Mob', () => {
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
    Master.afterMKTontopPREENTERPlugin();
  });
});