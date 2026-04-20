// ไฟล์ test.cy.ts
import * as Master from '../../Master';

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

// Helper function สำหรับรัน test flow ทั้งหมด
const runMKTPostpaidFlow = (Module: 'POST' | 'PRE' | 'ENTER' | 'MUSIC', subModule?: string) => {
  const config: any = {
    type: 'Ontop',
    Module: Module,
    autoSetDuration: true
  };

  if (subModule) {
    config.subModule = subModule;
  }

  Master.ProjectBasicInformationComplete('onetime', 'ontop', config);
  // Master.InternetRandom('notrecurring');
};

describe('PLM', () => {
  describe('Scenario: Mob POST', () => {
    it('MKT POSTPAID role', () => {
      runMKTPostpaidFlow('POST');
    });
    Master.afterMKTontopPOST();
  });

  describe.only('Scenario: ENTER', () => {
    it('MKT POSTPAID role', () => {
      runMKTPostpaidFlow('ENTER', 'POST');
    });
    Master.afterMKTontopENTER();
  });

  describe.only('Scenario: MUSIC', () => {
    it('MKT POSTPAID role', () => {
      runMKTPostpaidFlow('MUSIC', 'POST');
    });
    Master.afterMKTontopMUSIC();
  });
});