// ไฟล์ test.cy.ts
import * as Master from '../../Master';

// ใช้ fastVisit แทน cy.visit ปกติ
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  
  // ใช้ fastVisit แทน cy.visit ปกติ
  Master.fastVisit();
  cy.viewport(1920, 1080);
});

const runMKTPostpaidFlow = (segment: 'POST' |'PRE' | 'ENTER' | 'MUSIC', subSegment?: string) => {
  const config: any = {
    type: 'Ontop',
    segment: segment,
    autoSetDuration: true
  };

  if (subSegment) {
    config.subSegment = subSegment;
  }

  Master.ProjectBasicInformationComplete('usage', 'ontop', config);

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

  if (segment === 'PRE') {
    // allowMvpn สำหรับ PRE segment
    cy.get('input[formcontrolname="allowMvpn"]').eq(1).check({ force: true });
    Master.InternetLimitedDataOnly();
    Master.smsWordingpre();
    Master.backBacicInfo();
  } else {
    Master.smsWordingpre();
    Master.InternetLimitedDataOnly();
    Master.backBacicInfo();
  }

  // Add File - ปรับปรุงให้เร็วขึ้น
  cy.get('input[type="file"]', { timeout: 5000 }).should('exist');
  
  // ใช้ timeout ที่สั้นลง
  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  
  cy.wait('@postRequest', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 30000 }).its('response.statusCode').should('eq', 200);

  // อัพโหลดไฟล์แบบเร็ว
  cy.readFile('cypress/e2e/fixtures/file.pdf', 'binary').then((fileContent) => {
    cy.get('input[type="file"][id="files"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: 'file.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );
    
    // ใช้ beforeapproveMKT ที่ปรับปรุงแล้ว
    Master.beforeapproveMKT();
  });
};

describe('PLM', () => {
  describe('Scenario: Mob PRE', () => {
    it('MKT PREPAIDrole', () => {
      runMKTPostpaidFlow('PRE');
    });
    Master.afterMKTontopPREUsage();
  });

  describe('Scenario: ENTER', () => {
    it('MKT PREPAIDrole', () => {
      runMKTPostpaidFlow('ENTER', 'PRE');
    });
    Master.afterMKTontopPREUsageEnter();
  });

  describe('Scenario: MUSIC', () => {
    it('MKT PREPAIDrole', () => {
      runMKTPostpaidFlow('MUSIC', 'PRE');
    });
    Master.afterMKTontopPREUsageMusic();
  });
});