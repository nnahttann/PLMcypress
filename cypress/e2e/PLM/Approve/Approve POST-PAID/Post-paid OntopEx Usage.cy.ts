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
const runMKTPostpaidFlow = (Module: 'POST' | 'PRE' |'ENTER' | 'MUSIC', subModule?: string) => {
  const config: any = {
    type: 'Ontop',
    Module: Module,
    autoSetDuration: true
  };

  if (subModule) {
    config.subModule = subModule;
  }

  Master.ProjectBasicInformationComplete('usage', 'ontopextra', config);

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
  Master.InternetLimitedDataOnly();
  Master.smsWording();
  Master.backBacicInfo();

  Master.addFile();
};

describe('PLM', () => {
  describe('Scenario: Mob POST', () => {
    it('MKT POSTPAID role', () => {
      runMKTPostpaidFlow('POST');
    });
    Master.afterMKTontopPOST();
  });

  describe('Scenario: ENTER', () => {
    it('MKT POSTPAID role', () => {
      runMKTPostpaidFlow('ENTER', 'POST');
    });
    Master.afterMKTontopENTER();
  });

  describe('Scenario: MUSIC', () => {
    it('MKT POSTPAID role', () => {
      runMKTPostpaidFlow('MUSIC', 'POST');
    });
    Master.afterMKTontopMUSIC();
  });
});