// ไฟล์ test.cy.ts
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

// Helper function สำหรับรัน test flow ทั้งหมด
const runMKTprepaidFlow = (segment: 'pre' | 'PRE' | 'ENTER' | 'MUSIC', subSegment?: string) => {
  const config: any = {
    type: 'Ontop',
    segment: segment,
    autoSetDuration: true
  };
  if (subSegment) {
    config.subSegment = subSegment;
  }

  Master.ProjectBasicInformationComplete('onetime', 'ontop', config);

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
    Master.dropdownPromotionGroup();
    Master.InternetLimitedDataOnly();
    Master.smsWordingpre();
    Master.backBacicInfo();
  } else {
    Master.dropdownPromotionGroup();
    Master.smsWordingpre();
    Master.InternetLimitedDataOnly();
    Master.backBacicInfo();
  }


  // Add File
  cy.get('input[type="file"]', { timeout: 10000 }).should('exist');

  // รอ network requests (ต้องมี intercept ก่อนหน้านี้ใน test)
  // cy.wait('@preRequest', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 10000 }).its('response.statusCode').should('eq', 200);

  cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/file.pdf', 'binary').then((fileContent) => {
    cy.get('input[type="file"][id="files"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: 'file.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );
    Master.beforeapproveMKT();
  });
};

describe('PLM', () => {
  describe('Scenario: Mob', () => {
    it('MKT PREPAIDrole', () => {
      runMKTprepaidFlow('PRE');
    });
    Master.afterMKTontopPREplugin();
  });

  describe('Scenario: ENTER', () => {
    it('MKT PREPAIDrole', () => {
      runMKTprepaidFlow('ENTER', 'PRE');
    });
    Master.afterMKTontopPREENTER();
  });

  describe('Scenario: MUSIC', () => {
    it('MKT PREPAIDrole', () => {
      runMKTprepaidFlow('MUSIC', 'PRE');
    });
    Master.afterMKTontopPREMUSIC();
  });
});