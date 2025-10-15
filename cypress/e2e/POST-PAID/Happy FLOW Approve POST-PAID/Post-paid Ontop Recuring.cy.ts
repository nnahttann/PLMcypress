import * as Master from '../Master';
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
    Master.ProjectBasicInformationOntop("Recurring", "Ontop");
    Master.selectPriceType('recurring');
    Master.selectProductClass('ontop');
    //Duration 
    cy.get('input[formcontrolname="packageDuration"]').clear().type('12')

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
      "AIS Secure Net",
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
      Master.beforeapproveMKTontop();
    });
  });
  it('CKS role', () => {

    Master.login(Master.cks, Master.ckspass);

    // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
    cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

    // รอให้ API ต่าง ๆ เสร็จสิ้น
    cy.wait(['@setUserOnline', '@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    // const formattedDateMain = 'Mob POST Reg 0409 0038';
    const projectName = Cypress.env('projectName');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectName);

    //  ClaimProjectCKS from Unassigned Task
    Master.ClaimProjectCKS(Master.formattedDateOntop);

    // Find the "To Do List" section
    cy.wait(5000);
    Master.approveProject(Master.formattedDateOntop);


    // intercept API 
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

    // รอ
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 }).then((interceptions) => {
    });

    // Click the button
    //button Enhance PO
    cy.get('button.btn-sample')
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    //Navigate to mass product 

    // wait API 
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // Wait for initial API requests to complete
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    // รอ url
    cy.url().should('include', 'mass-enh-product-offering-detail')

    //Group package
    cy.get('select[formcontrolname="groupPackage"]')
      .select('5G Hot Deal Max Speed Offset')
    // Master.Tariff();
    cy.wait(5000)
    Master.priorityInternetLimitedDataOnly();

    Master.beforeapproveCKSontop();
  });
  it('CGMD Config IRB role', () => {

    Master.login(Master.cgcirb, Master.cgcirbpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@setUserOnline').its('response.statusCode').should('eq', 200);

    cy.contains('span', 'Menu').click();

    cy.wait(5000)

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');


    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0910_0951';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgcirb';

    Master.assignTeamTask(projectNamePONAME, assignee);
    cy.wait(10000)

    cy.contains('span', 'Menu').click();

    cy.wait(5000)

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
    cy.wait(10000)
    Master.approveProjectCGMD(projectNamePONAME);

  });
  it('CGMD Tester IRB role', () => {

    Master.login(Master.cgtirb, Master.cgtirbpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    cy.contains('span', 'Menu').click();

    cy.wait(5000)

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');


    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0610_2318';

    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgtirb';

    Master.assignTeamTask(projectNamePONAME, assignee);
    cy.wait(10000)

    cy.contains('span', 'Menu').click();

    cy.wait(5000)

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
    cy.wait(10000)
    Master.approveProjectCGMDtester(projectNamePONAME);

   
  });
  it('ACTM role', () => {

    Master.login(Master.actm, Master.actmpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const taskIdentifier = 'Onetime_Main_3009_1126';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    Master.approveProjectCGMDACTM(projectNamePONAME);

    // Click ปุ่ม Approve To CGMD
    cy.get(':nth-child(3) > :nth-child(4)').click();

    // cy.contains('button', 'Yes')
    //   .should('be.visible')
    //   .click();
    // verify alert
    cy.on('window:alert', (txt) => {
      expect(txt).to.contain('Approve and Send Mail Notify Success');
    });

    // verify redirect กลับ workspace
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

    // Click the Logout button
    cy.contains('button', 'Logout')
      .should('be.visible')
      .click();

    // Wait for the URL to change to the login page
    cy.url().should('include', '/login');
  });
  it('OPER role', () => {

    Master.login(Master.oper, Master.operpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const taskIdentifier = 'Onetime_Main_3009_1126';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    Master.approveProjectCGMDOPER(projectNamePONAME);

    // Click ปุ่ม Approve To PreGolive

    cy.get('.col-md-6 > :nth-child(3)').click();

    // cy.contains('button', 'Yes')
    //   .should('be.visible')
    //   .click();
    // verify alert
    cy.on('window:alert', (txt) => {
      expect(txt).to.contain('Approve and Send Mail Notify Success');
    });

    // verify redirect กลับ workspace
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

    // Click the Logout button
    cy.contains('button', 'Logout')
      .should('be.visible')
      .click();

    // Wait for the URL to change to the login page
    cy.url().should('include', '/login');
  });
});

