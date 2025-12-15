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

// Helper function สำหรับรัน test flow ทั้งหมด
const runMKTPostpaidFlow = (Module: 'POST' | 'PRE' | 'ENTER' | 'MUSIC', subModule?: string) => {
  const config: any = {
    type: 'OntopExtra',
    Module: Module,
    autoSetDuration: true
  };

  if (subModule) {
    config.subModule = subModule;
  }

  Master.ProjectBasicInformationComplete('recurring', 'ontopextra', config);

  // Target group
  Master.selectTargetGroup('random');

  // Remark
  cy.get('textarea[formcontrolname="remark"]').type('This is a new remark.');

  Master.PriceExcluding();

  // Target group
  Master.targetgroup();

  // ProductSpec
  const optionsToSelectProductSpec = ["Internet"];

  optionsToSelectProductSpec.forEach(option => {
    cy.get('select[formcontrolname="availableListBox"]')
      .contains(option)
      .then($option => {
        cy.wrap($option).dblclick();
      });
  });

  if (Module === 'PRE') {
    // allowMvpn สำหรับ PRE Module
    cy.get('input[formcontrolname="allowMvpn"]').eq(1).check({ force: true });
    Master.dropdownPromotionGroup();
    Master.InternetRandom();
    Master.smsWordingpre();
    Master.RetryPattern();
    Master.backBacicInfo();
  } else {
    Master.dropdownPromotionGroup();
    Master.InternetRandomPRERecurring();
    Master.smsWordingpre();
    Master.RetryPattern();
    Master.backBacicInfo();
  }
  Master.addFile();
};

describe('PLM', () => {
  describe('Scenario: Mob PRE', () => {
    it('MKT PREPAIDrole', () => {
      runMKTPostpaidFlow('PRE');
    });
    Master.afterMKTontopPRE();
  });

  describe('Scenario: ENTER', () => {
    it('MKT PREPAIDrole', () => {
      runMKTPostpaidFlow('ENTER', 'PRE');
    });
    Master.afterMKTontopPREENTER();
  });

  describe('Scenario: MUSIC', () => {
    it('MKT PREPAIDrole', () => {
      runMKTPostpaidFlow('MUSIC', 'PRE');
    });
    Master.afterMKTontopPREMUSIC();
  });
});