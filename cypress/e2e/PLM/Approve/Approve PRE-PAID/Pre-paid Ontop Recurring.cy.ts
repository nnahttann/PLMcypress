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
const runMKTPostpaidFlow = (Module: 'POST' |'PRE' | 'ENTER' | 'MUSIC', subModule?: string) => {
  const config: any = {
    type: 'Ontop',
    Module: Module,
    autoSetDuration: true
  };

  if (subModule) {
    config.subModule = subModule;
  }

  Master.ProjectBasicInformationComplete('recurring', 'ontop', config);

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
  Master.dropdownPromotionGroup();
  Master.InternetLimitedDataOnlyPRERecurring();
  Master.smsWordingpre();
  Master.backBacicInfo();

  // Add File
  cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

Master.addFile();
};

describe.only('PLM', () => {
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