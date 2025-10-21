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
  it('MKT POSTPAID role', () => {
    Master.ProjectBasicInformationOntop("Usage", "OntopExtra");
    Master.selectPriceType('usage');
    Master.selectProductClass('ontopExtra');
    //Duration 
    function randomInRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const randomMonth = randomInRange(3, 24);

cy.get('input[formcontrolname="packageDuration"]')
  .clear()
  .type(randomMonth.toString());


    //Duration unit
    // ✅ เสถียรและอ่านง่ายกว่า
    cy.get('select[formcontrolname="packageDurationUnit"]').select('Months');

    // การตรวจสอบ (Assertion) ที่ดีกว่า
    // คือการตรวจสอบว่าข้อความที่ถูกเลือกอยู่นั้นถูกต้อง
    cy.get('select[formcontrolname="packageDurationUnit"]')
      .find('option:selected') // หา option ที่ถูกเลือก
      .should('have.text', 'Months'); // ตรวจสอบ text ของมัน

    // 'Months' คือ option ลำดับที่ 3 (index = 2)
    // เพราะ "Please Select" คือ 0, "Days" คือ 1
    // cy.get('select[formcontrolname="packageDurationUnit"]').select(2);

    //targetgroup
    Master.selectTargetGroup('mass');

    //Remark 
    cy.get('textarea[formcontrolname="remark"]').type('This is a new remark.');

    Master.PriceExcluding();

    //*Target group
    Master.targetgroup();

    //ProductSpec
    const optionsToSelectProductSpec = [
      // "AI IP Camera",
        // "AIS Secure Net",
      // "Apple Care",
      // "Cloud Game",
      // "Cloud PC",
      // "Content VDO",
      // "Flowaccount",
      "Internet",
      // "MMS",
      // "Mobile Care",
      // "SMS",
      // "Vertical App",
      // "Voice",
      // "WiFi",
      // "Youtube Premium"
    ];

    optionsToSelectProductSpec.forEach(option => {
      cy.get('select[formcontrolname="availableListBox"]')
        .contains(option)
        .then($option => {
          cy.wrap($option).dblclick();
        });
    });

    Master.InternetLimitedDataOnly();

    Master.smsWording();

    Master.backBacicInfo();

  
    //Add File
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
  });
 Master.afterMKTontopPOST();
});

