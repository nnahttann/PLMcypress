// ไฟล์ test.cy.ts
import * as Master from '../../Master';

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

// Helper function สำหรับรัน test flow ทั้งหมด
const runMKTPostpaidFlow = (segment: 'POST' | 'PRE' |'ENTER' | 'MUSIC', subSegment?: string) => {
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
  Master.dropdownPromotionGroup();
  Master.InternetLimitedDataOnly();
  Master.smsWording();
  Master.backBacicInfo();

  // Add File
  cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

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

  describe.only('Scenario: MUSIC', () => {
    it('MKT POSTPAID role', () => {
      runMKTPostpaidFlow('MUSIC', 'POST');
    });
    Master.afterMKTontopMUSIC();
  });
});